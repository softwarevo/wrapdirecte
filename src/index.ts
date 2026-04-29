import { HttpClient, buildUserAgent } from './utils/http';
import { RawAccount, CleanAccount, LoginResult } from './types/account';
import { cleanAccount } from './utils/cleaning';
import { EcoleDirecteAccountTypeError, EcoleDirecteError } from './utils/errors';
import { encodeBase64, decodeBase64 } from './utils/base64';
import * as path from 'path';

import { HomeworkModule } from './modules/HomeworkModule';
import { MessagingModule } from './modules/MessagingModule';
import { GradesModule } from './modules/GradesModule';
import { TimetableModule } from './modules/TimetableModule';
import { AbsencesModule } from './modules/AbsencesModule';
import { TimelineModule } from './modules/TimelineModule';
import { DocumentsModule } from './modules/DocumentsModule';
import { CloudModule } from './modules/CloudModule';
import { SettingsModule } from './modules/SettingsModule';

interface WrapDirecteOptions {
  appName?: string;
  appVersion?: string;
}

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

  constructor(options?: WrapDirecteOptions) {
    let app = 'wrapDirecte/Seedling-0.2.0';
    if (options?.appName) {
      app = `${options.appName}/${options.appVersion || '1.0.0'}`;
    } else {
      if (typeof process !== 'undefined' && typeof require !== 'undefined') {
        try {
          const packageJson = require(path.resolve(__dirname, '..', 'package.json'));
          const name = packageJson.name || 'wrapDirecte';
          const version = packageJson.version || 'Seedling-0.2.0';
          app = `${name}/${version}`;
        } catch {
          // use default
        }
      }
    }
    this.http = new HttpClient(buildUserAgent(app));
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

    try {
      await this.http.getGTK();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new EcoleDirecteError(`Initial authentication setup failed while fetching GTK: ${message}`);
    }

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


  async directLogin(username: string, password: string, faProof: string, uuid: string = ''): Promise<LoginResult> {
    const [cn, cv] = decodeBase64(faProof).split(':');
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

    return this.handleLoginSuccess(response, undefined, { cn, cv });
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

    return this.handleLoginSuccess(finalResponse, undefined, {
      cn: challengePostResponse.data.cn,
      cv: challengePostResponse.data.cv,
    });
  }

  async selectAccount(accountId: number): Promise<CleanAccount> {
    const account = this.studentRawAccounts.find((a) => a.id === accountId);
    if (!account) {
      throw new EcoleDirecteAccountTypeError(`Student account ${accountId} was not found.`);
    }

    this.rawAccount = account;
    this.selectedAccount = await cleanAccount(account, this.http.getHeaders());
    this.initModules(account);

    return this.selectedAccount;
  }

  logout(): void {
    this.http.setToken(null);
    this.http.setGtk(null);
    this.currentUsername = '';
    this.currentPassword = '';
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

  private async handleLoginSuccess(response: any, preferredAccountId?: number, fa?: { cn: string; cv: string }): Promise<LoginResult> {
    this.rawAccounts = response.data.accounts || [];
    this.studentRawAccounts = this.rawAccounts.filter((a) => a.typeCompte === 'E');

    if (this.studentRawAccounts.length === 0) {
      throw new EcoleDirecteAccountTypeError();
    }

    const selectedRaw = this.findAccount(preferredAccountId);
    this.rawAccount = selectedRaw;
    
    this.studentAccounts = await Promise.all(this.studentRawAccounts.map(a => cleanAccount(a, this.http.getHeaders())));
    this.selectedAccount = this.studentAccounts.find((a) => a.id === selectedRaw.id) || null;

    this.initModules(selectedRaw);

    return {
      status: 'SUCCESS',
      token: response.token,
      accounts: this.studentAccounts,
      faProof: fa ? encodeBase64(`${fa.cn}:${fa.cv}`) : undefined,
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

  /**
   * Initialize all modules.
   * @param account The account to use for the modules. If not provided, uses the currently selected account.
   */
  public initModules(account?: RawAccount) {
    const targetAccount = (account || this.rawAccount) as RawAccount;
    this.homework = new HomeworkModule(this.http, targetAccount);
    this.messaging = new MessagingModule(this.http, targetAccount);
    this.grades = new GradesModule(this.http, targetAccount);
    this.timetable = new TimetableModule(this.http, targetAccount);
    this.absences = new AbsencesModule(this.http, targetAccount);
    this.timeline = new TimelineModule(this.http, targetAccount);
    this.documents = new DocumentsModule(this.http, targetAccount);
    this.cloud = new CloudModule(this.http, targetAccount);
    this.settings = new SettingsModule(this.http, targetAccount);
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
