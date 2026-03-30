import React, { useState } from 'react';
import './Css/Signup.css'; // Your new folder structure!

const Signup = ({ toggleSlide }) => {
  const [data, setData] = useState({ username: '', email: '', password: '' });

  const handleSignup = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:8000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    alert(result.message || result.detail);
    if (result.status === "success") {
      toggleSlide(); 
    }
  };

  return (
    <div className="signup-content">
      <h1>Join the Hub</h1>
      <p className="subtitle">Level up your experience today.</p>
      
      <form onSubmit={handleSignup}>
        <input type="text" placeholder="Username" required onChange={(e) => setData({...data, username: e.target.value})} />
        <input type="email" placeholder="Email" required onChange={(e) => setData({...data, email: e.target.value})} />
        <input type="password" placeholder="Password" required onChange={(e) => setData({...data, password: e.target.value})} />
        
        <button type="submit" className="main-btn-signup">Create Account</button>
      </form>
      
      <div className="signup-switch">
        Already have an account? <span onClick={toggleSlide}>Login</span>
      </div>
    </div>
  );
};

export default Signup;