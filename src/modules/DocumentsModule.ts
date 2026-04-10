import { BaseModule, BaseModuleOptions } from './BaseModule';
import { normalizeDate } from '../utils/date';

export interface CleanDocument {
  id: number;
  name: string;
  date: Date | null;
  type: string;
  studentId: number;
}

export class DocumentsModule extends BaseModule {
  async getDocuments(options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      '/elevesDocuments.awp',
      {},
      { archive: '', verbe: 'get' }
    );

    if (options.raw) return response.data;

    const result: Record<string, CleanDocument[]> = {};
    const categories = ['factures', 'notes', 'viescolaire', 'administratifs', 'inscriptions', 'entreprises'];

    categories.forEach(cat => {
      result[cat] = (response.data[cat] || []).map((d: any) => this.cleanDocument(d));
    });

    return result;
  }

  private cleanDocument(d: any): CleanDocument {
    return {
      id: d.id,
      name: d.libelle,
      date: normalizeDate(d.date),
      type: d.type,
      studentId: d.idEleve,
    };
  }
}
