import { BaseModule, BaseModuleOptions } from './BaseModule';
import { decodeBase64 } from '../utils/base64';
import { normalizeDate } from '../utils/date';

export interface CleanTimelineEvent {
  date: Date | null;
  type: string;
  id: number;
  title: string;
  subtitle: string;
  content: string;
}

export interface CleanPostIt {
  id: number;
  type: string;
  content: string;
  creationDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  author: {
    firstName: string;
    lastName: string;
    civility: string;
    id: string;
  };
}

export class TimelineModule extends BaseModule {
  async getStudentTimeline(options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/eleves/${this.studentId}/timeline.awp`,
      {},
      { verbe: 'get' }
    );

    if (options.raw) return response.data;

    return (response.data || []).map((e: any) => this.cleanEvent(e));
  }

  private cleanEvent(e: any): CleanTimelineEvent {
    return {
      date: normalizeDate(e.date),
      type: e.typeElement,
      id: e.idElement,
      title: e.titre,
      subtitle: e.soustitre,
      content: e.contenu,
    };
  }

  async getCommonTimeline(options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/E/${this.studentId}/timelineAccueilCommun.awp`,
      {},
      { verbe: 'get' }
    );

    if (options.raw) return response.data;

    return {
      events: (response.data.evenements || []).map((e: any) => this.cleanEvent(e)),
      postits: (response.data.postits || []).map((p: any) => this.cleanPostIt(p)),
    };
  }

  private cleanPostIt(p: any): CleanPostIt {
    return {
      id: p.id,
      type: p.type,
      content: p.contenu ? decodeBase64(p.contenu) : '',
      creationDate: normalizeDate(p.creationDate),
      startDate: normalizeDate(p.dateDebut),
      endDate: normalizeDate(p.dateFin),
      author: {
        firstName: p.auteur?.prenom,
        lastName: p.auteur?.nom,
        civility: p.auteur?.civilite,
        id: p.auteur?.id,
      },
    };
  }
}
