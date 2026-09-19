export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3333/api/v1`;
  }
  return 'http://127.0.0.1:3333/api/v1';
};

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
      : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getApiUrl();
  const response = await fetch(`${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    // Session expired or unauthenticated
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login?expired=1';
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errMsg = data.message || data.error;
    if (!errMsg && data.errors) {
      if (Array.isArray(data.errors)) {
        errMsg = data.errors.map((e: any) => e.message || e).join('; ');
      } else if (typeof data.errors === 'object') {
        errMsg = Object.values(data.errors).join('; ');
      }
    }
    const err: any = new Error(errMsg || `Erro ${response.status}: Falha na requisição`);
    err.response = { data, status: response.status };
    throw err;
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};
