import { API_BASE_URL } from '@/constants/Constants';

export class AuthError extends Error {
  constructor() { super('Authentication required'); this.name = 'AuthError'; }
}

export class ApiError extends Error {
  constructor(public status: number, public data: unknown, message?: string) {
    super(message ?? `API error ${status}`);
  }
}

type TokenStore = {
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  clearTokens: () => Promise<void>;
  /** Active organization id for multi-tenant request scoping (X-Organization-Id). */
  getActiveOrgId?: () => number | null;
};

let tokenStore: TokenStore | null = null;
let _refreshPromise: Promise<string | null> | null = null;

export function configureDataService(store: TokenStore) {
  tokenStore = store;
}

function activeOrgHeader(): Record<string, string> {
  const id = tokenStore?.getActiveOrgId?.() ?? null;
  return id != null ? { 'X-Organization-Id': String(id) } : {};
}

async function _doRefresh(): Promise<string | null> {
  const store = tokenStore;
  if (!store) return null;
  const refresh = await store.getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    await store.clearTokens();
    return null;
  }

  const data = await res.json();
  await store.setTokens(data.access, data.refresh ?? refresh);
  return data.access;
}

function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = _doRefresh().finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const access = tokenStore ? await tokenStore.getAccessToken() : null;

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...activeOrgHeader(),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const res = await fetch(fullUrl, { ...options, headers });

  if (res.status === 401 && retry && tokenStore) {
    const newAccess = await refreshAccessToken();
    if (newAccess) return request<T>(url, options, false);
    throw new AuthError();
  }

  if (!res.ok) {
    let data: unknown;
    try { data = await res.json(); } catch { data = null; }
    throw new ApiError(res.status, data, `${res.status} ${res.statusText}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export type ViewSetOptions = {
  params?: Record<string, string | number | boolean>;
};

export type ViewSet = {
  list: (opts?: ViewSetOptions) => Promise<unknown>;
  retrieve: (opts: { id: number | string } & ViewSetOptions) => Promise<unknown>;
  create: (opts: { body: unknown }) => Promise<unknown>;
  update: (opts: { id: number | string; body: unknown }) => Promise<unknown>;
  delete: (opts: { id: number | string }) => Promise<void>;
  options: () => Promise<unknown>;
  action: (opts: { id?: number | string; action: string; method?: string; body?: unknown; params?: Record<string, string> }) => Promise<unknown>;
};

function buildQuery(params?: Record<string, string | number | boolean>): string {
  if (!params) return '';
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export function getViewSet(baseUrl: string): ViewSet {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return {
    list: (opts) => request(`${base}${buildQuery(opts?.params)}`),
    retrieve: ({ id, ...opts }) => request(`${base}${id}/${buildQuery(opts?.params)}`),
    create: ({ body }) => request(base, { method: 'POST', body: JSON.stringify(body) }),
    update: ({ id, body }) => request(`${base}${id}/`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: ({ id }) => request(`${base}${id}/`, { method: 'DELETE' }),
    options: () => request(base, { method: 'OPTIONS' }),
    action: ({ id, action, method = 'POST', body, params }) => {
      const url = id ? `${base}${id}/${action}/${buildQuery(params)}` : `${base}${action}/${buildQuery(params)}`;
      return request(url, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
    },
  };
}

export async function uploadFormData<T>(url: string, formData: FormData): Promise<T> {
  return request<T>(url, { method: 'POST', body: formData });
}

export async function downloadBlob(url: string, retry = true): Promise<Blob> {
  const access = tokenStore ? await tokenStore.getAccessToken() : null;
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const headers: Record<string, string> = {
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...activeOrgHeader(),
  };
  const res = await fetch(fullUrl, { method: 'POST', headers });
  if (res.status === 401 && retry && tokenStore) {
    const newAccess = await refreshAccessToken();
    if (newAccess) return downloadBlob(url, false);
    throw new AuthError();
  }
  if (!res.ok) throw new ApiError(res.status, null, `${res.status} ${res.statusText}`);
  return res.blob();
}

export class AuthService {
  static async login(username: string, password: string) {
    const data = await request<{ access: string; refresh: string }>(
      '/api/auth/token/',
      { method: 'POST', body: JSON.stringify({ username, password }) },
      false,
    );
    if (tokenStore) await tokenStore.setTokens(data.access, data.refresh);
    return AuthService.getMe();
  }

  static async logout() {
    if (tokenStore) await tokenStore.clearTokens();
  }

  static async getMe() {
    return request('/api/auth/me/');
  }
}
