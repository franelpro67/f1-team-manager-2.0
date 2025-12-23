
import React from 'react';
import { TeamState, CarStats } from '../types';
import { Wrench, Cpu, Zap, ShieldCheck, ChevronUp } from 'lucide-react';

interface FactoryProps {
  team: TeamState;
  onUpgrade: (part: keyof CarStats, cost: number) => void;
}

const Factory: React.FC<FactoryProps> = ({ team, onUpgrade }) => {
  // El coste sube con el nivel: 3M base * nivel del componente
  const getUpgradeCost = (currentLevel: number) => (currentLevel + 1) * 3000000;

  const upgradeOptions = [
    { id: 'aerodynamics', label: 'Aerodynamics', icon: <WindIcon />, description: 'Higher cornering speed and DRS efficiency.' },
    { id: 'powerUnit', label: 'Power Unit', icon: <Zap size={24} />, description: 'Straight-line speed and ERS recovery.' },
    { id: 'chassis', label: 'Chassis', icon: <Cpu size={24} />, description: 'Weight distribution and tire wear management.' },
    { id: 'reliability', label: 'Reliability', icon: <ShieldCheck size={24} />, description: 'Reduce risk of mechanical failures (DNF).' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-f1 font-bold text-slate-100 mb-2 italic">Advanced R&D Center</h2>
          <p className="text-slate-400 font-medium">Research cost scales with component complexity. Higher levels provide major gains.</p>
        </div>
        <div className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 shadow-xl">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Available Funds</p>
          <p className="text-2xl font-f1 text-green-400">${(team.funds / 1000000).toFixed(1)}M</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upgradeOptions.map((opt) => {
          const level = team.car[opt.id as keyof CarStats];
          const cost = getUpgradeCost(level);
          const canAfford = team.funds >= cost;

          return (
            <div key={opt.id} className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl group hover:border-red-500/40 transition-all flex flex-col shadow-lg backdrop-blur-md">
              <div className="flex items-start gap-6 mb-6">
                <div className="p-5 bg-slate-950 rounded-2xl text-red-500 group-hover:bg-red-600 group-hover:text-white transition-all shadow-lg">
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-2">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{opt.label}</h3>
                    <div className="text-right">
                       <span className="text-[10px] text-slate-500 font-bold block uppercase">Current Level</span>
                       <span className="font-f1 text-2xl text-red-500 font-bold">LVL {level}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{opt.description}</p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-800">
                <div className="flex justify-between items-center mb-4 text-xs font-bold uppercase text-slate-500">
                  <span>Upgrade to Lvl {level + 1}</span>
                  <span className={canAfford ? 'text-green-400' : 'text-red-400'}>${(cost / 1000000).toFixed(1)}M Required</span>
                </div>
                
                <button
                  disabled={!canAfford}
                  onClick={() => onUpgrade(opt.id as keyof CarStats, cost)}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl ${
                    !canAfford
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-white text-slate-950 hover:bg-red-600 hover:text-white transform hover:-translate-y-1'
                  }`}
                >
                  <ChevronUp size={20} />
                  DEVELOP COMPONENT
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WindIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4a2 2 0 1 0-1.4-3.4H2" />
  </svg>
);

export default Factory;
