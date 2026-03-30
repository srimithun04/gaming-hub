import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './Css/Admin.css';

const DEFAULT_CROP = { unit: '%', width: 50, height: 50, x: 25, y: 25 };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('games'); 
  const [games, setGames] = useState([]);
  const [news, setNews] = useState([]);
  const [assets, setAssets] = useState({});

  // --- FORM STATES ---
  const [gameFormData, setGameFormData] = useState({ id: null, title: '', genre: '', image_url: '', crop_data: null });
  const [crop, setCrop] = useState(DEFAULT_CROP);
  const [completedCrop, setCompletedCrop] = useState(null);
  
  const [newsForm, setNewsForm] = useState({ id: null, tag: '', title: '', description: '', image_url: '' });

  // --- FETCH ALL DATA ---
  const fetchData = async () => {
    try {
      const [g, n, a] = await Promise.all([
        fetch('http://localhost:8000/api/top-games').then(r => r.json()),
        fetch('http://localhost:8000/api/news').then(r => r.json()),
        fetch('http://localhost:8000/api/assets').then(r => r.json())
      ]);
      setGames(g.games || []); 
      setNews(n.news || []); 
      setAssets(a.assets || {});
    } catch (error) {
      console.error("Fetch failed", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ==========================================
  // 1. GAME LOGIC (CAROUSEL)
  // ==========================================
  const resetGameForm = () => {
    setGameFormData({ id: null, title: '', genre: '', image_url: '', crop_data: null });
    setCrop(DEFAULT_CROP);
    setCompletedCrop(null);
  };

  const handleEditGame = (game) => {
    setGameFormData({ id: game.id, title: game.title, genre: game.genre, image_url: game.image, crop_data: game.crop_data });
    if (game.crop_data) {
      try {
        const parsed = JSON.parse(game.crop_data);
        if (parsed.cropBox) {
          setCrop(parsed.cropBox); setCompletedCrop(parsed.cropBox);
        } else {
          setCrop(DEFAULT_CROP); setCompletedCrop(DEFAULT_CROP);
        }
      } catch (e) { setCrop(DEFAULT_CROP); setCompletedCrop(DEFAULT_CROP); }
    } else { setCrop(DEFAULT_CROP); setCompletedCrop(DEFAULT_CROP); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

const handleSaveGame = async (e) => {
    e.preventDefault();
    try {
      let finalCropDataString = null;
      if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        finalCropDataString = JSON.stringify({ cropBox: completedCrop });
      } else {
        finalCropDataString = JSON.stringify({ cropBox: DEFAULT_CROP });
      }

      const payload = { title: gameFormData.title, genre: gameFormData.genre, image_url: gameFormData.image_url, crop_data: finalCropDataString };
      const isEditMode = gameFormData.id !== null;
      const url = isEditMode ? `http://localhost:8000/api/games/${gameFormData.id}` : 'http://localhost:8000/api/games';
      
      const response = await fetch(url, { 
        method: isEditMode ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      if (!response.ok) throw new Error("Backend route missing or failed!");
      
      const result = await response.json();
      
      if (result.status === 'success') {
        alert(`Game ${isEditMode ? 'Updated' : 'Added'} Successfully!`);
        resetGameForm(); 
        fetchData(); 
      }
    } catch (error) {
      console.error(error);
      alert("Save failed! Please make sure your Python backend is running and the Edit route exists.");
    }
  };
  const handleDeleteGame = async (id) => {
    if(window.confirm("Are you sure you want to delete this game?")) {
      await fetch(`http://localhost:8000/api/games/${id}`, { method: 'DELETE' });
      fetchData(); 
    }
  };

  // ==========================================
  // 2. NEWS LOGIC (BENTO CARDS)
  // ==========================================
  const handleSaveNews = async (e) => {
    e.preventDefault();
    if (!newsForm.id) return alert("Please select a slot to edit from the list on the right.");
    await fetch(`http://localhost:8000/api/news/${newsForm.id}`, {
      method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newsForm)
    });
    setNewsForm({ id: null, tag: '', title: '', description: '', image_url: '' });
    alert("News slot updated successfully!");
    fetchData();
  };

  // ==========================================
  // 3. ASSET LOGIC (BANNERS) - FIXED WITH SAVE BUTTONS
  // ==========================================
  const updateBanner = async (key, url) => {
    try {
      const response = await fetch(`http://localhost:8000/api/assets/${key}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ image_url: url })
      });
      const result = await response.json();
      if(result.status === 'success') {
        alert(`${key === 'login_banner' ? 'Login Banner' : 'Hero Banner'} saved successfully!`);
        fetchData();
      }
    } catch (e) {
      alert("Failed to save banner. Please check terminal.");
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="logo">GAMING<span>HUB</span> <strong>CMS</strong></div>
        <nav className="admin-tabs">
          <span className={activeTab === 'games' ? 'active' : ''} onClick={() => setActiveTab('games')}>Manage Games</span>
          <span className={activeTab === 'news' ? 'active' : ''} onClick={() => setActiveTab('news')}>Manage News</span>
          <span className={activeTab === 'site' ? 'active' : ''} onClick={() => setActiveTab('site')}>Site Banners</span>
        </nav>
        <button className="logout-btn" onClick={() => navigate('/')}>Logout</button>
      </header>

      <div className="admin-content">
        
        {/* --- TAB 1: GAMES --- */}
        {activeTab === 'games' && (
          <div className="admin-grid-layout">
            <section className="admin-card form-section">
              <h2>{gameFormData.id ? `Editing: ${gameFormData.title}` : 'Add New Game to Carousel'}</h2>
              <form onSubmit={handleSaveGame} className="admin-form">
                <label>Game Title</label>
                <input type="text" required value={gameFormData.title} onChange={(e) => setGameFormData({...gameFormData, title: e.target.value})} />
                
                <label>Genre</label>
                <input type="text" required value={gameFormData.genre} onChange={(e) => setGameFormData({...gameFormData, genre: e.target.value})} />
                
                <label>Image URL (Direct link to .jpg/.png)</label>
                <input type="text" required value={gameFormData.image_url} onChange={(e) => setGameFormData({...gameFormData, image_url: e.target.value})} />
                
                {gameFormData.image_url && (
                  <div className="crop-area">
                    <label>Customize Frontpage Image framing</label>
                    <p className="crop-tip">Drag the red box to any size (Free Crop). The entire area will be shown.</p>
                    <ReactCrop crop={crop} onChange={(p, pc) => setCrop(pc)} onComplete={(p, pc) => setCompletedCrop(pc)}>
                      <img src={gameFormData.image_url} alt="Artwork preview" style={{ maxWidth: '100%', display: 'block' }} onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=500"; alert("Invalid Image URL!"); }} />
                    </ReactCrop>
                  </div>
                )}
                <div className="form-actions">
                  <button type="submit" className="add-btn">{gameFormData.id ? 'Save Changes' : '+ Upload to Grid'}</button>
                  {gameFormData.id && <button type="button" className="cancel-btn" onClick={resetGameForm}>Cancel Edit</button>}
                </div>
              </form>
            </section>

            <section className="admin-card list-section">
              <h2>Manage Current Games</h2>
              <div className="game-list">
                {games.map(game => (
                  <div key={game.id} className="admin-game-row">
                    <img src={game.image} alt="thumbnail" className="admin-thumb" loading="lazy" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=500"; }} />
                    <div className="admin-game-info">
                      <h4>{game.title}</h4>
                      <span>{game.genre}</span>
                    </div>
                    <div className="row-actions">
                        <button className="edit-btn" onClick={() => handleEditGame(game)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDeleteGame(game.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --- TAB 2: NEWS BENTO --- */}
        {activeTab === 'news' && (
          <div className="admin-grid-layout">
            <section className="admin-card">
              <h2>{newsForm.id ? `Editing Slot ${newsForm.id}` : 'Select a slot to edit -->'}</h2>
              <form onSubmit={handleSaveNews} className="admin-form">
                <label>Badge Tag (e.g., BREAKING, RUMOR)</label>
                <input placeholder="Tag" value={newsForm.tag} onChange={e => setNewsForm({...newsForm, tag: e.target.value})} disabled={!newsForm.id} />
                
                <label>Headline</label>
                <input placeholder="Title" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} disabled={!newsForm.id} />
                
                <label>Description Content</label>
                <textarea placeholder="Description" value={newsForm.description} onChange={e => setNewsForm({...newsForm, description: e.target.value})} disabled={!newsForm.id} />
                
                <label>Background Image URL</label>
                <input placeholder="Image URL" value={newsForm.image_url} onChange={e => setNewsForm({...newsForm, image_url: e.target.value})} disabled={!newsForm.id} />
                
                <button type="submit" className="add-btn" disabled={!newsForm.id}>Update Bento Card</button>
              </form>
            </section>

            <section className="admin-card list-section">
              <h2>Current Bento Slots</h2>
              <p style={{color:'#888', marginBottom:'20px'}}>Click a slot to edit its content.</p>
              <div className="news-edit-list">
                {news.map(n => (
                  <div key={n.id} className="admin-game-row" onClick={() => setNewsForm(n)}>
                    <div className="admin-game-info">
                      <h4 style={{color: '#ef4444'}}>Slot {n.id}</h4>
                      <span>{n.title || '[Empty Slot]'}</span>
                    </div>
                    <button className="edit-btn">Edit</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --- TAB 3: BANNERS --- */}
        {activeTab === 'site' && (
          <div className="admin-grid-layout">
            <section className="admin-card">
              <h2>Login Page Background</h2>
              <p style={{color:'#888', marginBottom:'15px'}}>Changes the large sliding image on the Auth screen.</p>
              <div className="admin-form" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <input 
                  style={{flex: 1, marginBottom: 0}}
                  value={assets.login_banner || ''} 
                  onChange={e => setAssets({...assets, login_banner: e.target.value})} 
                  placeholder="Paste Image URL..." 
                />
                <button type="button" className="add-btn" style={{padding: '12px 20px'}} onClick={() => updateBanner('login_banner', assets.login_banner)}>Save</button>
              </div>
              <img src={assets.login_banner || 'https://via.placeholder.com/800x400?text=No+Image'} className="banner-preview" alt="Login preview" />
            </section>

            <section className="admin-card">
              <h2>Landing Page Hero Image</h2>
              <p style={{color:'#888', marginBottom:'15px'}}>Changes the image shown at the top of the user dashboard.</p>
              <div className="admin-form" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <input 
                  style={{flex: 1, marginBottom: 0}}
                  value={assets.landing_hero || ''} 
                  onChange={e => setAssets({...assets, landing_hero: e.target.value})} 
                  placeholder="Paste Image URL..." 
                />
                <button type="button" className="add-btn" style={{padding: '12px 20px'}} onClick={() => updateBanner('landing_hero', assets.landing_hero)}>Save</button>
              </div>
              <img src={assets.landing_hero || 'https://via.placeholder.com/800x400?text=No+Image'} className="banner-preview" alt="Hero preview" />
            </section>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;