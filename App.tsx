
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Market from './components/Market';
import Factory from './components/Factory';
import Engineering from './components/Engineering';
import Sponsors from './components/Sponsors';
import RaceSimulation from './components/RaceSimulation';
import { GameState, TeamState, RaceResult, Sponsor, TeamResult, RaceStrategy } from './types';
import { INITIAL_FUNDS, VERSUS_FUNDS, AVAILABLE_SPONSORS } from './constants';
import { Users, User, Globe, Search, Send, Play } from 'lucide-react';
import * as OnlineService from './services/onlineService';

const getRandomSponsors = (count: number): Sponsor[] => {
  const shuffled = [...AVAILABLE_SPONSORS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const createInitialTeam = (id: number, name: string, color: string, funds: number): TeamState => ({
  id,
  name,
  funds,
  reputation: 10,
  drivers: [],
  activeDriverIds: [],
  activeSponsorIds: [],
  sponsorOffers: getRandomSponsors(2),
  engineers: [],
  car: { aerodynamics: 1, powerUnit: 1, chassis: 1, reliability: 1 },
  color
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [seasonTab, setSeasonTab] = useState<'wdc' | 'wcc'>('wdc');
  const [isRacing, setIsRacing] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(() => !localStorage.getItem('f1_tycoon_game_v4'));
  const [isSearching, setIsSearching] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('f1_tycoon_game_v4');
    if (saved) return JSON.parse(saved);
    return {
      mode: 'single',
      teams: [createInitialTeam(0, "Player 1 Team", "red", INITIAL_FUNDS)],
      currentPlayerIndex: 0,
      currentRaceIndex: 0,
      seasonHistory: []
    };
  });

  const handleSaveGame = useCallback(() => {
    localStorage.setItem('f1_tycoon_game_v4', JSON.stringify(gameState));
  }, [gameState]);

  const driverStandings = useMemo(() => {
    const standings: Record<string, { name: string, team: string, points: number }> = {};
    
    gameState.seasonHistory.forEach(race => {
      race.fullClassification.forEach((entry: TeamResult) => {
        if (!standings[entry.driverName]) {
          standings[entry.driverName] = { name: entry.driverName, team: entry.teamName, points: 0 };
        }
        standings[entry.driverName].points += entry.points || 0;
      });
    });

    return Object.values(standings).sort((a, b) => b.points - a.points);
  }, [gameState.seasonHistory]);

  const handleStartGame = (mode: 'single' | 'versus' | 'online') => {
    if (mode === 'online') {
      setIsSearching(true);
    } else {
      const funds = mode === 'single' ? INITIAL_FUNDS : VERSUS_FUNDS;
      const teams = mode === 'single' 
        ? [createInitialTeam(0, "Tu Escudería", "red", funds)]
        : [createInitialTeam(0, "Player 1", "red", funds), createInitialTeam(1, "Player 2", "cyan", funds)];
      
      const newState: GameState = { mode, teams, currentPlayerIndex: 0, currentRaceIndex: 0, seasonHistory: [] };
      setGameState(newState);
      setShowModeSelector(false);
    }
  };

  const handleRaceStartWithStrategy = (strategy: RaceStrategy) => {
    setGameState(prev => ({
      ...prev,
      teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? { ...t, currentStrategy: strategy } : t)
    }));
    setIsRacing(true);
  };

  const handleFinishRace = async (result: RaceResult) => {
    setIsRacing(false);
    const updatedState = { ...gameState };
    
    updatedState.teams = updatedState.teams.map(team => {
      const teamRes = result.teamResults.find(r => r.teamId === team.id);
      const bestPos = teamRes ? Math.min(teamRes.driver1Position, teamRes.driver2Position) : 20;
      const activeSponsors = AVAILABLE_SPONSORS.filter(s => team.activeSponsorIds.includes(s.id));
      const sponsorPayout = activeSponsors.reduce((sum, s) => bestPos <= s.targetPosition ? sum + s.payoutPerRace : sum, 0);
      
      return {
        ...team,
        funds: team.funds + (21 - bestPos) * 300000 + sponsorPayout + 2000000,
        reputation: Math.min(100, team.reputation + Math.max(0, 10 - bestPos)),
        sponsorOffers: [...team.sponsorOffers, ...getRandomSponsors(1)].slice(0, 4),
        currentStrategy: undefined // Reset strategy for next race
      };
    });

    updatedState.seasonHistory = [...updatedState.seasonHistory, result];
    updatedState.currentRaceIndex += 1;
    updatedState.currentPlayerIndex = 0;

    setGameState(updatedState);
    setActiveTab('season');
  };

  const handleAcceptSponsor = (sponsor: Sponsor) => {
    setGameState(prev => {
      const newTeams = [...prev.teams];
      const team = newTeams[prev.currentPlayerIndex];
      if (team.activeSponsorIds.length >= 3) return prev;
      newTeams[prev.currentPlayerIndex] = {
        ...team,
        funds: team.funds + sponsor.signingBonus,
        activeSponsorIds: [...team.activeSponsorIds, sponsor.id],
        sponsorOffers: team.sponsorOffers.filter(o => o.id !== sponsor.id)
      };
      return { ...prev, teams: newTeams };
    });
  };

  const currentTeam = gameState.teams[gameState.currentPlayerIndex];

  if (showModeSelector) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-8 overflow-hidden bg-slate-950">
        {/* Cinematic Background Image (Alpine F1 Team Car) */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[40s] scale-110 animate-[pulse_10s_ease-in-out_infinite]"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1647891941746-fe1d57dadc97?auto=format&fit=crop&q=80&w=2070')`,
          }}
        />
        {/* Cinematic Dynamic Overlays with Alpine-inspired Cyan/Blue tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-blue-900/10 to-slate-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.9)_100%)]" />
        
        <div className="relative z-10 text-center space-y-16 max-w-7xl w-full">
          <div className="space-y-4 animate-in fade-in slide-in-from-top-12 duration-1000">
            <h1 className="text-8xl md:text-9xl font-f1 font-bold text-red-600 italic tracking-tighter drop-shadow-[0_0_80px_rgba(220,38,38,0.8)]">F1 TYCOON</h1>
            <div className="flex items-center justify-center gap-6">
              <div className="h-0.5 w-24 bg-gradient-to-r from-transparent to-red-600"></div>
              <p className="text-slate-100 font-black uppercase tracking-[1em] text-[10px] md:text-xs">THE BEST F1 TEAM MANAGER</p>
              <div className="h-0.5 w-24 bg-gradient-to-l from-transparent to-red-600"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300 px-4">
            <ModeCard onClick={() => handleStartGame('single')} icon={<User size={44} />} title="SINGLE CAREER" desc="Lidera tu propia escudería francesa o internacional hacia el podio mundial." />
            <ModeCard onClick={() => handleStartGame('versus')} icon={<Users size={44} />} title="LOCAL VERSUS" desc="Duelo directo en el asfalto. El Paddock solo es lo suficientemente grande para uno." />
            <ModeCard onClick={() => setShowManualInput(true)} icon={<Globe size={44} />} title="PADDOCK ONLINE" desc="Sincroniza tu estrategia con otros directores de equipo en tiempo real." accent="border-cyan-600/70 hover:border-cyan-500 shadow-2xl shadow-cyan-900/30 bg-cyan-950/20" />
          </div>

          <div className="flex flex-col items-center gap-3 text-red-600 animate-bounce">
            <Play size={20} className="rotate-90 fill-red-600" />
            <span className="text-[10px] font-black tracking-[0.6em] uppercase text-slate-300">Arrancar Motores</span>
          </div>
        </div>

        {showManualInput && (
          <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
             <div className="bg-slate-900/90 p-12 rounded-[4rem] border-4 border-red-600 max-w-md w-full shadow-[0_0_150px_rgba(220,38,38,0.4)]">
                <h3 className="text-4xl font-f1 font-bold text-white mb-8 uppercase italic tracking-tighter text-center">Enlace de Radio</h3>
                <div className="space-y-6">
                   <button onClick={() => { setShowManualInput(false); handleStartGame('online'); }} className="w-full py-6 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-red-900/40 uppercase tracking-widest text-sm group"><Search size={24} className="group-hover:scale-125 transition-transform" /> BUSCAR RIVAL</button>
                   <div className="relative flex items-center py-6"><div className="flex-1 h-px bg-slate-800"></div><span className="px-6 text-xs text-slate-500 font-bold uppercase tracking-widest">O introducir código</span><div className="flex-1 h-px bg-slate-800"></div></div>
                   <div className="flex gap-4">
                      <input type="text" placeholder="CODE" value={manualCode} maxLength={6} onChange={(e) => setManualCode(e.target.value.toUpperCase())} className="flex-1 bg-slate-950/80 border-2 border-slate-700 rounded-2xl px-6 py-5 font-mono font-bold text-3xl tracking-[0.4em] text-white outline-none focus:border-red-600 transition-all text-center" />
                      <button onClick={async () => {
                        if (!manualCode) return;
                        setIsSearching(true);
                        const remote = await OnlineService.fetchGameState(manualCode.toUpperCase());
                        if (remote) {
                          setGameState({ mode: 'online', roomCode: manualCode.toUpperCase(), isHost: false, teams: remote.teams, currentPlayerIndex: 0, currentRaceIndex: 0, seasonHistory: [] });
                          setIsSearching(false);
                          setShowModeSelector(false);
                        } else {
                          alert("Código no válido");
                          setIsSearching(false);
                        }
                      }} className="p-6 bg-white text-black rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-2xl"><Send size={28} /></button>
                   </div>
                   <button onClick={() => setShowManualInput(false)} className="w-full py-4 text-slate-500 text-xs font-black uppercase tracking-[0.4em] hover:text-white transition-colors">VOLVER</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex transition-colors duration-500 ${currentTeam.color === 'cyan' ? 'selection:bg-cyan-500' : 'selection:bg-red-500'}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        teamColor={currentTeam.color} 
        onReset={() => setShowModeSelector(true)} 
        onSave={handleSaveGame}
        hasNewOffers={currentTeam.sponsorOffers.length > 0}
      />
      <main className="ml-64 flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto pb-20">
          {activeTab === 'dashboard' && (
            <Dashboard 
              team={currentTeam} 
              onRaceStart={handleRaceStartWithStrategy} 
              onRenameTeam={(n) => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, name: n} : t)}))} 
              onToggleActive={(id) => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, activeDriverIds: t.activeDriverIds.includes(id) ? t.activeDriverIds.filter(x => x !== id) : (t.activeDriverIds.length < 2 ? [...t.activeDriverIds, id] : t.activeDriverIds)} : t)}))} 
              onResetSeason={() => {}} 
              isVersus={gameState.mode !== 'single'} 
            />
          )}
          {activeTab === 'market' && <Market team={currentTeam} onHireDriver={d => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, funds: t.funds - d.cost, drivers: [...t.drivers, d], activeDriverIds: t.activeDriverIds.length < 2 ? [...t.activeDriverIds, d.id] : t.activeDriverIds} : t)}))} onSellDriver={id => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, funds: t.funds + (t.drivers.find(x => x.id === id)?.cost || 0)*0.5, drivers: t.drivers.filter(x => x.id !== id), activeDriverIds: t.activeDriverIds.filter(x => x !== id)} : t)}))} />}
          {activeTab === 'engineering' && <Engineering team={currentTeam} onHireEngineer={e => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, funds: t.funds - e.cost, engineers: [...t.engineers, e]} : t)}))} onFireEngineer={id => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, engineers: t.engineers.filter(x => x.id !== id)} : t)}))} />}
          {activeTab === 'factory' && <Factory team={currentTeam} onUpgrade={(p, c) => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, funds: t.funds - c, car: {...t.car, [p]: t.car[p] + 1}} : t)}))} />}
          {activeTab === 'sponsors' && <Sponsors team={currentTeam} onAcceptSponsor={handleAcceptSponsor} onRejectSponsor={() => {}} onCancelActive={() => {}} />}
          {activeTab === 'season' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-end">
                 <div>
                   <h2 className="text-4xl font-f1 font-bold italic tracking-tighter uppercase">Temporada {gameState.currentRaceIndex + 2024}</h2>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Resultados Oficiales FIA</p>
                 </div>
                 <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setSeasonTab('wdc')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${seasonTab === 'wdc' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white'}`}>Mundial Pilotos (WDC)</button>
                    <button onClick={() => setSeasonTab('wcc')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${seasonTab === 'wcc' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white'}`}>Mundial Constructores (WCC)</button>
                 </div>
               </div>

               {seasonTab === 'wdc' ? (
                 <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        <tr>
                          <th className="px-10 py-6">Pos</th>
                          <th className="px-10 py-6">Piloto</th>
                          <th className="px-10 py-6">Escudería</th>
                          <th className="px-10 py-6 text-right">Puntos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {driverStandings.map((d, i) => (
                          <tr key={d.name} className={`hover:bg-slate-800/20 transition-colors ${i < 3 ? 'bg-slate-800/10' : ''}`}>
                            <td className="px-10 py-6 font-f1 text-lg">
                              <span className={i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-500' : 'text-slate-500'}>
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-10 py-6 font-bold text-white flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700">{d.name.substring(0,2)}</span> {d.name}
                            </td>
                            <td className="px-10 py-6 text-slate-400 text-xs font-bold uppercase italic">{d.team}</td>
                            <td className="px-10 py-6 text-right font-f1 text-xl text-red-500">{d.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {driverStandings.length === 0 && (
                      <div className="py-32 text-center opacity-30"><Play size={64} className="mx-auto mb-4" /><p className="font-bold uppercase tracking-widest">Sin datos de carrera</p></div>
                    )}
                 </div>
               ) : (
                 <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                   <table className="w-full text-left">
                     <thead className="bg-slate-950/50 border-b border-slate-800"><tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]"><th className="px-10 py-8">Gran Premio</th>{gameState.teams.map(t => (<th key={t.id} className={`px-10 py-8 ${t.color === 'cyan' ? 'text-cyan-400' : 'text-red-600'}`}>{t.name}</th>))}</tr></thead>
                     <tbody className="divide-y divide-slate-800/50">
                       {gameState.seasonHistory.map((race, i) => (
                         <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                           <td className="px-10 py-8 font-bold text-white uppercase tracking-tight italic">{race.raceName}</td>
                           {gameState.teams.map(t => {
                             const res = race.teamResults.find(r => r.teamId === t.id);
                             return (<td key={t.id} className="px-10 py-8"><div className="flex items-center gap-4"><span className="font-f1 text-sm text-slate-400">P{res?.driver1Position} / P{res?.driver2Position}</span><span className={`text-[10px] font-black px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 uppercase`}>+{res?.points} PTS</span></div></td>);
                           })}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
          )}
        </div>
      </main>
      {isRacing && <RaceSimulation teams={gameState.teams} currentRaceIndex={gameState.currentRaceIndex} onFinish={handleFinishRace} isHost={gameState.isHost || gameState.mode !== 'online'} roomCode={gameState.roomCode} />}
    </div>
  );
};

const ModeCard = ({ onClick, icon, title, desc, accent = "border-slate-800 hover:border-red-600" }: any) => (
  <button onClick={onClick} className={`group bg-slate-900/60 backdrop-blur-2xl border-2 ${accent} p-14 rounded-[3rem] transition-all hover:-translate-y-4 flex flex-col items-center text-center space-y-10 shadow-2xl relative overflow-hidden`}>
    <div className="p-10 bg-slate-950/90 rounded-[2.5rem] group-hover:bg-red-600/50 transition-all text-white border border-slate-800/60 group-hover:border-red-600/80 shadow-inner group-hover:shadow-red-600/30 group-hover:scale-110 duration-500">{icon}</div>
    <div className="relative z-10"><h2 className="text-3xl font-f1 font-bold mb-4 uppercase tracking-tighter italic text-white group-hover:text-red-500 transition-colors">{title}</h2><p className="text-slate-400 text-sm font-medium leading-relaxed italic group-hover:text-slate-100 transition-colors px-4">{desc}</p></div>
    <div className="absolute inset-0 bg-gradient-to-t from-red-600/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
  </button>
);

export default App;
