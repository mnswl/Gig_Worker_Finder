import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { promptGoogleLogin } from '../googleAuth';
import '../styles/Register.css';
import { countries, currencies } from '../data/options';
import { getCurrencySymbol } from '../utils/currency';
import { getCurrencyOfCountry } from '../data/countryCurrency';

function Register() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState(() => {
    const draft = JSON.parse(sessionStorage.getItem('draftRegistration') || '{}');
    return {
      firstName: '',
      lastName: '',
      username: '',
      phone: '',
      email: '',
      country: '',
      currency: '',
      password: '',
      confirmPassword: '',
      role: 'worker',
      ...draft,
    };
  });

  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleGoogle = () => {
    promptGoogleLogin(async (idToken) => {
      try {
        const res = await api.post('/auth/google', { idToken, role: form.role, country: form.country || undefined, currency: form.currency || undefined });
        const user = res.data.user;
        if(user.emailVerified){
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('role', user.role);
          // persist selections if backend hasn't stored them yet
if(form.country) localStorage.setItem('pendingCountry', form.country);
if(form.currency) localStorage.setItem('pendingCurrency', form.currency);
 navigate('/dashboard');
        } else {
          sessionStorage.setItem('token', res.data.token);
          sessionStorage.setItem('role', user.role);
          navigate('/verify', { state: { email: user.email, autoEmail: true } });
        }
      } catch (e) {
        setError(e.response?.data?.msg || 'Google sign-up failed');
      }
    });
  };

  const token = localStorage.getItem('token');
  if (token) {
    return (
      <div className="register-wrapper" data-aos="fade-up">
        <div className="d-none" style={{top:10,right:10}}>
        <button className="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">🌐</button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li><button className="dropdown-item" onClick={()=>i18n.changeLanguage('en') || localStorage.setItem('lng','en')}>English</button></li>
          <li><button className="dropdown-item" onClick={()=>i18n.changeLanguage('si') || localStorage.setItem('lng','si')}>සිංහල</button></li>
        </ul>
      </div>
      <img src="/logo.png" alt="Gig Worker Finder" className="register-logo" />
        <div className="alert alert-warning mt-4">{t('alreadyLoggedIn')}</div>
        <Link className="btn btn-primary me-2 mt-3" to="/dashboard">{t('goToDashboard')}</Link>
        <button className="btn btn-outline-danger mt-3" onClick={()=>{localStorage.removeItem('token');localStorage.removeItem('role');navigate('/login');}}>{t('logout')}</button>
      </div>
    );
  }

  // Form change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };
    if (name === 'country') {
      const cur = getCurrencyOfCountry(value);
      if (cur) updated.currency = cur;
    }
    setForm(updated);
  };

  // Save current form to session for potential return from verification
  const saveDraft = (data)=> sessionStorage.setItem('draftRegistration', JSON.stringify(data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.email){
      setError(t('emailRequired') || 'Email is required');
      return;
    }
    if(form.password !== form.confirmPassword){
      setError(t('passwordMismatch') || 'Passwords do not match');
      return;
    }
    try {
      // persist draft
      saveDraft(form);
      const { confirmPassword, ...registerDataRaw } = form;
      const registerData = { ...registerDataRaw };
      if(!registerData.email) delete registerData.email;
      if(!registerData.country) delete registerData.country;
      if(!registerData.currency) delete registerData.currency;
      if(!registerData.phone) delete registerData.phone;
      const res = await api.post('/auth/register', { ...registerData, name: `${form.firstName} ${form.lastName}`.trim() });
      // temporarily store country & currency until profile update
      if(form.country) localStorage.setItem('pendingCountry', form.country);
      if(form.currency) localStorage.setItem('pendingCurrency', form.currency);
      // Store token for automatic login after verification
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('role', res.data.user?.role);
      // redirect to verify page (codes will be sent after user clicks Verify)
      navigate('/verify', { state: { email: form.email, phone: form.phone, skipProfile: true } });
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="register-wrapper" data-aos="fade-up">
      <div className="d-none" style={{top:10,right:10}}>
        <button className="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">🌐</button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li><button className="dropdown-item" onClick={()=>i18n.changeLanguage('en') || localStorage.setItem('lng','en')}>English</button></li>
          <li><button className="dropdown-item" onClick={()=>i18n.changeLanguage('si') || localStorage.setItem('lng','si')}>සිංහල</button></li>
        </ul>
      </div>
      <img src="/logo.png" alt="Gig Worker Finder" className="register-logo" />
      <h2 className="h4 fw-bold mb-1">{t('welcome')}</h2>
      <p className="text-muted mb-4" style={{fontSize:'0.9rem'}}>{t('fillForm')}</p>

      <div className="mb-2 text-start" style={{maxWidth:'400px',margin:'0 auto'}}>
        <label className="form-label">{t('role') || 'Role'}</label>
        <select className="form-select" name="role" value={form.role} onChange={handleChange}>
          <option value="worker">{t('worker') || 'Freelancer'}</option>
          <option value="employer">{t('employer') || 'Client'}</option>
        </select>
      </div>
      <button className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center mb-3" onClick={handleGoogle}> 
        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style={{height:18,width:18}} className="me-2" />
        {t('signUpGoogle')}
      </button>
      <div className="register-divider">{t('or')}</div>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-md-6 mb-3 text-start">
            <label className="form-label">{t('firstName')}</label>
            <input type="text" name="firstName" className="form-control" value={form.firstName} onChange={handleChange} required />
          </div>
          <div className="col-md-6 mb-3 text-start">
            <label className="form-label">{t('lastName')}</label>
            <input type="text" name="lastName" className="form-control" value={form.lastName} onChange={handleChange} required />
          </div>
        </div>
        <div className="mb-3 text-start">
          <label className="form-label">{t('usernameLabel')}</label>
          <input type="text" name="username" className="form-control" value={form.username} onChange={handleChange} required />
        </div>
        <div className="mb-3 text-start">
          <label className="form-label">{t('email')}</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3 text-start">
          <label className="form-label">{t('phone')}</label>
          <input
            type="tel"
            name="phone"
            pattern="^\+?[0-9]{7,15}$"
            className="form-control"
            value={form.phone}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3 text-start">
          <label className="form-label">Country</label>
          <select name="country" className="form-select" value={form.country} onChange={handleChange} required>
            <option value="" disabled>Select Country</option>
            {countries.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="mb-3 text-start">
          <label className="form-label">Currency</label>
          <select name="currency" className="form-select" value={form.currency} onChange={handleChange} required>
            <option value="" disabled>Select Currency</option>
            {currencies.map(c=> <option key={c} value={c}>{`${getCurrencySymbol(c)} ${c}`}</option>)}
          </select>
        </div>
        <div className="mb-3 text-start">
          <label className="form-label">{t('password')}</label>
          <div className="input-group">
            <input
              type={showPwd ? 'text' : 'password'}
              name="password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button type="button" className="btn btn-outline-secondary" tabIndex="-1" onClick={() => setShowPwd(p=>!p)}>
              {showPwd ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        <div className="mb-3 text-start">
          <label className="form-label">{t('confirmPassword') || 'Confirm Password'}</label>
          <div className="input-group">
            <input
              type={showConfirmPwd ? 'text' : 'password'}
              name="confirmPassword"
              className="form-control"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <button type="button" className="btn btn-outline-secondary" tabIndex="-1" onClick={() => setShowConfirmPwd(p=>!p)}>
              {showConfirmPwd ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        <div className="mb-3 text-start">
          <label className="form-label">{t('role')}</label>
          <select
            name="role"
            className="form-select"
            value={form.role}
            onChange={handleChange}
          >
            <option value="worker">{t('worker')}</option>
            <option value="employer">{t('employer')}</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-100">{t('createAccount')}</button>
      </form>
      <p className="mt-3" style={{fontSize:'0.9rem'}}>
        {t('alreadyAccount')} <Link to="/login">{t('login')}</Link>
      </p>
    </div>
  );
}

export default Register;
