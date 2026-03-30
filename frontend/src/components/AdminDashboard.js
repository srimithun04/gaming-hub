import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './Css/Admin.css';

const DEFAULT_CROP = { unit: '%', width: 50, height: 50, x: 25, y: 25 };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  
  const [gameFormData, setGameFormData] = useState({
    id: null, title: '', genre: '', image_url: '', crop_data: null
  });
  
  const [crop, setCrop] = useState(DEFAULT_CROP);
  const [completedCrop, setCompletedCrop] = useState(null);

  const fetchGames = async () => {
    const response = await fetch('http://localhost:8000/api/top-games');
    const data = await response.json();
    if (data.status === 'success') setGames(data.games);
  };

  useEffect(() => { fetchGames(); }, []);

  const handleLogout = () => navigate('/');

  const resetFormState = () => {
    setGameFormData({ id: null, title: '', genre: '', image_url: '', crop_data: null });
    setCrop(DEFAULT_CROP);
    setCompletedCrop(null);
  };

  const handleEditClick = (game) => {
    setGameFormData({
      id: game.id, title: game.title, genre: game.genre,
      image_url: game.image, crop_data: game.crop_data
    });
    
    if (game.crop_data) {
      try {
        const parsed = JSON.parse(game.crop_data);
        if (parsed.cropBox) {
          setCrop(parsed.cropBox);
          setCompletedCrop(parsed.cropBox);
        } else {
          setCrop(DEFAULT_CROP);
          setCompletedCrop(DEFAULT_CROP);
        }
      } catch (e) {
        setCrop(DEFAULT_CROP);
        setCompletedCrop(DEFAULT_CROP);
      }
    } else {
      setCrop(DEFAULT_CROP);
      setCompletedCrop(DEFAULT_CROP);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveGame = async (e) => {
    e.preventDefault();
    
    let finalCropDataString = null;
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      finalCropDataString = JSON.stringify({ cropBox: completedCrop });
    } else {
      finalCropDataString = JSON.stringify({ cropBox: DEFAULT_CROP });
    }

    const payload = {
      title: gameFormData.title, genre: gameFormData.genre,
      image_url: gameFormData.image_url, crop_data: finalCropDataString 
    };
    
    const isEditMode = gameFormData.id !== null;
    const url = isEditMode ? `http://localhost:8000/api/games/${gameFormData.id}` : 'http://localhost:8000/api/games';
    const method = isEditMode ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    
    if (result.status === 'success') {
      alert(`Game ${isEditMode ? 'Updated' : 'Added'} Successfully!`);
      resetFormState(); 
      fetchGames(); 
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this game?")) {
      const response = await fetch(`http://localhost:8000/api/games/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.status === 'success') fetchGames(); 
    }
  };

  const isEditMode = gameFormData.id !== null;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="logo">GAMING<span>HUB</span> <strong>// ADMIN PANEL</strong></div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <div className="admin-content">
        <section className="admin-card form-section">
          <h2>{isEditMode ? `Editing: ${gameFormData.title}` : 'Add New Game to Carousel'}</h2>
          
          <form onSubmit={handleSaveGame} className="admin-form">
            <div className="input-group">
              <label>Game Title</label>
              <input type="text" required value={gameFormData.title} onChange={(e) => setGameFormData({...gameFormData, title: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Genre</label>
              <input type="text" required value={gameFormData.genre} onChange={(e) => setGameFormData({...gameFormData, genre: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Image URL (Direct link to .jpg/.png)</label>
              <input type="text" required value={gameFormData.image_url} onChange={(e) => setGameFormData({...gameFormData, image_url: e.target.value})} />
            </div>
            
            {gameFormData.image_url && (
              <div className="crop-area">
                <label>Customize Frontpage Image framing</label>
                <p className="crop-tip">Drag the red box to any size (Free Crop). The entire area will be shown.</p>
                <ReactCrop 
                  crop={crop} 
                  onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)} 
                  onComplete={(pixelCrop, percentCrop) => setCompletedCrop(percentCrop)}
                >
                  <img 
                    src={gameFormData.image_url} 
                    alt="Artwork preview" 
                    style={{ maxWidth: '100%', display: 'block' }} 
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=500"; alert("Invalid Image URL!"); }}
                  />
                </ReactCrop>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="add-btn">
                {isEditMode ? 'Save Changes' : '+ Upload to Grid'}
              </button>
              {isEditMode && (
                <button type="button" className="cancel-btn" onClick={resetFormState}>Cancel Edit</button>
              )}
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
                    <button className="edit-btn" onClick={() => handleEditClick(game)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(game.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;