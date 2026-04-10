import { BaseModule, BaseModuleOptions } from './BaseModule';
import { decodeBase64 } from '../utils/base64';
import { normalizeDate } from '../utils/date';

export interface CleanGrade {
  id: number;
  title: string;
  subjectCode: string;
  subjectLabel: string;
  date: Date | null;
  value: string;
  outOf: string;
  coefficient: number;
  isLetter: boolean;
  isSignificant: boolean;
  comment: string;
  periodCode: string;
}

export interface CleanPeriod {
  id: number | string;
  code: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  isClosed: boolean;
}

export class GradesModule extends BaseModule {
  async getGrades(year: string = '', options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/eleves/${this.studentId}/notes.awp`,
      { anneeScolaire: year },
      { verbe: 'get' }
    );

    if (options.raw) return response.data;

    const grades = (response.data.notes || []).map((n: any) => this.cleanGrade(n));
    const periods = (response.data.periodes || []).map((p: any) => this.cleanPeriod(p));
    const settings = this.cleanSettings(response.data.parametrage || {});

    return { grades, periods, settings };
  }

  private cleanGrade(n: any): CleanGrade {
    return {
      id: n.id,
      title: n.devoir,
      subjectCode: n.codeMatiere,
      subjectLabel: n.libelleMatiere,
      date: normalizeDate(n.date),
      value: n.valeur,
      outOf: n.noteSur,
      coefficient: n.coef,
      isLetter: !!n.enLettre,
      isSignificant: !n.nonSignificatif,
      comment: n.commentaire || '',
      periodCode: n.codePeriode,
    };
  }

  private cleanPeriod(p: any): CleanPeriod {
    return {
      id: p.idPeriode,
      code: p.codePeriode,
      name: p.periode,
      startDate: normalizeDate(p.dateDebut),
      endDate: normalizeDate(p.dateFin),
      isClosed: !!p.cloture,
    };
  }

  private cleanSettings(s: any): any {
    return {
      evaluationLabels: {
        eval1: s.libelleEval1 ? decodeBase64(s.libelleEval1) : '',
        eval2: s.libelleEval2 ? decodeBase64(s.libelleEval2) : '',
        eval3: s.libelleEval3 ? decodeBase64(s.libelleEval3) : '',
        eval4: s.libelleEval4 ? decodeBase64(s.libelleEval4) : '',
      },
      evaluationColors: {
        eval1: s.couleurEval1,
        eval2: s.couleurEval2,
        eval3: s.couleurEval3,
        eval4: s.couleurEval4,
      },
      displayAverage: !!s.affichageMoyenne,
      displayGrades: !!s.affichageNote,
    };
  }
}
