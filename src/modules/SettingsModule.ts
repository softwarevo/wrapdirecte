import { BaseModule } from './BaseModule';

export class SettingsModule extends BaseModule {
  async updateIndividualParam(value: string): Promise<void> {
    await this.http.request(
      'POST',
      '/parametreIndividuel.awp',
      {
        path: `Préférences/Elèves/accessibiliteVisuelle/id_${this.studentId}`,
        value,
      },
      { verbe: 'put' }
    );
  }

  async updateAccountSettings(data: {
    identifiant: string;
    nouveauMotDePasse: string;
    confirmationMotDePasse: string;
    email: string;
    portable: string;
    questionSecrete: string;
    reponse: string;
    uuid?: string;
  }): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/logins/${this.studentLoginId}.awp`,
      data,
      { verbe: 'put' }
    );
    return response.data;
  }

  async getAccountSettings(idLogin?: number): Promise<any> {
    const loginId = idLogin ?? this.studentLoginId;
    const response = await this.http.request<any>(
      'POST',
      `/logins/${loginId}.awp`,
      {},
      { verbe: 'get' }
    );
    return response.data;
  }
}
