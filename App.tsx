
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import Market from './components/Market.tsx';
import Factory from './components/Factory.tsx';
import Engineering from './components/Engineering.tsx';
import Training from './components/Training.tsx';
import Economy from './components/Economy.tsx';
import Sponsors from './components/Sponsors.tsx';
import RaceSimulation from './components/RaceSimulation.tsx';
import SeasonFinale from './components/SeasonFinale.tsx';
import Tutorial from './components/Tutorial.tsx';
import { GameState, TeamState, RaceResult, Sponsor, TeamResult, RaceStrategy, Driver, Stock, Investment } from './types.ts';
import { INITIAL_FUNDS, VERSUS_FUNDS, AVAILABLE_SPONSORS, INITIAL_STOCKS } from './constants.tsx';
import { Users, User, Globe, Search, Send, Play, Star, Shield, LayoutDashboard, Flag } from 'lucide-react';
import * as OnlineService from './services/onlineService.ts';

const MAX_RACES_PER_SEASON = 10;
const SAVE_KEY = 'f1_tycoon_persistent_v1';

/**
 * Logo de Escudería Profesional
 */
export const TeamManagerLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'currentColor', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: 'currentColor', stopOpacity: 0.6 }} />
      </linearGradient>
    </defs>
    <path d="M50 5 L85 20 V45 C85 70 50 95 50 95 C50 95 15 70 15 45 V20 L50 5Z" fill="url(#shieldGrad)" />
    <path d="M30 30 L70 30 M25 45 L75 45 M35 60 L65 60" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
    <path d="M40 25 H50 V35 H40 V25ZM50 35 H60 V45 H50 V35ZM40 45 H50 V55 H40 V45Z" fill="white" opacity="0.8" />
    <path d="M50 8 L82 22 V45 C82 68 50 90 50 90 C50 90 18 68 18 45 V22 L50 8Z" stroke="white" strokeWidth="2" opacity="0.5" />
  </svg>
);

const getRandomSponsors = (count: number, excludeIds: string[] = []): Sponsor[] => {
  const available = AVAILABLE_SPONSORS.filter(s => !excludeIds.includes(s.id));
  const shuffled = [...available].sort(() => 0.5 - Math.random());
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
  color,
  investments: []
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [seasonTab, setSeasonTab] = useState<'wdc' | 'wcc'>('wdc');
  const [isRacing, setIsRacing] = useState(false);
  const [showSeasonFinale, setShowSeasonFinale] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error("Error cargando partida guardada", e);
      }
    }
    return {
      mode: 'single',
      teams: [createInitialTeam(0, "Tu Escudería", "red", INITIAL_FUNDS)],
      currentPlayerIndex: 0,
      currentRaceIndex: 0,
      seasonHistory: [],
      stocks: INITIAL_STOCKS
    };
  });

  const [showModeSelector, setShowModeSelector] = useState(() => !localStorage.getItem(SAVE_KEY));

  useEffect(() => {
    if (!showModeSelector) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    }
  }, [gameState, showModeSelector]);

  const handleSaveGame = useCallback(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
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
    return Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name);
    });
  }, [gameState.seasonHistory]);

  const handleStartGame = (mode: 'single' | 'versus' | 'online') => {
    if (mode === 'online') {
      setIsSearching(true);
      // Simulación de búsqueda online para este demo
      setTimeout(() => {
        setIsSearching(false);
        alert("Paddock Global no disponible en este momento. Prueba el modo Single Player.");
      }, 2000);
    } else {
      const funds = mode === 'single' ? INITIAL_FUNDS : VERSUS_FUNDS;
      const teams = mode === 'single' 
        ? [createInitialTeam(0, "Tu Escudería", "red", funds)]
        : [createInitialTeam(0, "Player 1", "red", funds), createInitialTeam(1, "Player 2", "cyan", funds)];
      
      const newState: GameState = { mode, teams, currentPlayerIndex: 0, currentRaceIndex: 0, seasonHistory: [], stocks: INITIAL_STOCKS };
      setGameState(newState);
      setShowModeSelector(false);
      setShowSeasonFinale(false);
      if (mode === 'single') setShowTutorial(true);
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
    setGameState(prev => {
      const updatedStocks = prev.stocks.map(stock => {
        const changePercent = (Math.random() - 0.5) * 2 * stock.volatility;
        const newPrice = Math.max(10, Math.round(stock.price * (1 + changePercent)));
        return { ...stock, price: newPrice, trend: changePercent * 100 };
      });
      const updatedTeams = prev.teams.map(team => {
        const teamRes = result.teamResults.find(r => r.teamId === team.id);
        const bestPos = teamRes ? Math.min(teamRes.driver1Position, teamRes.driver2Position) : 20;
        const activeSponsors = AVAILABLE_SPONSORS.filter(s => team.activeSponsorIds.includes(s.id));
        const sponsorPayout = activeSponsors.reduce((sum, s) => bestPos <= s.targetPosition ? sum + s.payoutPerRace : sum, 0);
        const excludedIds = [...team.activeSponsorIds, ...team.sponsorOffers.map(o => o.id)];
        const newOffers = getRandomSponsors(1, excludedIds);
        return {
          ...team,
          funds: team.funds + (21 - bestPos) * 300000 + sponsorPayout + 2000000,
          reputation: Math.min(100, team.reputation + Math.max(0, 10 - bestPos)),
          sponsorOffers: [...team.sponsorOffers, ...newOffers].slice(0, 4),
          currentStrategy: undefined 
        };
      });
      return {
        ...prev,
        stocks: updatedStocks,
        teams: updatedTeams,
        seasonHistory: [...prev.seasonHistory, result],
        currentRaceIndex: prev.currentRaceIndex + 1,
        currentPlayerIndex: 0
      };
    });
    if (gameState.currentRaceIndex + 1 >= MAX_RACES_PER_SEASON) {
      setTimeout(() => setShowSeasonFinale(true), 2000);
    } else {
      setActiveTab('season');
    }
  };

  const handleRestartSeason = () => {
    setGameState(prev => ({ ...prev, currentRaceIndex: 0, seasonHistory: [] }));
    setShowSeasonFinale(false);
    setActiveTab('dashboard');
  };

  const handleBuyStock = (stockId: string, quantity: number, price: number) => {
    setGameState(prev => {
      const newTeams = [...prev.teams];
      const team = newTeams[prev.currentPlayerIndex];
      const cost = quantity * price;
      if (team.funds < cost) return prev;
      const updatedInvestments = [...team.investments];
      const invIndex = updatedInvestments.findIndex(i => i.stockId === stockId);
      if (invIndex >= 0) {
        updatedInvestments[invIndex] = { ...updatedInvestments[invIndex], shares: updatedInvestments[invIndex].shares + quantity, totalInvested: updatedInvestments[invIndex].totalInvested + cost };
      } else {
        updatedInvestments.push({ stockId, shares: quantity, totalInvested: cost });
      }
      newTeams[prev.currentPlayerIndex] = { ...team, funds: team.funds - cost, investments: updatedInvestments };
      return { ...prev, teams: newTeams };
    });
  };

  const handleSellStock = (stockId: string, quantity: number, price: number) => {
    setGameState(prev => {
      const newTeams = [...prev.teams];
      const team = newTeams[prev.currentPlayerIndex];
      const updatedInvestments = [...team.investments];
      const invIndex = updatedInvestments.findIndex(i => i.stockId === stockId);
      if (invIndex === -1 || updatedInvestments[invIndex].shares < quantity) return prev;
      const revenue = quantity * price;
      const inv = updatedInvestments[invIndex];
      if (inv.shares === quantity) {
        updatedInvestments.splice(invIndex, 1);
      } else {
        updatedInvestments[invIndex] = { ...inv, shares: inv.shares - quantity, totalInvested: inv.totalInvested * ((inv.shares - quantity) / inv.shares) };
      }
      newTeams[prev.currentPlayerIndex] = { ...team, funds: team.funds + revenue, investments: updatedInvestments };
      return { ...prev, teams: newTeams };
    });
  };

  const handleAcceptSponsor = (sponsor: Sponsor) => {
    setGameState(prev => {
      const newTeams = prev.teams.map((team, i) => {
        if (i !== prev.currentPlayerIndex) return team;
        const uniqueSponsors = Array.from(new Set(team.activeSponsorIds));
        if (uniqueSponsors.length >= 3 || uniqueSponsors.includes(sponsor.id)) return team;
        return {
          ...team,
          funds: team.funds + sponsor.signingBonus,
          activeSponsorIds: [...uniqueSponsors, sponsor.id],
          sponsorOffers: team.sponsorOffers.filter(o => o.id !== sponsor.id)
        };
      });
      return { ...prev, teams: newTeams };
    });
  };

  const handleRejectSponsor = (sponsorId: string) => {
    setGameState(prev => {
      const newTeams = prev.teams.map((team, i) => {
        if (i !== prev.currentPlayerIndex) return team;
        return { ...team, sponsorOffers: team.sponsorOffers.filter(o => o.id !== sponsorId) };
      });
      return { ...prev, teams: newTeams };
    });
  };

  const handleCancelSponsor = (sponsorId: string) => {
    setGameState(prev => {
      const newTeams = prev.teams.map((team, i) => {
        if (i !== prev.currentPlayerIndex) return team;
        return { ...team, activeSponsorIds: team.activeSponsorIds.filter(id => id !== sponsorId) };
      });
      return { ...prev, teams: newTeams };
    });
  };

  const handleTrainDriver = (driverId: string, stat: 'pace' | 'consistency' | 'experience', cost: number) => {
    setGameState(prev => {
      const newTeams = [...prev.teams];
      const team = newTeams[prev.currentPlayerIndex];
      const driverIndex = team.drivers.findIndex(d => d.id === driverId);
      if (driverIndex === -1 || team.funds < cost) return prev;
      const updatedDrivers = [...team.drivers];
      const gain = stat === 'experience' ? 5 : stat === 'consistency' ? 3 : 2;
      updatedDrivers[driverIndex] = { ...updatedDrivers[driverIndex], [stat]: Math.min(99, updatedDrivers[driverIndex][stat] + gain) };
      newTeams[prev.currentPlayerIndex] = { ...team, funds: team.funds - cost, drivers: updatedDrivers };
      return { ...prev, teams: newTeams };
    });
  };

  /**
   * PANTALLA DE SELECCIÓN DE MODO (RENDERIZADO INICIAL Y RESET)
   */
  if (showModeSelector) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,210,190,0.1),transparent_50%)]" />
        
        <div className="max-w-6xl w-full z-10 space-y-16">
          <div className="text-center space-y-4">
            <TeamManagerLogo className="w-24 h-24 mx-auto text-red-500 animate-fade" />
            <h1 className="text-6xl font-f1 font-bold text-white italic tracking-tighter uppercase">F1 Tycoon <span className="text-red-600">Manager</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">FIA Official Strategic Simulator</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ModeCard 
              onClick={() => handleStartGame('single')}
              icon={<User size={48} />}
              title="Single Player"
              desc="Construye tu leyenda desde cero. Gana el WDC contra la IA."
              accent="border-red-600/30 hover:border-red-600"
            />
            <ModeCard 
              onClick={() => handleStartGame('versus')}
              icon={<Users size={48} />}
              title="Local Versus"
              desc="Compite contra un amigo en el mismo dispositivo por turnos."
              accent="border-cyan-500/30 hover:border-cyan-500"
            />
            <ModeCard 
              onClick={() => handleStartGame('online')}
              icon={<Globe size={48} />}
              title="Online Paddock"
              desc="Únete al Paddock Global y desafía a managers de todo el mundo."
              accent="border-blue-500/30 hover:border-blue-500"
            />
          </div>

          {isSearching && (
            <div className="flex flex-col items-center gap-4 animate-pulse">
               <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-blue-500 font-black uppercase text-[10px] tracking-widest">Buscando Sesión Online...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentTeam = gameState.teams[gameState.currentPlayerIndex];

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex transition-colors duration-500 ${currentTeam.color === 'cyan' ? 'selection:bg-cyan-500' : 'selection:bg-red-500'}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        teamColor={currentTeam.color} 
        onReset={() => {
           if(confirm("¿Estás seguro de que quieres borrar todos los datos? Esta acción es irreversible.")) {
              // Limpiar datos
              localStorage.removeItem(SAVE_KEY);
              // Forzar estado inicial para evitar errores de renderizado
              setGameState({
                mode: 'single',
                teams: [createInitialTeam(0, "Tu Escudería", "red", INITIAL_FUNDS)],
                currentPlayerIndex: 0,
                currentRaceIndex: 0,
                seasonHistory: [],
                stocks: INITIAL_STOCKS
              });
              // Mostrar selector de modo
              setShowModeSelector(true);
           }
        }} 
        onSave={handleSaveGame}
        onOpenTutorial={() => setShowTutorial(true)}
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
          {activeTab === 'market' && (
            <Market 
              team={currentTeam} 
              onHireDriver={d => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, funds: t.funds - d.cost, drivers: [...t.drivers, d], activeDriverIds: t.activeDriverIds.length < 2 ? [...t.activeDriverIds, d.id] : t.activeDriverIds} : t)}))} 
              onSellDriver={id => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, funds: t.funds + (t.drivers.find(x => x.id === id)?.cost || 0)*0.8, drivers: t.drivers.filter(x => x.id !== id), activeDriverIds: t.activeDriverIds.filter(x => x !== id)} : t)}))} 
            />
          )}
          {activeTab === 'training' && <Training team={currentTeam} onTrainDriver={handleTrainDriver} />}
          {activeTab === 'economy' && <Economy team={currentTeam} stocks={gameState.stocks} onBuyStock={handleBuyStock} onSellStock={handleSellStock} />}
          {activeTab === 'engineering' && (
            <Engineering 
              team={currentTeam} 
              onHireEngineer={e => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, funds: t.funds - e.cost, engineers: [...t.engineers, e]} : t)}))} 
              onFireEngineer={id => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, funds: t.funds + (t.engineers.find(e => e.id === id)?.cost || 0) * 0.8, engineers: t.engineers.filter(x => x.id !== id)} : t)}))} 
            />
          )}
          {activeTab === 'factory' && <Factory team={currentTeam} onUpgrade={(p, c) => setGameState(prev => ({...prev, teams: prev.teams.map((t, i) => i === prev.currentPlayerIndex ? {...t, funds: t.funds - c, car: {...t.car, [p]: t.car[p] + 1}} : t)}))} />}
          {activeTab === 'sponsors' && <Sponsors team={currentTeam} onAcceptSponsor={handleAcceptSponsor} onRejectSponsor={handleRejectSponsor} onCancelActive={handleCancelSponsor} />}
          {activeTab === 'season' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-end">
                 <div>
                   <h2 className="text-4xl font-f1 font-bold italic tracking-tighter uppercase">GP {gameState.currentRaceIndex} / {MAX_RACES_PER_SEASON}</h2>
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
                        <tr><th className="px-10 py-6">Pos</th><th className="px-10 py-6">Piloto</th><th className="px-10 py-6">Escudería</th><th className="px-10 py-6 text-right">Puntos</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {driverStandings.map((d, i) => {
                          const isYourDriver = currentTeam.drivers.some(td => td.name === d.name);
                          const badgeClass = currentTeam.color === 'cyan' ? 'bg-cyan-500 text-white' : 'bg-red-600 text-white';
                          return (
                            <tr key={d.name} className={`hover:bg-slate-800/20 transition-colors ${isYourDriver ? 'bg-red-600/5 relative' : i < 3 ? 'bg-slate-800/10' : ''}`}>
                              <td className="px-10 py-6 font-f1 text-lg"><span className={i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-500' : 'text-slate-500'}>{i + 1}</span></td>
                              <td className="px-10 py-6 font-bold text-white flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700">{d.name.substring(0,2)}</span> 
                                <div className="flex flex-col">
                                  <span>{d.name}</span>
                                  {isYourDriver && <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest w-fit mt-1 shadow-lg ${badgeClass}`}>TU EQUIPO</span>}
                                </div>
                              </td>
                              <td className="px-10 py-6 text-slate-400 text-xs font-bold uppercase italic">{d.team}</td>
                              <td className="px-10 py-6 text-right font-f1 text-xl text-red-500">{d.points}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                   <table className="w-full text-left">
                     <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]"><tr ><th className="px-10 py-8">Gran Premio</th>{gameState.teams.map(t => (<th key={t.id} className={`px-10 py-8 ${t.color === 'cyan' ? 'text-cyan-400' : 'text-red-600'}`}>{t.name}</th>))}</tr></thead>
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
      {showSeasonFinale && <SeasonFinale standings={driverStandings} onRestartSeason={handleRestartSeason} onFullReset={() => setShowModeSelector(true)} />}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} onStepChange={setActiveTab} />}
    </div>
  );
};

const ModeCard = ({ onClick, icon, title, desc, accent }: any) => (
  <button onClick={onClick} className={`group bg-slate-900/40 backdrop-blur-3xl border-2 ${accent} p-12 rounded-[3rem] transition-all hover:-translate-y-4 flex flex-col items-center text-center space-y-8 shadow-2xl relative overflow-hidden`}>
    <div className="p-8 bg-slate-950/80 rounded-[2rem] text-white border border-slate-800 group-hover:scale-110 transition-transform duration-500 group-hover:text-red-500">{icon}</div>
    <div className="relative z-10"><h2 className="text-3xl font-f1 font-bold mb-3 uppercase tracking-tighter italic text-white">{title}</h2><p className="text-slate-500 text-sm font-medium leading-relaxed italic px-4 group-hover:text-slate-300 transition-colors">{desc}</p></div>
    <div className="absolute inset-0 bg-gradient-to-t from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
  </button>
);

export default App;
