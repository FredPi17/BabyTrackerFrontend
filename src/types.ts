export type Mood = 'joyeux' | 'calme' | 'fatigué' | 'grognon' | 'excité'

type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface MealPlan {
  breakfast: string
  lunch: string
  snack: string
  dinner: string
}

export interface SleepStats {
  naps: number
  totalHours: number
  nightHours: number
  napHours: number
  nightWakings: number
}

export interface HygieneStats {
  diapers: number
  baths: number
  medications: string
}

export interface ActivityLog {
  time: string
  description: string
}

export type EvendolCriterionId = 'vocal' | 'mimic' | 'movements' | 'positions' | 'relation'

export interface EvendolCriteriaScores {
  vocal: number
  mimic: number
  movements: number
  positions: number
  relation: number
}

export interface EvendolAssessment {
  recordedAt: string
  comment?: string
  criteria: EvendolCriteriaScores
  totalScore: number
}

export interface DailyLogEntry {
  id: string
  date: string
  mood: Mood
  energyLevel: number
  meals: MealPlan
  sleep: SleepStats
  hygiene: HygieneStats
  activities: ActivityLog[]
  evendolAssessments: EvendolAssessment[]
  notes: string
  createdAt: string
  updatedAt: string
}

export type CreateDailyLogDto = Omit<DailyLogEntry, 'id' | 'createdAt' | 'updatedAt' | 'notes'> & {
  notes?: string
}

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner']

export const EVENDOL_CRITERIA: Array<{
  id: EvendolCriterionId
  title: string
  description: string
}> = [
  {
    id: 'vocal',
    title: 'Expression vocale / verbale',
    description: 'Pleure, crie, gémit ou dit qu’il a mal',
  },
  {
    id: 'mimic',
    title: 'Mimique',
    description: 'Front plissé, sourcils froncés, bouche crispée',
  },
  {
    id: 'movements',
    title: 'Mouvements',
    description: 'S’agite, se raidit ou se crispe',
  },
  {
    id: 'positions',
    title: 'Positions',
    description: 'Attitude antalgique, se protège ou reste immobile',
  },
  {
    id: 'relation',
    title: 'Relation avec l’environnement',
    description: 'Consolable, s’intéresse aux jeux, communique',
  },
]

export interface IntegrationAppSummary {
  id: string
  name: string
  provider: 'dropbox'
  description: string
  status: 'beta' | 'ready'
  requiresTwoFactor: boolean
  documentationUrl?: string
}

export type DropboxAuthProvider = 'google' | 'apple' | 'email'

export interface DropboxAuthSession {
  authUrl: string
  state: string
}

export interface DropboxBackupInfo {
  id: string
  fileName: string
  sizeLabel: string
  sizeInBytes: number
  lastModified: string
  note: string
  pathLower: string
}

export interface DropboxConnectionResult {
  status: 'connected'
  appId: string
  appName: string
  accountEmail?: string
  provider?: DropboxAuthProvider
  state?: string
  availableBackups: DropboxBackupInfo[]
  message: string
}

export interface ConnectDropboxPayload {
  appId: string
  accountEmail?: string
  accessToken: string
}

export interface DropboxImportSummaryItem {
  date: string
  newEntries: number
  skipped: number
}

export interface DropboxImportResult {
  summary: DropboxImportSummaryItem[]
}
