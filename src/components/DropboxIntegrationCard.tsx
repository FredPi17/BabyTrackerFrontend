import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { api } from '../lib/api'
import type {
  ConnectDropboxPayload,
  DropboxAuthProvider,
  DropboxBackupInfo,
  DropboxConnectionResult,
  DropboxImportSummaryItem,
  IntegrationAppSummary,
} from '../types'

interface FormState {
  appId: string
  accountEmail: string
  accessToken: string
}

const initialFormState: FormState = {
  appId: '',
  accountEmail: '',
  accessToken: '',
}

const STORAGE_KEY = 'evendol.dropboxConnection'

const AUTH_PROVIDERS: Array<{
  id: DropboxAuthProvider
  label: string
  description: string
  cta: string
}> = [
  {
    id: 'google',
    label: 'Google',
    description: 'Connexion via votre compte Gmail / Workspace',
    cta: 'Continuer avec Google',
  },
  {
    id: 'apple',
    label: 'Apple',
    description: 'Identifiant Apple relié à votre Dropbox',
    cta: 'Continuer avec Apple',
  },
  {
    id: 'email',
    label: 'Adresse e-mail Dropbox',
    description: 'Utiliser un token Dropbox généré manuellement',
    cta: 'Lier mon compte avec un token',
  },
]

const formatDate = (value: string) =>
  new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

export function DropboxIntegrationCard() {
  const [apps, setApps] = useState<IntegrationAppSummary[]>([])
  const [appsError, setAppsError] = useState<string | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialFormState)
  const [isLoadingApps, setIsLoadingApps] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<DropboxConnectionResult | null>(null)
  const [authProvider, setAuthProvider] = useState<DropboxAuthProvider>('google')
  const [pendingOauthState, setPendingOauthState] = useState<string | null>(null)
  const [isRestoringConnection, setIsRestoringConnection] = useState(true)
  const [importingPath, setImportingPath] = useState<string | null>(null)
  const [importSummary, setImportSummary] = useState<DropboxImportSummaryItem[] | null>(null)

  const popupRef = useRef<Window | null>(null)
  const pendingStateRef = useRef<string | null>(null)
  const storedStateRef = useRef<string | null>(null)

  const persistConnection = (payload: {
    provider: DropboxAuthProvider
    state?: string
    result?: DropboxConnectionResult | null
  }) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          provider: payload.provider,
          state: payload.state,
          result: payload.result ?? null,
        }),
      )
    } catch (err) {
      console.warn('Impossible de sauvegarder la connexion Dropbox', err)
    }
  }

  const clearStoredConnection = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.warn('Impossible de supprimer la connexion Dropbox', err)
    }
    storedStateRef.current = null
    pendingStateRef.current = null
    setPendingOauthState(null)
    setResult(null)
  }

  useEffect(() => {
    let mounted = true
    const loadApps = async () => {
      setAppsError(null)
      try {
        const data = await api.fetchIntegrationApps()
        if (!mounted) {
          return
        }
        setApps(data)
        setForm((prev) => ({
          ...prev,
          appId: prev.appId || data[0]?.id || '',
        }))
      } catch (err) {
        if (!mounted) {
          return
        }
        console.error('Impossible de charger les intégrations Dropbox', err)
        setAppsError('Impossible de charger les applications compatibles Dropbox pour le moment.')
      } finally {
        if (mounted) {
          setIsLoadingApps(false)
        }
      }
    }
    loadApps()
    return () => {
      mounted = false
    }
  }, [])

  const selectedApp = useMemo(() => apps.find((item) => item.id === form.appId) ?? null, [apps, form.appId])

  useEffect(() => {
    const restoreConnection = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
          return
        }

        const stored: { state?: string; provider?: DropboxAuthProvider; result?: DropboxConnectionResult | null } =
          JSON.parse(raw)
        if (!stored?.provider) {
          return
        }

        if (stored.provider === 'email' && stored.result) {
          setResult(stored.result)
          setImportSummary(null)
          return
        }

        if (stored.state) {
          storedStateRef.current = stored.state
          const connection = await api.fetchDropboxConnection(stored.state)
          setResult(connection)
          setImportSummary(null)
          persistConnection({ provider: stored.provider, state: stored.state, result: connection })
        }
      } catch (err) {
        console.warn('Impossible de restaurer la connexion Dropbox', err)
        clearStoredConnection()
        setConnectError('Session Dropbox expirée, merci de relancer la connexion.')
      } finally {
        setIsRestoringConnection(false)
      }
    }

    restoreConnection()
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || data.type !== 'DROPBOX_OAUTH_RESULT') {
        return
      }
      if (!pendingStateRef.current || data.state !== pendingStateRef.current) {
        return
      }

      if (data.success) {
        void handleOauthSuccess(data.state)
      } else {
        setConnectError(data.message ?? 'Connexion Dropbox interrompue.')
        pendingStateRef.current = null
        setPendingOauthState(null)
        closePopup()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (field === 'appId') {
      setResult(null)
    }
  }

  const startOauthFlow = async () => {
    setIsSubmitting(true)
    setConnectError(null)
    try {
      const session = await api.createDropboxAuthSession(authProvider)
      const popup =
        window.open(session.authUrl, 'dropbox-oauth', 'width=620,height=720,noopener,noreferrer') ??
        window.open(session.authUrl, '_blank')
      if (!popup) {
        throw new Error('Impossible d’ouvrir la fenêtre Dropbox. Merci d’autoriser les pop-ups.')
      }
      popupRef.current = popup
      popup.focus()
      pendingStateRef.current = session.state
      setPendingOauthState(session.state)
    } catch (err) {
      console.error('Impossible de démarrer le flux OAuth Dropbox', err)
      setConnectError(err instanceof Error ? err.message : 'Impossible de démarrer la connexion Dropbox.')
      closePopup()
      pendingStateRef.current = null
      setPendingOauthState(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const connectWithManualToken = async () => {
    setIsSubmitting(true)
    setConnectError(null)
    const payload: ConnectDropboxPayload = {
      appId: form.appId,
      accountEmail: form.accountEmail.trim() || undefined,
      accessToken: form.accessToken.trim(),
    }

    try {
      const response = await api.connectToDropbox(payload)
      setResult(response)
      persistConnection({ provider: 'email', result: response })
      setImportSummary(null)
      setForm((prev) => ({
        ...prev,
        accessToken: '',
      }))
    } catch (err) {
      console.error('Connexion Dropbox impossible', err)
      setResult(null)
      setConnectError(err instanceof Error ? err.message : 'Connexion impossible à Dropbox.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOauthSuccess = async (state: string) => {
    try {
      const connection = await api.fetchDropboxConnection(state)
      setResult(connection)
      persistConnection({ provider: authProvider, state, result: connection })
      setImportSummary(null)
      setConnectError(null)
    } catch (err) {
      console.error('Impossible de récupérer la connexion Dropbox', err)
      setConnectError('Connexion Dropbox validée mais impossible de récupérer les fichiers.')
    } finally {
      pendingStateRef.current = null
      setPendingOauthState(null)
      closePopup()
    }
  }

  const closePopup = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    popupRef.current = null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.appId) {
      return
    }

    if (authProvider === 'email' && !form.accessToken.trim()) {
      setConnectError('Merci de coller un token Dropbox valide ou choisissez Google / Apple.')
      return
    }

    if (authProvider !== 'email') {
      await startOauthFlow()
      return
    }

    await connectWithManualToken()
  }

  const canSubmit =
    Boolean(form.appId && (authProvider !== 'email' || form.accessToken.trim().length > 0)) &&
    !isSubmitting &&
    !isLoadingApps &&
    !pendingOauthState &&
    !isRestoringConnection

  const handleForgetConnection = () => {
    clearStoredConnection()
    setConnectError(null)
    setImportSummary(null)
  }

  const handleImportBackup = async (backup: DropboxBackupInfo) => {
    if (!result?.state) {
      setConnectError('Impossible d’importer : merci de reconnecter Dropbox pour obtenir une session OAuth valide.')
      return
    }
    setImportingPath(backup.pathLower)
    setConnectError(null)
    try {
      const response = await api.importDropboxBackup(result.state, backup.pathLower)
      setImportSummary(response.summary)
    } catch (err) {
      console.error('Import Dropbox impossible', err)
      setConnectError(err instanceof Error ? err.message : 'Import Dropbox impossible.')
    } finally {
      setImportingPath(null)
    }
  }

  return (
    <section className="panel integration-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Import Dropbox</p>
          {!result ? (
            <>
              <h2>Connexion aux sauvegardes Baby Tracker</h2>
              <p>
                Choisissez votre méthode de connexion Dropbox (OAuth Google/Apple ou token manuel) pour scanner vos exports Baby
                Tracker.
              </p>
            </>
          ) : (
            <>
              <h2>Dropbox connecté</h2>
              <p>Votre compte est lié. Oubliez la connexion pour changer d’utilisateur.</p>
            </>
          )}
        </div>
      </div>

      {appsError && <div className="alert alert-warning">{appsError}</div>}
      {connectError && <div className="alert alert-warning">{connectError}</div>}

      {!result ? (
        <form className="integration-form" onSubmit={handleSubmit}>
          <label>
            <span className="form-label">Application à connecter</span>
            <select value={form.appId} onChange={handleChange('appId')} disabled={isLoadingApps || apps.length === 0}>
              {apps.length === 0 && <option value="">Aucune application disponible</option>}
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} · {app.status === 'beta' ? 'beta' : 'stable'}
                </option>
              ))}
            </select>
          </label>

          {selectedApp && (
            <p className="integration-helper">
              {selectedApp.description}{' '}
              {selectedApp.documentationUrl && (
                <a href={selectedApp.documentationUrl} target="_blank" rel="noreferrer">
                  Consulter la documentation Dropbox
                </a>
              )}
            </p>
          )}

          <div className="provider-options">
            {AUTH_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                className={`provider-button ${authProvider === provider.id ? 'active' : ''}`}
                onClick={() => {
                  setAuthProvider(provider.id)
                  setResult(null)
                  setConnectError(null)
                }}
              >
                <span className="provider-label">{provider.label}</span>
                <span className="provider-description">{provider.description}</span>
              </button>
            ))}
          </div>

          <div className="integration-grid">
            <label>
              <span className="form-label">Adresse Dropbox (optionnel)</span>
              <input
                type="email"
                name="accountEmail"
                placeholder="prenom.nom@example.com"
                value={form.accountEmail}
                onChange={handleChange('accountEmail')}
              />
            </label>
            {authProvider === 'email' && (
              <label>
                <span className="form-label">Token d’accès Dropbox</span>
                <input
                  type="password"
                  name="accessToken"
                  placeholder="sl.BD11..."
                  value={form.accessToken}
                  onChange={handleChange('accessToken')}
                />
              </label>
            )}
          </div>

          {authProvider === 'email' ? (
            <div className="integration-note">
              <p>
                Générez un token d’accès à partir du tableau de bord développeurs Dropbox (OAuth 2). Le token n’est utilisé que pour
                détecter les exports Baby Tracker stockés dans /Apps.
              </p>
            </div>
          ) : (
            <div className="integration-note">
              <p>Vous serez redirigé vers Dropbox pour autoriser Evendol. N’oubliez pas d’autoriser les pop-ups si nécessaire.</p>
            </div>
          )}

          <div className="integration-submit-row">
            <button className="primary" type="submit" disabled={!canSubmit || isRestoringConnection}>
              {isSubmitting ? 'Connexion en cours…' : getProvider(authProvider).cta}
            </button>
            <p className="integration-helper small">
              Les autorisations Dropbox sont utilisées à la volée puis supprimées après l’analyse des fichiers.
            </p>
          </div>
        </form>
      ) : (
        <div className="integration-connected">
          <div>
            <p className="integration-helper">
              Connecté à <strong>{result.accountEmail ?? 'Dropbox'}</strong>
            </p>
            <p className="integration-helper small">Cliquez sur « Oublier la connexion » pour relier un autre compte.</p>
          </div>
          <div className="integration-connected-actions">
            <button type="button" className="ghost-button" onClick={handleForgetConnection}>
              Oublier la connexion
            </button>
          </div>
        </div>
      )}

      {result?.availableBackups.length ? (
        <div className="integration-backups">
          <h3>Fichiers Dropbox détectés</h3>
          <ul className="backup-list">
            {result.availableBackups.map((backup) => (
              <BackupListItem
                key={backup.id}
                backup={backup}
                onImport={handleImportBackup}
                disabled={!result.state}
                isLoading={importingPath === backup.pathLower}
              />
            ))}
          </ul>
          {!result.state && (
            <p className="integration-helper small">
              Réauthentifiez votre compte Dropbox pour importer automatiquement les sauvegardes.
            </p>
          )}
          {importSummary && importSummary.length > 0 && (
            <div className="integration-note">
              <p>Dernier import :</p>
              <ul>
                {importSummary.map((item) => (
                  <li key={item.date}>
                    {item.date} · {item.newEntries} nouvelles entrées, {item.skipped} ignorées
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

function BackupListItem({
  backup,
  onImport,
  disabled,
  isLoading,
}: {
  backup: DropboxBackupInfo
  disabled: boolean
  isLoading: boolean
  onImport: (backup: DropboxBackupInfo) => void
}) {
  return (
    <li className="backup-item">
      <div>
        <strong>{backup.fileName}</strong>
        <p className="backup-meta">
          Modifié le {formatDate(backup.lastModified)} · {backup.sizeLabel}
        </p>
        <p className="backup-note">{backup.note}</p>
      </div>
      <button className="ghost-button" type="button" disabled={disabled || isLoading} onClick={() => onImport(backup)}>
        {isLoading ? 'Import en cours…' : 'Importer'}
      </button>
    </li>
  )
}

function getProvider(provider: DropboxAuthProvider) {
  return AUTH_PROVIDERS.find((item) => item.id === provider) ?? AUTH_PROVIDERS[0]
}
