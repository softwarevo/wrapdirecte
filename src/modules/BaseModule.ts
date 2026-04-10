import { RawAccount } from '../types/account';
import { HttpClient, API_VERSION } from '../utils/http';

export interface BaseModuleOptions {
  raw?: boolean;
}

export abstract class BaseModule {
  constructor(protected http: HttpClient, protected account: RawAccount) {}

  protected get studentId(): number {
    return this.account.id;
  }

  protected get studentUsername(): string {
    return this.account.identifiant;
  }

  protected get studentLoginId(): number {
    return this.account.idLogin;
  }

  protected get apiVersion(): string {
    return API_VERSION;
  }
}
