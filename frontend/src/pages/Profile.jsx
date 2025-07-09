import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { socket, connectSocket } from '../socket';
import { toast } from 'react-toastify';
import '../styles/Profile.css';
import { countries, currencies } from '../data/options';
import { getCurrencySymbol } from '../utils/currency';
import roleDisplay from '../utils/roleDisplay';
import { getCurrencyOfCountry } from '../data/countryCurrency';
import _ from 'lodash';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs'); // will adjust later based on role
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [verifyModal, setVerifyModal] = useState(() => localStorage.getItem('pendingPhoneVerify')==='true');
  const [otp, setOtp] = useState('');
  const [emailVerifyModal, setEmailVerifyModal] = useState(() => localStorage.getItem('pendingEmailVerify')==='true');
  const [emailOtp, setEmailOtp] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resume, setResume] = useState(null);
  const { t } = useTranslation();
  const [form, setForm] = useState({ username:'', firstName:'', lastName:'', email:'', phone:'' });
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  // dedicated handler to avoid inline re-creations & possible loops
  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/me');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      try { socket.disconnect(); } catch(e){}
      window.location.href = '/register';
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed');
    }
  };

  // fetch user and related data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data } = await api.get('/auth/me');
        let uid = data.id || data._id;
    // Fallbacks & pending selections
    const pendingCountry = localStorage.getItem('pendingCountry');
    const pendingCurrency = localStorage.getItem('pendingCurrency');
    const storedCountry = data.country || localStorage.getItem(`country_${uid}`) || pendingCountry || '';
    const storedCurrency = data.currency || localStorage.getItem(`currency_${uid}`) || pendingCurrency || '';
    const storedAvatar = data.avatar || localStorage.getItem(`avatar_${uid}`) || '';
    // Apply to user object
    setUser({ ...data, country: storedCountry, currency: storedCurrency, avatar: storedAvatar });
    // Persist per-user values
    if (storedCountry) localStorage.setItem(`country_${uid}`, storedCountry);
    if (storedCurrency) localStorage.setItem(`currency_${uid}`, storedCurrency);
    if (storedAvatar) localStorage.setItem(`avatar_${uid}`, storedAvatar);
    // If backend still missing, update it once
    if ((!data.country && pendingCountry) || (!data.currency && pendingCurrency)) {
      try {
        const patchRes = await api.patch('/auth/me', { country: pendingCountry, currency: pendingCurrency });
        // merge immediately so UI shows selections without reload
        const updatedCountry = patchRes.data.country || pendingCountry;
        const updatedCurrency = patchRes.data.currency || pendingCurrency;
        setUser(prev=>({ ...prev, country: updatedCountry, currency: updatedCurrency }));
        setForm(prev=>({ ...prev, country: updatedCountry, currency: updatedCurrency }));
        // clear pending values only after successful update
        localStorage.removeItem('pendingCountry');
        localStorage.removeItem('pendingCurrency');
      } catch (err) {
        console.error(err);
      }
    }
        if (data.role !== 'worker' && data.role !== 'employer') {
          setActiveTab('notifications');
        }
        localStorage.setItem('uid', data.id || data._id);
        const newUser = { ...data, country: storedCountry, currency: storedCurrency, avatar: storedAvatar };
        if (!_.isEqual(user, newUser)) {
          setUser(newUser);
        }
        const newForm = {
          username: data.username || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          country: storedCountry,
          currency: storedCurrency,
        };
        if (!_.isEqual(form, newForm)) {
          setForm(newForm);
        }
        // Jobs or posts depending on role
        if (data.role === 'employer') {
          const res = await api.get('/jobs/me');
          setJobs(res.data);
        } else {
          const res = await api.get('/jobs');
          // show only jobs the worker has applied to
          const applied = res.data.filter(j => j.applicants && j.applicants.some(a => {
             const uid = (a.user?._id || (typeof a.user==='object' && a.user.toString ? a.user.toString() : a.user));
             return uid === (data.id || data._id);
           }));
          setJobs(applied);
        }
        // TODO replace with real endpoints once implemented
        setNotifications([ { _id:1, text:'Welcome to Gig Worker Finder!' } ]);
        const msgRes = await api.get('/chat');
        setMessages(msgRes.data);
        // Fetch bookmarks
        try {
          const bm = await api.get('/users/me/bookmarks');
          setBookmarks(bm.data || []);
        } catch(e) { console.error(e); }
      } catch (err) {
        if (err.response?.status === 401) {
          // token invalid or expired
          localStorage.removeItem('token');
          navigate('/login');
        }
        console.error(err);
      }
    };
    fetchAll();

    // establish socket connection and listen for application status updates
    connectSocket();
    socket.off('applicationStatus'); // ensure no duplicate listeners
    socket.off('jobApplied');
    socket.on('applicationStatus', ({ jobId, jobTitle, status, message }) => {
      const uid = localStorage.getItem('uid');
      // show toast & push to notifications list
      setNotifications(prev => [...prev, { _id: Date.now().toString(), text: `Your application for "${jobTitle}" is now ${status}` }]);
      toast.info(`Application "${jobTitle}" ${status}`);
      // update jobs state
      setJobs(prev => prev.map(j => {
        if (j._id === jobId) {
          const updatedApplicants = j.applicants.map(a => {
            const aid = (a.user?._id || (typeof a.user==='object' && a.user.toString ? a.user.toString() : a.user));
            return aid === uid ? { ...a, status, responseMessage: message } : a;
          });
          return { ...j, applicants: updatedApplicants };
        }
        return j;
      }));
    });

    // when worker applies to job from another tab, add it to list
    socket.on('jobApplied', ({ job }) => {
      const uid = localStorage.getItem('uid');
      // ensure the applicants contain current user
      const match = job.applicants && job.applicants.some(a => {
        const aid = (a.user?._id || (typeof a.user==='object' && a.user.toString ? a.user.toString() : a.user));
        return aid === uid;
      });
      if (!match) return;
      setJobs(prev => {
        if (prev.some(j => j._id === job._id)) return prev;
        return [...prev, job];
      });
    });
  }, []);

  // refetch messages when messages tab selected
  useEffect(() => {
    if (activeTab==='messages') {
      (async () => {
        try {
          const res = await api.get('/chat');
          setMessages(res.data);
        } catch(err) { console.error(err); }
      })();
    }
  }, [activeTab]);

  const handleAvatarClick = () => setShowAvatarPicker(true);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Preview immediately
    const previewUrl = URL.createObjectURL(file);
    setUser(prev => ({ ...prev, avatar: previewUrl }));
    const uid = localStorage.getItem('uid');
    if(uid) localStorage.setItem(`avatar_${uid}`, previewUrl);
    // Upload to backend (endpoint to implement server-side)
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.post('/auth/avatar', fd);
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResume(file);
  };

  // predefined template avatars
  const templateAvatars = Array.from({ length: 70 }, (_, i) => `https://i.pravatar.cc/140?img=${i + 1}`);
  const selectTemplate = async (url) => {
    const uid = localStorage.getItem('uid');
    if(uid) localStorage.setItem(`avatar_${uid}`, url);
    setUser(prev => ({ ...prev, avatar: url }));
    setShowAvatarPicker(false);
    try {
      await api.post('/auth/avatar', { url });
    } catch (err) { console.error(err); }
  };

  if (!localStorage.getItem('token')) {
    navigate('/login');
    return null;
  }

  if (!user) return <p className="container mt-4">Loading profile...</p>;

  return (
    <div className="container mt-4" style={{ maxWidth: '900px' }}>
      {/* Verify Phone Modal */}
      {verifyModal && (
        <div className="modal d-block" tabIndex="-1" style={{background:'rgba(0,0,0,0.5)'}}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Verify Phone</h5>
              <button type="button" className="btn-close" onClick={()=>{setVerifyModal(false); localStorage.removeItem('pendingPhoneVerify'); setOtp('');}}></button>
            </div>
            <div className="modal-body">
              <p>Enter the 6-digit code sent to {user.phone}</p>
              <input className="form-control" value={otp} maxLength={6} onChange={e=>{ if(/^[0-9]*$/.test(e.target.value)) setOtp(e.target.value); }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>{setVerifyModal(false); localStorage.removeItem('pendingPhoneVerify'); setOtp('');}}>Cancel</button>
              <button className="btn btn-primary" disabled={otp.length!==6} onClick={async()=>{
                try {
                  await api.post('/auth/verify-phone',{ phone: user.phone, code: otp });
                  setUser(prev => ({ ...prev, phoneVerified: true }));
                  setVerifyModal(false);
                  localStorage.setItem('pendingPhoneVerify', 'false');
                  alert('Phone verified successfully!');
                }catch(err){ alert(err.response?.data?.msg || 'Invalid code'); }
              }}>Verify</button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Verify Email Modal */}
      {emailVerifyModal && (
        <div className="modal d-block" tabIndex="-1" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Verify Email</h5>
                <button type="button" className="btn-close" onClick={()=>{setEmailVerifyModal(false); localStorage.removeItem('pendingEmailVerify'); setEmailOtp('');}}></button>
              </div>
              <div className="modal-body">
                <p>Enter the 6-digit code sent to {user.email}</p>
                <input className="form-control" value={emailOtp} maxLength={6} onChange={e=>{ if(/^[0-9]*$/.test(e.target.value)) setEmailOtp(e.target.value); }} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={()=>{setEmailVerifyModal(false); localStorage.removeItem('pendingEmailVerify'); setEmailOtp('');}}>Cancel</button>
                <button className="btn btn-primary" disabled={emailOtp.length!==6} onClick={async()=>{
                  try {
                    await api.post('/auth/verify-email',{ email: user.email, code: emailOtp });
                    setUser(prev => ({ ...prev, emailVerified: true }));
                    setEmailVerifyModal(false);
                    localStorage.setItem('pendingEmailVerify','false');
                    alert('Email verified successfully!');
                  }catch(err){ alert(err.response?.data?.msg || 'Invalid code'); }
                }}>Verify</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="modal d-block" tabIndex="-1" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Choose Avatar</h5>
                <button type="button" className="btn-close" onClick={()=>setShowAvatarPicker(false)}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex flex-wrap gap-2">
                  {templateAvatars.map(url=> (
                    <img key={url} src={url} alt="tpl" className="rounded-circle" style={{width:80,height:80,cursor:'pointer',objectFit:'cover'}} onClick={()=>selectTemplate(url)} onError={e=>{e.currentTarget.style.display='none';}} />
                  ))}
                </div>
                <hr />
                <div className="d-flex flex-column gap-2">
                  <button className="btn btn-outline-primary" onClick={()=>{ setShowAvatarPicker(false); fileInputRef.current?.click(); }}>Upload Custom Image</button>
                  <button className="btn btn-secondary" onClick={()=>setShowAvatarPicker(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="profile-header" data-aos="fade-up">
        <img
          src={user.avatar || `https://i.pravatar.cc/140?u=${user.email}`}
          alt="avatar"
          className="profile-avatar"
          onClick={handleAvatarClick}
          title="Click to change avatar"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <div>
          <h3>{user.username || user.name}</h3>
          <p className="text-muted mb-1">
            {user.email}{' '}
            {user.emailVerified ? (
              <span className="badge bg-success">Verified</span>
            ) : (
              <span className="badge bg-warning text-dark">Unverified</span>
            )}
            {!user.emailVerified && (
              <button
                className="btn btn-sm btn-outline-primary ms-2"
                onClick={async () => {
                  try {
                    await api.post('/auth/email-code', { email: user.email });
                    localStorage.setItem('pendingEmailVerify','true');
                    setEmailOtp('');
                    setEmailVerifyModal(true);
                  } catch (err) {
                    alert(err.response?.data?.msg || 'Verification failed');
                  }
                }}
              >Verify</button>
            )}
          </p>
          <p className="mb-1">Phone: {user.phone}{' '}
            {user.phoneVerified ? (
              <span className="badge bg-success">Verified</span>
            ) : (
              <span className="badge bg-warning text-dark">Unverified</span>
            )}
            {!user.phoneVerified && (
              <button className="btn btn-sm btn-outline-primary ms-2" disabled={sendingCode} onClick={async()=>{
                try {
                  setSendingCode(true);
                  await api.post('/auth/phone-code',{ phone: user.phone });
                  localStorage.setItem('pendingPhoneVerify','true');
                   setVerifyModal(true);
                } catch(err){ alert(err.response?.data?.msg || 'Failed to send code'); }
                finally{ setSendingCode(false); }
              }}>Verify phone</button>) }
          </p>
          <span className="badge bg-primary text-uppercase">{roleDisplay(user.role)}</span>
          <span className="badge bg-secondary ms-2">{user.country || form.country}</span>
          <span className="badge bg-secondary ms-2">{user.currency || form.currency}</span>
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={()=>{
            if(!editMode){
              setForm({
                username:user.username||'',
                firstName:user.firstName||'',
                lastName:user.lastName||'',
                email:user.email||'',
                phone:user.phone||'',
                country:user.country||localStorage.getItem(`country_${user._id||user.id}`)||'',
                currency:user.currency||localStorage.getItem(`currency_${user._id||user.id}`)||getCurrencyOfCountry(user.country)||''
              });
            }
            setEditMode(prev=>!prev);
          }}>{editMode?'Cancel':'Edit'}</button>
        </div>
      </div>

      {/* Editable profile form */}
      {editMode && (
        <form className="mt-3" onSubmit={async e=>{e.preventDefault();try{
          const payload = {};
          Object.keys(form).forEach(k => { if(form[k] !== (user[k] || '')) payload[k]=form[k]; });
          if(Object.keys(payload).length===0){ setEditMode(false); return; }
          const res = await api.patch('/auth/me', payload);
          // Fallback: ensure country/currency updated in client even if backend doesn't return them
          const updatedUser = { ...user, ...res.data, country: form.country, currency: form.currency };
          const uid = res.data._id || res.data.id;
          if (uid) {
            localStorage.setItem(`country_${uid}`, form.country);
            localStorage.setItem(`currency_${uid}`, form.currency);
          }
          setUser(updatedUser);
          setEditMode(false);
        }catch(err){console.error(err);}}}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Username</label>
              <input className="form-control" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">First name</label>
              <input className="form-control" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last name</label>
              <input className="form-control" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" type="tel" pattern="^\+?[0-9]{7,15}$" value={form.phone} onChange={e=>{
                const val=e.target.value;
                if(/^\+?[0-9]*$/.test(val)) setForm({...form, phone:val});
              }} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Country</label>
              <select className="form-select" value={form.country} onChange={e=>{
                    const v = e.target.value;
                    const cur = getCurrencyOfCountry(v);
                    setForm(prev=>({ ...prev, country: v, currency: cur || prev.currency }));
                  }} required>
                <option value="" disabled>Select Country</option>
                {(!countries.includes(form.country) && form.country) && <option value={form.country}>{form.country}</option>}
                {countries.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})} required>
                <option value="" disabled>Select Currency</option>
                {(!currencies.includes(form.currency) && form.currency) && <option value={form.currency}>{form.currency}</option>}
                {currencies.map(c=> <option key={c} value={c}>{`${getCurrencySymbol(c)} ${c}`}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-3">Save</button>
        </form>
      )}

      {/* Resume Upload */}
      {user.role==='worker' && (
        <div className="my-3">
          <h5>Résumé / CV</h5>
          {user.resume ? (
            <p>
              {(() => { const resumeUrl = user.resume.startsWith('http') ? user.resume : api.defaults.baseURL.replace(/\/api$/, '') + user.resume; return (<a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="me-2">View current résumé</a>);})()}
            </p>
          ) : (
            <p className="text-muted">No résumé uploaded.</p>
          )}
          <button className="btn btn-outline-primary" disabled={uploadingResume} onClick={() => resumeInputRef.current?.click()}>
            {user.resume ? 'Replace résumé' : 'Upload résumé'}
          </button>
          {uploadingResume && <span className="ms-2 spinner-border spinner-border-sm"></span>}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            ref={resumeInputRef}
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const fd = new FormData();
              fd.append('resume', file);
              try {
                setUploadingResume(true);
                const res = await api.post('/users/me/resume', fd, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                setUser((prev) => ({ ...prev, resume: res.data.resume }));
                toast.success('Résumé uploaded');
              } catch (err) {
                toast.error(err.response?.data?.msg || 'Failed to upload');
              } finally {
                setUploadingResume(false);
                e.target.value = '';
              }
            }}
          />
        </div>
      )}

      {/* Tabs */}
      <ul className="nav profile-tabs mb-3">
        {(user.role==='worker' || user.role==='employer') && (
         <li className="nav-item">
           <button
             className={`nav-link ${activeTab==='jobs'?'active':''}`}
             onClick={() => setActiveTab('jobs')}
           >{user.role==='employer' ? t('myPosts') : t('appliedJobs')}</button>
         </li>)}
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab==='bookmarks'?'active':''}`}
            onClick={() => setActiveTab('bookmarks')}
          >Bookmarked</button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab==='notifications'?'active':''}`}
            onClick={() => setActiveTab('notifications')}
          >{t('notificationsTab')}</button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab==='messages'?'active':''}`}
            onClick={() => setActiveTab('messages')}
          >{t('messagesTab')}</button>
        </li>
      </ul>

      {/* Tab content */}
      {activeTab==='jobs' && (user.role==='worker' || user.role==='employer') && (
        <div>
          {jobs.map(job => (
            <div key={job._id} className="job-card d-flex justify-content-between align-items-start flex-column flex-md-row">
              <div>
                {(() => {
                  const myUid = (user.id || user._id);
                  const app = job.applicants?.find(a => {
                    const uid = (a.user?._id || (typeof a.user==='object' && a.user.toString ? a.user.toString() : a.user));
                    return uid === myUid;
                  });
                  const s = app?.status || 'pending';
                  const color = s==='accepted'?'success' : s==='rejected'?'danger' : 'secondary';
                  const label = s==='bookmarked' ? 'pending' : s;
                  return (
                    <h5>{job.title} <span className={`badge bg-${color} ms-2 text-capitalize`}>{label}</span></h5>
                  );
                })()} 
                <p className="mb-1">{job.location} • {job.type}</p>
                <small className="text-muted">{new Date(job.createdAt).toLocaleDateString()}</small>
              </div>
              {user.role==='worker' && (<>
                <button className="btn btn-sm btn-outline-danger mt-2 mt-md-0" onClick={async ()=>{
                    try{
                      await api.post(`/jobs/${job._id}/unapply`);
                      setJobs(prev=> prev.filter(j=>j._id!==job._id));
                    }catch(err){ console.error(err); }
                }}>Unapply</button>
                <button className="btn btn-sm btn-outline-primary mt-2 mt-md-0 ms-md-2" onClick={async ()=>{
                     const subject = prompt('Subject for message'); if(subject===null) return;
                      const text = prompt('Message body'); if(!text) return;
                      const receiverId = job.employer ? (job.employer._id || job.employer.id || job.employer) : null;
                      if(!receiverId){ alert('Cannot determine client to message'); return; }
                      try{ const res = await api.post('/chat',{ receiverId, subject, content:text, jobId: job._id }); setMessages(prev=>[...prev, res.data]); }
                    catch(err){ console.error(err); }
                }}>Message</button></>
              )}
            </div>
          ))}
          {jobs.length===0 && <p>No jobs yet.</p>}
        </div>
      )}

      {activeTab==='bookmarks' && (
        <div>
          {bookmarks.map(job => (
            <div key={job._id} className="job-card d-flex justify-content-between align-items-start flex-column flex-md-row">
              <div>
                <h5>{job.title}</h5>
                <p className="mb-1">{job.location} • {job.type}</p>
                <small className="text-muted">{new Date(job.createdAt).toLocaleDateString()}</small>
              </div>
              <button className="btn btn-sm btn-outline-danger mt-2 mt-md-0" onClick={async () => {
                try {
                  await api.delete(`/users/me/bookmarks/${job._id}`);
                  setBookmarks(prev => prev.filter(j => j._id !== job._id));
                } catch(err) { console.error(err); }
              }}>Remove</button>
            </div>
          ))}
          {bookmarks.length === 0 && <p>No bookmarks.</p>}
        </div>
      )}

      {activeTab==='notifications' && (
        <div>
          {notifications.map(n => (
            <div key={n._id} className="notification-item">{n.text}</div>
          ))}
          {notifications.length===0 && <p>No notifications.</p>}
        </div>
      )}

      {activeTab==='messages' && (
        <div>
          {messages.map(m => {
            const senderLabel = m.sender ? ((user && m.sender._id === user.id) ? 'Me' : m.sender.name) : 'Unknown';
            const receiverLabel = m.receiver ? ((user && m.receiver._id === user.id) ? 'Me' : m.receiver.name) : 'Unknown';
            return (
              <div key={m._id} className="message-item"><strong>{senderLabel} → {receiverLabel}: </strong>{m.content}</div>
            );
          })}
          {messages.length===0 && <p>No messages.</p>}
        </div>
      )}

      {/* Danger zone */}
      <hr className="my-4" />
      <button className="btn btn-outline-danger" onClick={() => setShowDelete(true)}>{t('deleteMyAccount')}</button>
      {showDelete && (
        <div className="card card-body mt-3">
          <h5>{t('deleteTitle')}</h5>
          <p className="small text-muted">{t('deleteDescription')}</p>
          <p className="small">{t('deleteConfirmInfo')}</p>
          <input className="form-control mb-3" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="Type here" />
          <button className="btn btn-danger" disabled={deleteConfirm !== 'DELETE MY ACCOUNT'} onClick={handleDeleteAccount}>{t('confirmDelete')}</button>
          <button className="btn btn-secondary ms-2" onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}>{t('cancelBtn')}</button>
        </div>
      )}
    </div>
  );
}

export default Profile;
