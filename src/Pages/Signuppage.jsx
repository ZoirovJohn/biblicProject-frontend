import React, { useState } from 'react';
import '../Styles/Signuppage.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../Context/LanguageContext';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();

  const text = {
    en: {
      create: 'Create your',
      botAccount: 'Bot Account',
      fullName: 'Full Name',
      username: 'Username',
      birthdate: 'Birthdate',
      email: 'Enter your email',
      password: 'Create a password',
      confirmPassword: 'Confirm password',
      signup: 'Sign Up',
      alreadyHave: 'Already have an account?',
      login: 'Login',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
    },
    ko: {
      create: '\uacc4\uc815 \ub9cc\ub4e4\uae30',
      botAccount: 'Bot \uacc4\uc815',
      fullName: '\uc804\uccb4 \uc774\ub984',
      username: '\uc0ac\uc6a9\uc790 \uc774\ub984',
      birthdate: '\uc0dd\ub144\uc6d4\uc77c',
      email: '\uc774\uba54\uc77c \uc785\ub825',
      password: '\ube44\ubc00\ubc88\ud638 \uc791\uc131',
      confirmPassword: '\ube44\ubc00\ubc88\ud638 \ud655\uc778',
      signup: '\uac00\uc785\ud558\uae30',
      alreadyHave: '\uae30\uc874\uc5d0 \uacc4\uc815\uc774 \uc788\uc2b5\ub2c8\uae4c?',
      login: '\ub85c\uadf8\uc778',
      gender: '\uc131\ubcc4',
      male: '\ub0a8\uc131',
      female: '\uc5ec\uc131',
      other: '\uae30\ud0c0',
    },
  };

  const t = text[language];

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match. Please check again.");
      return;
    }

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
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

    const { error: insertError } = await supabase.from('users').insert([
      {
        id: user.id,
        full_name: fullName,
        gender,
        username,
        birthdate,
        email,
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
          <h2>{t.create} <span>{t.botAccount}</span></h2>
        </div>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder={t.fullName}
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
              {t.male}
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
              {t.female}
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
              {t.other}
            </label>
          </div>

          <input
            type="text"
            placeholder={t.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="date"
            placeholder={t.birthdate}
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t.confirmPassword}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">{t.signup}</button>
        </form>
        <p className="switch-text">
          {t.alreadyHave} <a href="/">{t.login}</a>
        </p>
        <button onClick={toggleLanguage} className="lang-toggle">
          {language === 'en' ? '한국어' : 'English'}
        </button>
      </div>
    </div>
  );
}
