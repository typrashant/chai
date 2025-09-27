import React, { useState, useEffect } from 'react';
import { supabase } from './SupabaseClient.ts';
import { createNewUserProfile, getUserProfile, type UserProfile } from './db.ts';

interface AuthProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const APP_VERSION = '1.1.0';

// Logo and Icons can remain as they are, purely presentational.
const Logo = () => (
    <svg className="logo-svg" width="50" height="50" viewBox="0 0 50 50" aria-label="ChAi app logo, a steaming cutting chai glass">
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
  const [role, setRole] = useState<'Individual' | 'Financial Professional'>('Individual');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState<'Salaried' | 'Self-employed'>('Salaried');
  const [dependents, setDependents] = useState<number>(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advisorCodeFromUrl, setAdvisorCodeFromUrl] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('advisorCode');
    if (code) {
        setAdvisorCodeFromUrl(code);
        // Clean the URL to prevent re-use or confusion
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const resetForm = () => {
    setName('');
    setPhone('');
    setError('');
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
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

    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhoneNumber });

    if (error) {
      setError(error.message);
    } else {
      setStep(2);
    }
    setIsLoading(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setError('');

    const fullPhoneNumber = `+91${phone}`;

    const { data: { session }, error } = await supabase.auth.verifyOtp({
      phone: fullPhoneNumber,
      token: otp,
      type: 'sms'
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    if (session) {
      const existingProfile = await getUserProfile(session.user.id);
      if (existingProfile) {
        onLoginSuccess(existingProfile);
      } else if (authMode === 'signup') {
        // New user, proceed to demographics
        setStep(3);
      } else { // signin mode but no profile found
        setError("No account found with this number. Please sign up first.");
        setStep(1); // Go back to phone step
        setAuthMode('signup');
      }
    }
    setIsLoading(false);
  };

  const handleDemographicsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    if (age === '' || Number(age) < 0 || Number(age) > 120) {
        setError("Please enter a valid age between 0 and 120.");
        return;
    }
    if (!gender) {
        setError("Please select your gender.");
        return;
    }
    
    setIsLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const newProfile = await createNewUserProfile(
        user.id,
        name,
        `+91${phone}`,
        Number(age),
        gender,
        dependents,
        profession,
        role,
        advisorCodeFromUrl
      );

      if (newProfile) {
        onLoginSuccess(newProfile);
      } else {
        setError('There was an error creating your profile. Please try again.');
        setIsLoading(false);
      }
    } else {
        setError('Session expired. Please start over.');
        setStep(1);
        setIsLoading(false);
    }
  };


  const renderForm = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handlePhoneSubmit}>
             {authMode === 'signup' && (
                <div className="form-group">
                    <label>I am a...</label>
                    <div className="binary-toggle">
                        <button type="button" className={role === 'Individual' ? 'active' : ''} onClick={() => setRole('Individual')}>Individual</button>
                        <button type="button" className={role === 'Financial Professional' ? 'active' : ''} onClick={() => setRole('Financial Professional')}>Financial Professional</button>
                    </div>
                </div>
             )}
            {authMode === 'signup' && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Ananya Sharma" required />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="phone-input-container">
                  <span className="country-code">+91</span>
                  <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" required />
              </div>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="auth-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Sending OTP...' : 'Get OTP'}
            </button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleOtpSubmit}>
            <p className="otp-title">Enter the 6-digit OTP sent to your phone.</p>
            <div className="form-group">
              <label htmlFor="otp">OTP</label>
              <input id="otp" type="number" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" required />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="auth-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <div className="auth-footer">
                <p>Disclaimer: ChAi app is for financial planning education. For financial advice, please get in touch with a certified advisor.</p>
                <p>&copy; {new Date().getFullYear()} ChAi | Version {APP_VERSION}</p>
            </div>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleDemographicsSubmit}>
            <h2>A little about you...</h2>
            <p>This helps us personalize your financial plan.</p>
             <div className="form-group">
                <label htmlFor="age">Age</label>
                <input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 28" required />
              </div>
            <div className="form-group">
              <label>Gender</label>
              <div className="gender-selection">
                <button type="button" className={`gender-button ${gender === 'Male' ? 'active' : ''}`} onClick={() => setGender('Male')}><MaleIcon /> Male</button>
                <button type="button" className={`gender-button ${gender === 'Female' ? 'active' : ''}`} onClick={() => setGender('Female')}><FemaleIcon /> Female</button>
              </div>
            </div>
            <div className="form-group">
                <label>Profession</label>
                <div className="binary-toggle">
                    <button type="button" className={profession === 'Salaried' ? 'active' : ''} onClick={() => setProfession('Salaried')}>Salaried</button>
                    <button type="button" className={profession === 'Self-employed' ? 'active' : ''} onClick={() => setProfession('Self-employed')}>Self-employed</button>
                </div>
            </div>
            <div className="form-group">
              <label>Number of Dependents</label>
              <div className="dependents-selector">
                {[0, 1, 2, 3, 4, 5, 6].map(num => (
                  <button type="button" key={num} className={`dependent-button ${dependents === num ? 'active' : ''}`} onClick={() => setDependents(num)}>{num === 6 ? '6+' : num}</button>
                ))}
              </div>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="auth-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Finish Setup'}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container auth-container">
      <Logo />
      <h1 className="auth-title">Smart finance, made simple.</h1>
      <div className="auth-form">
        {step < 3 && (
          <>
            <h2>Welcome to ChAi!</h2>
            <p>{authMode === 'signup' ? 'Create an account to get started.' : 'Sign in to access your dashboard.'}</p>
            <div className="auth-toggle">
              <button className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); resetForm(); }}>Sign Up</button>
              <button className={authMode === 'signin' ? 'active' : ''} onClick={() => { setAuthMode('signin'); resetForm(); }}>Sign In</button>
            </div>
          </>
        )}
        {renderForm()}
      </div>
    </div>
  );
};

export default Auth;