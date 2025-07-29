import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { animateJobCardEntrance, jobCardHover, setupJobCardScrollReveal } from '../animations/jobCard';
import { initButtonRipple } from '../animations/buttonRipple';
import useExchangeRates from '../hooks/useExchangeRates';
import { getCurrencySymbol, convertAmount } from '../utils/currency';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';
import useCardStagger from '../hooks/useCardStagger';
import { pulse, confettiBurst } from '../utils/animations';
import api from '../api';
import { socket, connectSocket } from '../socket';
import { currencies } from '../data/options';

function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const publishBtnRef = useRef(null);
  // apply stagger once jobs change length
  useCardStagger('.job-card', [jobs.length]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showApplicantsId, setShowApplicantsId] = useState(null);
  // Holds latest AI suggestion from backend
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [pendingAiJob, setPendingAiJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const uidStored = localStorage.getItem('uid');
  const userCurrencyInit = uidStored ? localStorage.getItem(`currency_${uidStored}`) || 'LKR' : 'LKR';
  const blank = { title:'', description:'', location:'', pay:'', currency:userCurrencyInit, type:'gig', schedule:'' };
  const [form, setForm] = useState(blank);
  const [applied, setApplied] = useState([]);
  const [role, setRole] = useState(null);
  const [userCurrency, setUserCurrency] = useState(userCurrencyInit);
  const { rates, error } = useExchangeRates(userCurrency);
  // Persisted dashboard preferences
  const PREF_KEY = 'dashboardPrefs';
  const savedPrefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
  const savedBookmarks = JSON.parse(localStorage.getItem('bookmarkedJobs') || '[]');
  const savedHidden = JSON.parse(localStorage.getItem('hiddenJobs') || '[]');
  const [expanded, setExpanded] = useState([]); // array of job ids that show details
  const [myId, setMyId] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(savedPrefs.sortBy || 'latest');
  const [typeFilter, setTypeFilter] = useState(savedPrefs.typeFilter || 'all');
  const [remoteOnly, setRemoteOnly] = useState(savedPrefs.remoteOnly ?? false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(savedPrefs.pageSize || 10);
  const [dense, setDense] = useState(savedPrefs.dense || false);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(savedPrefs.bookmarkedOnly || false);
  const [hiddenOnly, setHiddenOnly] = useState(savedPrefs.hiddenOnly || false);
  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ sortBy, typeFilter, remoteOnly, pageSize, dense, bookmarkedOnly, hiddenOnly }));
  }, [sortBy, typeFilter, remoteOnly, pageSize, dense, bookmarkedOnly, hiddenOnly]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(()=> savedHidden);
  const [bookmarkedIds, setBookmarkedIds] = useState(()=> savedBookmarks);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [messageModal, setMessageModal] = useState(null); // {receiverId,name,jobId}
  const [alerts, setAlerts] = useState([]);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const filteredJobs = useMemo(() => {
    let res = jobs;
    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      res = res.filter(j =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q)) ||
        (j.description && j.description.toLowerCase().includes(q))
      );
    }
    // Type filter
    if (typeFilter !== 'all') {
      res = res.filter(j => j.type === typeFilter);
    }
    // Remote filter
    if (remoteOnly) {
      res = res.filter(j => (j.location || '').toLowerCase().includes('remote'));
    }
    // Hidden
    if (hiddenOnly) {
       res = res.filter(j => hiddenIds.includes(j._id));
     } else if (hiddenIds.length) {
       res = res.filter(j => !hiddenIds.includes(j._id));
     }
    if (bookmarkedOnly) {
      res = res.filter(j => bookmarkedIds.includes(j._id));
    }
    return res;
  }, [jobs, search, typeFilter, remoteOnly, hiddenIds, hiddenOnly, bookmarkedOnly, bookmarkedIds]);

  const sortedJobs = useMemo(() => {
    const arr = [...filteredJobs];
    switch (sortBy) {
      case 'payHigh':
        arr.sort((a,b)=> ((b.pay || 0) - (a.pay || 0))); break;
      case 'payLow':
        arr.sort((a,b)=> ((a.pay || 0) - (b.pay || 0))); break;
      case 'titleAZ':
        arr.sort((a,b)=> (a.title || '').localeCompare(b.title || '')); break;
      case 'titleZA':
        arr.sort((a,b)=> (b.title || '').localeCompare(a.title || '')); break;
      case 'employerAZ':
        arr.sort((a,b)=> ((a.employer?.name || '').localeCompare(b.employer?.name || ''))); break;
      case 'employerZA':
        arr.sort((a,b)=> ((b.employer?.name || '').localeCompare(a.employer?.name || ''))); break;
      case 'oldest':
        arr.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt)); break;
      default: // latest
        arr.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    }
    return arr;
  }, [filteredJobs, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize)); // still used for optional display
  const currentJobs = useMemo(() => sortedJobs.slice((page - 1) * pageSize, page * pageSize), [sortedJobs, page, pageSize]);
  const totalResults = sortedJobs.length;

  // init button ripple once
  useEffect(() => { initButtonRipple(); }, []);

  // animate cards on change
  useEffect(() => {
    animateJobCardEntrance();
    setupJobCardScrollReveal();
  }, [currentJobs]);
  const startIndex = Math.min((page - 1) * pageSize + 1, totalResults);
  const endIndex = Math.min(page * pageSize, totalResults);
  const sentinelRef = useRef(null);

  const loadMore = useCallback(() => {
    // Don’t append while overlay (applicants or message modal) is open – prevents rapid re-mount blink.
    if (showApplicantsModal || messageModal) return;
    setPage(p => (p * pageSize < sortedJobs.length ? p + 1 : p));
  }, [showApplicantsModal, messageModal, sortedJobs.length, pageSize]);

  useEffect(() => {
    if(showApplicantsModal || messageModal || !sentinelRef.current) return; // nothing to watch
    const observer = new IntersectionObserver(entries => {
      if(entries[0].isIntersecting){
        loadMore();
      }
    }, { threshold: 1 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, showApplicantsModal, messageModal, sentinelRef.current]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, remoteOnly, sortBy, pageSize, dense, hiddenIds, hiddenOnly, bookmarkedOnly]);

  

  

  // initial load
  useEffect(() => {
    const init = async () => {
      try {
        const me = await api.get('/auth/me');
        setUser(me.data);
        setRole(me.data.role);
        setUserCurrency(me.data.currency || localStorage.getItem(`currency_${me.data.id}`) || 'LKR');
    setMyId(me.data.id);
        localStorage.setItem('uid', me.data.id);
        const uid = me.data.id;
        let jobsData = [];
        if (me.data.role === 'employer') {
          const res = await api.get('/jobs');
          jobsData = res.data;
        } else {
          const res = await api.get('/jobs');
          jobsData = res.data;
          const appliedIds = jobsData.filter(j => j.applicants && j.applicants.some(a => (a.user?._id || a.user) === uid)).map(j=>j._id);
          setApplied(appliedIds);
        }
        setJobs(jobsData);
      } catch (err) {
        console.error(err);
      }
    };
    init();
    // socket connection
    connectSocket();
    socket.off('newJob');
    socket.off('newApplicant');
    socket.off('jobUpdated');
    socket.off('jobDeleted');
    socket.on('newJob', ({ job }) => {
       if(role==='worker' && job.status!=='approved') return;
       if(role==='employer' && job.employer?._id!==myId && job.status!=='approved') return;
       setJobs(prev => [{ ...job }, ...prev]);
      if (role !== 'employer') {
        toast.info(`New job posted: ${job.title}`);
        setAlerts(prev=>[...prev,{id:Date.now(),text:`New job posted: ${job.title}`,variant:'info'}]);
      }
    });

    // update or add job when admin modifies it
    socket.on('jobUpdated', ({ jobId, job }) => {
      setJobs(prev => {
        const idx = prev.findIndex(j => j._id === jobId);
        if (['rejected','suspended'].includes(job.status)) {
          return prev.filter(j => j._id !== jobId);
        }
        if (idx !== -1) {
          const arr = [...prev]; arr[idx] = job; return arr;
        }
        // newly approved add
        return [job, ...prev];
      });
    });

    socket.on('jobDeleted', ({ jobId, jobTitle }) => {
      setJobs(prev => prev.filter(j => j._id !== jobId));
      toast.info(`Job removed${jobTitle ? ': ' + jobTitle : ''}`);
    });

  }, []); // runs once

  // socket listeners depending on role and myId
  useEffect(() => {
    if(!socket || !socket.connected){ connectSocket(); }
    socket.off('newJob');
    socket.off('jobUpdated');
    socket.off('jobDeleted');

    socket.on('newJob', ({ job }) => {
      if(role==='worker' && job.status!=='approved') return;
      if(role==='employer' && job.employer?._id!==myId && job.status!=='approved') return;
      setJobs(prev => [{ ...job }, ...prev]);
    });
    socket.on('jobUpdated', ({ jobId, job }) => {
      setJobs(prev => {
        const idx = prev.findIndex(j => j._id === jobId);
        if (['rejected','suspended'].includes(job.status)) return prev.filter(j=>j._id!==jobId);
        if(idx!==-1){ const arr=[...prev]; arr[idx]=job; return arr; }
        if(job.status==='approved') return [job, ...prev];
        return prev;
      });
    });
    socket.on('jobDeleted', ({ jobId, jobTitle }) => {
      setJobs(prev => prev.filter(j => j._id !== jobId));
      toast.info(`Job removed${jobTitle ? ': ' + jobTitle : ''}`);
    });
  }, [role, myId]);

  useEffect(() => {
      const prev = JSON.parse(localStorage.getItem('bookmarkedJobs') || '[]');
    if(bookmarkedIds!==prev){
      localStorage.setItem('bookmarkedJobs', JSON.stringify(bookmarkedIds));
    }
    // Sync with backend
    const added = bookmarkedIds.filter(id=> !prev.includes(id));
    const removed = prev.filter(id=> !bookmarkedIds.includes(id));
    added.forEach(id=> api.put(`/users/me/bookmarks/${id}`).catch(()=>{}));
    removed.forEach(id=> api.delete(`/users/me/bookmarks/${id}`).catch(()=>{}));
  }, [bookmarkedIds]);
  useEffect(()=>{ localStorage.setItem('hiddenJobs', JSON.stringify(hiddenIds)); }, [hiddenIds]);

  const handleBulkApply = async () => {
    const targets = selectedIds.filter(id=> !applied.includes(id));
    if(targets.length===0){ toast.info('Already applied'); return; }
    for(const id of targets){
      try{
        await api.post(`/jobs/${id}/apply`);
        setApplied(prev=>[...prev,id]);
      }catch(err){ toast.error(err.response?.data?.msg||'Apply failed'); }
    }
    setSelectedIds([]);
  };
  const handleBulkBookmark = () => {
    setBookmarkedIds(prev=> Array.from(new Set([...prev, ...selectedIds])));
    toast.success('Bookmarked');
    setSelectedIds([]);
  };
  const handleBulkHide = () => {
    setHiddenIds(prev=> Array.from(new Set([...prev, ...selectedIds])));
    toast.info('Hidden');
    setSelectedIds([]);
  };
  const handleBulkUnhide = () => {
    setHiddenIds(prev => prev.filter(id => !selectedIds.includes(id)));
    toast.success('Unhidden');
    setSelectedIds([]);
  };

  return (
    <>
    {alerts.map(a=> (
        <div key={a.id} className={`alert alert-${a.variant} alert-dismissible fade show m-3`} role="alert">
          {a.text}
          <button type="button" className="btn-close" onClick={()=>setAlerts(prev=>prev.filter(x=>x.id!==a.id))}></button>
        </div>
      ))}
      <div className="container mt-4">
      <h2>{t('dashboard')}</h2>
      {role === 'employer' && (
        <>
          <button className="btn btn-primary mb-3" onClick={() => { setForm(prev=>({ ...prev, currency: userCurrency })); setShowForm(prev=>!prev); }}>
            {showForm ? t('cancel') : t('postJob')}
          </button>
          {user && !user.emailVerified && !user.phoneVerified && (
        <div className="alert alert-warning">Verify your email or phone to post or apply for jobs.</div>
      )}
      {showForm && (
            <form className="card card-body mb-4" onSubmit={async e => {
              e.preventDefault();
              try {
                const res = await api.post('/jobs', { ...form, pay: Number(form.pay) });
                const { job: newJob, aiSuggestion } = res.data;
                setJobs(prev => [{ ...newJob, currency: newJob.currency || form.currency }, ...prev]);
                if (aiSuggestion) {
                  setPendingAiJob(newJob);
                  // Delay showing AI suggestion modal so the publish button pulse is visible
                  setTimeout(() => setAiSuggestion(aiSuggestion), 400);
                }
                toast.success('Job posted');
                setShowForm(false);
                setForm(blank);
              } catch (err) {
                toast.error(err.response?.data?.msg || 'Failed to post job');
              }
            }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <input className="form-control" placeholder={t('title')} value={form.title} onChange={e => setForm({ ...form, title:e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <input className="form-control" placeholder={t('location')} value={form.location} onChange={e => setForm({ ...form, location:e.target.value })} required />
                </div>
                <div className="col-12">
                  <textarea className="form-control" placeholder={t('description')} value={form.description} onChange={e => setForm({ ...form, description:e.target.value })} required />
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})}>
                    {currencies.map(c => <option key={c} value={c}>{c} ({getCurrencySymbol(c)})</option>)}



                  </select>
                </div>
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text">{getCurrencySymbol(form.currency)}</span>
                    <input type="number" min="0" className="form-control" placeholder={t('pay')} value={form.pay} onChange={e => { const v=e.target.value; setForm({ ...form, pay: v === '' ? '' : Math.max(0, Number(v)) }); }} required />
                  </div>
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type:e.target.value })}>
                    <option value="full-time">{t('fullTime')}</option>
                    <option value="part-time">{t('partTime')}</option>
                    <option value="freelance">{t('freelance')}</option>
                    <option value="gig">{t('gig')}</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <input className="form-control" placeholder={`${t('schedule')} (${t('optional') || 'optional'})`} value={form.schedule} onChange={e => setForm({ ...form, schedule:e.target.value })} />
                </div>
              </div>
              <button type="submit" ref={publishBtnRef} onClick={() => pulse(publishBtnRef.current)} className="btn btn-success mt-3 w-100" disabled={!user || (!user.emailVerified && !user.phoneVerified)}>{t('publish')}</button>
            </form>
          )}
        </>
      )}
      {/* Search */}
      <div className="d-flex flex-wrap gap-2 mb-3" style={{maxWidth:'900px'}}>
        <div className="input-group" style={{minWidth:'250px'}}>
          <input type="text" className="form-control" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('searchJobs')} />
          {search ? (
            <button className="btn btn-outline-secondary" onClick={()=>setSearch('')}>{t('clear')}</button>
          ) : (
            <span className="input-group-text">{t('search')}</span>
          )}
        </div>
        <select className="form-select" style={{maxWidth:'200px'}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="latest">{t('latest')}</option>
          <option value="oldest">{t('oldest')}</option>
          <option value="payHigh">{t('payHigh')}</option>
          <option value="payLow">{t('payLow')}</option>
          <option value="titleAZ">Title A→Z</option>
          <option value="titleZA">Title Z→A</option>
          <option value="employerAZ">Client A→Z</option>
          <option value="employerZA">Client Z→A</option>
        </select>
        <select className="form-select" style={{maxWidth:'200px'}} value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="full-time">{t('fullTime')}</option>
          <option value="part-time">{t('partTime')}</option>
          <option value="freelance">{t('freelance')}</option>
          <option value="gig">{t('gig')}</option>
                    <option value="online">Online</option>
        </select>
        <button className={`btn btn-${bookmarkedOnly ? 'warning' : 'outline-warning'} ms-2`} onClick={() => setBookmarkedOnly(prev => !prev)}>
          {bookmarkedOnly ? 'All Jobs' : 'Bookmarked'}
        </button>
        <button className={`btn btn-${hiddenOnly ? 'danger' : 'outline-danger'} ms-2`} onClick={() => setHiddenOnly(prev => !prev)}>
          {hiddenOnly ? 'All Jobs' : 'Hidden'}
        </button>
        <div className="form-check d-flex align-items-center">
          <input className="form-check-input" type="checkbox" id="remoteOnly" checked={remoteOnly} onChange={e=>setRemoteOnly(e.target.checked)} />
          <label className="form-check-label ms-1" htmlFor="remoteOnly">Remote</label>
        </div>
        
        <select className="form-select" style={{maxWidth:'120px'}} value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}>
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <div className="form-check d-flex align-items-center">
          <input className="form-check-input" type="checkbox" id="densityToggle" checked={dense} onChange={e=>setDense(e.target.checked)} />
          <label className="form-check-label ms-1" htmlFor="densityToggle">Compact</label>
        </div>
      </div>
      {selectedIds.length>0 && (
        <div className="alert alert-info d-flex flex-wrap gap-2 align-items-center">
          <strong>{selectedIds.length} selected</strong>
          {role === 'worker' && <button className="btn btn-sm btn-primary" onClick={handleBulkApply}>Apply</button>}
          <button className="btn btn-sm btn-outline-secondary" onClick={handleBulkBookmark}>Bookmark</button>
          <button className="btn btn-sm btn-outline-danger" onClick={handleBulkHide}>Hide</button>
          <button className="btn btn-sm btn-outline-success" onClick={handleBulkUnhide}>Unhide</button>
          <button className="btn btn-sm btn-link" onClick={()=>setSelectedIds([])}>Clear</button>
        </div>
      )}
      {sortedJobs.length === 0 ? (
        <p>{t('noJobs')}</p>
      ) : (
        <ul className="list-unstyled row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {currentJobs.map((job) => (
            <li key={job._id} tabIndex="0" className={`col job-card card h-100 ${dense ? 'compact ' : ''}job-type-${job.type}`} onMouseEnter={e=>jobCardHover(true, e.currentTarget)} onMouseLeave={e=>jobCardHover(false, e.currentTarget)}>
              <div className="card-body w-100 d-flex flex-column align-items-center text-center">
                <h5 className="mb-1 d-flex align-items-center gap-2">
                      <input type="checkbox" className="form-check-input me-2" checked={selectedIds.includes(job._id)} onChange={e=>setSelectedIds(prev=> e.target.checked ? [...prev, job._id] : prev.filter(id=>id!==job._id))} />
                  {job.title}
                </h5>
                <div className="mb-2">
                  {(() => {
                    const needsConv = job.currency && job.currency !== userCurrency && rates;
                    const converted = needsConv ? convertAmount(job.pay, job.currency, userCurrency, rates).toFixed(2) : null;
                    const original = `${getCurrencySymbol(job.currency || userCurrency)} ${job.pay.toFixed ? job.pay.toFixed(2) : job.pay}`;
                    const convPart = needsConv ? ` = ${getCurrencySymbol(userCurrency)} ${converted}` : '';
                    const payClr = (() => { const v = converted ? Number(converted) : (job.pay || 0); if(v <= 500) return 'danger'; if(v <= 1500) return 'warning'; return 'success';})();
                    return <span className={`badge bg-${payClr} fw-normal`}>{original}{convPart}</span>;
                  })()}
                </div>
                <div className="text-muted small">
                  {job.location} • {job.type}
                  {job.location && job.location.toLowerCase().includes('remote') && (
                    <span className="badge bg-info text-dark ms-1">Remote</span>
                  )}
                  {/* Status badge visible to job owner (client) */}
                  {(() => {
                    if (role === 'employer' && (job.employer && ((job.employer._id || job.employer) === myId))) {
                      const status = job.status || 'pending';
                      const clr = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : status === 'suspended' ? 'warning' : 'secondary';
                      return <span className={`badge bg-${clr} ms-1 text-uppercase`}>{status}</span>;
                    }
                    return null;
                  })()}
                  {(() => {
                    const posted = (Date.now() - new Date(job.createdAt)) / 86400000;
                    return posted < 2 ? <span className="badge bg-danger ms-1">Urgent</span> : null;
                  })()}
                  <br />
                  • Posted by {job.employer && job.employer.name ? job.employer.name : 'Unknown'}
                  {job.employer && ((job.employer._id || job.employer) === myId) ? ' (me)' : ''}
                </div>
              </div>
              {expanded.includes(job._id) && (
                <div className="card card-body bg-light mt-3 w-100">
                  <p className="mb-2"><strong>Description</strong><br />{job.description}</p>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {(() => {
                         const displayPay = job.currency ? (job.currency===userCurrency ? job.pay : convertAmount(job.pay, job.currency, userCurrency, rates)) : job.pay;
                         const display = displayPay ? displayPay.toFixed(2) : job.pay;
                         const originalPart = `${getCurrencySymbol(job.currency || userCurrency)} ${job.pay.toFixed ? job.pay.toFixed(2) : job.pay}`;
                         const convertedPart = job.currency && job.currency !== userCurrency && rates ? ` = ${getCurrencySymbol(userCurrency)} ${display}` : '';
                         const payClr = (() => { const v = display; if(v <= 500) return 'danger'; if(v <= 1500) return 'warning'; return 'success';})();
                             return (
                               <>
                                 <span className={`badge bg-${payClr}`}>Pay: {originalPart}{convertedPart}</span>
                                 {job.location && job.location.toLowerCase().includes('remote') && <span className="badge bg-info text-dark">Remote</span>}
                                 {(() => { const posted = (Date.now()-new Date(job.createdAt)) / 86400000; return posted<2 ? <span className="badge bg-danger">Urgent</span> : null; })()}
                               </>
                             );
                       })()}
                    {job.schedule && <span className="badge bg-secondary">Schedule: {job.schedule}</span>}
                    <span className="badge bg-light text-dark border">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  {job.employer && (
                    <p className="mb-0"><strong>Contact:</strong> <a href={`mailto:${job.employer.email}`}>{job.employer.email}</a>{job.employer.phone ? ` • ${job.employer.phone}` : ''}</p>
                  )}
                </div>
               )}

               <div className="mt-auto d-flex flex-column align-items-center gap-2 w-100">
                  <button className="btn btn-sm btn-outline-secondary" onClick={()=>{
                    setExpanded(prev=> prev.includes(job._id) ? prev.filter(id=>id!==job._id) : [...prev, job._id]);
                  }}>{expanded.includes(job._id) ? t('hide') : t('details')}</button>
                </div>

                {role === 'worker' && (
                <button
                  className={`btn btn-sm mt-2 mt-md-0 ${applied.includes(job._id) ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                  onClick={async () => {
                    try {
                      if (applied.includes(job._id)) {
                        await api.post(`/jobs/${job._id}/unapply`);
                        setApplied(prev => prev.filter(id => id !== job._id));
                        toast.info('Application withdrawn');
                      } else {
                        const msg = window.prompt('Optional message to client (leave blank for none):','');
                        await api.post(`/jobs/${job._id}/apply`, { message: msg });
                        setApplied(prev => [...prev, job._id]);
                        toast.success('Applied!');
                      }
                    } catch (err) {
                      toast.error(err.response?.data?.msg || 'Action failed');
                    }
                  }}
                >
                  {applied.includes(job._id) ? 'Unapply' : 'Apply'}
                </button>
              )}
              {role === 'employer' && (job.employer && ((job.employer._id || job.employer) === myId)) && (
                <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                  <button className="btn btn-sm btn-outline-info" onClick={async ()=>{
                      try {
                         const res = await api.get(`/jobs/${job._id}/applicants`);
                         setApplicants(res.data);
                         setShowApplicantsId(job._id);
                         setShowApplicantsModal(true);
                       } catch(err) { toast.error(err.response?.data?.msg || 'Failed to fetch'); }
                  }}>Applicants</button>
                  <span className="badge bg-primary rounded-pill">{job.type}</span>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditingId(job._id); setForm({ title: job.title, description: job.description, location: job.location, pay: job.pay, currency: job.currency || userCurrency, type: job.type, schedule: job.schedule || '' }); }}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={async () => {
                    if (!window.confirm('Delete this job?')) return;
                    try {
                      await api.delete(`/jobs/${job._id}`);
                      setJobs(prev => prev.filter(j => j._id !== job._id));
                      toast.success('Job deleted');
                    } catch (err) {
                      toast.error(err.response?.data?.msg || 'Delete failed');
                    }
                  }}>Delete</button>
                </div>
              )}
              {editingId === job._id && (
                <form className="card card-body mt-2 w-100" onSubmit={async e => {
                  e.preventDefault();
                  try {
                    const res = await api.put(`/jobs/${job._id}`, { ...form, pay: Number(form.pay), currency: form.currency });
                    setJobs(prev => prev.map(j => j._id===job._id ? { ...res.data, currency: res.data.currency || form.currency } : j));
                    setEditingId(null); setForm(blank);
                    toast.success('Job updated');
                  } catch (err) {
                    toast.error(err.response?.data?.msg || 'Update failed');
                  }
                }}>
                  <div className="row g-2">
                    <div className="col-md-4"><input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder={t('title')} required /></div>
                    <div className="col-md-4"><input className="form-control" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder={t('location')} required /></div>
                    <div className="col-md-4"><select className="form-select" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})}>{currencies.map(c => <option key={c} value={c}>{c} ({getCurrencySymbol(c)})</option>)}</select></div><div className="col-md-4"><div className="input-group"><span className="input-group-text">{getCurrencySymbol(form.currency)}</span><input type="number" min="0" step="0.01" className="form-control" value={form.pay} onChange={e => { const v = e.target.value; setForm({ ...form, pay: v === '' ? '' : Math.max(0, Number(v)) }); }} placeholder={t('pay')} required /></div></div>
                    <div className="col-md-4"><select className="form-select" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})}>{currencies.map(c => <option key={c} value={c}>{c} ({getCurrencySymbol(c)})</option>)}</select></div>
                    <div className="col-12"><textarea className="form-control" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder={t('description')} required /></div>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <button type="submit" className="btn btn-success btn-sm">Save</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={()=>{setEditingId(null);setForm(blank);}}>Cancel</button>
                  </div>
                </form>
              )}
              {showApplicantsModal && showApplicantsId===job._id && (
                <Modal title={`Applicants for ${job.title}`} onClose={() => setShowApplicantsModal(false)}>
                  {applicants.length === 0 ? (
                     <div className="alert alert-info text-center">No applicants yet.</div>
                   ) : (
                     <ul className="list-group w-100 mt-2">
                       {applicants.map(a => (
                         <li key={a._id} tabIndex="0" className={`col job-card card h-100 ${dense ? 'compact ' : ''}job-type-${job.type} d-flex flex-column`}>
                           <div className="d-flex justify-content-between align-items-center w-100"><span>{a.user?.name || a.user?.email}</span><span className={`badge bg-${a.status==='pending'?'secondary':a.status==='accepted'?'success':a.status==='rejected'?'danger':'info'}`}>{a.status}</span></div>
                           {a.message && <div className="mt-1"><strong>Message:</strong> {a.message}</div>}
                            {a.user?.resume && (
                                <div className="mt-1">
                                  {(() => {
                                    const base = api.defaults.baseURL?.replace(/\/api$/, '') || '';
                                    const url = a.user.resume.startsWith('http') ? a.user.resume : base + a.user.resume;
                                    return (
                                      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">View Résumé</a>
                                    );
                                  })()}
                                </div>
                              )}
                           <div className="d-flex gap-1 mt-2">
                              <button className="btn btn-sm btn-outline-success" onClick={async()=>{
                                try { 
                                  const msg = window.prompt('Optional message to applicant (leave blank for none):','');
                                  await api.put(`/jobs/${job._id}/applicants/${a._id}`, { status: 'accepted', message: msg });
                                  toast.success('Accepted');
                                   confettiBurst(); 
                                  setApplicants(prev=>prev.map(p=>p._id===a._id?{...p,status:'accepted'}:p)); 
                                } catch(err){toast.error(err.response?.data?.msg||'Err');}
                              }}>Accept</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={async()=>{
                                try { 
                                  const msg = window.prompt('Optional message to applicant (leave blank for none):','');
                                  await api.put(`/jobs/${job._id}/applicants/${a._id}`, { status: 'rejected', message: msg });
                                  toast.info('Rejected'); 
                                  setApplicants(prev=>prev.map(p=>p._id===a._id?{...p,status:'rejected'}:p)); 
                                } catch(err){toast.error(err.response?.data?.msg||'Err');}
                              }}>Reject</button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={async()=>{
                                try { 
                                  const msg = window.prompt('Optional message to applicant (leave blank for none):','');
                                  await api.put(`/jobs/${job._id}/applicants/${a._id}`, { status: 'bookmarked', message: msg });
                                  toast.info('Bookmarked'); 
                                  setApplicants(prev=>prev.map(p=>p._id===a._id?{...p,status:'bookmarked'}:p)); 
                                } catch(err){toast.error(err.response?.data?.msg||'Err');}
                              }}>Bookmark</button>
                              <button className="btn btn-sm btn-outline-primary"
                                disabled={!user || (!user.emailVerified && !user.phoneVerified)}
                                onClick={() => navigate(`/chat?user=${a.user?._id}&job=${job._id}`)}
                              >Chat</button>
                            </div>
                         </li>
                       ))}
                     </ul>
                   )}
                </Modal>
              )}
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3">
          <span className="small text-muted mb-2 mb-md-0">
            Showing {startIndex}-{endIndex} of {totalResults}
          </span>
          <nav>
            <ul className="pagination mb-0">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>&laquo;</button>
              </li>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <li key={idx} className={`page-item ${page === idx + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setPage(idx + 1)}>{idx + 1}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>&raquo;</button>
              </li>
            </ul>
          </nav>
</div>
      )}
      {aiSuggestion && (
        <Modal title="AI Suggestions" onClose={() => setAiSuggestion(null)}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Improved Description</label>
            <textarea className="form-control" rows="6" value={aiSuggestion.improvedDescription || ''} readOnly />
            <button className="btn btn-secondary mt-2 me-2" onClick={() => { setAiSuggestion(null); toast.info('Kept original description'); }}>Keep Original</button>
            <button className="btn btn-outline-primary mt-2" onClick={async () => {
              try {
                if (pendingAiJob) {
                  await api.put(`/jobs/${pendingAiJob._id}`, { description: aiSuggestion.improvedDescription });
                  setJobs(prev => prev.map(j => j._id === pendingAiJob._id ? { ...j, description: aiSuggestion.improvedDescription } : j));
                }
                setAiSuggestion(null);
                toast.success('Job updated with AI description');
              } catch (err) {
                toast.error(err.response?.data?.msg || 'Update failed');
              }
            }}>Use This Description</button>
          </div>
          {aiSuggestion.missingFields && aiSuggestion.missingFields.length > 0 && (
            <div className="mt-3">
              <h6>Possible Missing Fields</h6>
              <ul>
                {aiSuggestion.missingFields.map(f => <li key={f}>{f}</li>)}
              </ul>
              <button className="btn btn-primary mt-2" onClick={() => {
                if (pendingAiJob) {
                  setEditingId(pendingAiJob._id);
                  setForm({ title: pendingAiJob.title, description: pendingAiJob.description, location: pendingAiJob.location, pay: pendingAiJob.pay, currency: pendingAiJob.currency || userCurrency, type: pendingAiJob.type, schedule: pendingAiJob.schedule || '' });
                }
                setAiSuggestion(null);
              }}>Edit Job to Add Details</button>
            </div>
          )}
        </Modal>
      )}

      {messageModal && (
        <Modal title={`Message to ${messageModal.name}`} onClose={() => setMessageModal(null)}>
          <form
            onSubmit={async e => {
              e.preventDefault();
              try {
                await api.post('/chat', {
                  receiverId: messageModal.receiverId,
                  subject: msgSubject,
                  content: msgContent,
                  jobId: messageModal.jobId,
                });
                toast.success('Message sent');
                setMessageModal(null);
              } catch (err) {
                toast.error(err.response?.data?.msg || 'Send failed');
              }
            }}
          >
            <div className="mb-3">
              <label className="form-label">Subject</label>
              <input
                className="form-control"
                value={msgSubject}
                onMouseEnter={e => jobCardHover(true, e.currentTarget)}
                onMouseLeave={e => jobCardHover(false, e.currentTarget)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Message</label>
              <textarea
                className="form-control"
                rows="4"
                value={msgContent}
                onChange={e => setMsgContent(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">Send</button>
              <button type="button" className="btn btn-secondary" onClick={() => setMessageModal(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
    </>
   );
}

export default Dashboard;
