import React, { useState } from 'react';
import './Css/Community.css';

const CreatePost = ({ username, onSuccess }) => {
  const [newPost, setNewPost] = useState({ game_title: '', content: '', media_url: '', media_type: 'image' });

  const handlePostSubmit = async () => {
    if (!newPost.media_url) return alert("Please add an image or video URL!");
    try {
      const payload = { ...newPost, username };
      const res = await fetch('http://localhost:8000/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setNewPost({ game_title: '', content: '', media_url: '', media_type: 'image' });
        onSuccess(); // Tells the parent to switch back to the feed
      } else {
        alert("Failed to post: " + data.message);
      }
    } catch (err) { 
      alert("Network Error while posting."); 
    }
  };

  return (
    <div className="create-post-box">
      <h3 style={{marginTop: 0, marginBottom: '20px', color: '#fff'}}>Create Transmission</h3>
      <input type="text" placeholder="What game are you playing?" value={newPost.game_title} onChange={e => setNewPost({...newPost, game_title: e.target.value})} />
      <textarea placeholder="Share a clip or drop a thought..." rows="3" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} />
      <div className="post-inputs-row">
        <input type="text" placeholder="Paste Image/Video URL here..." value={newPost.media_url} onChange={e => setNewPost({...newPost, media_url: e.target.value})} />
        <select value={newPost.media_type} onChange={e => setNewPost({...newPost, media_type: e.target.value})}>
          <option value="image">Image</option>
          <option value="video">Video (MP4)</option>
        </select>
      </div>
      <button className="post-btn" onClick={handlePostSubmit}>Transmit to Nexus</button>
      <div style={{ clear: 'both' }}></div>
    </div>
  );
};

export default CreatePost;