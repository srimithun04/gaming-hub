import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './components/login';
import Signup from './components/signup';
import Landing from './components/Landing';
import AdminDashboard from './components/AdminDashboard'; 

function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [loginBanner, setLoginBanner] = useState('');

  // Fetch the login banner from the database
  useEffect(() => {
    fetch('http://localhost:8000/api/assets')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.assets.login_banner) {
          setLoginBanner(data.assets.login_banner);
        }
      })
      .catch(err => console.error("Banner fetch failed", err));
  }, []);

  // Apply the custom banner if it exists
  const dynamicBackground = {
    backgroundImage: loginBanner ? `url(${loginBanner})` : 'linear-gradient(45deg, #111, #222)',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };

  return (
    <div className="auth-wrapper">
      <div 
        className={`sliding-image ${isSignup ? 'move-right' : ''}`}
        style={dynamicBackground}
      ></div>
      <div className={`sliding-form ${isSignup ? 'move-left' : ''}`}>
        {isSignup ? (
          <Signup toggleSlide={() => setIsSignup(false)} />
        ) : (
          <Login toggleSlide={() => setIsSignup(true)} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;