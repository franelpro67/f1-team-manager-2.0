
import React from 'react';
import { Trophy, Crown, Star, RotateCcw, Play, AlertCircle, ShieldAlert, Zap } from 'lucide-react';
import { TeamResult } from '../types';

interface SeasonFinaleProps {
  mode: 'single' | 'versus' | 'online' | 'competitive';
  canAdvanceCompetitive: boolean;
  standings: { name: string, team: string, points: number }[];
  onRestartSeason: () => void;
  onFullReset: () => void;
  onStartCompetitive?: () => void;
  consecutiveWins: number;
}

const SeasonFinale: React.FC<SeasonFinaleProps> = ({ 
  mode, 
  canAdvanceCompetitive, 
  standings, 
  onRestartSeason, 
  onFullReset,
  onStartCompetitive,
  consecutiveWins
}) => {
  const champion = standings[0];
  const podium = standings.slice(0, 3);
  const isCompetitive = mode === 'competitive';
  const failedCompetitive = isCompetitive && !canAdvanceCompetitive;
  const showCompetitiveButton = consecutiveWins >= 2 && mode !== 'competitive';

  return (
    <div className="fixed inset-0 bg-slate-950 z-[200] overflow-y-auto animate-in fade-in duration-1000">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.15)_0%,transparent_70%)]" />
      
      <div className="relative max-w-4xl mx-auto py-20 px-6 flex flex-col items-center">
        <div className="mb-12 text-center space-y-4">
          <div className="inline-block p-4 bg-yellow-500/10 rounded-full mb-4 animate-bounce">
            <Trophy className="text-yellow-500" size={64} />
          </div>
          <h1 className="text-6xl md:text-7xl font-f1 font-bold text-white italic tracking-tighter uppercase leading-none">
            {failedCompetitive ? "Misión" : "Campeón"} <br />
            <span className={failedCompetitive ? "text-red-600" : "text-yellow-500"}>{failedCompetitive ? "Fallida" : "Coronado"}</span>
          </h1>
          <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-xs">FIA Formula 1 World Championship</p>
        </div>

        {/* Competitive Unlock Notification */}
        {showCompetitiveButton && (
          <div className="mb-12 animate-pulse bg-yellow-500/20 border-2 border-yellow-500 p-6 rounded-[2rem] text-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <div className="flex items-center justify-center gap-3 text-yellow-500 mb-2">
              <Zap size={24} fill="currentColor" />
              <h3 className="text-xl font-f1 font-bold uppercase italic">¡MODO COMPETITIVO DESBLOQUEADO!</h3>
              <Zap size={24} fill="currentColor" />
            </div>
            <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Has ganado {consecutiveWins} mundiales seguidos. Estás listo para el siguiente nivel.</p>
          </div>
        )}

        {/* Competitive Mode Badge */}
        {isCompetitive && (
          <div className={`mb-12 flex items-center gap-4 px-8 py-4 rounded-2xl border-2 transition-all shadow-2xl ${failedCompetitive ? 'bg-red-600/10 border-red-600 text-red-500' : 'bg-green-600/10 border-green-600 text-green-500'}`}>
            {failedCompetitive ? <ShieldAlert size={32} /> : <Crown size={32} />}
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest">Requisito Modo Competitivo</p>
              <p className="font-f1 text-lg italic uppercase">{failedCompetitive ? "CONTRATO RESCINDIDO: Sin pilotos en el Top 5" : "OBJETIVO CUMPLIDO: Piloto en el Top 5"}</p>
            </div>
          </div>
        )}

        {/* Podium Visual */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-end">
          <div className="order-2 md:order-1 bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] text-center transform hover:scale-105 transition-transform">
            <p className="text-slate-500 font-f1 text-4xl mb-2">2</p>
            <p className="font-bold text-white text-xl mb-1">{podium[1]?.name}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase mb-4">{podium[1]?.team}</p>
            <p className="text-2xl font-f1 text-slate-300">{podium[1]?.points} PTS</p>
          </div>

          <div className="order-1 md:order-2 bg-yellow-500 p-10 rounded-[3rem] text-center shadow-[0_0_80px_rgba(234,179,8,0.3)] transform scale-110 relative z-10 border-4 border-yellow-300">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 p-3 rounded-full border-4 border-yellow-500">
               <Crown className="text-yellow-500" size={32} />
            </div>
            <p className="text-slate-950 font-f1 text-5xl mb-2 italic">1</p>
            <p className="font-black text-slate-950 text-2xl mb-1 uppercase tracking-tight">{champion?.name}</p>
            <p className="text-[10px] text-slate-900 font-black uppercase mb-4 opacity-70">{champion?.team}</p>
            <p className="text-3xl font-f1 text-slate-950">{champion?.points} PTS</p>
          </div>

          <div className="order-3 bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] text-center transform hover:scale-105 transition-transform">
            <p className="text-slate-500 font-f1 text-4xl mb-2">3</p>
            <p className="font-bold text-white text-xl mb-1">{podium[2]?.name}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase mb-4">{podium[2]?.team}</p>
            <p className="text-2xl font-f1 text-orange-500">{podium[2]?.points} PTS</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-6 w-full max-w-2xl">
           {showCompetitiveButton && (
             <button 
               onClick={onStartCompetitive}
               className="w-full py-8 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 text-black font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-[0_0_50px_rgba(234,179,8,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-4 animate-pulse group"
             >
               <Zap size={32} className="group-hover:rotate-12 transition-transform" fill="currentColor" />
               <span className="text-xl italic font-f1">JUGAR COMPETITIVO</span>
               <Zap size={32} className="group-hover:-rotate-12 transition-transform" fill="currentColor" />
             </button>
           )}

           <div className="flex flex-col md:flex-row gap-6 w-full relative">
              {failedCompetitive && (
                <div className="absolute -top-12 left-0 w-full text-center">
                    <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Has sido despedido por falta de resultados competitivos.</p>
                </div>
              )}
              <button 
                onClick={onRestartSeason}
                disabled={failedCompetitive}
                className={`flex-1 py-6 rounded-3xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 shadow-2xl group ${
                  failedCompetitive 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                  : 'bg-white text-black hover:bg-slate-200'
                }`}
              >
                <Play size={24} className={failedCompetitive ? "" : "group-hover:scale-125 transition-transform"} />
                {failedCompetitive ? "PROGRESIÓN BLOQUEADA" : "Siguiente Temporada"}
              </button>
              <button 
                onClick={onFullReset}
                className={`flex-1 py-6 rounded-3xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 border ${
                  failedCompetitive 
                  ? 'bg-red-600 text-white border-red-500 shadow-red-900/40 hover:scale-105' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-red-600/20'
                }`}
              >
                <RotateCcw size={24} />
                {failedCompetitive ? "REINTENTAR DESDE CERO" : "Reiniciar Carrera"}
              </button>
           </div>
        </div>
        
        <p className="mt-12 text-slate-600 text-[10px] font-black uppercase tracking-[0.8em]">End of Season Performance Report</p>
      </div>
    </div>
  );
};

export default SeasonFinale;
