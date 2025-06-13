import React, { useState } from 'react';
import '../Styles/Signuppage.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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

  // 1. Signup via Supabase Auth
  const { data: authData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username
      }
    }
  });

  if (signupError) {
    alert(signupError.message);
    return;
  }

  const user = authData.user;
  if (!user) {
    alert("Signup succeeded but user object is null. Please check your email to confirm the account.");
    return;
  }

  // 2. Insert into 'users' table
  const { error: insertError } = await supabase.from('users').insert([
    {
      id: user.id, // 🧠 Связываем с auth.users по user.id
      full_name: fullName,
      gender: gender,
      username: username,
      birthdate: birthdate,
      email: email,
    }
  ]);

  if (insertError) {
    alert("Signup succeeded but failed to save user data: " + insertError.message);
    return;
  }

  alert('Signup successful! Please check your email to confirm your account.');
  navigate('/');
};

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-header">
          <img src="/bot1.png" alt="Buddy Bot" className="signup-bot" />
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

          <div className="gender-options">
            <label className="gender-label">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={(e) => setGender(e.target.value)}
                required
              />
              Male
            </label>
            <label className="gender-label">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={(e) => setGender(e.target.value)}
                required
              />
              Female
            </label>
            <label className="gender-label">
              <input
                type="radio"
                name="gender"
                value="other"
                checked={gender === 'other'}
                onChange={(e) => setGender(e.target.value)}
                required
              />
              Other
            </label>
          </div>

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
