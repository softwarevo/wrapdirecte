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

export interface CleanGradesResponse {
  grades: CleanGrade[];
  periods: CleanPeriod[];
  settings: any;
  competencies: CleanCompetence[];
}

export interface RawGradesOptions extends BaseModuleOptions {
  raw: true;
}

export interface CleanGradesOptions extends BaseModuleOptions {
  raw?: false;
}

export interface CleanCompetence {
  id: number | string;
  competenceId: number | string;
  knowledgeId: number | string;
  elementProgramId: number | string;
  title: string;
  description: string;
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
  noteId?: number | string;
  noteTitle?: string;
  noteDate?: Date | null;
  noteValue?: string;
  noteOutOf?: string;
  noteCoefficient?: number;
}

export class GradesModule extends BaseModule {
  async getGrades(year: string, options: RawGradesOptions): Promise<any>;
  async getGrades(year?: string, options?: CleanGradesOptions): Promise<CleanGradesResponse>;
  async getGrades(
    year: string = '',
    options: BaseModuleOptions = {}
  ): Promise<CleanGradesResponse | any> {
    const response = await this.http.request<any>(
      'POST',
      `/eleves/${this.studentId}/notes.awp`,
      { anneeScolaire: year },
      { verbe: 'get' }
    );

    if (options.raw) return response.data;

    const notes = response.data.notes || [];
    const grades = notes.map((n: any) => this.cleanGrade(n));
    const periods = (response.data.periodes || []).map((p: any) => this.cleanPeriod(p));
    const settings = this.cleanSettings(response.data.parametrage || {});
    const competencies = [
      ...this.cleanCompetencies(
        response.data.competences ||
        response.data.competences?.competences ||
        response.data.competence ||
        []
      ),
      ...this.extractCompetenciesFromNotes(notes),
    ];

    return { grades, periods, settings, competencies };
  }

  private cleanCompetencies(raw: any): CleanCompetence[] {
    return this.normalizeCompetenciesInput(raw).map((c: any) => this.cleanCompetence(c));
  }

  private extractCompetenciesFromNotes(notes: any[]): CleanCompetence[] {
    return notes.flatMap((note: any) => {
      const noteFields = {
        noteId: note.id,
        noteTitle: note.devoir,
        noteDate: note.date,
        noteValue: note.valeur,
        noteOutOf: note.noteSur,
        noteCoefficient: note.coef,
      };

      return (note.elementsProgramme || []).map((element: any) =>
        this.cleanCompetence({
          ...element,
          ...noteFields,
          codeMatiere: note.codeMatiere,
          libelleMatiere: note.libelleMatiere,
          codePeriode: note.codePeriode,
          date: element.date || note.date,
        })
      );
    });
  }

  private normalizeCompetenciesInput(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.competences)) return raw.competences;
    if (Array.isArray(raw.liste)) return raw.liste;
    return [];
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

  /**
   * Resolve a stable competence identifier from heterogeneous upstream payloads.
   * Precedence order is:
   * 1) c.id
   * 2) c.idCompetence
   * 3) c.idNote
   * 4) c.idElemProg
   * 5) ''
   */
  private resolveCompetenceId(c: any): string {
    return c.id || c.idCompetence || c.idNote || c.idElemProg || '';
  }

  private cleanCompetence(c: any): CleanCompetence {
    return {
      id: this.resolveCompetenceId(c),
      competenceId: c.idCompetence || '',
      knowledgeId: c.idConnaissance || '',
      elementProgramId: c.idElemProg || '',
      title: c.libelleCompetence || c.libelle || c.competence || c.nom || '',
      description: c.descriptif || c.description || '',
      subjectCode: c.codeMatiere || c.codeMat || c.code || '',
      subjectLabel: c.libelleMatiere || c.libelle || c.matiere || '',
      date: normalizeDate(c.date || c.dateEvaluation || c.dateDebut),
      value: c.valeur || c.note || c.resultat || '',
      outOf: c.noteSur || c.outOf || '',
      coefficient: c.coef || c.coefficient || 0,
      isLetter: !!c.enLettre || false,
      isSignificant: !(c.nonSignificatif || c.nonSignificatifEvaluation),
      comment: c.commentaire || c.comment || '',
      periodCode: c.codePeriode || c.periode || '',
      noteId: c.noteId,
      noteTitle: c.noteTitle || c.noteLibelle || '',
      noteDate: normalizeDate(c.noteDate || c.dateNote),
      noteValue: c.noteValue || c.valeurNote || '',
      noteOutOf: c.noteOutOf || c.noteSur || '',
      noteCoefficient: c.noteCoefficient || c.coefNote || 0,
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
