import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './components/login';
import Signup from './components/signup';
import Landing from './components/Landing';
import AdminDashboard from './components/AdminDashboard'; 

function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  return (
    <div className="auth-wrapper">
      <div className={`sliding-image ${isSignup ? 'move-right' : ''}`}></div>
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