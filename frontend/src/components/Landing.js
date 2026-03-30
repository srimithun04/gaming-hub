import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // IMPORT useLocation
import DynamicCanvasCrop from './utils/DynamicCanvasCrop';
import './Css/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to access the passed state
  const [games, setGames] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // GRAB THE USERNAME, DEFAULT TO 'GAMER' IF NONE IS FOUND
  const username = location.state?.username || 'Gamer';
  
  // GET THE FIRST LETTER AND MAKE IT UPPERCASE
  const avatarLetter = username.charAt(0).toUpperCase();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/top-games');
        const data = await response.json();
        if (data.status === 'success') {
          setGames(data.games);
        }
      } catch (error) {
        console.error("Database connection failed", error);
      }
    };
    fetchGames();
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
          
          {/* DISPLAY THE DYNAMIC AVATAR LETTER */}
          <div className="avatar">{avatarLetter}</div>
          
          {showProfile && (
            <div className="profile-dropdown">
              {/* DISPLAY THE FULL USERNAME IN THE DROPDOWN */}
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
          <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000" alt="Gaming visual" className="hero-image" />
        </div>
      </section>

      {/* HARDCODED NEWS SECTION (For Now) */}
      <section className="news-bento">
        <div className="bento-header">
          <h2>Latest Transmissions</h2>
          <p>The biggest updates from across the Grid.</p>
        </div>
        <div className="bento-grid">
          <div className="bento-card wide">
            <img src="https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=1000" alt="GTA 6" className="bento-bg" />
            <div className="bento-content">
              <span className="bento-tag">BREAKING</span>
              <h3>Grand Theft Auto VI: Return to Vice City</h3>
              <p>Rockstar confirms a 2025 release window with a record-breaking trailer drop.</p>
            </div>
          </div>
          <div className="bento-card square">
            <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800" alt="Steam Sale" className="bento-bg" />
            <div className="bento-content">
              <span className="bento-tag store">STORE</span>
              <h3>Steam Summer Sale</h3>
              <p>Up to 85% off major titles starting next week.</p>
            </div>
          </div>
          <div className="bento-card square">
            <img src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800" alt="RDR2 Update" className="bento-bg" />
            <div className="bento-content">
              <span className="bento-tag rumor">RUMOR</span>
              <h3>RDR2 Next-Gen Patch</h3>
              <p>Leaks suggest a 60FPS update is finally in development.</p>
            </div>
          </div>
          <div className="bento-card wide">
            <img src="https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1000" alt="Spider-Man" className="bento-bg" />
            <div className="bento-content">
              <span className="bento-tag update">UPDATE</span>
              <h3>Marvel's Spider-Man: Symbiote DLC</h3>
              <p>Insomniac reveals free new suits and challenges coming this Friday.</p>
            </div>
          </div>
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