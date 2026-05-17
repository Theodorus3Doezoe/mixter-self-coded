import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Music, Eye, ChevronRight, RotateCcw, Volume2, User, Calendar, Disc, Share2, Info, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface Track {
  titel: string;
  artist: string;
  added_by: string[];
  media: {
    thumbnail: string | null;
    preview_url: string | null;
    release_year: number | null;
    deezer_id: number | null;
  };
}

const Game: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [track, setTrack] = useState<Track | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  const isHost = localStorage.getItem(`host_${sessionId}`) === 'true';

  const fetchRoomStatus = async () => {
    try {
      const response = await api.get(`/rooms/${sessionId}`);
      
      if (response.data.isFinished) {
        setFinished(true);
        setLoading(false);
        return;
      }

      const currentTrack = response.data.current_track;
      
      if (currentTrack) {
        // Gebruik een unieke identifier voor track vergelijking. 
        // Aangezien we geen ID hebben in de track pool, vergelijken we titel + artist.
        const currentId = `${currentTrack.titel}-${currentTrack.artist}`;
        const previousId = track ? `${track.titel}-${track.artist}` : null;

        if (currentId !== previousId) {
          setTrack(currentTrack);
          setRevealed(false);
        }
      } else if (isHost && !track && !finished) {
          // Als host, start de eerste track als er nog niets is
          handleNext();
      }
      
      setLoading(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error('Sessie is beëindigd of niet gevonden.');
        navigate('/');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomStatus();
    const interval = setInterval(fetchRoomStatus, 3000);
    return () => clearInterval(interval);
  }, [sessionId, track?.titel, track?.artist]);

  useEffect(() => {
    if (track?.media.preview_url && audioRef.current) {
      if (revealed) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Auto-play blocked", e));
      }
    }
  }, [track, revealed]);

  const handleNext = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/game/next-track/${sessionId}`);
      if (response.data.status === "finished") {
        setFinished(true);
      } else {
        setTrack(response.data.current);
        setRevealed(false);
        toast.success('Volgende nummer!');
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('leeg')) {
          setFinished(true);
      } else {
          toast.error('Fout bij volgende track');
      }
    }
    setLoading(false);
  };

  const handleLeave = () => {
    if (window.confirm('Weet je zeker dat je de sessie wilt verlaten?')) {
      navigate('/');
    }
  };

  if (loading && !track) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black italic uppercase tracking-widest text-indigo-500">Laden...</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in duration-500">
        <div className="bg-slate-800 p-12 rounded-3xl shadow-2xl border border-slate-700 space-y-6">
          <div className="bg-indigo-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/50">
            <RotateCcw size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">FINISH!</h1>
          <p className="text-slate-400 font-bold">Het spel is afgelopen. Bedankt voor het spelen!</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl text-xl transition-all uppercase"
          >
            Nieuw Spel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-6">
      {/* Playback Card */}
      <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden relative">
        <div className="h-2 bg-indigo-500 w-full animate-pulse"></div>
        
        <div className="p-10 text-center space-y-8">
          <div className={`w-48 h-48 mx-auto rounded-3xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-inner relative overflow-hidden ${!revealed ? 'animate-pulse' : ''}`}>
             {!revealed ? (
               <Music size={80} className="text-indigo-500/20" />
             ) : (
               track?.media.thumbnail ? (
                 <img src={track.media.thumbnail} alt="Album cover" className="w-full h-full object-cover animate-in fade-in duration-500" />
               ) : (
                 <Disc size={120} className="text-indigo-500 animate-[spin_8s_linear_infinite]" />
               )
             )}
             
             {/* Preview Audio Indicator */}
             {track?.media.preview_url && !revealed && (
               <div className="absolute bottom-4 right-4 bg-indigo-600 p-2 rounded-full">
                 <Volume2 size={16} className="text-white" />
               </div>
             )}
          </div>

          <div className="space-y-4">
            {!revealed ? (
              <div className="space-y-2">
                <div className="h-8 bg-slate-900 rounded-full w-3/4 mx-auto animate-pulse"></div>
                <div className="h-5 bg-slate-900 rounded-full w-1/2 mx-auto animate-pulse"></div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h2 className="text-3xl font-black text-white italic leading-tight mb-1">{track?.titel}</h2>
                <p className="text-indigo-400 font-bold text-lg uppercase tracking-tight">{track?.artist}</p>
              </div>
            )}
          </div>

          {!revealed ? (
            <div className="space-y-4">
              <button 
                onClick={() => setRevealed(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-2xl text-2xl shadow-lg shadow-indigo-600/40 transition-all uppercase flex items-center justify-center gap-4 group"
              >
                <Eye className="group-hover:scale-125 transition-transform" /> REVEAL
              </button>
              
              {isHost && !track?.media.preview_url && (
                <button 
                  onClick={handleNext}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-xl transition-all uppercase text-sm"
                >
                  Skip (Geen audio)
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in duration-300">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 flex flex-col items-center">
                <Calendar className="text-indigo-500 mb-2" size={20} />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Jaartal</span>
                <span className="text-xl font-black text-white italic">{track?.media.release_year || '???'}</span>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 flex flex-col items-center">
                <User className="text-indigo-500 mb-2" size={20} />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Door</span>
                <span className="text-sm font-black text-white italic truncate w-full text-center px-1" title={track?.added_by.join(', ')}>
                  {track?.added_by.join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {isHost && revealed && (
          <div className="p-6 bg-slate-900/50 border-t border-slate-700">
            <button 
              onClick={handleNext}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-2xl text-xl transition-all uppercase flex items-center justify-center gap-3"
            >
              Volgende <ChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Audio Element */}
      {track?.media.preview_url && (
        <audio 
          key={`${track.titel}-${track.artist}`}
          ref={audioRef} 
          src={track.media.preview_url} 
          autoPlay 
          loop
        />
      )}

      {/* Control Buttons */}
      <div className="grid grid-cols-1">
        <button 
          onClick={handleLeave}
          className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-3 rounded-2xl transition-all uppercase text-xs flex items-center justify-center gap-2 border border-slate-700"
        >
          <LogOut size={14} /> Verlaten
        </button>
      </div>

      {!track?.media.preview_url && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
          <Info className="text-amber-500 shrink-0" size={20} />
          <p className="text-amber-200 text-xs font-medium leading-relaxed">
            Geen preview beschikbaar voor dit nummer. Je zult het op een andere manier moeten afspelen of dit nummer overslaan.
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Sessie: {sessionId}</span>
        </div>
        <button className="text-slate-500 hover:text-white transition-colors">
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default Game;