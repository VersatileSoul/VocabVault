function Navbar({ categories, activeCategory, onCategoryChange }) {
  return (
    <nav className="navbar">
      <div className="nav-tabs">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`nav-tab ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat.key)}
          >
            <span className="tab-icon">{cat.icon}</span>
            <span className="tab-label">{cat.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export default Navbar
