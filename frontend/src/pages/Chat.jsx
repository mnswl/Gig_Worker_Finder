import { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { socket } from '../socket';
import api from '../api';
import '../styles/Chat.css';

function Chat() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialUserId = params.get('user');
  const initialJobId = params.get('job');

  const [conversations, setConversations] = useState([]); // [{user:{_id,name,email,avatar}, lastMessage, unread}]
  const [selected, setSelected] = useState(null); // user object
  const [messages, setMessages] = useState([]); // [{_id,sender,receiver,content,createdAt}]
  const [newMsg, setNewMsg] = useState('');
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [myId, setMyId] = useState('');
  const [jobRef, setJobRef] = useState(null);
  const messagesRef = useRef(null);
  // Conversations sorted: unread first, then most recent
  const sortedConversations = useMemo(() => {
    const arr = [...conversations];
    arr.sort((a,b)=>{
      if(a.unread && !b.unread) return -1;
      if(!a.unread && b.unread) return 1;
      const ta = new Date(a.updatedAt || a.lastMessageAt || 0);
      const tb = new Date(b.updatedAt || b.lastMessageAt || 0);
      return tb - ta; // recent first
    });
    return arr;
  }, [conversations]);
  // Helper to fire native notification
  const showNativeNotification = (title, body) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        console.log('Firing notification', title, body);
        new Notification(title, { body });
      } catch (err) {
        console.error('Notification error', err);
      }
    }
  };

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch my profile to know my id
  useEffect(() => {
    if(messagesRef.current){
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, selected]);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/auth/me');
        setMyId(me.data.id);
      } catch (err) {}
    })();
  }, []);

  

  // ensure joined after myId available
  useEffect(() => {
    if (socket.connected && myId) {
      socket.emit('join', myId);
    }
  }, [myId]);

  // Handle incoming message and typing
  useEffect(() => {
    socket.on('newMessage', msg => {
      const senderId = msg.sender._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      const isCurrentThread = selected && (senderId === selected._id || receiverId === selected._id);
      const isToMe = receiverId === myId;
      // Update conversation list
      setConversations(prev => {
        const idx = prev.findIndex(c => (c.user._id || c.user) === (msg.sender._id || msg.sender));
        const isUnread = !isCurrentThread;
        let updated = [...prev];
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], lastMessage: msg.content, unread: isUnread, updatedAt: msg.createdAt };
        } else {
          updated.push({ user: msg.sender, lastMessage: msg.content, unread: isUnread, updatedAt: msg.createdAt });
        }
        return updated;
      });
      // If current convo open, append
      if (isCurrentThread) {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
      } else {
        const shouldNotify = !document.hasFocus() || !isCurrentThread;
        if (shouldNotify) {
          toast.info(`New message from ${msg.sender.name || 'Someone'}: ${msg.content.slice(0,60)}`);
          showNativeNotification(msg.sender.name || 'New message', msg.content);
        }
      }
    });
          socket.on('typing', ({ from }) => {
        if (selected && from === selected._id) {
          setTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTyping(false), 1500);
        }
      });
      return () => {
        socket.off('newMessage');
        socket.off('typing');
      };
  }, [socket, selected]);

  // Fetch conversations
  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
      // If initial user specified, open that convo
      if (initialUserId) {
        const found = res.data.find(c => (c.user._id || c.user) === initialUserId);
        if (found) {
          openConversation(found.user, initialJobId);
        } else {
          // fetch user info
          const userRes = await api.get(`/users/${initialUserId}`);
          openConversation(userRes.data, initialJobId);
        }
      }
    } catch (err) {
      toast.error('Failed to load conversations');
    }
  };

  useEffect(() => {
    loadConversations();

  }, []);

  const openConversation = async (user, jobId = null) => {
    setSelected(user);
    // mark as read in list
    setConversations(prev => prev.map(c => ((c.user._id || c.user) === user._id) ? { ...c, unread: false } : c));
    setJobRef(null);
    navigate(`/chat?user=${user._id}${jobId ? `&job=${jobId}` : ''}`);
    try {
      if (jobId) {
        try {
          const jobRes = await api.get(`/jobs/${jobId}`);
          setJobRef({ _id: jobId, title: jobRes.data.title });
        } catch (_) {}
      }
      const res = await api.get(`/chat/with/${user._id}`);
      setMessages(res.data);
    } catch (err) {
      toast.error('Failed to load messages');
    }
  };

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    try {
      const res = await api.post('/chat', {
        receiverId: selected._id,
        subject: '',
        content: newMsg.trim(),
        jobId: jobRef ? jobRef._id : null,
      });
      // Optimistic UI handled via socket echo; just clear input.
      setNewMsg('');
    } catch (err) {
      toast.error('Send failed');
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <h5 className="p-3 border-bottom">Conversations</h5>
        <ul className="list-group list-group-flush conversation-list">
          {sortedConversations.map(c => (
            <li
              key={c.user._id || c.user}
              className={`list-group-item d-flex align-items-center gap-2 pointer ${selected && (selected._id === (c.user._id || c.user) ? 'active' : '')}`}
              onClick={() => openConversation(c.user)}
            >
              <div className="avatar-circle bg-primary text-white fw-bold">
                {c.user.name ? c.user.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold">{c.user.name || 'Unknown'}</div>
                <small className="text-muted text-truncate d-block" style={{maxWidth: '160px'}}>{c.lastMessage}</small>
              </div>{c.unread && <span className="badge bg-danger ms-auto">●</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="chat-main d-flex flex-column">
        {selected ? (
          <>
            <div className="d-flex justify-content-between align-items-center border-bottom p-3">
              <div>
                <div className="fw-semibold">{selected.name}</div>
                {jobRef && <small className="text-muted">{t('jobLabel')}: {jobRef.title}</small>}
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/dashboard')}>&times;</button>
            </div>
            <div ref={messagesRef} className="flex-grow-1 overflow-auto p-3 messages-container">
               {typing && <small className="text-muted mb-2">{selected.name} is typing...</small>}
              {messages.map(m => (
                <div key={m._id} className={`d-flex mb-2 ${m.sender._id === selected._id || m.sender === selected._id ? 'align-start' : 'justify-content-end'}`}>
                  <div className={`chat-bubble ${m.sender._id === selected._id || m.sender === selected._id ? 'incoming' : 'outgoing'}`}>{m.content}</div>
                </div>
              ))}
            </div>
            <div className="p-3 border-top d-flex gap-2">
              <input
                className="form-control"
                value={newMsg}
                onChange={e => {
                  setNewMsg(e.target.value);
                  if (selected) {
                    socket.emit('typing', { to: selected._id });
                  }
                }}
                placeholder={t('typeMessage')}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button className="btn btn-primary" onClick={handleSend}>{t('send')}</button>
            </div>
          </>
        ) : (
          <div className="h-100 position-relative">
            <button
              className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-3"
              onClick={() => navigate('/dashboard')}
            >
              &times;
            </button>
            <div className="h-100 d-flex align-items-center justify-content-center">
              <p className="text-muted">{t('selectConversation')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
