import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
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
        <div
          className="chat-widget-window fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-96 h-[26rem] bg-white/50 dark:bg-gray-900/60 border-4 border-blue-600 dark:border-blue-400 outline outline-2 outline-blue-500/50 ring-0 shadow-[0_16px_48px_rgba(0,0,0,0.25)] rounded-xl overflow-hidden flex flex-col backdrop-blur-3xl backdrop-saturate-150 backdrop-brightness-110"
          style={{ backdropFilter: 'blur(30px) saturate(180%)', WebkitBackdropFilter: 'blur(30px) saturate(180%)' }}
        >
          
          
          <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-white/90 dark:bg-gray-900/80">
            <div className="relative flex items-center gap-2">
              <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">AI ChatBot</h3>
            </div>
            <button onClick={() => setOpen(false)} className="chat-widget-close" aria-label="Close chat">
              <span className="block w-4 h-4 relative">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-0.5 bg-gray-700 dark:bg-gray-200"></span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-2 bg-gray-700 dark:bg-gray-200"></span>
              </span>
            </button>
          </div>
          <div className="relative z-10 flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex w-full mb-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="relative flex items-center gap-2">
                    <div className="flex items-start w-full gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shadow">
                        🤖
                      </div>
                      <div className="bg-gradient-to-br from-indigo-500 via-sky-500 to-blue-500 text-white rounded-2xl rounded-tl-none shadow px-4 py-2 max-w-[70%]">
                        {m.content}
                      </div>
                    </div>
                    <div className="ml-10 mt-1">
                      <span className="ai-badge inline-flex items-center gap-1 px-2 py-1">
                        ✨ Answered by AI
                      </span>
                    </div>
                  </div>
                )}
                {m.role === 'user' && (
                  <div className="relative flex items-center gap-2">
                    <div className="bg-white text-gray-900 dark:bg-gray-800/70 dark:text-gray-100 rounded-2xl rounded-tr-none shadow px-4 py-2 max-w-[70%]">
                      {m.content}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-sm font-bold shadow">
                      👤
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && <p className="text-gray-400 text-xs">Assistant is typing…</p>}
            <div ref={bottomRef} />
          </div>
          <div className="relative z-10 mt-auto p-3 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 rounded-b-2xl">
            <div className="flex items-center w-full gap-2">
              <input
                type="text"
                className="flex-1 bg-white/90 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="chat-widget-send disabled:opacity-60"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="plane-svg text-white" />
              </button>
                
          </div>
        </div>
      </div>
       )}
    </>
  );
}
