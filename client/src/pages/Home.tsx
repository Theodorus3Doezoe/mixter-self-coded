import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Music, PlayCircle, UserPlus, Plus, X, History, ArrowRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface RecentSession {
  id: string;
  name: string;
  playlistUrls: string[];
  isHost: boolean;
}

const Home: React.FC = () => {
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [playlistUrls, setPlaylistUrls] = useState<string[]>(['']);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Laad recente sessies
    const saved = localStorage.getItem('recent_sessions');
    if (saved) {
      try {
        setRecentSessions(JSON.parse(saved));
      } catch (e) {
        console.error('Fout bij laden recente sessies', e);
      }
    }

    // Zorg voor een player_id
    if (!localStorage.getItem('player_id')) {
      localStorage.setItem('player_id', Math.random().toString(36).substring(2, 15));
    }
  }, []);

  const getPlayerId = () => localStorage.getItem('player_id') || '';

  const saveRecentSession = (session: RecentSession) => {
    const updated = [session, ...recentSessions.filter(s => s.id !== session.id)].slice(0, 5);
    setRecentSessions(updated);
    localStorage.setItem('recent_sessions', JSON.stringify(updated));
  };

  const removeRecentSession = (id: string) => {
    const updated = recentSessions.filter(s => s.id !== id);
    setRecentSessions(updated);
    localStorage.setItem('recent_sessions', JSON.stringify(updated));
  };

  const addPlaylistField = () => {
    setPlaylistUrls([...playlistUrls, '']);
  };

  const removePlaylistField = (index: number) => {
    if (playlistUrls.length > 1) {
      const newUrls = [...playlistUrls];
      newUrls.splice(index, 1);
      setPlaylistUrls(newUrls);
    }
  };

  const updatePlaylistUrl = (index: number, value: string) => {
    const newUrls = [...playlistUrls];
    newUrls[index] = value;
    setPlaylistUrls(newUrls);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const filteredUrls = playlistUrls.filter(url => url.trim() !== '');
    if (filteredUrls.length === 0) {
      toast.error('Voeg minimaal één playlist URL toe');
      setLoading(false);
      return;
    }

    try {
      // 1. Create Room
      const createRes = await api.post('/rooms/create');
      const roomCode = createRes.data.room.code;
      
      // 2. Join Room
      await api.post('/rooms/join', {
        code: roomCode,
        player_id: getPlayerId(),
        name: name
      });

      // 3. Upload Playlists (one by one for better error handling/feedback)
      for (const url of filteredUrls) {
        await api.post('/rooms/playlist', {
          code: roomCode,
          player_id: getPlayerId(),
          url: url
        });
      }

      localStorage.setItem(`host_${roomCode}`, 'true');
      
      saveRecentSession({
        id: roomCode,
        name: name,
        playlistUrls: filteredUrls,
        isHost: true
      });
      
      toast.success('Sessie aangemaakt!');
      navigate(`/lobby/${roomCode}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Fout bij het aanmaken van de sessie');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const filteredUrls = playlistUrls.filter(url => url.trim() !== '');
    if (filteredUrls.length === 0) {
      toast.error('Voeg minimaal één playlist URL toe');
      setLoading(false);
      return;
    }

    try {
      // 1. Join Room
      await api.post('/rooms/join', {
        code: sessionIdInput,
        player_id: getPlayerId(),
        name: name
      });

      // 2. Upload Playlists
      for (const url of filteredUrls) {
        await api.post('/rooms/playlist', {
          code: sessionIdInput,
          player_id: getPlayerId(),
          url: url
        });
      }
      
      saveRecentSession({
        id: sessionIdInput,
        name: name,
        playlistUrls: filteredUrls,
        isHost: false
      });

      toast.success('Sessie gejoined!');
      navigate(`/lobby/${sessionIdInput}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Fout bij het joinen van de sessie');
    } finally {
      setLoading(false);
    }
  };

  const handleRejoin = async (session: RecentSession) => {
    try {
      // Check of sessie nog bestaat
      await api.get(`/rooms/${session.id}`);
      
      if (session.isHost) {
        localStorage.setItem(`host_${session.id}`, 'true');
      }
      
      navigate(`/lobby/${session.id}`);
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error('Deze sessie bestaat niet meer.');
        removeRecentSession(session.id);
      } else {
        navigate(`/lobby/${session.id}`);
      }
    }
  };

  return (
    <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center">
        <div className="bg-indigo-600 p-4 rounded-full mb-4 shadow-lg shadow-indigo-500/50">
          <Music size={48} className="text-white" />
        </div>
        <h1 className="text-6xl font-black italic tracking-tighter text-indigo-500 mb-2">MIXTER</h1>
        <p className="text-slate-400 font-medium italic">De ultieme multiplayer muziekbingo</p>
      </div>

      {!isJoining && !isCreating ? (
        <div className="space-y-6">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Sessie Code</label>
              <input 
                type="text" 
                placeholder="VUL CODE IN" 
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-2xl font-black text-center uppercase tracking-widest focus:border-indigo-500 outline-none transition-all"
                value={sessionIdInput}
                onChange={(e) => setSessionIdInput(e.target.value.toUpperCase())}
              />
            </div>
            
            <button 
              onClick={() => setIsJoining(true)}
              disabled={!sessionIdInput}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-xl shadow-lg shadow-indigo-600/20 transition-all uppercase flex items-center justify-center gap-2"
            >
              <UserPlus size={20} /> JOIN SESSIE
            </button>
            
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] bg-slate-700 flex-1"></div>
              <span className="text-slate-500 font-bold text-xs italic">OF</span>
              <div className="h-[1px] bg-slate-700 flex-1"></div>
            </div>
            
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-2xl text-xl transition-all uppercase flex items-center justify-center gap-2"
            >
              <PlayCircle size={20} /> Sessie Aanmaken
            </button>
          </div>

          {/* Recente Sessies Sectie */}
          {recentSessions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
              <div className="flex items-center gap-2 mb-4 px-2">
                <History size={16} className="text-slate-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Recente Sessies</h3>
              </div>
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="group bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/50 rounded-2xl p-4 flex items-center justify-between transition-all"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black tracking-widest text-white">{session.id}</span>
                        {session.isHost && (
                           <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-black uppercase">Host</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[150px]">
                        Als {session.name}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => removeRecentSession(session.id)}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                        title="Verwijder uit lijst"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleRejoin(session)}
                        className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white p-2 px-4 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all"
                      >
                        Herjoin <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 space-y-6 text-left animate-in fade-in zoom-in duration-300">
          <h2 className="text-2xl font-black italic text-indigo-400 uppercase tracking-tight">
            {isCreating ? 'Nieuwe Sessie' : `Join ${sessionIdInput}`}
          </h2>
          
          <form onSubmit={isCreating ? handleCreate : handleJoin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Je Naam</label>
              <input 
                required
                type="text" 
                placeholder="Bijv. Svend" 
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 font-bold focus:border-indigo-500 outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Spotify Playlists (Publiek)</label>
              
              {playlistUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    required
                    type="url" 
                    placeholder="https://open.spotify.com/playlist/..." 
                    className="flex-1 bg-slate-900 border-2 border-slate-700 rounded-2xl p-3 font-bold focus:border-indigo-500 outline-none transition-all text-xs"
                    value={url}
                    onChange={(e) => updatePlaylistUrl(index, e.target.value)}
                  />
                  {playlistUrls.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removePlaylistField(index)}
                      className="bg-red-500/10 text-red-500 p-3 rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                type="button"
                onClick={addPlaylistField}
                className="w-full py-2 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-bold text-xs hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Playlist Toevoegen
              </button>
            </div>

            <div className="pt-2 space-y-3">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-xl shadow-lg shadow-indigo-600/20 transition-all uppercase flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : (isCreating ? 'Sessie Starten' : 'Joinen')}
              </button>
              
              <button 
                type="button"
                onClick={() => { setIsJoining(false); setIsCreating(false); }}
                className="w-full bg-transparent border-2 border-slate-700 hover:bg-slate-700 text-slate-400 font-bold py-3 rounded-2xl transition-all uppercase text-sm"
              >
                Terug
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Home;