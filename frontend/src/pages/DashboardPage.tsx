// Created by Google Gemini
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Plus, 
  LogOut, 
  Settings, 
  MessageCircle, 
  Clock, 
  ChevronRight, 
  MoreVertical, 
  Trash2, 
  Palette 
} from 'lucide-react';
import type { Room } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface DashboardRoom extends Room {
  latestMessage?: {
    content: string;
    created_at: string;
    user: { username: string };
  };
  color: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [rooms, setRooms] = useState<DashboardRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchRooms();
    }
  }, [session]);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    const crn = prompt('Enter class CRN to join:');
    if (!crn) return;
    const course_name = prompt('Enter course name (optional):');

    try {
      await axios.post(`${BACKEND_URL}/api/rooms/join`, { crn, course_name }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      fetchRooms();
    } catch (error) {
      console.error('Failed to join room', error);
    }
  };

  const leaveRoom = async (crn: string) => {
    if (!window.confirm(`Are you sure you want to leave ${crn}?`)) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/rooms/${crn}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setRooms(rooms.filter(r => r.crn !== crn));
    } catch (error) {
      console.error('Failed to leave room', error);
    }
  };

  const updateColor = async (crn: string, color: string) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/rooms/${crn}/color`, { color }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setRooms(rooms.map(r => r.crn === crn ? { ...r, color } : r));
      setShowSettings(null);
    } catch (error) {
      console.error('Failed to update color', error);
    }
  };

  const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <MessageCircle className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRN Connect</h1>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={joinRoom}
              className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
            >
              <Plus size={20} /> Join Class
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button 
              onClick={signOut}
              className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">My Classes</h2>
        <p className="text-slate-500 font-medium">Welcome back, {session?.user.email?.split('@')[0]}. You have {rooms.length} active classes.</p>
      </header>

      {/* Grid of Class Cards */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rooms.map((room) => (
          <div 
            key={room.crn}
            className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden group hover:scale-[1.02] transition-all duration-300 flex flex-col relative"
          >
            {/* Card Header Color Strip */}
            <div 
              className="h-3 w-full" 
              style={{ backgroundColor: room.color }}
            ></div>
            
            <div className="p-8 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                    {room.course_name || `Class ${room.crn}`}
                  </h3>
                  <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    CRN: {room.crn}
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setShowSettings(showSettings === room.crn ? null : room.crn)}
                    className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-all"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {showSettings === room.crn && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 p-2 animate-in zoom-in-95 duration-200">
                      <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Class Settings</div>
                      <div className="p-2 mb-2">
                        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-600">
                          <Palette size={14} /> Change Color
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {COLORS.map(c => (
                            <button 
                              key={c}
                              type="button"
                              onClick={() => updateColor(room.crn, c)}
                              className="w-6 h-6 rounded-full border border-white ring-1 ring-slate-200 cursor-pointer"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => leaveRoom(room.crn)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 transition-all text-sm font-bold"
                      >
                        <Trash2 size={18} /> Leave Class
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Latest Activity Preview */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mt-auto">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest Activity</span>
                </div>
                {room.latestMessage ? (
                  <div>
                    <p className="text-slate-700 text-sm line-clamp-2 italic mb-3 font-medium">
                      "{room.latestMessage.content}"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {room.latestMessage.user.username}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(room.latestMessage.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs font-medium">No messages yet. Be the first!</p>
                )}
              </div>
            </div>

            <button 
              onClick={() => navigate(`/chat/${room.crn}`)}
              className="w-full py-5 bg-white border-t border-slate-50 flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all group/btn"
            >
              Enter Classroom <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}

        {/* Empty State / Add New Class Placeholder */}
        {rooms.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-200 border border-slate-100">
              <Plus size={48} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No classes yet</h3>
            <p className="text-slate-500 max-w-sm mb-8 font-medium">Join your first class by entering a CRN. You can then start chatting with your fellow VT students.</p>
            <button 
              onClick={joinRoom}
              className="bg-blue-600 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all scale-100 hover:scale-105"
            >
              Get Started
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
