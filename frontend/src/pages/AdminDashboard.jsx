import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import roleDisplay from '../utils/roleDisplay';
import { socket, connectSocket } from '../socket';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  // Determine current admin id
  let currentId = localStorage.getItem('userId');
  if (!currentId && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentId = payload.id;
    } catch(e) { /* ignore */ }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to load users');
      } finally {
        setLoading(false);
        // fetch jobs after users so token confirmed
        try {
          const resJ = await api.get('/admin/jobs', { headers: { Authorization: `Bearer ${token}` } });
          setJobs(resJ.data);
        } catch(err){ console.error(err);}
      }
    };
    fetchUsers();
    connectSocket();
    socket.off('newJob');
    socket.off('jobUpdated');
    socket.off('jobDeleted');
    socket.off('bulkJobsUpdated');
    socket.off('bulkJobsDeleted');
    socket.on('newJob', ({ job }) => {
      setJobs(prev => [job, ...prev]);
    });
    socket.on('jobUpdated', ({ jobId, job }) => {
      setJobs(prev => prev.map(j => j._id === jobId ? job : j));
    });
    socket.on('jobDeleted', ({ jobId, jobTitle }) => {
       setJobs(prev => prev.filter(j => j._id !== jobId));
       toast.info(`Job deleted${jobTitle ? ': '+jobTitle : ''}`);
     });
    socket.on('bulkJobsUpdated', ({ ids, update }) => {
      setJobs(prev => prev.map(j => ids.includes(j._id) ? { ...j, ...update } : j));
    });
    socket.on('bulkJobsDeleted', ({ ids }) => {
      setJobs(prev => prev.filter(j => !ids.includes(j._id)));
    });
  }, [token]);

  const deleteUser = async (id) => {
    const isSelf = currentId && String(id) === String(currentId);
        if (isSelf) {
      const selfText = prompt("Type 'Delete My Account' to confirm.");
      if (selfText !== 'Delete My Account') return;
    } else {
      const confirmText = prompt("Type 'OkAy' to confirm deletion of this user.");
      if (confirmText !== 'OkAy') return;
    }
    // confirmation handled above
    try {
      await api.delete(`/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  // Job action helpers
  const jobAction = async (id, action) => {
    try {
      const auth = { headers: { Authorization: `Bearer ${token}` } };
      if (action === 'delete') {
        await api.delete(`/admin/jobs/${id}`, auth);
        setJobs(prev => prev.filter(j => j._id !== id));
      } else {
        const res = await api.put(`/admin/jobs/${id}/${action}`, {}, auth);
        const job = res.data.job || null;
        setJobs(prev => prev.map(j => j._id === id ? (job ? job : j) : j));
      }
    } catch(err){ console.error(err); alert('Action failed'); }
  };

  if (loading) return <p className="mt-5 text-center">Loading...</p>;

  return (
    <div className="container mt-4">
      <h2 className="h4 mb-3">Admin Dashboard</h2>
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item"><button className={`nav-link ${tab==='users'?'active':''}`} onClick={()=>setTab('users')}>Users</button></li>
        <li className="nav-item"><button className={`nav-link ${tab==='jobs'?'active':''}`} onClick={()=>setTab('jobs')}>Gigs</button></li>
      </ul>

      {tab==='users' && (
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u._id}</td>
              <td>{u.name}</td>
              <td>{u.email}{u._id === currentId ? ' (me)' : ''}</td>
              <td>{roleDisplay(u.role)}</td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      {tab==='jobs' && (
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Employer</th>
            <th>Status</th>
            <th>Featured</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(j => (
            <tr key={j._id}>
              <td>{j._id}</td>
              <td>{j.title}</td>
              <td>{j.employer?.name || '—'}</td>
              <td>{j.status}</td>
              <td>{j.featured ? '★' : ''}</td>
              <td>
                {j.status !== 'approved' && <button className="btn btn-sm btn-success me-1" onClick={() => jobAction(j._id,'approve')}>Approve</button>}
                {j.status !== 'rejected' && <button className="btn btn-sm btn-warning me-1" onClick={() => jobAction(j._id,'reject')}>Reject</button>}
                {j.status !== 'suspended' && <button className="btn btn-sm btn-secondary me-1" onClick={() => jobAction(j._id,'suspend')}>Suspend</button>}
                {j.status === 'suspended' && <button className="btn btn-sm btn-info me-1" onClick={() => jobAction(j._id,'unsuspend')}>Unsuspend</button>}
                {j.featured ? <button className="btn btn-sm btn-outline-primary me-1" onClick={() => jobAction(j._id,'unfeature')}>Unfeature</button> : <button className="btn btn-sm btn-primary me-1" onClick={() => jobAction(j._id,'feature')}>Feature</button>}
                <button className="btn btn-sm btn-danger" onClick={() => jobAction(j._id,'delete')}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

export default AdminDashboard;
