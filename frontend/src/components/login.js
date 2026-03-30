import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Css/Login.css'; 

const Login = ({ toggleSlide }) => {
  const [data, setData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:8000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (result.status === "success") {
      if (result.role === "admin") {
        navigate('/admin');
      } else {
        navigate('/landing', { state: { username: data.username } }); 
      }
    } else {
      alert(result.message); 
    }
  };

  return (
    <div className="login-content">
      <h1>Hi Gamer</h1>
      <p className="subtitle">Welcome to the Gaming Hub</p>
      
      {/* Added autoComplete="off" to the form */}
      <form onSubmit={handleLogin} autoComplete="off">
        <input 
          type="text" 
          placeholder="Username" 
          required 
          autoComplete="off" 
          onChange={(e) => setData({...data, username: e.target.value})} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          required 
          autoComplete="new-password" 
          onChange={(e) => setData({...data, password: e.target.value})} 
        />
        
        <div className="forgot-password">Forgot password?</div>

        <div className="divider">
          <span>or</span>
        </div>

        <button type="button" className="google-btn">
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
          Login with Google
        </button>

        <button type="submit" className="main-btn">Login</button>
      </form>
      
      <div className="login-switch">
        Don't have an account? <span onClick={toggleSlide}>Sign up</span>
      </div>
    </div>
  );
};

export default Login;