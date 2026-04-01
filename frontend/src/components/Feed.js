import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Css/Community.css';

const Feed = ({ posts, currentUser, onRefresh }) => {
  const navigate = useNavigate();
  
  const [showComments, setShowComments] = useState({}); 
  const [commentsData, setCommentsData] = useState({}); 
  const [newComment, setNewComment] = useState({});     

  const handleFeedFollowToggle = async (targetUser) => {
    try {
      const safeTarget = encodeURIComponent(targetUser);
      const res = await fetch(`http://localhost:8000/api/community/profile/${safeTarget}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_user: currentUser })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onRefresh(); 
      }
    } catch (err) {
      console.error("Follow from feed failed", err);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/community/posts/${postId}/comments`);
      const data = await res.json();
      if (data.status === 'success') {
        setCommentsData(prev => ({ ...prev, [postId]: data.comments }));
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  const toggleComments = (postId) => {
    const isOpening = !showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: isOpening }));
    
    if (isOpening) {
      fetchComments(postId);
    }
  };

  const handlePostComment = async (postId) => {
    const content = newComment[postId];
    if (!content || !content.trim()) return;

    try {
      const res = await fetch(`http://localhost:8000/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, content: content.trim() })
      });
      
      const data = await res.json();
      
      if (data.status === 'success') {
        setNewComment(prev => ({ ...prev, [postId]: '' })); 
        fetchComments(postId); 
        onRefresh(); // NEW: Instantly refresh the feed so the comment count goes up by 1!
      } else {
        alert("Database Error: " + data.message); 
      }
    } catch (err) {
      alert("Network Error: Did you restart your FastAPI server?");
      console.error("Failed to post comment", err);
    }
  };

  if (posts.length === 0) {
    return <div className="no-posts">No transmissions found. Be the first!</div>;
  }

  return (
    <>
      {posts.map(post => (
        <div key={post.id} className="post-card">
          <div className="post-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span 
                className="post-author"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${post.username}`, { state: { username: currentUser } })}
              >
                @{post.username}
              </span>

              {currentUser !== post.username && (
                <button 
                  className={`feed-follow-btn ${post.is_following ? 'following' : ''}`}
                  onClick={() => handleFeedFollowToggle(post.username)}
                >
                  {post.is_following ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>

            {post.game_title && <span className="post-game-tag">{post.game_title}</span>}
          </div>
          
          {post.media_type === 'video' ? (
            <video src={post.media_url} controls className="post-media" />
          ) : (
            <img 
              src={post.media_url} 
              alt="Post media" 
              className="post-media" 
              onError={(e) => { e.target.src = "https://via.placeholder.com/800x400?text=Invalid+Image+URL"; }} 
            />
          )}
          
          {post.content && <div className="post-content">{post.content}</div>}
          
          <div className="post-actions">
            <button className="action-btn gg-btn">🔺 GG ({post.gg_count || 0})</button>
            <button 
              className={`action-btn ${showComments[post.id] ? 'active-comment-btn' : ''}`} 
              onClick={() => toggleComments(post.id)}
            >
              {/* UPDATED: Now displays the real-time comment count! */}
              💬 Comments ({post.comment_count || 0})
            </button>
          </div>

          {showComments[post.id] && (
            <div className="comments-section">
              <div className="comments-list">
                {(!commentsData[post.id] || commentsData[post.id].length === 0) ? (
                  <div className="empty-comments">No comments yet. Be the first to drop one!</div>
                ) : (
                  commentsData[post.id].map(comment => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-avatar">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="comment-body">
                        <span 
                          className="comment-author"
                          onClick={() => navigate(`/profile/${comment.username}`, { state: { username: currentUser } })}
                        >
                          @{comment.username}
                        </span>
                        <p className="comment-text">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="comment-input-row">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  value={newComment[post.id] || ''}
                  onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                />
                <button onClick={() => handlePostComment(post.id)}>Send</button>
              </div>
            </div>
          )}

        </div>
      ))}
    </>
  );
};

export default Feed;