import { BaseModule, BaseModuleOptions } from './BaseModule';
import { normalizeDate } from '../utils/date';

export interface CleanCourse {
  id: number;
  subject: string;
  subjectCode: string;
  type: string;
  startDate: Date | null;
  endDate: Date | null;
  color: string;
  teacher: string;
  room: string;
  group: string;
  groupCode: string;
  isModified: boolean;
  isCancelled: boolean;
  hasSessionContent: boolean;
  hasHomework: boolean;
}

export class TimetableModule extends BaseModule {
  async getTimetable(startDate: string, endDate: string, options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/E/${this.studentId}/emploidutemps.awp`,
      {
        dateDebut: startDate,
        dateFin: endDate,
        avecTrous: false,
      },
      { verbe: 'get' }
    );

    if (options.raw) return response.data;

    return (response.data || []).map((c: any) => this.cleanCourse(c));
  }

  private cleanCourse(c: any): CleanCourse {
    return {
      id: c.id,
      subject: c.matiere,
      subjectCode: c.codeMatiere,
      type: c.typeCours,
      startDate: normalizeDate(c.start_date),
      endDate: normalizeDate(c.end_date),
      color: c.color,
      teacher: c.prof,
      room: c.salle,
      group: c.groupe,
      groupCode: c.groupeCode,
      isModified: !!c.isModifie,
      isCancelled: !!c.isAnnule,
      hasSessionContent: !!c.contenuDeSeance,
      hasHomework: !!c.devoirAFaire,
    };
  }

  async getIcalUrl(): Promise<string> {
    const response = await this.http.request<{ url: string }>(
      'POST',
      `/ical/E/${this.studentId}/url.awp`,
      {},
      { verbe: 'get' }
    );
    return `https://api.ecoledirecte.com/v3/${response.data.url}`;
  }
}
