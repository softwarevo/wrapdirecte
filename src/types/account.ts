export interface RawAccount {
  idLogin: number;
  id: number;
  uid: string;
  identifiant: string;
  typeCompte: 'E' | 'P' | 'A' | 'F';
  codeOgec: string;
  main: boolean;
  lastConnexion: string;
  civilite: string;
  prenom: string;
  particule: string;
  nom: string;
  email: string;
  isPrimaire: boolean;
  nomEtablissement: string;
  logoEtablissement: string;
  couleurAgendaEtablissement: string;
  dicoEnLigneLeRobert: boolean;
  socketToken: string;
  modules: RawModule[];
  parametresIndividuels: RawIndividualParams;
  profile: RawProfile;
}

export interface RawModule {
  code: string;
  enable: boolean;
  ordre: number;
  badge: number;
  params: Record<string, string>;
}

export interface RawIndividualParams {
  [key: string]: any;
  isQrcode: boolean;
  accessibiliteVisuelle: boolean;
  zoomPage: boolean;
  checkAuthentificationSecure: boolean;
}

export interface RawProfile {
  sexe: 'M' | 'F';
  infoEDT: string;
  nomEtablissement: string;
  idEtablissement: string;
  rneEtablissement: string;
  telPortable: string;
  idReelEtab: string;
  photo: string;
  estApprenant: boolean;
  classe: {
    id: number;
    code: string;
    libelle: string;
    estNote: number;
  };
}

export interface CleanAccount {
  loginId: number;
  id: number;
  uid: string;
  username: string;
  accountType: 'E' | 'P' | 'A' | 'F';
  ogecCode: string;
  isMain: boolean;
  lastConnection: Date | string;
  civility: string;
  firstName: string;
  particule: string;
  lastName: string;
  email: string;
  isPrimary: boolean;
  establishmentName: string;
  establishmentLogo: string;
  establishmentAgendaColor: string;
  hasOnlineDictionary: boolean;
  socketToken: string;
  modules: CleanModule[];
  individualParams: CleanIndividualParams;
  profile: CleanProfile;
}

export interface CleanModule {
  code: string;
  isEnabled: boolean;
  order: number;
  badgeCount: number;
  params: Record<string, string>;
}

export interface CleanIndividualParams {
  [key: string]: any;
  hasQrCode: boolean;
  visualAccessibility: boolean;
  pageZoom: boolean;
  secureAuthCheck: boolean;
}

export interface CleanProfile {
  gender: 'M' | 'F';
  timetableInfo: string;
  establishmentName: string;
  establishmentId: string;
  establishmentRne: string;
  mobilePhone: string;
  realEstablishmentId: string;
  photoUrl: string;
  isLearner: boolean;
  class: {
    id: number;
    code: string;
    name: string;
    isGraded: boolean;
  };
}

export interface LoginResult {
  status: 'SUCCESS' | '2FA_REQUIRED';
  token: string;
  accounts?: CleanAccount[];
  challenge?: {
    question: string;
    proposals: string[];
  };
}
