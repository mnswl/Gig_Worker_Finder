import { useEffect, useState } from 'react';
import OtpInput from '../components/OtpInput';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { countries, currencies } from '../data/options';
import { getCurrencySymbol } from '../utils/currency';
import { getCurrencyOfCountry } from '../data/countryCurrency';

function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, phone, autoEmail, skipProfile } = location.state || {};

  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailSent, setEmailSent] = useState(!!autoEmail);
  const [phoneSent, setPhoneSent] = useState(false);
  const [msg, setMsg] = useState(autoEmail ? 'We have sent a verification code to your email.' : '');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // additional info
  const [profile, setProfile] = useState({ username: '', country: '', currency: '' });
  const [profileSaved, setProfileSaved] = useState(!!skipProfile);

  const saveProfile = async () => {
    if (!profile.username || !profile.country || !profile.currency) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await api.patch('/auth/me', profile);
      setProfileSaved(true);
      setMsg('Profile saved');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to save profile');
    }
  };

  const proceedTwoFactor = () => {
    if (!(emailVerified && profileSaved && (!phone || phoneVerified))) {
      alert('Please complete verification and save profile');
      return;
    }
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    if (token) {
      localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
    }
    sessionStorage.removeItem('draftRegistration');
    navigate('/twofactor');
  };

  const finishSignup = async () => {
    if (!emailVerified && !phoneVerified) {
      alert('Please verify at least one contact method');
      return;
    }
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    if (token) {
      localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
    }
    sessionStorage.removeItem('draftRegistration');
      // apply pending country/currency if present
    const pendingCountry = localStorage.getItem('pendingCountry');
    const pendingCurrency = localStorage.getItem('pendingCurrency');
    if (pendingCountry || pendingCurrency) {
      try {
        await api.patch('/auth/me', { country: pendingCountry, currency: pendingCurrency });
      } catch (err) {
        console.error(err);
      }
      if (pendingCountry) localStorage.removeItem('pendingCountry');
      if (pendingCurrency) localStorage.removeItem('pendingCurrency');
    }
    navigate('/dashboard');
  };

  // handle cancellation
  const handleCancel = async () => {
    try {
      await api.delete('/auth/cancel');
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/register');
    } catch (err) {
      console.error(err);
      setMsg('Failed to cancel registration. Please try again.');
    }
  };

  // fetch current profile once
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/me');
        const existing = {
          username: res.data.username || '',
          country: res.data.country || '',
          currency: res.data.currency || ''
        };
        setProfile(existing);
        if (existing.username && existing.country && existing.currency) {
          setProfileSaved(true);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Enter key handler
  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Enter') return;
      if (document.activeElement.tagName === 'TEXTAREA') return;
      e.preventDefault();
      // priority: verify code -> create account
      if (emailCode.length === 6 && !emailVerified) {
        verifyEmail();
        return;
      }
      if (phoneCode.length === 6 && phoneSent && !phoneVerified) {
        verifyPhone();
        return;
      }
      if (emailVerified && profileSaved && (!phone || phoneVerified)) {
        createAccount();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [emailCode, emailVerified, phoneCode, phoneSent, phoneVerified, profileSaved]);

  const sendEmailCode = async () => {
    if (!email) return;
    try {
      await api.post('/auth/email-code', { email });
      setEmailSent(true);
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.msg || 'Failed to send email code');
    }
  };

  const sendPhoneCode = async () => {
    if (!phone) return;
    try {
      await api.post('/auth/phone-code', { phone });
      setPhoneSent(true);
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.msg || 'Failed to send phone code');
    }
  };

  const verifyEmail = async () => {
    try {
      await api.post('/auth/verify-email', { email, code: emailCode });
      setEmailVerified(true);
      setMsg('Email verified successfully');
    } catch (err) {
      alert(err.response?.data?.msg || 'Verification failed');
    }
  };

  const verifyPhone = async () => {
    try {
      await api.post('/auth/verify-phone', { phone, code: phoneCode });
      setPhoneVerified(true);
      setMsg('Phone verified successfully');
    } catch (err) {
      alert(err.response?.data?.msg || 'Verification failed');
    }
  };

  if (!email && !phone) {
    return (
      <div className="container py-5">
        <h3>No verification info found.</h3>
        <Link to="/login" className="btn btn-primary mt-3">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: 500 }} data-aos="fade-up">
      <h2 className="mb-3">Verify Your Contact Information</h2>
      <p className="text-muted">
        You need to verify at least <strong>one</strong> contact method before using the platform.
        Verifying both is recommended.
      </p>
      {msg && <div className="alert alert-danger">{msg}</div>}

      {email && (
        <div className="card card-body mb-4">
          <h5>Email Verification</h5>
          <p>
            {emailSent
              ? 'We have sent a 6-digit code to your email.'
              : 'Send a verification code to your email.'}
          </p>
          <div className="input-group mb-2">
            <OtpInput value={emailCode} onChange={setEmailCode} disabled={!emailSent} />
            <button className="btn btn-outline-secondary" onClick={sendEmailCode}>
              {emailSent ? 'Resend' : 'Send Code'}
            </button>
          </div>
          <button className="btn btn-primary" onClick={verifyEmail} disabled={emailCode.length !== 6}>
            Verify Email
          </button>
          {emailVerified && <span className="badge bg-success ms-2">Verified</span>}
        </div>
      )}

      {phone && (
        <div className="card card-body mb-4">
          <h5>Phone Verification</h5>
          <p>
            {phoneSent
              ? 'We have sent a 6-digit code via SMS.'
              : 'Send a verification code to your phone.'}
          </p>
          <div className="input-group mb-2">
            <OtpInput value={phoneCode} onChange={setPhoneCode} disabled={!phoneSent} />
            <button className="btn btn-outline-secondary" onClick={sendPhoneCode}>
              {phoneSent ? 'Resend' : 'Send Code'}
            </button>
          </div>
          <button className="btn btn-primary" onClick={verifyPhone} disabled={phoneCode.length !== 6}>
            Verify Phone
          </button>
          {phoneVerified && <span className="badge bg-success ms-2">Verified</span>}
        </div>
      )}

      {!profileSaved && (
        <div className="card card-body mb-4">
          <h5>Profile Information</h5>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={profile.username}
              onChange={e => setProfile({ ...profile, username: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Country</label>
            <select
              className="form-select"
              value={profile.country}
              onChange={e => {
                const v = e.target.value;
                const cur = getCurrencyOfCountry(v);
                setProfile(prev => ({
                  ...prev,
                  country: v,
                  currency: cur || prev.currency
                }));
              }}
              required
            >
              <option value="" disabled>
                Select Country
              </option>
              {countries.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Currency</label>
            <select
              className="form-select"
              value={profile.currency}
              onChange={e => setProfile({ ...profile, currency: e.target.value })}
              required
            >
              <option value="" disabled>
                Select Currency
              </option>
              {currencies.map(c => (
                <option key={c} value={c}>
                  {`${getCurrencySymbol(c)} ${c}`}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={saveProfile}>
            Save Profile
          </button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mt-4">
        <p className="mb-0">If you’ve already verified, you can</p>
        <Link to="/login">login here</Link>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-outline-secondary" onClick={handleCancel}>
          Back & Edit Details
        </button>
        { (autoEmail || (skipProfile && email && !phone)) && (
          <button className="btn btn-success" onClick={proceedTwoFactor} disabled={autoEmail ? !(emailVerified && profileSaved && (!phone || phoneVerified)) : !emailVerified}>
            Proceed to Two-Factor Setup
          </button>
        ) }
        { (skipProfile && ( (email && phone) || (!email && phone) )) && (
          <button className="btn btn-primary" onClick={finishSignup} disabled={!(emailVerified || phoneVerified)}>
            Continue to the Site
          </button>
        ) }
      </div>
    </div>
  );
}

export default Verify;
