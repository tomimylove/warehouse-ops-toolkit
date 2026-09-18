import type { DataProvider } from './data-provider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const restApiProvider: DataProvider = {
  list: (entity) => request(`/${entity}`),
  get: (entity, id) => request(`/${entity}/${id}`),
  create: (entity, data) =>
    request(`/${entity}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (entity, id, data) =>
    request(`/${entity}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (entity, id) =>
    request(`/${entity}/${id}`, { method: 'DELETE' }),
};
