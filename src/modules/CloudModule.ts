import { BaseModule, BaseModuleOptions } from './BaseModule';
import { USER_AGENT } from '../utils/http';

export interface CleanCloudNode {
  type: 'file' | 'folder';
  name: string;
  date: Date | null;
  size: number;
  id: string;
  children?: CleanCloudNode[];
}

export class CloudModule extends BaseModule {
  async getCloudFiles(depth: number = 3, options: BaseModuleOptions = {}): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/cloud/E/${this.studentId}.awp`,
      { profondeur: depth },
      { verbe: 'get', v: this.apiVersion }
    );

    if (options.raw) return response.data;

    return (response.data || []).map((node: any) => this.cleanCloudNode(node));
  }

  private cleanCloudNode(n: any): CleanCloudNode {
    return {
      type: n.type,
      name: n.libelle,
      date: n.date ? new Date(n.date.replace(/-/g, '/')) : null,
      size: n.taille || 0,
      id: n.id,
      children: n.children ? n.children.map((c: any) => this.cleanCloudNode(c)) : undefined,
    };
  }

  async createFolder(parentPath: string, folderName: string): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/cloud/E/${this.studentId}.awp`,
      {
        parentNode: { id: parentPath, type: 'folder' },
        libelle: folderName,
        typeRessource: 'folder',
      },
      { verbe: 'post', v: this.apiVersion }
    );
    return response.data;
  }

  async copyNodes(parentPath: string, nodes: any[]): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/cloud/E/${this.studentId}.awp`,
      {
        parentNode: { id: parentPath, type: 'folder' },
        clipboard: nodes,
      },
      { verbe: 'copy', v: this.apiVersion }
    );
    return response.data;
  }

  async deleteNodes(nodes: any[]): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/cloud/E/${this.studentId}/visibility.awp`,
      { tabNodes: nodes },
      { verbe: 'delete', v: this.apiVersion }
    );
    return response.data;
  }

  async restoreNodes(nodes: any[]): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      `/cloud/E/${this.studentId}/visibility.awp`,
      { tabNodes: nodes },
      { verbe: 'post', v: this.apiVersion }
    );
    return response.data;
  }

  async moveNodes(parentPath: string, nodes: any[]): Promise<any> {
    const copyResult = await this.copyNodes(parentPath, nodes);
    await this.deleteNodes(nodes);
    return copyResult;
  }

  async exportToCloud(fileId: number, module: 'CAHIER_DE_TEXTES' | 'MESSAGERIE'): Promise<any> {
    const response = await this.http.request<any>(
      'POST',
      '/exportToCloud.awp',
      {},
      {
        idFichier: fileId.toString(),
        typeModule: module,
        isArchive: 'false',
        isEternel: 'false',
        idVisiteStage: '',
        verbe: 'post',
        v: this.apiVersion,
      }
    );
    return response.data;
  }

  async uploadFile(destPath: string, fileData: Blob | Buffer, fileName: string): Promise<any> {
    const url = new URL(`https://api.ecoledirecte.com/v3/televersement.awp`);
    url.searchParams.append('verbe', 'post');
    url.searchParams.append('mode', 'CLOUD');
    url.searchParams.append('dest', destPath);

    const formData = new FormData();

    // 1. Préparation du Blob de manière compatible Node/Browser
    let fileToAppend: Blob;

    if (fileData instanceof Blob) {
        // Si c'est déjà un Blob, on l'utilise directement
        fileToAppend = fileData;
    } else {
        // Si c'est un Buffer (Node.js), on le convertit en Uint8Array pour le constructeur Blob
        // Le cast "as Buffer" lève l'ambiguïté TS2769
        fileToAppend = new Blob([new Uint8Array(fileData as Buffer)]);
    }

    // 2. Ajout au FormData (on utilise la variable nettoyée 'fileToAppend')
    formData.append('file', fileToAppend, fileName);

    // 3. Envoi de la requête
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'X-Token': this.http.getToken() || '',
        // Note : On ne définit SURTOUT PAS le Content-Type ici, 
        // fetch le fera automatiquement avec le boundary pour le FormData
      },
      body: formData,
    });

    return await response.json();
  }

  async downloadFile(params: {
    type: 'CLOUD' | 'FICHIER_CDT' | 'PIECE_JOINTE' | string;
    fileId: string;
    year?: string;
  }): Promise<Blob> {
    const url = `https://api.ecoledirecte.com/v3/telechargement.awp?verbe=get`;

    const body: Record<string, string> = {
      leTypeDeFichier: params.type,
      fichierId: params.fileId,
      token: this.http.getToken() || '',
    };

    if (params.type === 'CLOUD') {
      body.data = JSON.stringify({ idEntity: this.studentId, typeEntity: 'E' });
    }
    if (params.year) {
      body.anneeMessages = params.year;
    }

    const formBody = Object.keys(body).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key])).join('&');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    return await response.blob();
  }
}
