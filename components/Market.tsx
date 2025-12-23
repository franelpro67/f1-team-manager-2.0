
import React from 'react';
import { TeamState, Driver } from '../types';
import { AVAILABLE_DRIVERS } from '../constants';
import { UserPlus, Trash2, Zap, ShieldCheck, Target, TrendingUp, Star } from 'lucide-react';

interface MarketProps {
  team: TeamState;
  onHireDriver: (driver: Driver) => void;
  onSellDriver: (driverId: string) => void;
}

const Market: React.FC<MarketProps> = ({ team, onHireDriver, onSellDriver }) => {
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-f1 font-bold text-slate-100 italic tracking-tighter uppercase">Mercado de Pilotos</h2>
        <p className="text-slate-400 font-medium italic">Firma a los mejores talentos de la historia y la actualidad. Máximo 4 pilotos por equipo.</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {AVAILABLE_DRIVERS.map((driver) => {
          const isHired = team.drivers.some(d => d.id === driver.id);
          const canAfford = team.funds >= driver.cost;
          
          return (
            <div key={driver.id} className={`bg-slate-900/60 border-2 rounded-[2.5rem] overflow-hidden transition-all flex flex-col group shadow-2xl ${isHired ? 'border-red-600 bg-red-950/10' : 'border-slate-800 hover:border-slate-600'}`}>
              {/* Header con Imagen */}
              <div className="relative h-64 bg-slate-950/50 flex items-end justify-center pt-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                <img 
                  src={driver.image} 
                  alt={driver.name} 
                  className="relative z-0 h-full w-auto object-contain transition-transform duration-700 group-hover:scale-110" 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://media.formula1.com/d_driver_fallback_image.png'; }}
                />
                <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                   <div className="bg-red-600 text-white px-3 py-1 rounded-lg font-f1 text-lg font-bold shadow-lg">
                     {driver.pace}
                   </div>
                   <span className="text-[10px] text-white/50 font-black uppercase text-center tracking-widest">Ritmo</span>
                </div>
                <div className="absolute top-6 left-6 z-20">
                   <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                     {driver.nationality}
                   </div>
                </div>
              </div>
              
              {/* Contenido / Estadísticas */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h4 className="text-2xl font-f1 font-bold uppercase italic tracking-tighter text-white group-hover:text-red-500 transition-colors">{driver.name}</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">{driver.experience} GP de Experiencia</p>
                </div>

                {/* Grid de Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <StatBox label="Consistencia" value={driver.consistency} icon={<ShieldCheck size={14} className="text-blue-400" />} />
                   <StatBox label="Marketing" value={driver.marketability} icon={<Star size={14} className="text-yellow-400" />} />
                   <StatBox label="Experiencia" value={driver.experience} icon={<TrendingUp size={14} className="text-green-400" />} />
                   <StatBox label="Ritmo" value={driver.pace} icon={<Zap size={14} className="text-red-400" />} />
                </div>
                
                <div className="mt-auto space-y-4">
                  <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Coste de Fichaje</p>
                    <p className="text-2xl font-f1 font-bold text-green-400">${(driver.cost / 1000000).toFixed(1)}M</p>
                  </div>
                  
                  {isHired ? (
                    <button
                      onClick={() => onSellDriver(driver.id)}
                      className="w-full py-4 bg-red-600/10 text-red-500 border border-red-600/30 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                      <Trash2 size={16} /> VENDER (+${(driver.cost * 0.8 / 1000000).toFixed(1)}M)
                    </button>
                  ) : (
                    <button
                      disabled={!canAfford || team.drivers.length >= 4}
                      onClick={() => onHireDriver(driver)}
                      className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl transform active:scale-95 ${
                        !canAfford || team.drivers.length >= 4
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-white text-black hover:bg-red-600 hover:text-white shadow-red-900/20'
                      }`}
                    >
                      <UserPlus size={18} /> FIRMAR CONTRATO
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

const StatBox = ({ label, value, icon }: any) => (
  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 flex flex-col gap-2">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className="flex items-end gap-2">
       <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-slate-100 opacity-50 transition-all duration-1000" style={{ width: `${value}%` }}></div>
       </div>
       <span className="text-xs font-bold text-slate-100">{value}</span>
    </div>
  </div>
);

export default Market;
