import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/solid';
import api from '../api';
import './ChatWidget.css';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI assistant. How can I help you today?' }
  ]); // { role, content }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { messages: [...messages, userMsg] });
      if (data?.reply) {
        setMessages((m) => [...m, data.reply]);
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I had trouble responding.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
        onClick={() => setOpen(true)}
        className="fixed z-60 w-14 h-14 rounded-full
                   bg-blue-600 text-white flex items-center justify-center
                   shadow-lg hover:shadow-xl hover:scale-110 transition-transform
                   duration-300 ring-2 ring-white"
        style={{ position: 'fixed', bottom: '6.5rem', right: '1.2rem', left: 'unset', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#2563EB' }}   // <- forces right side
        aria-label="Open help chat"
        >
          <svg viewBox="0 0 24 24" className="h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none">
            <g transform="translate(0 3)">
            <circle cx="12" cy="3" r="1.5" fill="white" />
            <path d="M12 4.5v2.5" stroke="white" strokeWidth={2} strokeLinecap="round" />
            <path d="M6 8c0-2.21 1.79-4 4-4h4c2.21 0 4 1.79 4 4v5c0 2.76-2.24 5-5 5h-1l-.5 1.5L12 18l-.5-1.5H11c-2.76 0-5-2.24-5-5V8z" fill="white" />
            <path d="M10 17l2 1.8L14 17" fill="white" />
            <circle cx="10" cy="12" r="1.5" fill="#2563EB" />
            <circle cx="14" cy="12" r="1.5" fill="#2563EB" />
                      </g>
          </svg>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="chat-widget-window fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-80 md:w-96 h-[28rem] bg-transparent shadow-2xl rounded-2xl flex flex-col border border-gray-200/70 dark:border-gray-700/70 backdrop-blur-lg" >
          <div className="flex justify-between items-center p-3 border-b dark:border-gray-700 bg-transparent rounded-t-2xl backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">AI Assistant</h3>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m, idx) => (
              <div key={idx} className={`whitespace-pre-wrap ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={m.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl px-3 py-2 inline-block shadow' : 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 inline-block shadow-sm'}>
                  {m.content}
                </span>
              </div>
            ))}
            {loading && <p className="text-gray-400 text-xs">Assistant is typing…</p>}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
              />
              <button
                onClick={send}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white p-2 rounded-full shadow-md transition"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="h-5 w-5 rotate-90 -translate-y-px" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
