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

    const result: Record<string, CleanMessage[]> = {};
    const types = ['received', 'sent', 'draft', 'archived'];

    types.forEach(type => {
      result[type] = (response.data.messages[type] || []).map((m: any) => this.cleanMessage(m, type as any));
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

  async getMessageContent(messageId: number, year: string, options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/eleves/${this.studentId}/messages/${messageId}.awp`,
      { anneeMessages: year },
      { verbe: 'get', mode: 'destinataire', v: this.apiVersion }
    );

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
}
