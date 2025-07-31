import React, { useState, useEffect, useRef } from 'react';
import '../styles/glassnav.css';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  PhoneIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

const GlassmorphicNav = ({ token, handleLogout, lng, changeLanguage }) => {
  const navItemRefs = useRef([]);
  const highlightRef = useRef(null);
  const location = useLocation();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { path: '/', icon: HomeIcon, label: t('home'), key: 'home' },
    { path: '/dashboard', icon: ChartBarIcon, label: t('dashboard'), key: 'dashboard' },
    { path: '/profile', icon: UserIcon, label: t('myProfile'), key: 'profile' },
    { path: '/chat', icon: ChatBubbleLeftRightIcon, label: t('chat'), key: 'chat' },
    { path: '/settings', icon: Cog6ToothIcon, label: t('settings'), key: 'settings' },
    { path: '/about', icon: InformationCircleIcon, label: t('about'), key: 'about' },
    { path: '/contact', icon: PhoneIcon, label: t('contact'), key: 'contact' },
  ];

  // Navigation items for non-authenticated users
  const guestNavItems = [
    { path: '/', icon: HomeIcon, label: t('home'), key: 'home' },
    { path: '/about', icon: InformationCircleIcon, label: t('about'), key: 'about' },
    { path: '/contact', icon: PhoneIcon, label: t('contact'), key: 'contact' },
    { path: '/login', icon: ArrowLeftOnRectangleIcon, label: t('login'), key: 'login' },
    { path: '/register', icon: UserPlusIcon, label: t('signUp'), key: 'signup' },
  ];

  const navItems = token ? authenticatedNavItems : guestNavItems;

  // Update active index based on current path
  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.path === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname, navItems]);

  // Update highlight position
  useEffect(() => {
    const el = navItemRefs.current[activeIndex];
    const highlight = highlightRef.current;
    if (el && highlight) {
      const { offsetLeft, offsetWidth } = el;
      highlight.style.width = `${offsetWidth}px`;
      highlight.style.transform = `translateX(${offsetLeft}px)`;
    }
  }, [activeIndex]);

  const NavItem = ({ item, index, isActive, refEl }) => {
    const Icon = item.icon;
    
    return (
      <Link ref={refEl}
        to={item.path}
        className={`glass-nav-link ${
          isActive 
            ? 'text-white' 
            : 'text-gray-300 hover:text-white'
        }`}
        onClick={() => setActiveIndex(index)}
      >
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 transition-all duration-300 ${
            isActive ? 'drop-shadow-lg' : 'group-hover:drop-shadow-md'
          }`} />
          <span className={`text-sm font-medium transition-all duration-300 ${
            isActive ? 'drop-shadow-lg' : ''
          }`}>
            {item.label}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <nav className="glass-nav">
      <div className="glass-container">
        {/* Logo */}
        <Link to="/">
          <img src="/logo.png" alt="Gig Worker Finder" className="glass-logo" />
        </Link>

        {/* Navigation Items */}
        <div className="glass-nav-items">
          {/* Active pill background */}
          <div
            ref={highlightRef}
            className="glass-highlight"
          />
          
          {/* Navigation items */}
          {navItems.map((item, index) => (
            <NavItem
              key={item.key}
              item={item}
              index={index}
              isActive={index === activeIndex}
              refEl={el => (navItemRefs.current[index] = el)}
            />
          ))}
        </div>

        {/* Right side controls */}
        <div className="glass-controls">
          <ThemeToggle />
          
          {/* Language Dropdown */}
          <div className="glass-dropdown">
            <button className="glass-control-btn">
              {lng.toUpperCase()}
            </button>
            <div className="glass-dropdown-menu">
              <button 
                className="glass-dropdown-item"
                onClick={() => changeLanguage('en')}
              >
                English
              </button>
              <button 
                className="glass-dropdown-item"
                onClick={() => changeLanguage('si')}
              >
                සිංහල
              </button>
            </div>
          </div>

          {/* Admin Link (if admin) */}
          {token && localStorage.getItem('role') === 'admin' && (
            <Link to="/admin" className="glass-control-btn">
              <Cog6ToothIcon />
            </Link>
          )}

          {/* Logout Button (if authenticated) */}
          {token && (
            <button onClick={handleLogout} className="glass-control-btn">
              <ArrowRightOnRectangleIcon />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default GlassmorphicNav;
