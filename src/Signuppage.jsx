// src/SignupPage.jsx
import React, { useState } from 'react';
import './Loginpage.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match. Please check again.");
      return;
    }

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      alert(signupError.message);
      return;
    }

    // Insert user details into custom users table
    const { data: insertData, error: insertError } = await supabase.from('users').insert([
      {
        full_name: fullName,
        gender: gender,
        username: username,
        birthdate: birthdate,
        email: email,
      }
    ]);

    if (insertError) {
      alert("Signup succeeded but failed to save user data: " + insertError.message);
    } else {
      alert('Signup successful! Please check your email to confirm your account.');
      navigate('/');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/bot1.png" alt="Buddy Bot" className="login-bot" />
          <h2>Create your <span>Bot Account</span></h2>
        </div>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="date"
            placeholder="Birthdate"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Sign Up</button>
        </form>
        <p className="switch-text">
          Already have an account? <a href="/">Login</a>
        </p>
      </div>
    </div>
  );
}
