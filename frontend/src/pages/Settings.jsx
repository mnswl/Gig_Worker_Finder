import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { 
  UserIcon, 
  BellIcon, 
  GlobeAltIcon, 
  ShieldCheckIcon,
  EyeIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  KeyIcon,
  TrashIcon,
  CheckIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import './Settings.css';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { darkMode: isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Settings state
  const [settings, setSettings] = useState({
    // Profile settings
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    jobAlerts: true,
    messageAlerts: true,
    
    // Privacy settings
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    
    // App preferences
    language: i18n.language,
    currency: 'USD',
    timezone: 'America/New_York',
    autoSave: true,
    compactView: false
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationData, setVerificationData] = useState({ type: '', value: '', code: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [user, setUser] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [pendingDeletion, setPendingDeletion] = useState(false);

  // Validation helper functions
  const validateField = (key, value) => {
    const errors = {};
    
    switch (key) {
      case 'firstName':
        if (!value.trim()) {
          errors.firstName = 'First name is required';
        } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,40}$/.test(value.trim())) {
          errors.firstName = 'Use letters only (2-40 chars)';
        }
        break;
        
      case 'lastName':
        if (value && !/^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,40}$/.test(value.trim())) {
          errors.lastName = 'Use letters only (2-40 chars)';
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
        
      case 'phone':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          errors.phone = 'Please enter a valid phone number';
        }
        break;
        
      case 'bio':
        if (value && value.length > 500) {
          errors.bio = 'Bio must be less than 500 characters';
        }
        break;
    }
    
    return errors;
  };

  const getFieldError = (key) => {
    return fieldTouched[key] ? validationErrors[key] : null;
  };

  const isFieldValid = (key) => {
    return fieldTouched[key] && !validationErrors[key];
  };

  // Indicates if any validation errors are present across the form
  const hasValidationErrors = Object.values(validationErrors).some(Boolean);

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/auth/me');
        const data = response.data;
        
        setUser(data);
        
        // Use firstName/lastName directly from backend instead of parsing name field
        // This prevents issues with inconsistent name field truncation
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';
        

        
        // Load saved settings from localStorage
        const savedSettings = localStorage.getItem('userSettings');
        const localSettings = savedSettings ? JSON.parse(savedSettings) : {};

        

        setSettings(prev => ({
          ...prev,
          firstName,
          lastName,
          email: data.email || '',
          phone: data.phone || '',
          bio: data.bio || '',
          currency: data.currency || 'USD',
          language: data.language || i18n.language,
          // Load notification preferences from localStorage or defaults
          emailNotifications: localSettings.emailNotifications !== undefined ? localSettings.emailNotifications : true,
          pushNotifications: localSettings.pushNotifications !== undefined ? localSettings.pushNotifications : true,
          smsNotifications: localSettings.smsNotifications !== undefined ? localSettings.smsNotifications : false,
          jobAlerts: localSettings.jobAlerts !== undefined ? localSettings.jobAlerts : true,
          messageAlerts: localSettings.messageAlerts !== undefined ? localSettings.messageAlerts : true,
          // Privacy settings from localStorage
          profileVisibility: localSettings.profileVisibility || 'public',
          showEmail: localSettings.showEmail !== undefined ? localSettings.showEmail : false,
          showPhone: localSettings.showPhone !== undefined ? localSettings.showPhone : false,
          allowMessages: localSettings.allowMessages !== undefined ? localSettings.allowMessages : true,
          // App preferences from localStorage
          autoSave: localSettings.autoSave !== undefined ? localSettings.autoSave : true,
          compactView: localSettings.compactView !== undefined ? localSettings.compactView : false,
        }));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user settings');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [i18n.language]);

  const handleSettingChange = (key, value) => {
    // Mark field as touched for validation
    setFieldTouched(prev => ({ ...prev, [key]: true }));
    
    // Validate the field
    const fieldErrors = validateField(key, value);
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors,
      // Clear error if field is now valid
      ...(Object.keys(fieldErrors).length === 0 && { [key]: undefined })
    }));
    
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: value
      };
      return newSettings;
    });
    setHasChanges(true);
    
    // Auto-save if enabled (using functional update to get current value)
    if (key !== 'autoSave') {
      setSettings(currentSettings => {
        if (currentSettings.autoSave) {
          setTimeout(() => handleSaveSettings(), 500); // Debounce auto-save
        }
        return currentSettings;
      });
    }
  };

  const handleLanguageChange = (lang) => {
    handleSettingChange('language', lang);
  };
  
  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      setSettings({
        ...settings,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        jobAlerts: true,
        messageAlerts: true,
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        allowMessages: true,
        autoSave: true,
        compactView: false
      });
      setHasChanges(true);
      toast.info('Settings reset to defaults. Click Save to apply changes.');
    }
  };
  
  const handleDeleteAccount = async () => {
    try {
      setPendingDeletion(true);
      
      // Show undo toast for 10 seconds
      const toastId = toast.warning(
        <div>
          <strong>Account deletion scheduled</strong>
          <br />
          <small>Your account will be deleted in 10 seconds</small>
          <br />
          <button 
            className="btn btn-sm btn-outline-light mt-2"
            onClick={() => handleUndoDelete(toastId)}
          >
            Undo Delete
          </button>
        </div>,
        {
          position: "top-center",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: false,
          onClose: () => {
            if (pendingDeletion) {
              executeAccountDeletion();
            }
          }
        }
      );

      // Set timeout for actual deletion
      const timeout = setTimeout(() => {
        if (pendingDeletion) {
          executeAccountDeletion();
        }
      }, 10000);
      
      setUndoTimeout(timeout);
      setShowDeleteModal(false);
      
    } catch (error) {
      console.error('Error scheduling account deletion:', error);
      toast.error('Failed to schedule account deletion');
      setPendingDeletion(false);
    }
  };

  const handleUndoDelete = (toastId) => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    setPendingDeletion(false);
    toast.dismiss(toastId);
    toast.success('Account deletion cancelled', {
      position: "top-center",
      autoClose: 3000
    });
  };

  const executeAccountDeletion = async () => {
    try {
      await api.delete('/auth/me');
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Account deleted successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setPendingDeletion(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);

    // Prevent save if there are validation errors
    if (Object.values(validationErrors).some(Boolean)) {
      toast.error('Please fix the highlighted errors before saving.');
      setSaving(false);
      return;
    }

    try {
      // Validate required fields
      if (!settings.firstName.trim()) {
        toast.error('First name is required');
        setSaving(false);
        return;
      }
      
      if (!settings.email.trim()) {
        toast.error('Email is required');
        setSaving(false);
        return;
      }
      
      // Check if email or phone changed (these might trigger verification)
      const emailChanged = user && settings.email !== user.email;
      const phoneChanged = user && settings.phone !== user.phone;
      
      // MINIMAL SAVE - Only save fields that definitely work (same as Profile page)
      const updateData = {
        name: `${settings.firstName} ${settings.lastName}`.trim(),
        firstName: settings.firstName,
        lastName: settings.lastName,
        bio: settings.bio || '',
        currency: settings.currency,
        language: settings.language
      };
      

      
      const response = await api.patch('/auth/me', updateData);

      
      // Update local state with response
      setUser(prev => ({ ...prev, ...response.data }));
      
      // Store notification/privacy settings in localStorage for now
      const localSettings = {
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
        jobAlerts: settings.jobAlerts,
        messageAlerts: settings.messageAlerts,
        profileVisibility: settings.profileVisibility,
        showEmail: settings.showEmail,
        showPhone: settings.showPhone,
        allowMessages: settings.allowMessages,
        autoSave: settings.autoSave,
        compactView: settings.compactView
      };
      
      localStorage.setItem('userSettings', JSON.stringify(localSettings));

      

      
      // Handle email change separately if needed
      if (emailChanged) {
        try {
          await api.patch('/auth/me', { email: settings.email });
          // Auto-send email verification code
          await api.post('/auth/email-code', { email: settings.email });
          // Show verification modal
          setVerificationType('email');
          setVerificationTarget(settings.email);
          setShowVerificationModal(true);
          toast.info('Email updated. Please verify your new email address.');
        } catch (emailError) {
          console.error('Email update error:', emailError);
          if (emailError.response?.status === 400) {
            toast.warning('Email updated but verification required. Check your email for verification code.');
          } else {
            toast.error('Failed to update email. Please try again.');
          }
        }
      }
      
      // Handle phone change separately if needed
      if (phoneChanged) {
        try {
          await api.patch('/auth/me', { phone: settings.phone });
          // Auto-send phone verification code
          await api.post('/auth/phone-code', { phone: settings.phone });
          // Show verification modal
          setVerificationType('phone');
          setVerificationTarget(settings.phone);
          setShowVerificationModal(true);
          toast.info('Phone updated. Please verify your new phone number.');
        } catch (phoneError) {
          console.error('Phone update error:', phoneError);
          if (phoneError.response?.status === 400) {
            toast.warning('Phone updated but verification required. Check your phone for verification code.');
          } else {
            toast.error('Failed to update phone. Please try again.');
          }
        }
      }
      
      // Update language if changed
      if (settings.language !== i18n.language) {
        i18n.changeLanguage(settings.language);
      }
      
      // Reset hasChanges flag after successful save
      setHasChanges(false);
      
      // Show success message
      if (!emailChanged && !phoneChanged) {
        toast.success('Settings saved successfully!');
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // More detailed error handling
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid input data';
        toast.error(`Validation error: ${errorMessage}`);
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        // Redirect to login if needed
        navigate('/login');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to save settings. Please try again.');
      }
      
      console.error('Full error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle verification code submission
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }
    
    setVerifying(true);
    try {
      if (verificationType === 'email') {
        await api.post('/auth/verify-email', { 
          email: verificationTarget, 
          code: verificationCode 
        });
        toast.success('Email verified successfully!');
      } else if (verificationType === 'phone') {
        await api.post('/auth/verify-phone', { 
          phone: verificationTarget, 
          code: verificationCode 
        });
        toast.success('Phone verified successfully!');
      }
      
      // Close modal and refresh user data
      setShowVerificationModal(false);
      setVerificationCode('');
      
      // Refresh user data to get updated verification status
      const { data } = await api.get('/auth/me');
      setUser(data);
      
    } catch (error) {
      console.error('Verification error:', error);
      if (error.response?.status === 400) {
        toast.error('Invalid verification code. Please try again.');
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };
  
  // Resend verification code
  const handleResendCode = async () => {
    try {
      if (verificationType === 'email') {
        await api.post('/auth/email-code', { email: verificationTarget });
        toast.success('New verification code sent to your email');
      } else if (verificationType === 'phone') {
        await api.post('/auth/phone-code', { phone: verificationTarget });
        toast.success('New verification code sent to your phone');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend code. Please try again.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheckIcon },
    { id: 'preferences', label: 'Preferences', icon: GlobeAltIcon },
    { id: 'account', label: 'Account', icon: KeyIcon }
  ];

  return (
    <div className="settings-page">
      <div className="container-fluid py-4">
        <div className="row">
          {/* Settings Navigation */}
          <div className="col-lg-3 col-md-4 mb-4">
            <div className="settings-nav card">
              <div className="card-body p-0">
                <h5 className="card-title p-3 mb-0 border-bottom">Settings</h5>
                <nav className="nav flex-column">
                  {tabs.map(tab => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <IconComponent className="settings-icon" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="col-lg-9 col-md-8">
            <div className="settings-content card">
              <div className="card-body">
                
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="settings-section">
                    <h4 className="section-title d-flex align-items-center gap-2 mb-4">
                      <UserIcon className="section-icon" />
                      Profile Information
                    </h4>

                    <div className="row g-3">
                      {/* First Name */}
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="firstName">
                          First Name <span className="text-danger">*</span>
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          className={`form-control ${getFieldError('firstName') ? 'is-invalid' : ''} ${isFieldValid('firstName') ? 'is-valid' : ''}`}
                          value={settings.firstName}
                          onChange={(e) => handleSettingChange('firstName', e.target.value)}
                          aria-describedby={getFieldError('firstName') ? 'firstName-error' : 'firstName-help'}
                          aria-invalid={!!getFieldError('firstName')}
                          required
                        />
                        {getFieldError('firstName') ? (
                          <div id="firstName-error" className="invalid-feedback" role="alert">
                            {getFieldError('firstName')}
                          </div>
                        ) : (
                          <div id="firstName-help" className="form-text">
                            Your first name as it appears on your profile
                          </div>
                        )}
                      </div>

                      {/* Last Name */}
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="lastName">Last Name</label>
                        <input
                          id="lastName"
                          type="text"
                          className={`form-control ${getFieldError('lastName') ? 'is-invalid' : ''} ${isFieldValid('lastName') ? 'is-valid' : ''}`}
                          value={settings.lastName}
                          onChange={(e) => handleSettingChange('lastName', e.target.value)}
                          aria-describedby="lastName-help"
                        />
                        <div id="lastName-help" className="form-text">
                          Your last name (optional)
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="email">
                          Email <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <EnvelopeIcon className="input-icon" />
                          </span>
                          <input
                            id="email"
                            type="email"
                            className={`form-control ${getFieldError('email') ? 'is-invalid' : ''} ${isFieldValid('email') ? 'is-valid' : ''}`}
                            value={settings.email}
                            onChange={(e) => handleSettingChange('email', e.target.value)}
                            aria-describedby={getFieldError('email') ? 'email-error' : 'email-help'}
                            aria-invalid={!!getFieldError('email')}
                            required
                          />
                        </div>
                        {getFieldError('email') ? (
                          <div id="email-error" className="invalid-feedback" role="alert">
                            {getFieldError('email')}
                          </div>
                        ) : (
                          <div id="email-help" className="form-text">
                            Used for login and notifications. Changes require verification.
                          </div>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="phone">Phone</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <DevicePhoneMobileIcon className="input-icon" />
                          </span>
                          <input
                            id="phone"
                            type="tel"
                            className={`form-control ${getFieldError('phone') ? 'is-invalid' : ''} ${isFieldValid('phone') ? 'is-valid' : ''}`}
                            value={settings.phone}
                            onChange={(e) => handleSettingChange('phone', e.target.value)}
                            aria-describedby={getFieldError('phone') ? 'phone-error' : 'phone-help'}
                            aria-invalid={!!getFieldError('phone')}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        {getFieldError('phone') ? (
                          <div id="phone-error" className="invalid-feedback" role="alert">
                            {getFieldError('phone')}
                          </div>
                        ) : (
                          <div id="phone-help" className="form-text">
                            Optional. Include country code for international numbers.
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      <div className="col-12">
                        <label className="form-label" htmlFor="bio">Bio</label>
                        <textarea
                          id="bio"
                          className={`form-control ${getFieldError('bio') ? 'is-invalid' : ''} ${isFieldValid('bio') ? 'is-valid' : ''}`}
                          rows="3"
                          value={settings.bio}
                          onChange={(e) => handleSettingChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          aria-describedby={getFieldError('bio') ? 'bio-error' : 'bio-help'}
                          aria-invalid={!!getFieldError('bio')}
                          maxLength="500"
                        />
                        {getFieldError('bio') ? (
                          <div id="bio-error" className="invalid-feedback" role="alert">
                            {getFieldError('bio')}
                          </div>
                        ) : null}
                        <div id="bio-help" className="form-text">
                          {settings.bio ? `${settings.bio.length}/500 characters` : '0/500 characters'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="settings-section">
                    <h4 className="section-title d-flex align-items-center gap-2 mb-4">
                      <BellIcon className="section-icon" />
                      Notification Preferences
                    </h4>
                    
                    <div className="settings-group">
                      <h6 className="settings-group-title">Communication</h6>
                      <div className="row g-3">
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={settings.emailNotifications}
                              onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                            />
                            <label className="form-check-label">
                              Email Notifications
                              <small className="text-muted d-block">Receive updates via email</small>
                            </label>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={settings.pushNotifications}
                              onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                            />
                            <label className="form-check-label">
                              Push Notifications
                              <small className="text-muted d-block">Browser notifications</small>
                            </label>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={settings.smsNotifications}
                              onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                            />
                            <label className="form-check-label">
                              SMS Notifications
                              <small className="text-muted d-block">Text message alerts</small>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-group">
                      <h6 className="settings-group-title">Content Alerts</h6>
                      <div className="row g-3">
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={settings.jobAlerts}
                              onChange={(e) => handleSettingChange('jobAlerts', e.target.checked)}
                            />
                            <label className="form-check-label">
                              Job Alerts
                              <small className="text-muted d-block">New job postings matching your skills</small>
                            </label>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={settings.messageAlerts}
                              onChange={(e) => handleSettingChange('messageAlerts', e.target.checked)}
                            />
                            <label className="form-check-label">
                              Message Alerts
                              <small className="text-muted d-block">New messages and chat notifications</small>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="settings-section">
                    <h4 className="section-title d-flex align-items-center gap-2 mb-4">
                      <ShieldCheckIcon className="section-icon" />
                      Privacy & Security
                    </h4>
                    
                    <div className="settings-group">
                      <h6 className="settings-group-title">Profile Visibility</h6>
                      <div className="row g-3">
                        <div className="col-12">
                          <select
                            className="form-select"
                            value={settings.profileVisibility}
                            onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                          >
                            <option value="public">Public - Anyone can view</option>
                            <option value="registered">Registered Users Only</option>
                            <option value="private">Private - Hidden from search</option>
                          </select>
                        </div>
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={settings.showEmail}
                              onChange={(e) => handleSettingChange('showEmail', e.target.checked)}
                            />
                            <label className="form-check-label">
                              Show Email Address
                              <small className="text-muted d-block">Display email on your profile</small>
                            </label>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={settings.showPhone}
                              onChange={(e) => handleSettingChange('showPhone', e.target.checked)}
                            />
                            <label className="form-check-label">
                              Show Phone Number
                              <small className="text-muted d-block">Display phone on your profile</small>
                            </label>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={settings.allowMessages}
                              onChange={(e) => handleSettingChange('allowMessages', e.target.checked)}
                            />
                            <label className="form-check-label">
                              Allow Direct Messages
                              <small className="text-muted d-block">Let other users message you</small>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="settings-section">
                    <h4 className="section-title d-flex align-items-center gap-2 mb-4">
                      <GlobeAltIcon className="section-icon" />
                      App Preferences
                    </h4>
                    
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Language</label>
                        <select
                          className="form-select"
                          value={settings.language}
                          onChange={(e) => handleSettingChange('language', e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="si">සිංහල</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Currency</label>
                        <select
                          className="form-select"
                          value={settings.currency}
                          onChange={(e) => handleSettingChange('currency', e.target.value)}
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <div className="settings-group">
                          <h5 className="settings-group-title d-flex align-items-center gap-2">
                            <EyeIcon className="section-icon" style={{width: '20px', height: '20px'}} />
                            Theme Appearance
                          </h5>
                          <p className="text-muted mb-3">Choose your preferred theme for the best visual experience</p>
                          
                          <div className="theme-toggle-container d-flex gap-3 flex-wrap justify-content-center">
                            <button
                              className={`theme-pill day ${!isDark ? 'active' : ''}`}
                              onClick={() => !isDark || toggleTheme()}
                              aria-pressed={!isDark}
                              aria-label="Switch to light theme - Day Mode"
                              title="Light Theme"
                            >
                              <span className="pill-text">Day Mode</span>
                              <span className="pill-icon-wrapper">
                                <SunIcon className="pill-icon" />
                              </span>
                            </button>

                            <button
                              className={`theme-pill night ${isDark ? 'active' : ''}`}
                              onClick={() => isDark || toggleTheme()}
                              aria-pressed={isDark}
                              aria-label="Switch to dark theme - Night Mode"
                              title="Dark Theme"
                            >
                              <span className="pill-icon-wrapper">
                                <MoonIcon className="pill-icon" />
                              </span>
                              <span className="pill-text">Night Mode</span>
                            </button>
                          </div>
                          
                          <div className="theme-preview mt-3 text-center">
                            <small className="text-muted">
                              {isDark ? (
                                <span>🌙 Dark theme is easier on the eyes in low light</span>
                              ) : (
                                <span>☀️ Light theme provides better readability in bright environments</span>
                              )}
                            </small>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={settings.autoSave}
                            onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                          />
                          <label className="form-check-label">
                            Auto-save Changes
                            <small className="text-muted d-block">Automatically save settings as you change them</small>
                          </label>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={settings.compactView}
                            onChange={(e) => handleSettingChange('compactView', e.target.checked)}
                          />
                          <label className="form-check-label">
                            Compact View
                            <small className="text-muted d-block">Show more content in less space</small>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                  <div className="settings-section">
                    <h4 className="section-title d-flex align-items-center gap-2 mb-4">
                      <KeyIcon className="section-icon" />
                      Account Management
                    </h4>
                    
                    <div className="settings-group">
                      <h6 className="settings-group-title">Security</h6>
                      <div className="row g-3">
                        <div className="col-12">
                          <button className="btn btn-outline-primary">
                            Change Password
                          </button>
                          <small className="text-muted d-block mt-1">
                            Last changed 3 months ago
                          </small>
                        </div>
                        <div className="col-12">
                          <button className="btn btn-outline-secondary">
                            Enable Two-Factor Authentication
                          </button>
                          <small className="text-muted d-block mt-1">
                            Add an extra layer of security to your account
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="settings-group">
                      <h6 className="settings-group-title">Data Management</h6>
                      <div className="row g-3">
                        <div className="col-12">
                          <button className="btn btn-outline-info">
                            Download My Data
                          </button>
                          <small className="text-muted d-block mt-1">
                            Export all your account data
                          </small>
                        </div>
                        <div className="col-12">
                          <button className="btn btn-outline-warning">
                            Deactivate Account
                          </button>
                          <small className="text-muted d-block mt-1">
                            Temporarily disable your account
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="settings-group danger-zone">
                      <h6 className="settings-group-title text-danger">Danger Zone</h6>
                      <div className="row g-3">
                        <div className="col-12">
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => setShowDeleteModal(true)}
                            disabled={pendingDeletion}
                          >
                            <TrashIcon className="me-2" style={{width: '16px', height: '16px'}} />
                            {pendingDeletion ? 'Deletion Pending...' : 'Delete Account'}
                          </button>
                          <small className="text-muted d-block mt-1">
                            Permanently delete your account and all data
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="settings-actions mt-4 pt-3 border-top">
                  <button 
                    className="btn btn-primary me-2"
                    onClick={handleSaveSettings}
                    disabled={saving || !hasChanges || hasValidationErrors}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="me-2" style={{width: '16px', height: '16px'}} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={handleResetToDefaults}
                  >
                    Reset to Defaults
                  </button>
                  {hasChanges && (
                    <small className="text-warning ms-3">
                      You have unsaved changes
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Delete Account</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                <p className="text-muted">All your data, including:</p>
                <ul className="text-muted">
                  <li>Profile information</li>
                  <li>Job applications</li>
                  <li>Messages and conversations</li>
                  <li>Work history</li>
                </ul>
                <p className="text-muted">will be permanently deleted.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                >
                  Yes, Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Verify {verificationType === 'email' ? 'Email' : 'Phone'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setVerificationCode('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  We've sent a verification code to your {verificationType === 'email' ? 'email' : 'phone'}:
                </p>
                <p className="fw-bold text-primary">{verificationTarget}</p>
                <div className="mb-3">
                  <label className="form-label">Verification Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Didn't receive the code?
                  </small>
                  <button 
                    type="button" 
                    className="btn btn-link btn-sm"
                    onClick={handleResendCode}
                  >
                    Resend Code
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setVerificationCode('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleVerifyCode}
                  disabled={verifying || !verificationCode.trim()}
                >
                  {verifying ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
