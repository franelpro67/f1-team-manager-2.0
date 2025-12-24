
import React from 'react';
import { Trophy, Crown, Star, RotateCcw, Play, AlertCircle, ShieldAlert } from 'lucide-react';
import { TeamResult } from '../types';

interface SeasonFinaleProps {
  mode: 'single' | 'versus' | 'online' | 'competitive';
  canAdvanceCompetitive: boolean;
  standings: { name: string, team: string, points: number }[];
  onRestartSeason: () => void;
  onFullReset: () => void;
}

const SeasonFinale: React.FC<SeasonFinaleProps> = ({ mode, canAdvanceCompetitive, standings, onRestartSeason, onFullReset }) => {
  const champion = standings[0];
  const podium = standings.slice(0, 3);
  const isCompetitive = mode === 'competitive';
  const failedCompetitive = isCompetitive && !canAdvanceCompetitive;

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

        {/* Full Standings Summary */}
        <div className="w-full bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden mb-16 shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 border-b border-slate-800">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-8 py-4">Pos</th>
                <th className="px-8 py-4">Piloto</th>
                <th className="px-8 py-4 text-right">Puntos Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {standings.slice(3, 10).map((d, i) => (
                <tr key={d.name} className="hover:bg-slate-800/20">
                  <td className="px-8 py-4 font-f1 text-slate-500">{i + 4}</td>
                  <td className="px-8 py-4 text-white font-bold italic uppercase tracking-tighter">{d.name}</td>
                  <td className="px-8 py-4 text-right font-f1 text-slate-400">{d.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
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
               : 'bg-white text-black hover:bg-yellow-500'
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
        
        <p className="mt-12 text-slate-600 text-[10px] font-black uppercase tracking-[0.8em]">End of Season Performance Report</p>
      </div>
    </div>
  );
};

export default SeasonFinale;
