import { BaseModule, BaseModuleOptions } from './BaseModule';
import { normalizeDate } from '../utils/date';

export interface CleanAbsence {
  id: number;
  type: 'Absence' | 'Retard' | string;
  date: Date | null;
  displayDate: string;
  label: string;
  reason: string;
  isJustified: boolean;
  comment: string;
}

export class AbsencesModule extends BaseModule {
  async getAbsences(options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/eleves/${this.studentId}/viescolaire.awp`,
      {},
      { verbe: 'get' }
    );

    if (options.raw) return response.data;

    return (response.data.absencesRetards || []).map((a: any) => this.cleanAbsence(a));
  }

  private cleanAbsence(a: any): CleanAbsence {
    return {
      id: a.id,
      type: a.typeElement,
      date: normalizeDate(a.date),
      displayDate: a.displayDate,
      label: a.libelle,
      reason: a.motif,
      isJustified: !!a.justifie,
      comment: a.commentaire || '',
    };
  }
}
