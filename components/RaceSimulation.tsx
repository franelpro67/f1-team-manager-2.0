
import React, { useState, useEffect } from 'react';
import { TeamState, RaceResult } from '../types';
import { simulateRace } from '../services/geminiService';
import { syncGameState, fetchGameState } from '../services/onlineService';
import { Loader2, Trophy, AlertCircle } from 'lucide-react';

interface RaceSimulationProps {
  teams: TeamState[];
  currentRaceIndex: number;
  onFinish: (result: RaceResult) => void;
  isHost?: boolean;
  roomCode?: string;
}

const RaceSimulation: React.FC<RaceSimulationProps> = ({ teams, currentRaceIndex, onFinish, isHost, roomCode }) => {
  const [result, setResult] = useState<RaceResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runSim = async () => {
      setLoading(true);
      try {
        if (isHost) {
          // El Host genera la carrera
          const res = await simulateRace(teams, currentRaceIndex);
          setResult(res);
          // Si estamos online, compartimos el resultado inmediatamente
          if (roomCode) {
            await syncGameState(roomCode, { 
              raceResult: res, 
              status: 'race_ready', 
              lastUpdateBy: 'host' 
            });
          }
        } else {
          // El invitado espera el resultado del host
          let polledResult = null;
          while (!polledResult) {
            const data = await fetchGameState(roomCode!);
            if (data?.raceResult) {
              polledResult = data.raceResult;
            } else {
              await new Promise(r => setTimeout(r, 2000));
            }
          }
          setResult(polledResult);
        }
      } catch (error) {
        console.error("Simulation error", error);
      } finally {
        setLoading(false);
      }
    };
    runSim();
  }, [teams, currentRaceIndex, isHost, roomCode]);

  if (loading) return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center z-[100]">
      <div className="relative mb-8">
        <Loader2 className="animate-spin text-blue-500" size={80} />
        <div className="absolute inset-0 animate-ping bg-blue-500/20 rounded-full"></div>
      </div>
      <h2 className="text-4xl font-f1 italic font-bold text-white uppercase tracking-tighter">
        {isHost ? "Simulating GP..." : "Waiting for Telemetry..."}
      </h2>
      <p className="text-slate-500 text-xs mt-4 uppercase tracking-[0.3em] font-bold">Synchronizing Grid Data</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] p-8 overflow-y-auto animate-in fade-in zoom-in">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <header className="flex justify-between items-center border-b border-slate-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-yellow-500 rounded-2xl text-slate-950 shadow-xl shadow-yellow-500/20">
              <Trophy size={32} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Podium Ceremony</p>
              <h2 className="text-4xl font-f1 font-bold italic text-white uppercase">{result?.raceName}</h2>
            </div>
          </div>
          <button 
            onClick={() => result && onFinish(result)} 
            className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-2xl uppercase tracking-tighter transform hover:scale-105 active:scale-95"
          >
            CONTINUE TO HQ
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Grid Performance</h3>
            {teams.map(t => {
              const res = result?.teamResults.find(r => r.teamId === t.id);
              return (
                <div key={t.id} className={`p-8 rounded-3xl border-2 bg-slate-900/50 backdrop-blur-md transition-all ${t.color === 'cyan' ? 'border-cyan-500/30 shadow-cyan-500/10' : 'border-red-500/30 shadow-red-500/10'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className={`text-2xl font-f1 font-bold uppercase ${t.color === 'cyan' ? 'text-cyan-400' : 'text-red-500'}`}>{t.name}</h4>
                    <span className="font-f1 text-2xl text-green-400">+{res?.points} PTS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <PosBox pos={res?.driver1Position || 0} />
                    <PosBox pos={res?.driver2Position || 0} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-8 h-full">
            <div>
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <AlertCircle size={16} className="text-blue-500" /> Track Highlights
               </h3>
               <div className="space-y-3">
                 {result?.events.map((e, i) => (
                   <div key={i} className="text-sm text-slate-300 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 italic">
                     {e}
                   </div>
                 ))}
               </div>
            </div>
            <div className="pt-8 border-t border-slate-800">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Official Commentary</h3>
               <p className="text-sm text-slate-400 italic leading-relaxed bg-slate-800/20 p-6 rounded-2xl border border-slate-800">
                 "{result?.commentary}"
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PosBox = ({ pos }: { pos: number }) => (
  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Final Position</p>
    <p className={`text-4xl font-f1 font-bold ${pos <= 3 ? 'text-yellow-500' : pos <= 10 ? 'text-white' : 'text-slate-600'}`}>P{pos}</p>
  </div>
);

export default RaceSimulation;
