import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Users, Loader2, Play, Crown, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
}

const Lobby: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [users, setUsers] = useState<User[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();
  
  const isHost = localStorage.getItem(`host_${sessionId}`) === 'true';

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get(`/rooms/${sessionId}`);
        
        // joined_players is een dictionary {id: Player}
        const playersDict = response.data.joined_players;
        const playersList = Object.values(playersDict).map((p: any) => ({
          id: p.id,
          name: p.name
        }));
        
        setUsers(playersList);
        
        if (response.data.isStarted) {
          navigate(`/game/${sessionId}`);
        }
      } catch (err) {
        // Sessie niet gevonden of andere fout
        // Geen toast hier om de loop niet te spammen
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [sessionId, navigate]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await api.post(`/game/start/${sessionId}`);
      toast.success('Game gestart!');
      navigate(`/game/${sessionId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Fout bij het starten van de game.');
      setIsStarting(false);
    }
  };

  const handleLeave = () => {
    if (window.confirm('Weet je zeker dat je de lobby wilt verlaten?')) {
      navigate('/');
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black italic text-indigo-500 uppercase tracking-tighter">Sessie Lobby</h1>
        <div className="inline-block bg-slate-800 px-6 py-2 rounded-2xl border-2 border-indigo-500/30">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block">Code</span>
          <span className="text-3xl font-black text-white tracking-[0.2em]">{sessionId?.toUpperCase()}</span>
        </div>
      </div>

      <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-500" size={20} />
            <h2 className="font-black uppercase tracking-tight text-lg">Spelers ({users.length})</h2>
          </div>
          {isHost && (
            <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
              <Crown size={10} /> Host
            </div>
          )}
        </div>

        <div className="p-4 space-y-2 max-h-80 overflow-y-auto font-sans">
          {users.map((user, index) => (
            <div 
              key={user.id} 
              className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 animate-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg">
                {user.name[0].toUpperCase()}
              </div>
              <span className="font-bold text-slate-200">{user.name}</span>
            </div>
          ))}
          
          {users.length === 0 && (
            <div className="py-8 text-center text-slate-500 italic">Wachten op spelers...</div>
          )}
        </div>

        <div className="p-6 bg-slate-800/50 border-t border-slate-700 space-y-3">
          {isHost ? (
            <>
              <button 
                onClick={handleStart}
                disabled={isStarting || users.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-xl shadow-lg shadow-indigo-600/20 transition-all uppercase flex items-center justify-center gap-3"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="animate-spin" /> Mixing...
                  </>
                ) : (
                  <>
                    <Play fill="currentColor" size={20} /> Start Game
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="text-center py-2 flex items-center justify-center gap-3 text-slate-400 font-bold italic text-sm">
                <Loader2 className="animate-spin" size={16} />
                Wachten tot de host start...
              </div>
              <button 
                onClick={handleLeave}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-2xl transition-all uppercase text-xs flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Lobby Verlaten
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-slate-500 text-xs font-medium px-8">
          Deel de code met je vrienden om ze uit te nodigen!
        </p>
      </div>
    </div>
  );
};

export default Lobby;