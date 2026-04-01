import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatWindow from './ChatWindow';
import Feed from './Feed';
import CreatePost from './CreatePost';
import './Css/Community.css';
import './Css/Landing.css';

const Community = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || 'Gamer';
  
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('feed'); 
  const [showProfile, setShowProfile] = useState(false);

  const [soloChats, setSoloChats] = useState([]); 
  const [squadChats, setSquadChats] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null); 

  const fetchPosts = async () => {
    try {
      const safeUser = encodeURIComponent(username);
      const res = await fetch(`http://localhost:8000/api/community/posts?current_user=${safeUser}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.status === 'success') setPosts(data.posts);
    } catch (err) { console.error("Failed to fetch posts", err); }
  };

  const fetchInbox = async () => {
    try {
      const safeUsername = encodeURIComponent(username);
      const res = await fetch(`http://localhost:8000/api/community/inbox/${safeUsername}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.status === 'success') setSoloChats(data.inbox);
    } catch (err) { console.error("Inbox fetch failed", err); }
  };

  useEffect(() => { 
    fetchPosts(); 
    fetchInbox();
    
    const interval = setInterval(() => { fetchInbox(); }, 3000);
    return () => clearInterval(interval);
  }, [username]); 

  const handleLogout = () => navigate('/');

  const handleSearchUsers = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      try {
        const safeQuery = encodeURIComponent(query);
        const safeUser = encodeURIComponent(username);
        const res = await fetch(`http://localhost:8000/api/community/users/search?q=${safeQuery}&current_user=${safeUser}`);
        const data = await res.json();
        if (data.status === 'success') setSearchResults(data.users);
      } catch (err) { console.error("Search failed", err); }
    } else {
      setSearchResults([]);
    }
  };

  const initiateChat = (targetUser) => {
    setActiveChatUser(targetUser); 
    setSearchQuery('');
    setSearchResults([]);
    fetchInbox(); 
  };

  return (
    <div className="community-shield">
      <header className="dash-header">
        <div className="logo" onClick={() => navigate('/landing', { state: { username } })} style={{ cursor: 'pointer' }}>GAMING<span>HUB</span></div>
        <nav className="dash-nav">
          <span onClick={() => navigate('/landing', { state: { username } })} style={{ cursor: 'pointer' }}>Home</span>
          <span className="active">The Nexus</span>
        </nav>
        
        <div className="profile-wrapper" onClick={() => setShowProfile(!showProfile)}>
          <div className="avatar">{username.charAt(0).toUpperCase()}</div>
          {showProfile && (
            <div className="profile-dropdown">
              <div className="dropdown-item" style={{color: '#fff', borderBottom: '1px solid #333'}}>
                Hi, <strong>{username}</strong>
              </div>
              <div className="dropdown-item" onClick={() => navigate(`/profile/${username}`, { state: { username } })}>Profile</div>
              <div className="dropdown-item logout" onClick={handleLogout}>Logout</div>
            </div>
          )}
        </div>
      </header>

      <div className="community-layout">
        
        {/* --- LEFT NAVIGATION --- */}
        <aside className="comm-sidebar">
          <div className="comm-section-title">Main Hub</div>
          
          {/* FIX: Removed the malformed <Feed /> injection from this class name */}
          <div 
            className={`comm-menu-item ${activeTab === 'feed' && !activeChatUser ? 'active' : ''}`} 
            onClick={() => { setActiveTab('feed'); setActiveChatUser(null); }}
          >
            🌍 Nexus Feed
          </div>
          
          <div 
            className={`comm-menu-item ${activeTab === 'create' && !activeChatUser ? 'active' : ''}`} 
            onClick={() => { setActiveTab('create'); setActiveChatUser(null); }}
          >
            ✍️ Create Post
          </div>
          
          <div 
            className="comm-menu-item" 
            onClick={() => navigate(`/profile/${username}`, { state: { username } })}
          >
            👤 My Profile
          </div>
          
          <div className="comm-menu-item">🔖 Saved Clips</div>
          
          <div className="comm-section-title" style={{marginTop: '30px'}}>Official Pages</div>
          <div className="comm-menu-item">⭐ Rockstar Games</div>
          <div className="comm-menu-item">⭐ CD Projekt Red</div>
          <div className="comm-menu-item">⭐ FromSoftware</div>
        </aside>

        {/* --- CENTER PANEL (FEED OR CHAT) --- */}
        <main className="comm-feed" style={{ gap: activeChatUser ? '0' : '30px', paddingRight: activeChatUser ? '0' : '10px' }}>
          
          {activeChatUser ? (
            <ChatWindow 
              key={activeChatUser} 
              currentUser={username} 
              targetUser={activeChatUser} 
              onClose={() => { setActiveChatUser(null); fetchInbox(); }} 
            />
          ) : (
            <>
              {activeTab === 'create' && (
                <CreatePost 
                  username={username} 
                  onSuccess={() => { fetchPosts(); setActiveTab('feed'); }} 
                />
              )}
              {/* FIX: Properly passing onRefresh to the Feed component here! */}
              {activeTab === 'feed' && <Feed posts={posts} currentUser={username} onRefresh={fetchPosts} />}
            </>
          )}
        </main>

        {/* --- RIGHT COMMS PANEL (INBOX ONLY) --- */}
        <aside className="comm-chat-panel">
          <div className="chat-half">
            <div className="chat-header">Direct Messages</div>
            
            <div className="chat-search-container">
              <input 
                type="text" className="chat-search-input" placeholder="Search gamers to text..." 
                value={searchQuery} onChange={handleSearchUsers}
              />
              
              {searchResults.length > 0 && (
                <div className="chat-search-results">
                  {searchResults.map(u => (
                    <div key={u.username} className="chat-search-item" onClick={() => initiateChat(u.username)}>
                      <div className="chat-avatar" style={{width: '28px', height: '28px', fontSize: '0.8rem'}}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="chat-list">
              {soloChats.length === 0 ? (
                <div className="empty-chat-msg">No active messages. Search for a gamer above to start chatting!</div>
              ) : (
                soloChats.map(chat => {
                  const unreadCount = parseInt(chat.unread_count) || 0;
                  const displayBadge = unreadCount > 9 ? '9+' : unreadCount;
                  const isUnread = unreadCount > 0 && activeChatUser !== chat.name;

                  return (
                    <div 
                      key={chat.name} 
                      className={`chat-user ${activeChatUser === chat.name ? 'active-chat-user' : ''} ${isUnread ? 'unread-chat' : ''}`} 
                      onClick={() => initiateChat(chat.name)}
                    >
                      <div className="chat-avatar">{chat.name.charAt(0).toUpperCase()}</div>
                      <div className="chat-user-info">
                        <span style={{ fontWeight: isUnread ? 'bold' : '500', color: isUnread ? '#fff' : '' }}>
                          {chat.name}
                        </span>
                        <small style={{ color: isUnread ? '#d4d4d4' : '#888', fontWeight: isUnread ? 'bold' : 'normal' }}>
                          {isUnread ? 'New transmission received' : 'Tap to open chat'}
                        </small>
                      </div>
                      
                      {isUnread && (
                        <div className="unread-badge">{displayBadge}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="chat-half">
            <div className="chat-header">My Squads</div>
            <div className="chat-list">
              {squadChats.length === 0 ? (
                <div className="empty-chat-msg">You haven't joined any squads yet. Create one or look out for invites.</div>
              ) : (
                squadChats.map(chat => (
                  <div key={chat.id} className="chat-user">
                    <div className="chat-avatar squad-icon">🛡️</div>
                    <div className="chat-user-info">
                      <span>{chat.name}</span>
                      <small>{chat.lastMsg}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Community;