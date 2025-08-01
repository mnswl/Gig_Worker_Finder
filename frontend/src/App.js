import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/theme.css';
import './styles/glassnav.css';
import './styles/light-mode-enhancements.css';
import './styles/job-card-fix.css';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import GlassmorphicNav from './components/GlassmorphicNav';
import ScrollToTop from './components/ScrollToTop';
import CursorAura from './components/CursorAura';
import RouteLoader from './components/RouteLoader';
import { bounce } from './utils/animations';
import { connectSocket, socket } from './socket';
import api from './api';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Suspense, lazy, useRef, useEffect, useState } from 'react';
import { SwitchTransition, CSSTransition } from 'react-transition-group';

// Lazy-loaded page components for code-splitting
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Verify = lazy(() => import('./pages/Verify'));
const TwoFactor = lazy(() => import('./pages/TwoFactor'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Chat = lazy(() => import('./pages/Chat'));
const Settings = lazy(() => import('./pages/Settings'));
const CurrencyConverter = lazy(() => import('./pages/CurrencyConverter'));
const AdminRegister = lazy(() => import('./pages/AdminRegister'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));
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
    <GlassmorphicNav 
      token={token}
      handleLogout={handleLogout}
      lng={lng}
      changeLanguage={changeLanguage}
    />
  );
}



// Animated page transitions using react-transition-group
function AnimatedRoutes() {
  const location = useLocation();
  const nodeRef = useRef(null);
  return (
    <SwitchTransition>
      <CSSTransition key={location.pathname} classNames="page" timeout={300} unmountOnExit nodeRef={nodeRef}>
        <div ref={nodeRef}>
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
            <Route path="/converter" element={<CurrencyConverter />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin-register" element={<AdminRegister />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </CSSTransition>
    </SwitchTransition>
  );
}

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Navigation />
          <CursorAura />
          <RouteLoader />
          <Suspense fallback={<RouteLoader />}>
            <AnimatedRoutes />
          </Suspense>
          <ScrollToTop />
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </ThemeProvider>
  );
}

export default App;
