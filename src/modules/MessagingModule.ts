import { BaseModule, BaseModuleOptions } from './BaseModule';
import { decodeBase64, encodeBase64 } from '../utils/base64';
import { normalizeDate } from '../utils/date';

export interface CleanMessage {
  id: number;
  subject: string;
  date: Date | null;
  from: CleanContact;
  to: CleanContact[];
  content?: string;
  isRead: boolean;
  hasAttachments: boolean;
  attachments: CleanAttachment[];
  type: 'received' | 'sent' | 'draft' | 'archived' | 'classeur';
  folderId?: number;
}

export interface CleanFolder {
  id: number;
  name: string;
}

export interface CleanContact {
  id: number;
  firstName: string;
  lastName: string;
  civility: string;
  role: string;
}

export interface CleanAttachment {
  id: number;
  name: string;
  date: Date | null;
  type: string;
}

export class MessagingModule extends BaseModule {
  async getMessages(year: string, options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/eleves/${this.studentId}/messages.awp`,
      { anneeMessages: year },
      { getAll: '1', verbe: 'get', v: this.apiVersion }
    );

    if (options.raw) return response.data;

    const result: {
      messages: Record<string, CleanMessage[]>;
      folders: CleanFolder[];
    } = {
      messages: {},
      folders: (response.data.classeurs || []).map((c: any) => ({
        id: c.id,
        name: c.libelle,
      })),
    };

    const types = ['received', 'sent', 'draft', 'archived'];

    types.forEach(type => {
      result.messages[type] = (response.data.messages[type] || []).map((m: any) => this.cleanMessage(m, type as any));
    });

    return result;
  }

  async getMessagesByFolder(folderId: number, options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/eleves/${this.studentId}/messages.awp`,
      {},
      {
        force: 'false',
        typeRecuperation: 'classeur',
        idClasseur: folderId.toString(),
        orderBy: 'date',
        order: 'desc',
        query: '',
        onlyRead: '',
        page: '0',
        itemsPerPage: '100',
        getAll: '0',
        verbe: 'get',
        v: this.apiVersion,
      }
    );

    if (options.raw) return response.data;

    const messages = response.data.messages;
    const messagesList = Array.isArray(messages) ? messages : [];

    return messagesList.map((m: any) => this.cleanMessage(m, 'classeur'));
  }

  async getMessageContent(
    messageId: number,
    year: string,
    options: BaseModuleOptions & { markAsUnread?: boolean } = {}
  ): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/eleves/${this.studentId}/messages/${messageId}.awp`,
      { anneeMessages: year },
      { verbe: 'get', mode: 'destinataire', v: this.apiVersion }
    );

    if (options.markAsUnread) {
      await this.markAsUnread([messageId], year);
    }

    if (options.raw) return response.data;

    return {
      ...this.cleanMessage(response.data, response.data.mtype),
      content: response.data.content ? decodeBase64(response.data.content) : '',
    };
  }

  private cleanMessage(m: any, type: 'received' | 'sent' | 'draft' | 'archived' | 'classeur'): CleanMessage {
    return {
      id: m.id,
      subject: m.subject,
      date: normalizeDate(m.date),
      from: this.cleanContact(m.from),
      to: (m.to || []).map((t: any) => this.cleanContact(t)),
      isRead: !!m.read,
      hasAttachments: (m.files || []).length > 0,
      attachments: (m.files || []).map((f: any) => ({
        id: f.id,
        name: f.libelle,
        date: normalizeDate(f.date),
        type: f.type,
      })),
      type,
      folderId: m.idClasseur,
    };
  }

  private cleanContact(c: any): CleanContact {
    if (!c) return { id: 0, firstName: '', lastName: '', civility: '', role: '' };
    return {
      id: c.id,
      firstName: c.prenom,
      lastName: c.nom,
      civility: c.civilite,
      role: c.role,
    };
  }

  async sendMessage(params: {
    subject: string;
    content: string;
    recipients: any[];
    year: string;
  }): Promise<number> {
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').split('.')[0];

    const response = await this.http.request<any>(
      'POST',
      `/eleves/${this.studentId}/messages.awp`,
      {
        message: {
          subject: params.subject,
          content: encodeBase64(params.content),
          groupesDestinataires: [
            {
              destinataires: params.recipients,
              selection: { type: params.recipients[0]?.type || 'P' }
            }
          ],
          transfertFiles: [],
          files: [],
          date: formattedDate,
          read: true,
          from: {
            role: 'E',
            id: this.studentId,
            read: true
          },
          brouillon: false
        },
        anneeMessages: params.year
      },
      { verbe: 'post', v: this.apiVersion }
    );

    return response.data.id;
  }

  async getContacts(type: 'professeurs' | 'personnels' | 'entreprises'): Promise<any[]> {
    const response = await this.http.request<any>(
      'POST',
      `/messagerie/contacts/${type}.awp`,
      {},
      { verbe: 'get', v: this.apiVersion }
    );
    return response.data.contacts;
  }

  async markAsRead(ids: number[], year: string): Promise<void> {
    await this.http.request(
      'POST',
      `/eleves/${this.studentId}/messages.awp`,
      {
        action: 'marquerCommeLu',
        ids,
        anneeMessages: year,
      },
      { verbe: 'put', v: this.apiVersion }
    );
  }

  async markAsUnread(ids: number[], year: string): Promise<void> {
    await this.http.request(
      'POST',
      `/eleves/${this.studentId}/messages.awp`,
      {
        action: 'marquerCommeNonLu',
        ids,
        anneeMessages: year,
      },
      { verbe: 'put', v: this.apiVersion }
    );
  }

  async archiveMessages(ids: number[], year: string): Promise<void> {
    await this.http.request(
      'POST',
      `/eleves/${this.studentId}/messages.awp`,
      {
        action: 'archiver',
        ids,
        anneeMessages: year,
      },
      { verbe: 'put', v: this.apiVersion }
    );
  }

  async unarchiveMessages(ids: number[], year: string): Promise<void> {
    await this.http.request(
      'POST',
      `/eleves/${this.studentId}/messages.awp`,
      {
        action: 'desarchiver',
        ids,
        anneeMessages: year,
      },
      { verbe: 'put', v: this.apiVersion }
    );
  }

  async moveMessages(ids: number[], folderId: number): Promise<void> {
    await this.http.request(
      'POST',
      `/eleves/${this.studentId}/messages.awp`,
      {
        action: 'deplacer',
        idClasseur: folderId,
        ids: ids.map(id => `${id}:-1`),
      },
      { verbe: 'put', v: this.apiVersion }
    );
  }

  async createFolder(name: string): Promise<number> {
    const response = await this.http.request<any>(
      'POST',
      '/messagerie/classeurs.awp',
      { libelle: name },
      { verbe: 'post', v: this.apiVersion }
    );
    return response.data.id;
  }

  async deleteFolder(folderId: number): Promise<void> {
    await this.http.request(
      'POST',
      `/messagerie/classeur/${folderId}.awp`,
      {},
      { verbe: 'delete', v: this.apiVersion }
    );
  }
}
