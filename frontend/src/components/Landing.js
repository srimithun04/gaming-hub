import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DynamicCanvasCrop from './utils/DynamicCanvasCrop';
import './Css/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [games, setGames] = useState([]);
  
  // DYNAMIC CONTENT STATES
  const [news, setNews] = useState([]);
  const [heroBanner, setHeroBanner] = useState('');
  
  const [showProfile, setShowProfile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const username = location.state?.username || 'Gamer';
  const avatarLetter = username.charAt(0).toUpperCase();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [gRes, nRes, aRes] = await Promise.all([
          fetch('http://localhost:8000/api/top-games').then(r => r.json()),
          fetch('http://localhost:8000/api/news').then(r => r.json()),
          fetch('http://localhost:8000/api/assets').then(r => r.json())
        ]);
        
        if (gRes.status === 'success') setGames(gRes.games || []);
        if (nRes.status === 'success') setNews(nRes.news || []);
        
        // BUG FIXED HERE: Changed 'hero_banner' to 'landing_hero' to match the database
        if (aRes.status === 'success') setHeroBanner(aRes.assets.landing_hero || '');
        
      } catch (error) {
        console.error("Database connection failed", error);
      }
    };
    fetchAllData();
  }, []);

  const handleLogout = () => navigate('/');
  const handleWishlist = (gameTitle) => alert(`Wishlist function for ${gameTitle} is next!`);

  const nextGame = () => setCurrentIndex((prev) => (prev + 1 < games.length ? prev + 1 : prev));
  const prevGame = () => setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
  const handleWheel = (e) => {
    if (e.deltaY > 50 || e.deltaX > 50) nextGame();
    if (e.deltaY < -50 || e.deltaX < -50) prevGame();
  };

  return (
    <div className="landing-shield">
      <header className="dash-header">
        <div className="logo">GAMING<span>HUB</span></div>
        <nav className="dash-nav">
          <span className="active">Home</span>
          <span>Community</span>
        </nav>
        <div className="search-bar">
          <input type="text" placeholder="Search games..." />
        </div>
        <div className="profile-wrapper" onClick={() => setShowProfile(!showProfile)}>
          
          <div className="avatar">{avatarLetter}</div>
          
          {showProfile && (
            <div className="profile-dropdown">
              <div className="dropdown-item" style={{color: '#fff', borderBottom: '1px solid #333'}}>
                Hi, <strong>{username}</strong>
              </div>
              <div className="dropdown-item">Profile</div>
              <div className="dropdown-item logout" onClick={handleLogout}>Logout</div>
            </div>
          )}
        </div>
      </header>

      <section className="hero-split">
        <div className="hero-left">
          <h1>Level Up<br/>Your Hub</h1>
          <p>Find. Play. Connect. The Grid is yours.</p>
          <div className="hero-details">
            <div className="detail-item">
              <span className="detail-num">#01</span>
              <div>
                <strong>Discover Games</strong>
                <p>Find your next play from millions.</p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-num">#02</span>
              <div>
                <strong>Track Stats</strong>
                <p>Log your hours, achievements, and progress.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-right">
          {/* DYNAMIC HERO BANNER */}
          <img 
            src={heroBanner || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000"} 
            alt="Gaming visual" 
            className="hero-image" 
          />
        </div>
      </section>

      <section className="news-bento">
        <div className="bento-header">
          <h2>Latest Transmissions</h2>
          <p>The biggest updates from across the Grid.</p>
        </div>
        <div className="bento-grid">
          
          {/* DYNAMIC BENTO GRID LOOP */}
          {news.map((item, index) => {
            const cardClass = (index === 0 || index === 3) ? 'wide' : 'square';
            
            return (
              <div key={item.id} className={`bento-card ${cardClass}`}>
                <img 
                  src={item.image_url || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=500"} 
                  alt={item.title} 
                  className="bento-bg" 
                />
                <div className="bento-content">
                  <span className={`bento-tag ${item.tag ? item.tag.toLowerCase() : ''}`}>
                    {item.tag || 'NEW'}
                  </span>
                  <h3>{item.title || 'Awaiting Signal...'}</h3>
                  <p>{item.description || 'Check back later for updates.'}</p>
                </div>
              </div>
            );
          })}

        </div>
      </section>

      <section className="carousel-section" onWheel={handleWheel}>
        <div className="carousel-header">
          <h2>Featured Collection</h2>
          <p>Swipe through the top trending games in the database right now.</p>
        </div>
        
        <button className="carousel-arrow left" onClick={prevGame} disabled={currentIndex === 0}>&#10094;</button>

        <div className="carousel-container">
          {games.map((game, index) => {
            const offset = index - currentIndex;
            const absOffset = Math.abs(offset);
            const isCenter = offset === 0;

            if (absOffset > 3) return null;

            return (
              <div 
                key={game.id} 
                className={`carousel-card ${isCenter ? 'active' : ''}`}
                style={{
                  transform: `translateX(${offset * 160}px) scale(${1 - absOffset * 0.15}) perspective(1000px) rotateY(${offset * -10}deg)`,
                  zIndex: 10 - absOffset,
                  opacity: 1 - absOffset * 0.25,
                }}
                onClick={() => setCurrentIndex(index)}
              >
                {/* DYNAMIC CANVAS CROP FOR CAROUSEL GAMES ONLY */}
                <DynamicCanvasCrop
                  src={game.image}
                  cropData={game.crop_data}
                  alt={game.title}
                  className="carousel-img" 
                  loading="lazy"
                />
                
                <div className="carousel-info">
                  <div>
                    <h3>{game.title}</h3>
                    <span className="genre-badge">{game.genre}</span>
                  </div>
                  <button className="heart-btn" onClick={(e) => { e.stopPropagation(); handleWishlist(game.title); }}>
                    ♥
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button className="carousel-arrow right" onClick={nextGame} disabled={currentIndex === games.length - 1}>&#10095;</button>
      </section>

      <footer className="dash-footer">
        <div className="social-icons">
          <div className="icon-circle">f</div>
          <div className="icon-circle">t</div>
          <div className="icon-circle">in</div>
          <div className="icon-circle">ig</div>
        </div>
        <div className="footer-switch">
          Don't have an account? <span>Sign up</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;