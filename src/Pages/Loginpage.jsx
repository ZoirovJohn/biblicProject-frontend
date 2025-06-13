import React, { useState } from 'react';
import '../Styles/Loginpage.css';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log(data);

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('invalid login credentials') ||
        msg.includes('user not found') ||
        msg.includes('email not found')
      ) {
        alert('You are not an existing user. Please create an account first.');
      } else {
        alert(error.message);
      }
    } else if (data?.user) {
      navigate('/welcome');
    } else {
      alert('Login failed: No user returned');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/bot1.png" alt="Buddy Bot" className="login-bot" />
          <h2>
            Welcome to <span>Bot!</span>
          </h2>
        </div>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="forgot-password-container">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot your password?
            </Link>
          </div>
          <button type="submit">Sign In</button>
        </form>
        <p className="switch-text">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

