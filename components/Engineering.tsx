
import React from 'react';
import { TeamState, Engineer } from '../types';
import { AVAILABLE_ENGINEERS } from '../constants';
import { Wrench, Zap, Wind, ShieldCheck, Briefcase, Trash2, Plus, DollarSign } from 'lucide-react';

interface EngineeringProps {
  team: TeamState;
  onHireEngineer: (engineer: Engineer) => void;
  onFireEngineer: (engineerId: string) => void;
}

const Engineering: React.FC<EngineeringProps> = ({ team, onHireEngineer, onFireEngineer }) => {
  const currentEngineers = team.engineers;
  const slots = [0, 1, 2];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-f1 font-bold text-slate-100 flex items-center gap-3 italic">
            <Briefcase className="text-red-500" /> Technical Staff Management
          </h2>
          <p className="text-slate-400 font-medium italic">You can hire up to 3 engineers. Their combined expertise drives car development.</p>
        </div>
      </header>

      {/* Current Team Slots */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {slots.map(index => {
          const eng = currentEngineers[index];
          return (
            <div key={index} className={`relative min-h-[260px] rounded-3xl border-2 p-6 flex flex-col transition-all ${
              eng ? 'bg-slate-900 border-red-600/30 shadow-xl' : 'bg-slate-950 border-dashed border-slate-800'
            }`}>
              {eng ? (
                <>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                    eng.specialty === 'Aero' ? 'bg-blue-600/20 text-blue-500' :
                    eng.specialty === 'Engine' ? 'bg-yellow-600/20 text-yellow-500' :
                    'bg-green-600/20 text-green-500'
                  }`}>
                    {eng.specialty === 'Aero' ? <Wind size={28} /> : 
                     eng.specialty === 'Engine' ? <Zap size={28} /> : 
                     <ShieldCheck size={28} />}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1 uppercase tracking-tight">{eng.name}</h4>
                  <p className="text-[10px] text-red-500 font-bold uppercase mb-4">{eng.specialty} Lead</p>
                  
                  <div className="bg-slate-950 rounded-xl p-3 flex justify-between items-center border border-slate-800 mb-4">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Technical Skill</span>
                    <span className="font-f1 text-xl text-white">{eng.rating}</span>
                  </div>

                  <button 
                    onClick={() => onFireEngineer(eng.id)}
                    className="mt-auto w-full py-2 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12} /> VENDER (+${(eng.cost * 0.8 / 1000000).toFixed(1)}M)
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-700">
                  <Plus size={40} className="mb-2 opacity-20" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-30">Empty Slot</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <div className="pt-4">
        <h3 className="text-xl font-f1 font-bold text-slate-100 mb-6 uppercase tracking-tighter">Available Experts</h3>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AVAILABLE_ENGINEERS.map((eng) => {
            const isHired = currentEngineers.some(e => e.id === eng.id);
            const canAfford = team.funds >= eng.cost;
            const hasSlots = currentEngineers.length < 3;
            
            return (
              <div key={eng.id} className={`bg-slate-900/60 border border-slate-800 rounded-3xl p-6 transition-all group ${isHired ? 'opacity-50 pointer-events-none grayscale' : 'hover:border-slate-600 hover:bg-slate-900 shadow-md'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-slate-950 text-slate-400 group-hover:text-red-500 transition-colors`}>
                    {eng.specialty === 'Aero' ? <Wind size={24} /> : eng.specialty === 'Engine' ? <Zap size={24} /> : <ShieldCheck size={24} />}
                  </div>
                  <span className="font-f1 text-xl text-white">{eng.rating}</span>
                </div>

                <h3 className="font-bold uppercase text-sm mb-1">{eng.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">{eng.specialty}</p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500">
                    <span>Fee</span>
                    <span className="text-green-400">${(eng.cost / 1000000).toFixed(1)}M</span>
                  </div>

                  <button
                    disabled={!canAfford || !hasSlots || isHired}
                    onClick={() => onHireEngineer(eng)}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition-all ${
                      !canAfford || !hasSlots || isHired
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-red-600 hover:text-white'
                    }`}
                  >
                    {isHired ? 'CONTRACTED' : 'HIRE STAFF'}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default Engineering;
