import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import HindiInput from '../components/HindiInput'

const CATEGORY_INFO = {
  ows: { label: 'One Word Substitution', icon: '🔤' },
  idioms: { label: 'Idioms & Phrases', icon: '💬' },
  syn_ant: { label: 'Synonyms & Antonyms', icon: '🔁' },
}

const DISPLAY_CONFIGS = {
  ows: {
    columns: ['#', 'One Word', 'Phrase / Description', 'Hindi Meaning', 'Date'],
    render: (entry) => (
      <>
        <td className="table-cell cell-highlight">{entry.word}</td>
        <td className="table-cell">{entry.phrase}</td>
        <td className="table-cell cell-hindi">{entry.hindi || '—'}</td>
      </>
    ),
  },
  idioms: {
    columns: ['#', 'Idiom / Phrase', 'Meaning', 'Hindi Meaning', 'Date'],
    render: (entry) => (
      <>
        <td className="table-cell cell-highlight">{entry.idiom}</td>
        <td className="table-cell">{entry.meaning}</td>
        <td className="table-cell cell-hindi">{entry.hindi || '—'}</td>
      </>
    ),
  },
  syn_ant: {
    columns: ['#', 'Word', 'Meaning', 'Hindi', 'Synonyms', 'Antonyms', 'Date'],
    render: (entry) => (
      <>
        <td className="table-cell cell-highlight">{entry.word}</td>
        <td className="table-cell">{entry.meaning}</td>
        <td className="table-cell cell-hindi">{entry.hindi || '—'}</td>
        <td className="table-cell cell-syn">{entry.synonyms}</td>
        <td className="table-cell cell-ant">{entry.antonyms}</td>
      </>
    ),
  },
}

const EDIT_FIELDS = {
  ows: [
    { name: 'phrase', label: 'Phrase / Description', type: 'text' },
    { name: 'word', label: 'One Word', type: 'text' },
    { name: 'hindi', label: 'Hindi Meaning', type: 'hindi' },
  ],
  idioms: [
    { name: 'idiom', label: 'Idiom / Phrase', type: 'text' },
    { name: 'meaning', label: 'Meaning', type: 'text' },
    { name: 'hindi', label: 'Hindi Meaning', type: 'hindi' },
  ],
  syn_ant: [
    { name: 'word', label: 'Word', type: 'text' },
    { name: 'meaning', label: 'Meaning (English)', type: 'text' },
    { name: 'hindi', label: 'Hindi Meaning', type: 'hindi' },
    { name: 'synonyms', label: 'Synonyms', type: 'text' },
    { name: 'antonyms', label: 'Antonyms', type: 'text' },
  ],
}

function ViewCategory() {
  const { category } = useParams()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [notification, setNotification] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [editFormKey, setEditFormKey] = useState(0)

  const info = CATEGORY_INFO[category]
  const config = DISPLAY_CONFIGS[category]

  useEffect(() => {
    fetchEntries()
    setSearchTerm('')
    setEditingEntry(null)
  }, [category])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/${category}`)
      const data = await res.json()
      setEntries(data)
    } catch (err) {
      console.error('Failed to fetch entries:', err)
    }
    setLoading(false)
  }

  const deleteEntry = async (id) => {
    try {
      const res = await fetch(`/api/${category}/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showNotification('Entry deleted 🗑️')
        fetchEntries()
      }
    } catch (err) {
      showNotification('Failed to delete ❌')
    }
  }

  const openEditModal = (entry) => {
    setEditingEntry(entry)
    const fields = EDIT_FIELDS[category]
    const data = {}
    fields.forEach(f => {
      data[f.name] = entry[f.name] || ''
    })
    setEditFormData(data)
    setEditFormKey(prev => prev + 1)
  }

  const closeEditModal = () => {
    setEditingEntry(null)
    setEditFormData({})
  }

  const handleEditChange = (fieldName, value) => {
    setEditFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const cleanData = {}
      for (const [key, value] of Object.entries(editFormData)) {
        if (value && value.trim()) {
          cleanData[key] = value.trim()
        }
      }
      const res = await fetch(`/api/${category}/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      })
      if (res.ok) {
        showNotification('Entry updated successfully! ✅')
        closeEditModal()
        fetchEntries()
      }
    } catch (err) {
      showNotification('Failed to update entry ❌')
    }
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2500)
  }

  if (!info || !config) {
    return (
      <div className="view-page">
        <div className="view-error">Invalid category</div>
      </div>
    )
  }

  // Filter entries by search term
  const filtered = entries.filter(entry => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return Object.values(entry).some(
      val => typeof val === 'string' && val.toLowerCase().includes(term)
    )
  })

  return (
    <div className="view-page">
      {notification && <div className="notification">{notification}</div>}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Entry</h2>
              <button className="modal-close" onClick={closeEditModal}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleEditSubmit}>
              {EDIT_FIELDS[category].map(field => (
                <div key={field.name} className="form-group">
                  <label htmlFor={`edit-${field.name}`}>{field.label}</label>
                  {field.type === 'hindi' ? (
                    <HindiInput
                      key={editFormKey}
                      id={`edit-${field.name}`}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={editFormData[field.name] || ''}
                      onChange={(val) => handleEditChange(field.name, val)}
                      required={false}
                      initialHindi={editFormData[field.name] || ''}
                    />
                  ) : (
                    <input
                      id={`edit-${field.name}`}
                      type="text"
                      value={editFormData[field.name] || ''}
                      onChange={(e) => handleEditChange(field.name, e.target.value)}
                      autoComplete="off"
                    />
                  )}
                </div>
              ))}
              <div className="modal-actions">
                <button type="submit" className="submit-btn update-btn">✅ Update Entry</button>
                <button type="button" className="cancel-btn" onClick={closeEditModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="view-header">
        <Link to="/" className="back-link">‹ Back to Entry</Link>
        <div className="view-title">
          <h1>{info.icon} {info.label}</h1>
          <div className="view-stats">
            <span className="view-stat-badge total">{entries.length} Total</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="view-search">
        <input
          type="text"
          placeholder={`Search ${info.label.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <span className="search-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">Loading entries...</div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>No entries yet in {info.label}.</p>
          <Link to="/" className="empty-link">Go add some →</Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {config.columns.map(col => (
                  <th key={col} className="table-head">{col}</th>
                ))}
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, index) => {
                const dateStr = entry.createdAt
                  ? new Date(entry.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })
                  : '—'
                return (
                  <tr key={entry.id} className="table-row">
                    <td className="table-cell cell-number">{index + 1}</td>
                    {config.render(entry)}
                    <td className="table-cell cell-date">{dateStr}</td>
                    <td className="table-cell cell-action">
                      <button
                        className="edit-btn-table"
                        onClick={() => openEditModal(entry)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn-table"
                        onClick={() => deleteEntry(entry.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Category navigation */}
      <div className="view-nav-bar">
        {Object.entries(CATEGORY_INFO).map(([key, val]) => (
          <Link
            key={key}
            to={`/view/${key}`}
            className={`view-nav-link ${key === category ? 'active' : ''}`}
          >
            {val.icon} {val.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ViewCategory
