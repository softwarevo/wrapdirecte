import { EcoleDirecteAPIError } from './errors';

export const API_VERSION = '7.12.1';
const DEFAULT_APP = 'wrapDirecte/Seedling-0.1.2';
const buildUserAgent = (app: string) => `${app} (iPhone; CPU iPhone OS 26_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23E246  EDMOBILE v${API_VERSION}`;
export const BASE_URL = 'https://api.ecoledirecte.com/v3';

export interface APIResponse<T> {
  host: string;
  code: number;
  token: string;
  message: string;
  data: T;
}

export class HttpClient {
  private token: string | null = null;
  private gtk: string | null = null;
  private userAgent: string;

  constructor(userAgent: string = buildUserAgent(DEFAULT_APP)) {
    this.userAgent = userAgent;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setGtk(gtk: string) {
    this.gtk = gtk;
  }

  async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body: unknown = null,
    params: Record<string, string> = {}
  ): Promise<APIResponse<T>> {
    const url = new URL(BASE_URL + path);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    if (!url.searchParams.has('v')) {
      url.searchParams.append('v', API_VERSION);
    }

    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (this.token) {
      headers['X-Token'] = this.token;
    }

    if (this.gtk) {
      const cleanGtk = this.gtk.replace(/\r\n/g, '');
      headers['X-Gtk'] = cleanGtk;
      headers['Cookie'] = 'GTK=' + cleanGtk;
    }

    let requestBody: string | undefined;
    if (body !== null) {
      const dataString = JSON.stringify(body);
      requestBody = 'data=' + encodeURIComponent(dataString);
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      throw new EcoleDirecteAPIError(`HTTP Error: ${response.status} ${response.statusText}`, response.status);
    }

    const headerToken = response.headers.get('x-token');
    const result = (await response.json()) as APIResponse<T>;

    if (result.code !== 200 && result.code !== 250) {
      throw new EcoleDirecteAPIError(result.message || 'Unknown API Error', result.code, result.host);
    }

    // Always prefer header token if available
    const newToken = headerToken || result.token;
    if (newToken) {
      this.token = newToken;
      result.token = newToken; // Update result for consistency
    }

    return result;
  }

  getToken(): string | null {
    return this.token;
  }

  getUserAgent(): string {
    return this.userAgent;
  }

  async getGTK(): Promise<void> {
    const path = '/login.awp';
    const url = BASE_URL + path + '?gtk=1&v=' + API_VERSION;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': this.userAgent }
    });

    interface HeadersWithSetCookie extends Headers {
      getSetCookie(): string[];
    }

    const hasGetSetCookie = (headers: Headers): headers is HeadersWithSetCookie =>
      typeof (headers as HeadersWithSetCookie).getSetCookie === 'function';

    const setCookies = hasGetSetCookie(response.headers)
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter((cookie): cookie is string => Boolean(cookie));

    if (setCookies.length > 0) {
      for (const cookie of setCookies) {
        const match = cookie.match(/GTK=([^;]+)/);
        if (match) {
          this.gtk = match[1];
          break;
        }
      }
    }

    if (!this.gtk && typeof window !== 'undefined' && typeof document !== 'undefined' && document.cookie) {
      // Browser fallback (if cookies are somehow readable)
      const match = document.cookie.match(/GTK=([^;]+)/);
      if (match) {
        this.gtk = match[1];
      }
    }
  }
}
