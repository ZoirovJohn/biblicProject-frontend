import React, { useState } from 'react';
import '../Styles/Loginpage.css';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../Context/LanguageContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();

  const text = {
    en: {
      welcome: 'Welcome to',
      bot: 'Bot!',
      emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password',
      signIn: 'Sign In',
      forgotPassword: 'Forgot your password?',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
    },
    ko: {
      welcome: '\uc5ec\uc11c\uc624\uc138\uc694!',
      // bot: '\ubcf4\ud2b8!',
      emailPlaceholder: '\uc774\uba54\uc77c \uc785\ub825',
      passwordPlaceholder: '\ube44\ubc00\ubc88\ud638 \uc785\ub825',
      signIn: '\ub85c\uadf8\uc778',
      forgotPassword: '\ube44\ubc00\ubc88\ud638\ub97c \uc78a\uc73c\uc168\ub098\uc694?',
      noAccount: '\uacc4\uc815\uc774 \uc5c6\uc73c\uc2dc\uba74?',
      signUp: '\uac00입하기',
    }
  };

  const t = text[language];

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
            {t.welcome} <span>{t.bot}</span>
          </h2>
        </div>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="forgot-password-container">
            <Link to="/forgot-password" className="forgot-password-link">
              {t.forgotPassword}
            </Link>
          </div>
          <button type="submit">{t.signIn}</button>
        </form>
        <p className="switch-text">
          {t.noAccount} <Link to="/signup">{t.signUp}</Link>
        </p>
        <button onClick={toggleLanguage} className="lang-toggle">
          {language === 'en' ? '한국어' : 'English'}
        </button>
      </div>
    </div>
  );
}
