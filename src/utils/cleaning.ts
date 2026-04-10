import { RawAccount, CleanAccount, RawModule, CleanModule, RawProfile, CleanProfile, RawIndividualParams, CleanIndividualParams } from '../types/account';
import { normalizeDate } from './date';

export function cleanAccount(raw: RawAccount): CleanAccount {
  return {
    loginId: raw.idLogin,
    id: raw.id,
    uid: raw.uid,
    username: raw.identifiant,
    accountType: raw.typeCompte,
    ogecCode: raw.codeOgec,
    isMain: raw.main,
    lastConnection: normalizeDate(raw.lastConnexion) || raw.lastConnexion,
    civility: raw.civilite,
    firstName: raw.prenom,
    particule: raw.particule,
    lastName: raw.nom,
    email: raw.email,
    isPrimary: raw.isPrimaire,
    establishmentName: raw.nomEtablissement,
    establishmentLogo: raw.logoEtablissement,
    establishmentAgendaColor: raw.couleurAgendaEtablissement,
    hasOnlineDictionary: raw.dicoEnLigneLeRobert,
    socketToken: raw.socketToken,
    modules: raw.modules.map(cleanModule),
    individualParams: cleanIndividualParams(raw.parametresIndividuels),
    profile: cleanProfile(raw.profile),
  };
}

function cleanModule(raw: RawModule): CleanModule {
  return {
    code: raw.code,
    isEnabled: raw.enable,
    order: raw.ordre,
    badgeCount: raw.badge,
    params: raw.params,
  };
}

function cleanProfile(raw: RawProfile): CleanProfile {
  return {
    gender: raw.sexe,
    timetableInfo: raw.infoEDT,
    establishmentName: raw.nomEtablissement,
    establishmentId: raw.idEtablissement,
    establishmentRne: raw.rneEtablissement,
    mobilePhone: raw.telPortable,
    realEstablishmentId: raw.idReelEtab,
    photoUrl: raw.photo.startsWith('//') ? `https:${raw.photo}` : raw.photo,
    isLearner: raw.estApprenant,
    class: {
      id: raw.classe?.id,
      code: raw.classe?.code,
      name: raw.classe?.libelle,
      isGraded: raw.classe?.estNote === 1,
    },
  };
}

function cleanIndividualParams(raw: RawIndividualParams): CleanIndividualParams {
  const clean: CleanIndividualParams = {
    hasQrCode: raw.isQrcode,
    visualAccessibility: raw.accessibiliteVisuelle,
    pageZoom: raw.zoomPage,
    secureAuthCheck: raw.checkAuthentificationSecure,
  };

  // Copy other properties
  Object.keys(raw).forEach(key => {
    if (!['isQrcode', 'accessibiliteVisuelle', 'zoomPage', 'checkAuthentificationSecure'].includes(key)) {
      clean[key] = raw[key];
    }
  });

  return clean;
}
