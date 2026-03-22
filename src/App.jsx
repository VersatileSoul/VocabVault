import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import DataEntryForm from './components/DataEntryForm'
import ViewCategory from './pages/ViewCategory'
import Quiz from './pages/Quiz'
import Login from './pages/Login'

const CATEGORIES = [
  { key: 'ows', label: 'One Word Substitution', icon: '🔤' },
  { key: 'idioms', label: 'Idioms & Phrases', icon: '💬' },
  { key: 'syn_ant', label: 'Synonyms & Antonyms', icon: '🔁' },
]

function HomePage() {
  const { isAdmin } = useAuth()
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
    const token = localStorage.getItem('vocabvault_token')
    try {
      const res = await fetch(`/api/${activeCategory}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entryData),
      })
      if (res.ok) {
        showNotification('Entry added successfully! ✅')
        fetchAllStats()
      } else {
        showNotification('Unauthorized. Please login. ❌')
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

      {isAdmin && (
        <>
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
          </main>
        </>
      )}

      <div className="quiz-launch-section">
        <Link to="/quiz" className="quiz-launch-btn">
          🧠 Take a Quiz
          <span className="quiz-launch-sub">Test your vocabulary knowledge</span>
        </Link>
      </div>
    </>
  )
}

function AppLayout() {
  const { user, isAdmin, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="header-link">
          <h1>📖 VocabVault</h1>
          <p className="subtitle">English Vocabulary Builder</p>
        </Link>
        <div className="header-actions">
          {isAdmin ? (
            <div className="admin-bar">
              <span className="admin-badge">👤 {user.username}</span>
              <button className="auth-btn logout-btn" onClick={logout}>Logout</button>
            </div>
          ) : (
            <Link to="/login" className="auth-btn login-btn">🔐 Admin Login</Link>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/view/:category" element={<ViewCategory />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
