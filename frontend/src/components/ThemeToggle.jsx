import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const prevModeRef = useRef(darkMode);

  const handleToggle = () => {
    toggleTheme();
  };

  // Trigger animation whenever darkMode value changes (toggled anywhere in the app)
  useEffect(() => {
    if (prevModeRef.current !== darkMode) {
      setIsAnimating(true);
      const to = setTimeout(() => setIsAnimating(false), 600);
      prevModeRef.current = darkMode;
      return () => clearTimeout(to);
    }
  }, [darkMode]);

  const buttonStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    background: darkMode 
      ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #4338ca 100%)'
      : 'linear-gradient(135deg, #f472b6 0%, #fb923c 50%, #fbbf24 100%)',
    transform: isAnimating ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1)',
  };

  const iconStyle = {
    transition: 'all 0.3s ease',
    opacity: isAnimating ? 0 : 1,
    transform: isAnimating ? 'scale(0.5) rotate(90deg)' : 'scale(1) rotate(0deg)',
  };

  const handleMouseEnter = (e) => {
    if (!isAnimating) {
      e.target.style.transform = 'scale(1.05)';
      e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
    }
  };

  const handleMouseLeave = (e) => {
    if (!isAnimating) {
      e.target.style.transform = 'scale(1)';
      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    }
  };

  return (
    <button
      onClick={handleToggle}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      disabled={isAnimating}
    >
      <div style={iconStyle}>
        {darkMode ? (
          <svg
            width="24"
            height="24"
            fill="white"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            fill="white"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
