import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function TwoFactor() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [msg, setMsg] = useState('');

  // Enter key behavior
  useEffect(()=>{
    const onKey=(e)=>{
      if(e.key!=='Enter') return;
      if(!phoneSent){
        if(phone) sendPhoneCode();
      } else if(phoneSent && !phoneVerified){
        if(phoneCode.length===6) verifyPhone();
      }
    };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [phone, phoneSent, phoneCode, phoneVerified]);

  const sendPhoneCode = async () => {
    if (!phone) return;
    try {
      // Save phone to user profile first (required by backend)
      await api.patch('/auth/me', { phone });
      await api.post('/auth/phone-code', { phone });
      setPhoneSent(true);
      setMsg('Verification code sent via SMS');
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.msg || 'Failed to send phone code');
    }
  };

  const verifyPhone = async () => {
    try {
      await api.post('/auth/verify-phone', { phone, code: phoneCode });
      setPhoneVerified(true);
      setMsg('Phone verified successfully');
      // update user phone in DB is already verified by controller
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.msg || 'Verification failed');
    }
  };

  const skip = async () => {
    try {
      if (phone && !phoneVerified) {
        // remove phone from DB
        await api.patch('/auth/me', { phone: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      navigate('/dashboard');
    }
  };

  return (
    <div className="container py-5" style={{maxWidth: 500}}>
      <h2 className="mb-3">Set up Two-Factor Authentication</h2>
      <p className="text-muted">For additional security you can verify a phone number now. You may also skip and do this later.</p>

      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="card card-body">
        <label className="form-label">Phone Number</label>
        <input type="text" className="form-control mb-2" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. +94771234567" />
        {phoneSent && (
          <>
            <label className="form-label">SMS Code</label>
            <input type="text" className="form-control mb-2" value={phoneCode} onChange={e=>setPhoneCode(e.target.value)} maxLength={6} />
          </>
        )}
        {!phoneSent ? (
          <button className="btn btn-primary" onClick={sendPhoneCode} disabled={!phone}>Send Code</button>
        ) : (
          <button className="btn btn-success" onClick={verifyPhone} disabled={phoneCode.length!==6}>Verify Phone</button>
        )}
      </div>

      <button className="btn btn-link mt-3" onClick={skip}>Skip for now</button>
    </div>
  );
}

export default TwoFactor;
