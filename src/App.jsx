import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import DataEntryForm from './components/DataEntryForm'
import ViewCategory from './pages/ViewCategory'
import Quiz from './pages/Quiz'

const CATEGORIES = [
  { key: 'ows', label: 'One Word Substitution', icon: '🔤' },
  { key: 'idioms', label: 'Idioms & Phrases', icon: '💬' },
  { key: 'syn_ant', label: 'Synonyms & Antonyms', icon: '🔁' },
]

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('ows')
  const [stats, setStats] = useState({})
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    fetchAllStats()
  }, [activeCategory])

  const fetchAllStats = async () => {
    try {
      const res = await fetch('/api/all/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const addEntry = async (entryData) => {
    try {
      const res = await fetch(`/api/${activeCategory}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      })
      if (res.ok) {
        showNotification('Entry added successfully! ✅')
        fetchAllStats()
      }
    } catch (err) {
      showNotification('Failed to add entry ❌')
    }
  }

  const showNotification = (message) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 2500)
  }

  const activeCategoryInfo = CATEGORIES.find(c => c.key === activeCategory)

  return (
    <>
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      <div className="stats-bar">
        {CATEGORIES.map(cat => (
          <Link key={cat.key} to={`/view/${cat.key}`} className="stat-card-link">
            <div className="stat-card">
              <span className="stat-icon">{cat.icon}</span>
              <div className="stat-info">
                <span className="stat-label">{cat.label}</span>
                <span className="stat-numbers">
                  <strong>{stats[cat.key]?.total || 0}</strong> total
                </span>
              </div>
              <span className="stat-arrow">→</span>
            </div>
          </Link>
        ))}
      </div>

      <Navbar
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <main className="main-content">
        <div className="form-section-full">
          <h2>{activeCategoryInfo.icon} Add {activeCategoryInfo.label}</h2>
          <DataEntryForm
            category={activeCategory}
            onSubmit={addEntry}
          />
        </div>

        <div className="quiz-launch-section">
          <Link to="/quiz" className="quiz-launch-btn">
            🧠 Take a Quiz
            <span className="quiz-launch-sub">Test your vocabulary knowledge</span>
          </Link>
        </div>
      </main>
    </>
  )
}

function AppLayout() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="header-link">
          <h1>📖 VocabVault</h1>
          <p className="subtitle">English Vocabulary Builder</p>
        </Link>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/view/:category" element={<ViewCategory />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
