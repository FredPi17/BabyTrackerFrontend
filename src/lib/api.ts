import type {
  ConnectDropboxPayload,
  CreateDailyLogDto,
  DailyLogEntry,
  DropboxAuthProvider,
  DropboxAuthSession,
  DropboxConnectionResult,
  DropboxImportResult,
  IntegrationAppSummary,
} from '../types'

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }

  return 'http://localhost:3000'
}

const API_URL = resolveApiBaseUrl().replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erreur réseau inconnue')
  }

  return response.json() as Promise<T>
}

export const api = {
  fetchLogs() {
    return request<DailyLogEntry[]>('/api/logs')
  },
  createLog(payload: CreateDailyLogDto) {
    return request<DailyLogEntry>('/api/logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateLog(id: string, payload: Partial<CreateDailyLogDto>) {
    return request<DailyLogEntry>(`/api/logs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
  fetchIntegrationApps() {
    return request<IntegrationAppSummary[]>('/api/integrations/apps')
  },
  createDropboxAuthSession(provider: DropboxAuthProvider) {
    return request<DropboxAuthSession>('/api/integrations/dropbox/auth-session', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    })
  },
  fetchDropboxConnection(state: string) {
    return request<DropboxConnectionResult>(`/api/integrations/dropbox/connections/${state}`)
  },
  connectToDropbox(payload: ConnectDropboxPayload) {
    return request<DropboxConnectionResult>('/api/integrations/dropbox/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  importDropboxBackup(state: string, path: string) {
    return request<DropboxImportResult>('/api/integrations/dropbox/import', {
      method: 'POST',
      body: JSON.stringify({ state, path }),
    })
  },
}
