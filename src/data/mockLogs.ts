import type { DailyLogEntry } from '../types'

const today = new Date()
const isoDate = (offset = 0) => {
  const date = new Date(today)
  date.setDate(today.getDate() - offset)
  return date.toISOString().split('T')[0]
}

export const MOCK_LOGS: DailyLogEntry[] = [
  {
    id: 'mock-1',
    date: isoDate(),
    mood: 'joyeux',
    energyLevel: 8,
    meals: {
      breakfast: 'Porridge aux fruits rouges',
      lunch: 'Poulet, riz et carottes',
      snack: 'Compote pomme-poire',
      dinner: 'Soupe de légumes et pain',
    },
    sleep: {
      naps: 2,
      totalHours: 12,
      nightHours: 9,
      napHours: 3,
      nightWakings: 1,
    },
    hygiene: {
      diapers: 4,
      baths: 1,
      medications: 'Vitamine D (1 goutte)',
    },
    activities: [
      { time: '09:30', description: 'Jeu sensoriel et éveil musical' },
      { time: '15:00', description: 'Sortie au parc' },
    ],
    evendolAssessments: [
      {
        recordedAt: '09:00',
        comment: 'Avant la sieste',
        criteria: {
          vocal: 1,
          mimic: 1,
          movements: 0,
          positions: 0,
          relation: 1,
        },
        totalScore: 3,
      },
      {
        recordedAt: '14:00',
        criteria: {
          vocal: 0,
          mimic: 0,
          movements: 0,
          positions: 0,
          relation: 0,
        },
        totalScore: 0,
      },
    ],
    notes: "Très curieux aujourd'hui, a beaucoup souri.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    date: isoDate(1),
    mood: 'calme',
    energyLevel: 6,
    meals: {
      breakfast: 'Yaourt et banane',
      lunch: 'Poisson, purée de patate douce',
      snack: 'Bâtonnets de concombre',
      dinner: 'Purée courgette et tofu',
    },
    sleep: {
      naps: 1,
      totalHours: 11,
      nightHours: 10,
      napHours: 1,
      nightWakings: 0,
    },
    hygiene: {
      diapers: 5,
      baths: 0,
      medications: 'Aucun',
    },
    activities: [
      { time: '10:00', description: 'Lecture avec papa' },
      { time: '16:00', description: 'Peinture au doigt' },
    ],
    evendolAssessments: [
      {
        recordedAt: '11:00',
        comment: 'Avant repas',
        criteria: {
          vocal: 2,
          mimic: 1,
          movements: 1,
          positions: 1,
          relation: 1,
        },
        totalScore: 6,
      },
    ],
    notes: 'A demandé beaucoup de câlins en fin de journée.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
