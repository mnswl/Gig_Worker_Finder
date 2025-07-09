import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecret: '',
  });
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const { confirmPassword, ...data } = form;
      const res = await api.post('/auth/register-admin', data);
      // Store token, redirect to dashboard
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'admin');
      localStorage.setItem('userId', res.data.user.id);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="container mt-5" style={{maxWidth: '500px'}}>
      <h2 className="h4 mb-3 text-center">Admin Registration</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="form-label">First Name</label>
          <input type="text" name="firstName" className="form-control" value={form.firstName} onChange={handleChange} required />
        </div>
        <div className="mb-2">
          <label className="form-label">Last Name</label>
          <input type="text" name="lastName" className="form-control" value={form.lastName} onChange={handleChange} required />
        </div>
        <div className="mb-2">
          <label className="form-label">Username</label>
          <input type="text" name="username" className="form-control" value={form.username} onChange={handleChange} required />
        </div>
        <div className="mb-2">
          <label className="form-label">Email</label>
          <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
        </div>
        <div className="mb-2">
          <label className="form-label">Password</label>
          <div className="input-group">
            <input type={showPwd ? 'text' : 'password'} name="password" className="form-control" value={form.password} onChange={handleChange} required />
            <button type="button" className="btn btn-outline-secondary" tabIndex="-1" onClick={() => setShowPwd(p=>!p)}>
              {showPwd ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        <div className="mb-2">
          <label className="form-label">Confirm Password</label>
          <div className="input-group">
            <input type={showConfPwd ? 'text' : 'password'} name="confirmPassword" className="form-control" value={form.confirmPassword} onChange={handleChange} required />
            <button type="button" className="btn btn-outline-secondary" tabIndex="-1" onClick={() => setShowConfPwd(p=>!p)}>
              {showConfPwd ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Admin Secret</label>
          <input type="password" name="adminSecret" className="form-control" value={form.adminSecret} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary w-100">Register Admin</button>
      </form>
      <p className="mt-3 text-center">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default AdminRegister;
