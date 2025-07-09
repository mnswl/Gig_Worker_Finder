import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Verify from './pages/Verify';
import TwoFactor from './pages/TwoFactor';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/theme.css';
import { useState, useEffect, useRef } from 'react';
import AOS from 'aos';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { socket, connectSocket } from './socket';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import About from './pages/About';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Chat from './pages/Chat';
import AdminRegister from './pages/AdminRegister';
import AdminDashboard from './pages/AdminDashboard';
import { bounce } from './utils/animations';
import CursorAura from './components/CursorAura';
import api from './api';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const brandRef = useRef(null);
  // bounce brand on mount
  useEffect(() => {
    if (brandRef.current) bounce(brandRef.current);
  }, []);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const { t, i18n } = useTranslation();
  const savedLng = localStorage.getItem('lng');
  const [lng, setLng] = useState(savedLng==='ta' ? 'en' : (savedLng || 'en'));

  useEffect(() => {
    const tok = localStorage.getItem('token');
    setToken(tok);
    if (tok) {
      (async ()=>{
        try {
          const res = await api.get('/auth/me');
          const unverified = !res.data.emailVerified && !res.data.phoneVerified;
          if(unverified){
            // move token to session and force verify
            sessionStorage.setItem('token', localStorage.getItem('token'));
            sessionStorage.setItem('role', localStorage.getItem('role'));
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            navigate('/verify', { state: { email: res.data.email, autoEmail: true } });
          }
        } catch(err){
          console.error(err);
        }
      })();
      connectSocket();
      const uid = localStorage.getItem('userId');
      if (uid) {
        socket.emit('join', uid);
      }
    } else if (socket.connected) {
      socket.disconnect();
    }
  }, [location]);

  // Apply theme changes
  useEffect(() => {
    document.body.classList.remove('light','dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Refresh AOS animations on route change
  useEffect(()=>{
    AOS.refresh();
  }, [location]);

  // language change
  const changeLanguage = (l) => {
    setLng(l);
    i18n.changeLanguage(l);
    localStorage.setItem('lng', l);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setToken(null);
    navigate('/');
  };

  return (
    <nav className="navbar navbar-top navbar-expand-md navbar-dark bg-primary border-bottom">
      <div className="container-fluid">
        <Link ref={brandRef} className="navbar-brand d-flex align-items-center" to="/">
          <img src="/logo.png" alt="Gig Worker Finder" height="40" className="me-2" />
        </Link>
        <div className="ms-auto d-flex align-items-center">
          <div className="form-check form-switch text-light me-3 mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="themeSwitch"
              checked={theme === 'dark'}
              onChange={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            />
            <label className="form-check-label small" htmlFor="themeSwitch">
              {theme === 'dark' ? t('themeDark') : t('themeLight')}
            </label>
          </div>
          {token && localStorage.getItem('role')==='admin' && (
              <Link className="btn btn-link text-white" to="/admin">Admin</Link>
            )}
            {token ? (
            <>
              <Link className="btn btn-link text-white" to="/dashboard">{t('dashboard')}</Link>
              <Link className="btn btn-link text-white" to="/profile">{t('myProfile')}</Link>
              <Link className="btn btn-link text-white" to="/about">{t('about')}</Link>
               <Link className="btn btn-link text-white" to="/contact">Contact</Link>
              <Link className="btn btn-link text-white" to="/chat">{t('chat')}</Link>
              <div className="dropdown me-2">
                <button className="btn btn-link text-white dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {lng.toUpperCase()}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><button className="dropdown-item" onClick={()=>changeLanguage('en')}>English</button></li>
                  <li><button className="dropdown-item" onClick={()=>changeLanguage('si')}>සිංහල</button></li>
                </ul>
              </div>
              <button className="btn btn-link text-white" onClick={handleLogout}>{t('logout')}</button>
            </>
          ) : (
            <>
              <div className="dropdown me-2">
                <button className="btn btn-link text-white dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {lng.toUpperCase()}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><button className="dropdown-item" onClick={()=>changeLanguage('en')}>English</button></li>
                  <li><button className="dropdown-item" onClick={()=>changeLanguage('si')}>සිංහල</button></li>
                </ul>
              </div>
              <Link className="btn btn-link text-white" to="/about">About</Link>
               <Link className="btn btn-link text-white" to="/login">{t('login')}</Link>
               <Link className="btn btn-link text-white" to="/register">{t('signUp')}</Link>
               <Link className="btn btn-link text-white" to="/contact">Contact</Link>
              <Link className="btn btn-link text-white" to="/admin-register">Admin SignUp</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}



// Animated page transitions using react-transition-group
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <SwitchTransition>
      <CSSTransition key={location.pathname} classNames="page" timeout={300} unmountOnExit>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/twofactor" element={<TwoFactor />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </CSSTransition>
    </SwitchTransition>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <CursorAura />

      <AnimatedRoutes />
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </BrowserRouter>
  );
}

export default App;

