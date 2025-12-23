
import React from 'react';
import { TeamState, Driver } from '../types';
import { Dumbbell, Zap, ShieldCheck, TrendingUp, DollarSign, Target, AlertTriangle } from 'lucide-react';

interface TrainingProps {
  team: TeamState;
  onTrainDriver: (driverId: string, stat: 'pace' | 'consistency' | 'experience', cost: number) => void;
}

const Training: React.FC<TrainingProps> = ({ team, onTrainDriver }) => {
  // Función para calcular el coste dinámico basado en el stat actual
  const calculateCost = (baseCost: number, currentStat: number) => {
    // Multiplicador: Los stats por encima de 80 son mucho más caros de mejorar (15% extra por punto)
    const penaltyThreshold = 80;
    if (currentStat <= penaltyThreshold) return baseCost;
    
    const extraPoints = currentStat - penaltyThreshold;
    const multiplier = Math.pow(1.15, extraPoints); // 15% de incremento compuesto por punto
    return Math.round(baseCost * multiplier);
  };

  const getDifficultyLabel = (stat: number) => {
    if (stat >= 95) return { label: 'PERFECCIÓN', color: 'text-purple-400' };
    if (stat >= 90) return { label: 'NIVEL MAESTRO', color: 'text-orange-400' };
    if (stat >= 80) return { label: 'ALTO RENDIMIENTO', color: 'text-yellow-400' };
    return { label: 'DESARROLLO BASE', color: 'text-green-400' };
  };

  const TRAINING_PROGRAMS = [
    { 
      id: 'pace', 
      name: 'Simulador de Élite', 
      stat: 'pace', 
      gain: 2, 
      baseCost: 4000000, // Reducido al 50% de 8M
      icon: <Zap size={20} />, 
      color: 'text-red-500', 
      desc: 'Optimización de trazadas y puntos de frenada.' 
    },
    { 
      id: 'consistency', 
      name: 'Neuro-Coaching', 
      stat: 'consistency', 
      gain: 3, 
      baseCost: 3000000, // Reducido al 50% de 6M
      icon: <ShieldCheck size={20} />, 
      color: 'text-blue-500', 
      desc: 'Control de estrés y reducción de errores en stint largo.' 
    },
    { 
      id: 'experience', 
      name: 'Masterclass Técnica', 
      stat: 'experience', 
      gain: 5, 
      baseCost: 2000000, // Reducido al 50% de 4M
      icon: <TrendingUp size={20} />, 
      color: 'text-green-500', 
      desc: 'Gestión avanzada de neumáticos y ahorro de combustible.' 
    },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-f1 font-bold text-slate-100 italic tracking-tighter uppercase flex items-center gap-4">
            <Dumbbell className="text-red-600" size={40} /> Driver Performance Center
          </h2>
          <p className="text-slate-400 font-medium italic mt-2">
            La excelencia tiene un precio. Mejorar pilotos de élite requiere inversiones masivas.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl hidden md:block">
           <div className="flex items-center gap-2 text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-1">
             <AlertTriangle size={12} /> Aviso de Box
           </div>
           <p className="text-[10px] text-slate-500 max-w-[200px]">Los costes aumentan drásticamente cuando un stat supera los 80 puntos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {team.drivers.length === 0 ? (
          <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] p-20 text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest italic">Contrata pilotos en el mercado para empezar el entrenamiento.</p>
          </div>
        ) : (
          team.drivers.map((driver) => (
            <div key={driver.id} className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 flex flex-col lg:flex-row gap-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-600 opacity-50"></div>
              
              {/* Info Piloto */}
              <div className="lg:w-1/3 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img 
                      src={driver.image} 
                      className="w-24 h-24 rounded-3xl object-cover bg-slate-950 border-2 border-slate-800 shadow-xl" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://media.formula1.com/d_driver_fallback_image.png'; }} 
                    />
                    <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg italic">
                      PRO
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-f1 font-bold italic text-white">{driver.name}</h3>
                    <p className="text-xs font-black uppercase text-slate-500 tracking-widest">{driver.nationality}</p>
                  </div>
                </div>
                
                <div className="space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                  <StatRow label="Ritmo" value={driver.pace} color="bg-red-500" />
                  <StatRow label="Consistencia" value={driver.consistency} color="bg-blue-500" />
                  <StatRow label="Experiencia" value={driver.experience} color="bg-green-500" />
                </div>
              </div>

              {/* Programas con Costes Dinámicos */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                {TRAINING_PROGRAMS.map((prog) => {
                  const currentVal = driver[prog.stat as keyof Driver] as number;
                  const currentCost = calculateCost(prog.baseCost, currentVal);
                  const canAfford = team.funds >= currentCost;
                  const isMaxed = currentVal >= 99;
                  const diff = getDifficultyLabel(currentVal);

                  return (
                    <div key={prog.id} className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between hover:border-slate-600 transition-all group/card">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className={`p-3 rounded-xl bg-slate-900 w-fit ${prog.color}`}>
                            {prog.icon}
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded bg-slate-900 ${diff.color}`}>
                            {diff.label}
                          </span>
                        </div>
                        <h4 className="font-bold text-white uppercase text-sm tracking-tight">{prog.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{prog.desc}</p>
                        <div className="flex items-center gap-2 text-green-400 text-xs font-black uppercase">
                           <Target size={12} /> +{prog.gain} {prog.stat}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-600 font-bold uppercase">Inversión</span>
                          <span className={`text-sm font-f1 ${canAfford ? 'text-white' : 'text-red-500'} flex items-center gap-1`}>
                            {currentCost > prog.baseCost && <AlertTriangle size={12} className="text-orange-500" />}
                            ${(currentCost / 1000000).toFixed(2)}M
                          </span>
                        </div>
                        <button
                          disabled={!canAfford || isMaxed}
                          onClick={() => onTrainDriver(driver.id, prog.stat as any, currentCost)}
                          className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            isMaxed 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                            : !canAfford 
                            ? 'bg-red-900/20 text-red-500 cursor-not-allowed' 
                            : 'bg-white text-black hover:bg-red-600 hover:text-white shadow-lg group-hover/card:scale-[1.02]'
                          }`}
                        >
                          {isMaxed ? 'CAPACIDAD MÁXIMA' : 'EJECUTAR MEJORA'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatRow = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
      <span>{label}</span>
      <span className="text-white">{value}</span>
    </div>
    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default Training;
