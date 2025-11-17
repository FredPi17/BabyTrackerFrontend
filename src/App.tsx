import { useState } from 'react'
import { DailyHistory } from './components/DailyHistory'
import { DailyLogForm } from './components/DailyLogForm'
import { DailySummary } from './components/DailySummary'
import { EvendolCalendar } from './components/EvendolCalendar'
import { DropboxIntegrationCard } from './components/DropboxIntegrationCard'
import { StatsPanel } from './components/StatsPanel'
import { useDailyLog } from './hooks/useDailyLog'
import './App.css'

const NAV_ITEMS = [
  {
    id: 'dashboard' as const,
    title: 'Tableau de bord',
    description: 'Résumé des dernières données',
  },
  {
    id: 'manual' as const,
    title: 'Saisie manuelle',
    description: 'Complétez vos suivis à la main',
  },
  {
    id: 'imports' as const,
    title: 'Imports Dropbox',
    description: 'Connectez vos sauvegardes Baby Tracker',
  },
  {
    id: 'stats' as const,
    title: 'Stats',
    description: 'Visualisez les tendances',
  },
]

type NavId = (typeof NAV_ITEMS)[number]['id']

function App() {
  const { entries, latestEntry, selectedDate, setSelectedDate, createEntry, isLoading, isSaving, error } = useDailyLog()
  const [activeTab, setActiveTab] = useState<NavId>('dashboard')

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Tableau de bord parental</p>
          <h1>Evendol · Suivi quotidien</h1>
          <p>Consignez l'humeur, les repas, le sommeil et toutes les informations importantes de votre enfant.</p>
        </div>
        <label className="date-filter">
          <span>Jour consulté</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </header>

      <nav className="app-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-card ${activeTab === item.id ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab(item.id)}
          >
            <span>{item.title}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>

      {error && <div className="alert alert-warning">{error}</div>}

      {activeTab === 'dashboard' && (
        <main className="layout layout-single">
          <section className="panel stack">
            <DailySummary entry={latestEntry} isLoading={isLoading} />
            <EvendolCalendar entries={entries} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <DailyHistory entries={entries} />
          </section>
        </main>
      )}

      {activeTab === 'manual' && (
        <main className="layout layout-single">
          <section className="panel">
            <DailyLogForm defaultDate={selectedDate} onSubmit={createEntry} isSubmitting={isSaving} />
          </section>
        </main>
      )}

      {activeTab === 'imports' && (
        <main className="layout layout-single">
          <DropboxIntegrationCard />
        </main>
      )}

      {activeTab === 'stats' && (
        <main className="layout layout-single">
          <section className="panel">
            <StatsPanel entries={entries} />
          </section>
        </main>
      )}
    </div>
  )
}

export default App
