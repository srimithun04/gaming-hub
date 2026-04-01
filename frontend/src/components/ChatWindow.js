import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // NEW: Imported navigate
import EmojiPicker from 'emoji-picker-react';
import './Css/Community.css'; 

const ChatWindow = ({ currentUser, targetUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  const navigate = useNavigate(); // NEW: Hook initialized

  useEffect(() => {
    setNewMessage('');
    setShowEmojiPicker(false);
  }, [targetUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const safeUser1 = encodeURIComponent(currentUser);
      const safeUser2 = encodeURIComponent(targetUser);
      
      const res = await fetch(`http://localhost:8000/api/community/messages?user1=${safeUser1}&user2=${safeUser2}`, {
        cache: 'no-store' 
      });
      if (!res.ok) return; 
      
      const data = await res.json();
      if (data.status === 'success') {
        setMessages(data.messages);
      }
    } catch (err) { 
      console.error("Failed to fetch messages", err); 
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => { fetchMessages(); }, 2000);
    return () => clearInterval(interval);
  }, [currentUser, targetUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevInput => prevInput + emojiObject.emoji);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const messageText = newMessage.trim(); 
    setNewMessage(''); 
    setShowEmojiPicker(false); 

    try {
      const res = await fetch('http://localhost:8000/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: currentUser, receiver: targetUser, content: messageText })
      });

      const data = await res.json();

      if (data.status === 'success') {
        fetchMessages(); 
      } else {
        alert("Database Error: " + data.message);
        setNewMessage(messageText); 
      }
    } catch (err) { 
      alert("Network Error: Could not reach the backend."); 
      setNewMessage(messageText); 
      console.error(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // NEW: Function to navigate to the target user's profile
  const goToProfile = () => {
    navigate(`/profile/${targetUser}`, { state: { username: currentUser } });
  };

  return (
    <div className="active-chat-container">
      <div className="active-chat-header">
        <button className="back-btn" onClick={onClose}>←</button>
        
        {/* UPDATED: Added onClick and cursor styling so it acts like a link */}
        <div 
          className="chat-avatar" 
          style={{ width: '30px', height: '30px', cursor: 'pointer' }}
          onClick={goToProfile}
          title={`View ${targetUser}'s profile`}
        >
          {targetUser?.charAt(0).toUpperCase()}
        </div>
        
        {/* UPDATED: Added onClick and cursor styling */}
        <div 
          className="chat-target-name"
          style={{ cursor: 'pointer' }}
          onClick={goToProfile}
          title={`View ${targetUser}'s profile`}
        >
          {targetUser}
        </div>
      </div>

      <div className="chat-messages-area">
        {messages.length === 0 ? (
          <div className="empty-chat-msg">Say hi to {targetUser}!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_username === currentUser;
            return (
              <div key={msg.id} className={`message-wrapper ${isMe ? 'message-mine' : 'message-theirs'}`}>
                <div className="message-bubble">{msg.content}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} /> 
      </div>

      <div className="chat-input-area">
        <div ref={emojiPickerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {showEmojiPicker && (
            <div className="emoji-picker-container">
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                theme="dark" 
                emojiStyle="native"
              />
            </div>
          )}

          <button 
            className="emoji-btn" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add Emoji"
          >
            😀
          </button>
        </div>

        <input 
          type="text" 
          className="chat-main-input"
          placeholder={`Message ${targetUser}...`} 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button className="send-btn" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;