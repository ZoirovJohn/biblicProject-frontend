// src/ForgotPassword.jsx
import React, { useState } from 'react';
import './Loginpage.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Password reset email sent!');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Forgot Password</h2>
          <p>Enter your registered email to get a reset link</p>
        </div>
        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Reset Link</button>
        </form>
        {message && <p style={{ color: 'lightblue', marginTop: '1rem' }}>{message}</p>}
        <p className="switch-text">
          Remembered? <span style={{ cursor: 'pointer', color: '#3b82f6' }} onClick={() => navigate('/')}>Login here</span>
        </p>
      </div>
    </div>
  );
}

