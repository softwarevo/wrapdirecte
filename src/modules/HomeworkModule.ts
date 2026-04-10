import { BaseModule, BaseModuleOptions } from './BaseModule';
import { decodeBase64, encodeBase64 } from '../utils/base64';
import { normalizeDate } from '../utils/date';

export interface CleanHomework {
  id: number;
  date: Date | null;
  subject: string;
  subjectCode: string;
  teacherName: string;
  isInterrogation: boolean;
  isDone: boolean;
  content: string;
  files: CleanFile[];
  comments: CleanComment[];
  sessionContent: {
    content: string;
    files: CleanFile[];
    comments: CleanComment[];
  };
}

export interface CleanFile {
  id: number;
  name: string;
  date: Date | null;
  size: number;
  type: string;
}

export interface CleanComment {
  id: number;
  authorId: number;
  authorProfile: string;
  authorName: string;
  date: Date | null;
  message: string;
}

export class HomeworkModule extends BaseModule {
  async getHomework(date: string, options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/Eleves/${this.studentId}/cahierdetexte/${date}.awp`,
      {},
      { verbe: 'get' }
    );

    if (options.raw) return response.data;

    return (response.data.matieres || []).map((m: any) => this.cleanHomework(m, response.data.date));
  }

  private cleanHomework(m: any, date: string): CleanHomework {
    const aFaire = m.aFaire || {};
    const session = m.contenuDeSeance || {};

    return {
      id: m.id,
      date: normalizeDate(date),
      subject: m.matiere,
      subjectCode: m.codeMatiere,
      teacherName: m.nomProf,
      isInterrogation: !!m.interrogation,
      isDone: !!aFaire.effectue,
      content: aFaire.contenu ? decodeBase64(aFaire.contenu) : '',
      files: (aFaire.documents || []).map((f: any) => this.cleanFile(f)),
      comments: (aFaire.commentaires || []).map((c: any) => this.cleanComment(c)),
      sessionContent: {
        content: session.contenu ? decodeBase64(session.contenu) : '',
        files: (session.documents || []).map((f: any) => this.cleanFile(f)),
        comments: (session.commentaires || []).map((c: any) => this.cleanComment(c)),
      },
    };
  }

  private cleanFile(f: any): CleanFile {
    return {
      id: f.id,
      name: f.libelle,
      date: normalizeDate(f.date),
      size: f.taille || 0,
      type: f.type,
    };
  }

  private cleanComment(c: any): CleanComment {
    return {
      id: c.id,
      authorId: c.idAuteur,
      authorProfile: c.profilAuteur,
      authorName: c.auteur,
      date: normalizeDate(c.date),
      message: c.message ? decodeBase64(c.message) : '',
    };
  }

  async markAsDone(homeworkId: number, isDone: boolean = true): Promise<void> {
    const data = {
      idDevoirsEffectues: isDone ? [homeworkId] : [],
      idDevoirsNonEffectues: isDone ? [] : [homeworkId],
    };

    await this.http.request(
      'POST',
      `/Eleves/${this.studentId}/cahierdetexte.awp`,
      data,
      { verbe: 'put' }
    );
  }

  async addComment(homeworkId: number, message: string): Promise<number> {
    const response = await this.http.request<any>(
      'POST',
      `/Eleves/${this.studentId}/afaire/commentaires.awp`,
      {
        message: encodeBase64(message),
        idContenu: homeworkId,
      },
      { verbe: 'post' }
    );

    return response.data.id;
  }
}
