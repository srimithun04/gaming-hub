import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './Css/Profile.css';
import './Css/Landing.css'; 

const Profile = () => {
  const { targetUsername } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = location.state?.username || 'Gamer';

  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0, is_following: false });
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [showProfile, setShowProfile] = useState(false);

  // NEW: States for the Follower/Following Modal
  const [followModal, setFollowModal] = useState({ isOpen: false, type: '', data: [] });
  const [followSearch, setFollowSearch] = useState('');

  const fetchProfileData = async () => {
    try {
      const safeTarget = encodeURIComponent(targetUsername);
      const safeCurrent = encodeURIComponent(currentUser);

      const [statsRes, postsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/community/profile/${safeTarget}?current_user=${safeCurrent}`).then(r => r.json()),
        fetch(`http://localhost:8000/api/community/profile/${safeTarget}/posts`).then(r => r.json())
      ]);

      if (statsRes.status === 'success') setStats(statsRes.stats);
      if (postsRes.status === 'success') setUserPosts(postsRes.posts);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  useEffect(() => {
    fetchProfileData();
    window.scrollTo(0, 0); 
    setFollowModal({ isOpen: false, type: '', data: [] }); // Close modal on profile change
  }, [targetUsername]);

  const handleFollowToggle = async () => {
    try {
      const safeTarget = encodeURIComponent(targetUsername);
      const res = await fetch(`http://localhost:8000/api/community/profile/${safeTarget}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_user: currentUser })
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchProfileData(); 
      }
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  const handleLogout = () => navigate('/');
  const isOwnProfile = currentUser === targetUsername;

  // NEW: Fetch and open the Follow list modal
  const openFollowModal = async (type) => {
    setFollowModal({ isOpen: true, type, data: [] });
    setFollowSearch(''); // Reset search when opening
    
    try {
      const safeTarget = encodeURIComponent(targetUsername);
      const res = await fetch(`http://localhost:8000/api/community/profile/${safeTarget}/${type}`);
      const result = await res.json();
      if (result.status === 'success') {
        setFollowModal({ isOpen: true, type, data: result.data });
      }
    } catch (err) {
      console.error(`Failed to fetch ${type}`, err);
    }
  };

  // NEW: Filter the data based on search input
  const filteredFollowData = followModal.data.filter(user => 
    user.username.toLowerCase().includes(followSearch.toLowerCase())
  );

  return (
    <div className="profile-shield">
      <header className="dash-header">
        <div className="logo" onClick={() => navigate('/landing', { state: { username: currentUser } })} style={{ cursor: 'pointer' }}>GAMING<span>HUB</span></div>
        <nav className="dash-nav">
          <span onClick={() => navigate('/landing', { state: { username: currentUser } })} style={{ cursor: 'pointer' }}>Home</span>
          <span onClick={() => navigate('/community', { state: { username: currentUser } })} style={{ cursor: 'pointer' }}>The Nexus</span>
        </nav>
        
        <div className="profile-wrapper" onClick={() => setShowProfile(!showProfile)}>
          <div className="avatar">{currentUser.charAt(0).toUpperCase()}</div>
          
          {showProfile && (
            <div className="profile-dropdown">
              <div className="dropdown-item" style={{color: '#fff', borderBottom: '1px solid #333'}}>
                Hi, <strong>{currentUser}</strong>
              </div>
              <div className="dropdown-item" onClick={() => { setShowProfile(false); navigate(`/profile/${currentUser}`, { state: { username: currentUser } }); }}>
                Profile
              </div>
              <div className="dropdown-item logout" onClick={handleLogout}>Logout</div>
            </div>
          )}
        </div>
      </header>

      <div className="profile-container">
        
        <div className="profile-header-card">
          <div className="profile-banner">
            <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2000" alt="Banner" />
          </div>
          
          <div className="profile-info-row">
            <div className="profile-avatar-large">
              {targetUsername.charAt(0).toUpperCase()}
            </div>
            
            <div className="profile-stats">
              {/* NEW: Clickable stat boxes */}
              <div className="stat-box clickable" onClick={() => openFollowModal('followers')}>
                <strong>{stats.followers}</strong>
                <span>Followers</span>
              </div>
              <div className="stat-box">
                <strong>{stats.posts}</strong>
                <span>Posts</span>
              </div>
              <div className="stat-box clickable" onClick={() => openFollowModal('following')}>
                <strong>{stats.following}</strong>
                <span>Following</span>
              </div>
            </div>
          </div>

          <div className="profile-actions-row">
            <div className="profile-name-block">
              <h2>{targetUsername}</h2>
              <p>Gamer • The Grid</p>
            </div>
            
            <div className="action-buttons">
              {!isOwnProfile ? (
                <button className={`follow-btn ${stats.is_following ? 'following' : ''}`} onClick={handleFollowToggle}>
                  {stats.is_following ? 'Unfollow' : 'Follow +'}
                </button>
              ) : (
                <button className="edit-profile-btn">Edit Profile</button>
              )}
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <div className={`pro-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
            Transmissions <span className="tab-count">{stats.posts}</span>
          </div>
          <div className={`pro-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
            Saved Vault
          </div>
        </div>

        {activeTab === 'posts' && (
          <div className="profile-grid">
            {userPosts.length === 0 ? (
              <div className="empty-profile">No transmissions logged yet.</div>
            ) : (
              userPosts.map(post => (
                <div key={post.id} className="grid-post-card">
                  {post.media_type === 'video' ? (
                    <video src={post.media_url} controls className="grid-media" />
                  ) : (
                    <img src={post.media_url} alt="Post" className="grid-media" onError={(e) => { e.target.src = "https://via.placeholder.com/400?text=Image+Lost"; }} />
                  )}
                  <div className="grid-post-overlay">
                    <span className="grid-game-tag">{post.game_title || 'General'}</span>
                    <span className="grid-ggs">🔺 {post.gg_count || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* NEW: The Modal Overlay */}
      {followModal.isOpen && (
        <div className="follow-modal-overlay" onClick={() => setFollowModal({ isOpen: false, type: '', data: [] })}>
          <div className="follow-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="follow-modal-header">
              <h3>{followModal.type === 'followers' ? 'Followers' : 'Following'}</h3>
              <button className="close-modal-btn" onClick={() => setFollowModal({ isOpen: false, type: '', data: [] })}>✕</button>
            </div>
            
            <div className="follow-modal-search">
              <input 
                type="text" 
                placeholder="Search gamers..." 
                value={followSearch}
                onChange={(e) => setFollowSearch(e.target.value)}
              />
            </div>

            <div className="follow-modal-list">
              {filteredFollowData.length === 0 ? (
                <div className="follow-modal-empty">No gamers found.</div>
              ) : (
                filteredFollowData.map(u => (
                  <div 
                    key={u.username} 
                    className="follow-modal-user"
                    onClick={() => {
                      setFollowModal({ isOpen: false, type: '', data: [] });
                      navigate(`/profile/${u.username}`, { state: { username: currentUser } });
                    }}
                  >
                    <div className="follow-avatar">{u.username.charAt(0).toUpperCase()}</div>
                    <span>{u.username}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;