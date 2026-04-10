import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socket } from '../lib/socket';
import axios from 'axios';
import { 
  Plus, 
  Send, 
  Paperclip, 
  MessageSquare, 
  X, 
  Users, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import type { Room, Message, User as ChatUser } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const ChatPage = () => {
  const { crn } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showMemberSidebar, setShowMemberSidebar] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      socket.connect();
    }
    return () => {
      socket.disconnect();
    };
  }, [session]);

  useEffect(() => {
    if (crn && session) {
      fetchRoomDetails(crn);
      fetchMessages(crn);
      fetchUsers(crn);
      socket.emit('join_room', crn);
    }
  }, [crn, session]);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.room_crn === crn) {
        setMessages((prev) => [...prev, message]);
      }
    };
    
    const handleMessageUpdate = (message: Message) => {
      if (message.room_crn === crn) {
        setMessages((prev) => prev.map(m => m.id === message.id ? message : m));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdate);
    };
  }, [crn]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRoomDetails = async (crn: string) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/rooms/${crn}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setCurrentRoom(data);
    } catch (error) {
      console.error('Failed to fetch room details', error);
    }
  };

  const fetchMessages = async (crn: string) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/rooms/${crn}/messages`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const fetchUsers = async (crn: string) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/rooms/${crn}/users`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await axios.post(`${BACKEND_URL}/api/messages/${messageId}/react`, { emoji }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
    } catch (error) {
      console.error('Failed to react', error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-slate-100">
        <header className="h-24 border-b border-slate-100 flex items-center justify-between px-10 bg-white/90 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/')}
              className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-100 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="h-10 w-px bg-slate-100"></div>
            <div>
                <h2 className="font-black text-2xl text-slate-900 tracking-tight leading-none mb-2 flex items-center gap-2">
                    {currentRoom?.course_name || `Class ${crn}`}
                </h2>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">CRN: {crn}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    <button 
                        onClick={() => setShowMemberSidebar(!showMemberSidebar)}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                    >
                        {users.length} Students Online
                    </button>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowMemberSidebar(!showMemberSidebar)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border ${
                    showMemberSidebar 
                    ? 'bg-blue-50 border-blue-100 text-blue-600' 
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
             >
                <Users size={18} />
                <span>Roster</span>
             </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10 custom-scrollbar scroll-smooth">
          {messages.map((msg, idx) => {
            const isFirstInGroup = idx === 0 || messages[idx-1].user_id !== msg.user_id;
            
            return (
              <div key={msg.id} className={`flex gap-5 group relative ${isFirstInGroup ? 'mt-6' : 'mt-1'}`}>
                {isFirstInGroup ? (
                  <div className="w-12 h-12 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-slate-400 border border-slate-100 shadow-sm overflow-hidden">
                    {msg.user.avatar_url ? (
                      <img src={msg.user.avatar_url} alt={msg.user.username || ''} className="w-full h-full object-cover" />
                    ) : (
                      msg.user.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                ) : (
                  <div className="w-12 flex-shrink-0 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pt-1 font-bold">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {isFirstInGroup && (
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-black text-[15px] text-slate-900 hover:text-blue-600 cursor-pointer transition-colors tracking-tight">
                        {msg.user.username}
                      </span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  {msg.parent_message_id && isFirstInGroup && (
                    <div className="flex items-center gap-2 mb-3 bg-blue-50/50 border border-blue-100/50 rounded-xl py-2 px-4 max-w-fit shadow-sm shadow-blue-50/50">
                        <MessageSquare size={12} className="text-blue-400" />
                        <span className="text-xs text-blue-600 font-bold italic">
                            Replying to {messages.find(m => m.id === msg.parent_message_id)?.user.username}
                        </span>
                    </div>
                  )}
                  
                  <div className="bg-slate-50/30 group-hover:bg-slate-50 border border-transparent group-hover:border-slate-100 rounded-3xl px-6 py-4 transition-all inline-block max-w-full relative shadow-sm shadow-transparent group-hover:shadow-slate-100/50">
                    <div className="text-slate-700 leading-relaxed break-words text-[16px] font-medium">{msg.content}</div>
                    
                    {msg.attachments.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {msg.attachments.map(att => (
                          <a 
                            key={att.id} 
                            href={`${BACKEND_URL}/${att.file_path}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-4 max-w-sm hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50 transition-all group/file"
                          >
                            <div className="bg-blue-50 p-2.5 rounded-xl group-hover/file:bg-blue-100 transition-colors">
                                <Paperclip size={20} className="text-blue-600" />
                            </div>
                            <div className="min-w-0 pr-4">
                                <div className="text-slate-900 text-[13px] font-black truncate tracking-tight">
                                    {att.file_name}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1 opacity-60">
                                    {att.file_type.split('/')[1] || 'FILE'}
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-200 group-hover/file:text-blue-300 ml-auto transition-colors" />
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                <button 
                                    key={emoji} 
                                    onClick={() => handleReact(msg.id, emoji)}
                                    className="bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-2 transition-all shadow-sm"
                                >
                                    <span>{emoji}</span>
                                    <span className="text-slate-400 font-black">{msg.reactions.filter(r => r.emoji === emoji).length}</span>
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
                  
                  <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 flex gap-2 bg-white border border-slate-100 p-2 rounded-2xl shadow-2xl z-10 transition-all transform group-hover:-translate-y-3">
                    <button onClick={() => handleReact(msg.id, '👍')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600">👍</button>
                    <button onClick={() => handleReact(msg.id, '❤️')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-red-600">❤️</button>
                    <button onClick={() => setReplyTo(msg)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600">
                        <MessageSquare size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messageEndRef} />
        </div>
        
        <div className="px-10 pb-10 bg-white">
          <div className="relative max-w-5xl mx-auto">
            {replyTo && (
                <div className="absolute bottom-full left-0 right-0 bg-slate-50/80 backdrop-blur-md px-8 py-3.5 rounded-t-3xl border-x border-t border-slate-100 flex justify-between items-center text-xs animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-lg shadow-inner">
                            <MessageSquare size={14} className="text-blue-600" />
                        </div>
                        <span className="text-slate-500 font-bold tracking-tight">Replying to <span className="font-black text-slate-900">{replyTo.user.username}</span></span>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-slate-300 hover:text-red-500 transition-colors bg-white p-1 rounded-lg shadow-sm">
                        <X size={20} />
                    </button>
                </div>
            )}
            <ChatInput crn={crn || ''} token={session?.access_token || ''} parentMessageId={replyTo?.id} onSent={() => setReplyTo(null)} />
          </div>
        </div>
      </div>

      {/* Users Sidebar */}
      {crn && showMemberSidebar && (
        <div className="w-96 bg-slate-50 flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-500 shadow-2xl z-30 relative">
          <header className="h-24 border-b border-slate-200 flex items-center justify-between px-10 bg-white sticky top-0 z-10">
             <div className="flex items-center gap-3">
                <Users size={20} className="text-blue-600" />
                <h3 className="font-black text-lg text-slate-900 tracking-tight uppercase tracking-widest text-xs">Class Roster</h3>
             </div>
             <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[11px] font-black border border-blue-100">
                {users.length}
             </span>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div>
                <div className="text-[10px] font-black text-slate-300 px-4 mb-5 uppercase tracking-[0.2em]">Active VT Students</div>
                <div className="space-y-2">
                    {users.map(user => (
                    <div key={user.id} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all duration-300 border border-transparent hover:border-slate-100">
                        <div className="relative">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-300 text-lg overflow-hidden border border-slate-100 ring-2 ring-transparent group-hover:ring-blue-100 group-hover:shadow-lg transition-all">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username || ''} className="w-full h-full object-cover" />
                                ) : (
                                    user.username?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-slate-50 group-hover:border-white transition-all shadow-sm ring-2 ring-green-100 group-hover:ring-green-200" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-slate-900 group-hover:text-blue-600 truncate font-black text-[15px] transition-colors tracking-tight">{user.username}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
          </div>
          
          <footer className="p-8 border-t border-slate-200 bg-white">
            <button 
                onClick={() => setShowMemberSidebar(false)}
                className="w-full py-4 bg-slate-50 text-slate-500 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
            >
                Hide Roster
            </button>
          </footer>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f5f9;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
};

const ChatInput = ({ crn, token, parentMessageId, onSent }: { crn: string, token: string, parentMessageId?: string, onSent?: () => void }) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append('content', content);
    formData.append('room_crn', crn);
    if (parentMessageId) formData.append('parent_message_id', parentMessageId);
    files.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      await axios.post(`${BACKEND_URL}/api/messages`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setContent('');
      setFiles([]);
      if (onSent) onSent();
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  return (
    <form 
        onSubmit={handleSend} 
        className={`bg-white rounded-2xl p-1.5 flex flex-col gap-1 transition-all duration-500 border ${
            isFocused 
            ? 'border-blue-500 shadow-lg ring-4 ring-blue-50' 
            : 'border-slate-200 shadow-md shadow-slate-100'
        } ${parentMessageId ? 'rounded-t-none' : ''}`}
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-slate-50/50 rounded-xl border border-slate-100 mb-1 mx-1">
          {files.map((file, idx) => (
            <div key={idx} className="bg-white p-1.5 px-3 rounded-lg flex items-center gap-2 text-[11px] border border-slate-200 shadow-sm animate-in zoom-in-50 duration-300">
              <div className="bg-blue-50 p-1 rounded-md">
                  <Paperclip size={12} className="text-blue-600" />
              </div>
              <span className="truncate max-w-[120px] font-bold text-slate-900 tracking-tight">{file.name}</span>
              <button 
                type="button" 
                onClick={() => setFiles(f => f.filter((_, i) => i !== idx))} 
                className="text-slate-300 hover:text-red-500 transition-colors ml-1 bg-slate-50 p-0.5 rounded"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-1">
        <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-all"
        >
            <Plus size={20} />
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        <input
            type="text"
            placeholder={`Message class...`}
            className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder-slate-300 font-bold py-2 text-sm"
            value={content}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setContent(e.target.value)}
        />
        <button 
            type="submit" 
            className={`p-2.5 rounded-xl transition-all duration-500 transform ${
                content.trim() || files.length > 0 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-100 opacity-100' 
                : 'bg-slate-50 text-slate-200 scale-90 opacity-50 cursor-not-allowed'
            }`}
        >
            <Send size={18} />
        </button>
      </div>
    </form>
  );
};

export default ChatPage;
