import React, { useState } from 'react';
import { supabase } from './SupabaseClient';
import { createNewUserProfile, getUserProfile, type UserProfile } from './db';

interface AuthProps {
  onLoginSuccess: (user: UserProfile) => void;
}

// Logo and Icons can remain as they are, purely presentational.
const Logo = () => (
    <svg className="logo-svg" width="50" height="50" viewBox="0 0 50 50" aria-label="Chai app logo, a steaming cutting chai glass">
        <defs>
            <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className="shine-start" />
                <stop offset="50%" className="shine-mid" />
                <stop offset="100%" className="shine-end" />
            </linearGradient>
        </defs>
        <path className="glass-body" d="M 12,15 L 38,15 C 39,15 40,16 40,18 L 37,43 C 37,44 36,45 35,45 L 15,45 C 14,45 13,44 13,43 L 10,18 C 10,16 11,15 12,15 Z" />
        <path className="glass-shine" d="M 12,15 L 38,15 C 39,15 40,16 40,18 L 37,43 C 37,44 36,45 35,45 L 15,45 C 14,45 13,44 13,43 L 10,18 C 10,16 11,15 12,15 Z" fill="url(#glassShine)" />
        <path className="chai-liquid" d="M 14,24 L 36,24 L 35.5,41 C 35.5,42 34.5,43 33.5,43 L 16.5,43 C 15.5,43 14.5,42 14.5,41 Z" />
        <path className="chai-foam" d="M 14 24 C 18 22, 22 25, 25 24 C 28 23, 32 25, 36 24" />
        <g transform="translate(3,0)">
            <path className="steam steam-1" d="M22 8 C 25 2, 30 2, 33 8" />
            <path className="steam steam-2" d="M25 10 C 28 4, 33 4, 36 10" />
            <path className="steam steam-3" d="M20 12 C 23 6, 28 6, 31 12" />
        </g>
    </svg>
);
const MaleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const FemaleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 16v6"/><path d="M9 19h6"/></svg>);


const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Demographics
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState<'Salaried' | 'Self-employed'>('Salaried');
  const [dependents, setDependents] = useState<number>(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setPhone('');
    setError('');
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (authMode === 'signup' && !name) {
      setError('Please provide your full name.');
      setIsLoading(false);
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      setIsLoading(false);
      return;
    }

    const fullPhoneNumber = `+91${phone}`;

    const { error } = await supabase.auth.signInWithOtp({
      phone: fullPhoneNumber,
    });

    if (error) {
      setError(error.message);
    } else {
      setStep(2); // Move to OTP step
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!/^\d{4}$/.test(otp)) {
      setError('Please enter a valid 4-digit OTP.');
      setIsLoading(false);
      return;
    }

    const fullPhoneNumber = `+91${phone}`;
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      phone: fullPhoneNumber,
      token: otp,
      type: 'sms',
    });

    if (error) {
      setError(error.message);
    } else if (session) {
      const userProfile = await getUserProfile(session.user.id);
      if (userProfile) {
        // Existing user, log them in
        onLoginSuccess(userProfile);
      } else {
        // New user, go to demographics
        setStep(3);
      }
    }
    setIsLoading(false);
  };
  
  const handleDemographicsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!age || !gender) {
      setError('Please provide your age and gender.');
      setIsLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const dateOfBirth = new Date();
        dateOfBirth.setFullYear(dateOfBirth.getFullYear() - parseInt(age, 10));

        const newUserProfile = await createNewUserProfile(
            user.id,
            name,
            user.phone!,
            dateOfBirth.toISOString().split('T')[0], // Format as YYYY-MM-DD
            gender,
            dependents,
            profession
        );

        if (newUserProfile) {
            onLoginSuccess(newUserProfile);
        } else {
            setError('Could not create your profile. Please try again.');
        }
    } else {
        setError('Session expired. Please start over.');
    }
    setIsLoading(false);
  };

  return (
    <div className="container auth-container">
      <Logo />
      {step === 1 && <h2 className="auth-title">Smart finance, made simple.</h2>}
      <div className="auth-form">
        {step === 1 && (
             <div className="auth-toggle">
                <button 
                    className={authMode === 'signup' ? 'active' : ''} 
                    onClick={() => { setAuthMode('signup'); resetForm(); }}
                    aria-pressed={authMode === 'signup'}
                >
                    Sign Up
                </button>
                <button 
                    className={authMode === 'signin' ? 'active' : ''} 
                    onClick={() => { setAuthMode('signin'); resetForm(); }}
                    aria-pressed={authMode === 'signin'}
                >
                    Sign In
                </button>
            </div>
        )}

        {step === 1 && (
          <form onSubmit={handlePhoneSubmit}>
            {authMode === 'signup' && (
                <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input id="name" type="text" placeholder="e.g., Priya Sharma" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
            )}
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="phone-input-container">
                  <span className="country-code">+91</span>
                  <input id="phone" type="tel" placeholder="1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} required />
              </div>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Sending...' : (authMode === 'signup' ? 'Get OTP' : 'Sign In')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <h2 className="otp-title">Enter OTP</h2>
            <p>A 4-digit code was sent to your phone.</p>
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input id="otp" type="text" inputMode="numeric" placeholder="1234" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} required />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleDemographicsSubmit}>
            <h2>A little about you...</h2>
            <p>This helps us personalize your experience.</p>
            <div className="form-group">
              <label htmlFor="age">Your Age</label>
              <input id="age" type="number" placeholder="e.g., 28" value={age} onChange={(e) => setAge(e.target.value)} required />
            </div>
            <div className="form-group">
                <label>What's your craft?</label>
                <div className="binary-toggle">
                    <button type="button" className={profession === 'Salaried' ? 'active' : ''} onClick={() => setProfession('Salaried')}>Salaried</button>
                    <button type="button" className={profession === 'Self-employed' ? 'active' : ''} onClick={() => setProfession('Self-employed')}>Self-employed</button>
                </div>
            </div>
            <div className="form-group">
                <label>Gender</label>
                <div className="gender-selection">
                    <button type="button" className={`gender-button ${gender === 'Male' ? 'active' : ''}`} onClick={() => setGender('Male')}><MaleIcon /> Male</button>
                    <button type="button" className={`gender-button ${gender === 'Female' ? 'active' : ''}`} onClick={() => setGender('Female')}><FemaleIcon /> Female</button>
                </div>
            </div>
            <div className="form-group">
                <label>Number of Dependents</label>
                <div className="dependents-selector">
                    {Array.from({ length: 7 }, (_, i) => i).map(num => (
                        <button key={num} type="button" className={`dependent-button ${dependents === num ? 'active' : ''}`} onClick={() => setDependents(num)}>{num}</button>
                    ))}
                </div>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Finish & Start'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;