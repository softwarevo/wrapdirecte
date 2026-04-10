import { HttpClient } from './utils/http';
import { RawAccount, CleanAccount, LoginResult } from './types/account';
import { cleanAccount } from './utils/cleaning';
import { EcoleDirecteAccountTypeError, EcoleDirecteError } from './utils/errors';
import { encodeBase64, decodeBase64 } from './utils/base64';

import { HomeworkModule } from './modules/HomeworkModule';
import { MessagingModule } from './modules/MessagingModule';
import { GradesModule } from './modules/GradesModule';
import { TimetableModule } from './modules/TimetableModule';
import { AbsencesModule } from './modules/AbsencesModule';
import { TimelineModule } from './modules/TimelineModule';
import { DocumentsModule } from './modules/DocumentsModule';
import { CloudModule } from './modules/CloudModule';
import { SettingsModule } from './modules/SettingsModule';

export class WrapDirecte {
  private http: HttpClient;
  private currentUsername: string = '';
  private currentPassword: string = '';
  private rawAccounts: RawAccount[] = [];
  private studentRawAccounts: RawAccount[] = [];
  private studentAccounts: CleanAccount[] = [];
  private selectedAccount: CleanAccount | null = null;
  private rawAccount: RawAccount | null = null;

  // Modules are only available after a successful login
  public homework?: HomeworkModule;
  public messaging?: MessagingModule;
  public grades?: GradesModule;
  public timetable?: TimetableModule;
  public absences?: AbsencesModule;
  public timeline?: TimelineModule;
  public documents?: DocumentsModule;
  public cloud?: CloudModule;
  public settings?: SettingsModule;

  constructor() {
    this.http = new HttpClient();
  }

  get isAuthenticated(): boolean {
    return !!this.http.getToken() && !!this.selectedAccount;
  }

  get accounts(): CleanAccount[] {
    return this.studentAccounts;
  }

  async login(username: string, password: string, uuid: string = '', preferredAccountId?: number): Promise<LoginResult> {
    this.currentUsername = username;
    this.currentPassword = password;

    await this.http.getGTK();

    const response = await this.http.request<any>('POST', '/login.awp', {
      identifiant: username,
      motdepasse: password,
      isReLogin: false,
      uuid,
      fa: [],
    }, {});

    if (response.code === 250) {
      const challengeResponse = await this.http.request<{ question: string; propositions: string[] }>(
        'POST',
        '/connexion/doubleauth.awp',
        {},
        { verbe: 'get' }
      );

      return {
        status: '2FA_REQUIRED',
        token: response.token,
        challenge: {
          question: decodeBase64(challengeResponse.data.question),
          proposals: (challengeResponse.data.propositions || []).map((p: string) => decodeBase64(p)),
        },
      };
    }

    return this.handleLoginSuccess(response, preferredAccountId);
  }

  async relogin(username: string, password: string, uuid: string): Promise<LoginResult> {
    const response = await this.http.request<any>('POST', '/login.awp', {
      identifiant: username,
      motdepasse: password,
      isReLogin: true,
      uuid,
    }, {});

    return this.handleLoginSuccess(response);
  }

  async directLogin(username: string, password: string, cn: string, cv: string, uuid: string = ''): Promise<LoginResult> {
    const response = await this.http.request<any>('POST', '/login.awp', {
      identifiant: username,
      motdepasse: password,
      isReLogin: false,
      uuid,
      fa: [
        {
          cn,
          cv,
          uniq: 'false',
        },
      ],
    }, {});

    return this.handleLoginSuccess(response);
  }

  async submit2FA(answer: string, uuid: string = ''): Promise<LoginResult> {
    if (!this.currentUsername || !this.currentPassword) {
      throw new EcoleDirecteError('No pending login flow to submit 2FA for. Call login() first.');
    }

    const challengePostResponse = await this.http.request<{ cn: string; cv: string }>(
      'POST',
      '/connexion/doubleauth.awp',
      { choix: encodeBase64(answer) },
      { verbe: 'post' }
    );

    const finalResponse = await this.http.request<any>('POST', '/login.awp', {
      identifiant: this.currentUsername,
      motdepasse: this.currentPassword,
      isReLogin: false,
      uuid,
      fa: [
        {
          cn: challengePostResponse.data.cn,
          cv: challengePostResponse.data.cv,
          uniq: 'false',
        },
      ],
    }, {});

    return this.handleLoginSuccess(finalResponse);
  }

  async selectAccount(accountId: number): Promise<CleanAccount> {
    const account = this.studentRawAccounts.find((a) => a.id === accountId);
    if (!account) {
      throw new EcoleDirecteAccountTypeError(`Student account ${accountId} was not found.`);
    }

    this.rawAccount = account;
    this.selectedAccount = cleanAccount(account);
    this.initModules(account);

    return this.selectedAccount;
  }

  logout(): void {
    this.http.setToken(null);
    this.rawAccounts = [];
    this.studentRawAccounts = [];
    this.studentAccounts = [];
    this.rawAccount = null;
    this.selectedAccount = null;
    this.homework = undefined;
    this.messaging = undefined;
    this.grades = undefined;
    this.timetable = undefined;
    this.absences = undefined;
    this.timeline = undefined;
    this.documents = undefined;
    this.cloud = undefined;
    this.settings = undefined;
  }

  private handleLoginSuccess(response: any, preferredAccountId?: number): LoginResult {
    this.rawAccounts = response.data.accounts || [];
    this.studentRawAccounts = this.rawAccounts.filter((a) => a.typeCompte === 'E');

    if (this.studentRawAccounts.length === 0) {
      throw new EcoleDirecteAccountTypeError();
    }

    const selectedRaw = this.findAccount(preferredAccountId);
    this.rawAccount = selectedRaw;
    this.selectedAccount = cleanAccount(selectedRaw);
    this.studentAccounts = this.studentRawAccounts.map(cleanAccount);

    this.initModules(selectedRaw);

    return {
      status: 'SUCCESS',
      token: response.token,
      accounts: this.studentAccounts,
    };
  }

  private findAccount(preferredAccountId?: number): RawAccount {
    if (preferredAccountId) {
      const preferred = this.studentRawAccounts.find((a) => a.id === preferredAccountId);
      if (preferred) {
        return preferred;
      }
    }

    return this.studentRawAccounts[0];
  }

  private initModules(account: RawAccount) {
    this.homework = new HomeworkModule(this.http, account);
    this.messaging = new MessagingModule(this.http, account);
    this.grades = new GradesModule(this.http, account);
    this.timetable = new TimetableModule(this.http, account);
    this.absences = new AbsencesModule(this.http, account);
    this.timeline = new TimelineModule(this.http, account);
    this.documents = new DocumentsModule(this.http, account);
    this.cloud = new CloudModule(this.http, account);
    this.settings = new SettingsModule(this.http, account);
  }

  getAccount(): CleanAccount | null {
    return this.selectedAccount;
  }

  getRawAccount(): RawAccount | null {
    return this.rawAccount;
  }

  setToken(token: string | null) {
    this.http.setToken(token);
  }
}
