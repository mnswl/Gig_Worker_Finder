import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { promptGoogleLogin } from '../googleAuth';
import '../styles/Register.css';

function Login() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const changeLanguage = (lng) => { i18n.changeLanguage(lng); localStorage.setItem('lng', lng); };
  const [form, setForm] = useState({ email: '', password: '' });
  // role for new Google sign-ups
  const [role, setRole] = useState('worker');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = () => {
    promptGoogleLogin(async (idToken) => {
      try {
        const res = await api.post('/auth/google', { idToken, role });
        const user = res.data.user;
        if(user.emailVerified || user.phoneVerified){
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('role', user.role);
          navigate('/dashboard');
        } else {
          sessionStorage.setItem('token', res.data.token);
          sessionStorage.setItem('role', user.role);
          navigate('/verify', { state: { email: user.email, autoEmail: true } });
        }
      } catch (e) {
        setError(e.response?.data?.msg || 'Google sign-in failed');
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
          <li><button className="dropdown-item" onClick={()=>changeLanguage('en')}>English</button></li>
          <li><button className="dropdown-item" onClick={()=>changeLanguage('si')}>සිංහල</button></li>
        </ul>
      </div>
      <img src="/logo.png" alt="Gig Worker Finder" className="register-logo" />
        <div className="alert alert-warning mt-4">{t('alreadyLoggedIn')}</div>
        <Link className="btn btn-primary me-2 mt-3" to="/dashboard">{t('goToDashboard')}</Link>
        <button className="btn btn-outline-danger mt-3" onClick={()=>{localStorage.removeItem('token');localStorage.removeItem('role');navigate('/login');}}>{t('logout')}</button>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', form);
      const user = res.data.user;
// treat as verified if either contact method verified
      const verified = user.emailVerified || user.phoneVerified;      
      if(verified){
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userId', user.id);
      } else {
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('role', user.role);
        sessionStorage.setItem('userId', user.id);
        navigate('/verify', { state: { email: user.email, phone: user.phone, autoEmail: !user.emailVerified && !user.phoneVerified } });
        return;
      }
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="register-wrapper" data-aos="fade-up">
      <div className="d-none" style={{top:10,right:10}}>
        <button className="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">🌐</button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li><button className="dropdown-item" onClick={()=>changeLanguage('en')}>English</button></li>
          <li><button className="dropdown-item" onClick={()=>changeLanguage('si')}>සිංහල</button></li>
        </ul>
      </div>
      <img src="/logo.png" alt="Gig Worker Finder" className="register-logo" />
      <h2 className="h4 fw-bold mb-1">{t('welcomeBack')}</h2>
      <p className="text-muted mb-4" style={{fontSize:'0.9rem'}}>{t('loginContinue')}</p>

      <div className="mb-2 text-start" style={{maxWidth:'400px',margin:'0 auto'}}>
        <label className="form-label">{t('role') || 'Role'}</label>
        <select className="form-select" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="worker">{t('worker') || 'Freelancer'}</option>
          <option value="employer">{t('employer') || 'Client'}</option>
        </select>
      </div>
      <button className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center mb-3" onClick={handleGoogle}> 
        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style={{height:18,width:18}} className="me-2" />
        {t('signInGoogle')}
      </button>
      <div className="register-divider">{t('or')}</div>

      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3 text-start">
          <label className="form-label">{t('emailOrPhone')}</label>
          <input type="text" name="email" className="form-control" value={form.email} onChange={handleChange} required />
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
        <button type="submit" className="btn btn-primary w-100">{t('login')}</button>
      </form>
      <p className="mt-3" style={{fontSize:'0.9rem'}}>
        {t('noAccount')} <Link to="/register">{t('register')}</Link>
      </p>
    </div>
  );
}

export default Login;
