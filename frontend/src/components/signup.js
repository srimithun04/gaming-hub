import React, { useState } from 'react';
import './Css/Signup.css'; 

const Signup = ({ toggleSlide }) => {
  const [data, setData] = useState({ username: '', email: '', password: '' });

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      // If the backend route is missing, throw an error immediately
      if (!response.ok) throw new Error("Backend route missing or failed!");
      
      const result = await response.json();
      
      if (result.status === "success") {
        alert("Account created successfully! Welcome to the Hub.");
        toggleSlide(); // Smoothly slide back to the login screen
      } else {
        alert("Signup failed: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server error! Make sure the backend is running and the /signup route exists.");
    }
  };

  return (
    <div className="signup-content">
      <h1>Join the Hub</h1>
      <p className="subtitle">Level up your experience today.</p>
      
      <form onSubmit={handleSignup}>
        <input 
          type="text" 
          placeholder="Username" 
          required 
          onChange={(e) => setData({...data, username: e.target.value})} 
        />
        <input 
          type="email" 
          placeholder="Email" 
          required 
          onChange={(e) => setData({...data, email: e.target.value})} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          required 
          onChange={(e) => setData({...data, password: e.target.value})} 
        />
        
        <button type="submit" className="main-btn-signup">Create Account</button>
      </form>
      
      <div className="signup-switch">
        Already have an account? <span onClick={toggleSlide}>Login</span>
      </div>
    </div>
  );
};

export default Signup;