import { RawAccount, CleanAccount, RawModule, CleanModule, RawProfile, CleanProfile, RawIndividualParams, CleanIndividualParams } from '../types/account';
import { normalizeDate } from './date';
import { arrayBufferToBase64 } from './base64';

export async function cleanAccount(raw: RawAccount, headers?: Record<string, string>): Promise<CleanAccount> {
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
    profile: await cleanProfile(raw.profile, headers),
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

async function cleanProfile(raw: RawProfile, headers: Record<string, string> = {}): Promise<CleanProfile> {
  const photoUrl = raw.photo ? (raw.photo.startsWith('//') ? `https:${raw.photo}` : raw.photo) : '';
  let photoB64: string | null = null;

  if (photoUrl && !photoUrl.includes('no-photo')) {
    try {
      const response = await fetch(photoUrl, { headers });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const base64Data = arrayBufferToBase64(buffer);
        photoB64 = `data:${contentType};base64,${base64Data}`;
      }
    } catch (e) {
      // Ignore fetch errors for photo
    }
  }

  return {
    gender: raw.sexe,
    timetableInfo: raw.infoEDT,
    establishmentName: raw.nomEtablissement,
    establishmentId: raw.idEtablissement,
    establishmentRne: raw.rneEtablissement,
    mobilePhone: raw.telPortable,
    realEstablishmentId: raw.idReelEtab,
    photoUrl,
    photoB64,
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
