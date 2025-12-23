
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, X, Play, Trophy, Wrench, Coins, Users, Zap } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tab?: string;
}

const STEPS: TutorialStep[] = [
  {
    title: "BIENVENIDO, DIRECTOR",
    description: "Acabas de tomar el mando de una escudería de F1. Tu objetivo: gestionar fondos, desarrollar el mejor coche y ganar el Mundial de Pilotos (WDC).",
    icon: <Trophy className="text-yellow-500" size={48} />,
    tab: "dashboard"
  },
  {
    title: "HQ DASHBOARD",
    description: "Aquí verás tus fondos, reputación y nivel técnico. Recuerda: ¡Necesitas 2 pilotos titulares y al menos 1 ingeniero para poder competir!",
    icon: <Zap className="text-red-500" size={48} />,
    tab: "dashboard"
  },
  {
    title: "MERCADO DE PILOTOS",
    description: "Firma a leyendas como Senna o Vettel. Un piloto con mucho 'Pace' puede compensar un coche lento, pero son caros de mantener.",
    icon: <Users className="text-blue-500" size={48} />,
    tab: "market"
  },
  {
    title: "FÁBRICA R&D",
    description: "Invierte en Aerodinámica, Motor y Chasis. Cada nivel te hace ganar décimas vitales en la simulación de carrera.",
    icon: <Wrench className="text-slate-400" size={48} />,
    tab: "factory"
  },
  {
    title: "SPONSORS Y ECONOMÍA",
    description: "Firma contratos con marcas. Si cumples el objetivo de posición en carrera, recibirás un pago extra masivo.",
    icon: <Coins className="text-green-500" size={48} />,
    tab: "sponsors"
  },
  {
    title: "EL MURO DE BOXES",
    description: "Antes de cada carrera elegirás estrategia. 1 Parada es segura y consistente; 2 Paradas es arriesgada pero muy rápida si tienes un buen piloto.",
    icon: <Play className="text-red-600" size={48} />,
    tab: "dashboard"
  }
];

interface TutorialProps {
  onClose: () => void;
  onStepChange: (tab: string) => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose, onStepChange }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (STEPS[next].tab) onStepChange(STEPS[next].tab!);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      if (STEPS[prev].tab) onStepChange(STEPS[prev].tab!);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border-4 border-red-600 rounded-[3rem] max-w-lg w-full p-10 shadow-[0_0_100px_rgba(220,38,38,0.3)] relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
          <div 
            className="h-full bg-red-600 transition-all duration-500" 
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-6 bg-slate-950 rounded-[2rem] shadow-inner border border-slate-800">
            {step.icon}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-3xl font-f1 font-bold text-white italic tracking-tighter uppercase">
              {step.title}
            </h3>
            <p className="text-slate-400 font-medium leading-relaxed italic">
              {step.description}
            </p>
          </div>

          <div className="flex w-full gap-4 pt-4">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="flex-1 py-4 border-2 border-slate-800 rounded-2xl text-slate-400 font-black uppercase text-xs hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Atrás
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex-[2] py-4 bg-white text-black rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
            >
              {currentStep === STEPS.length - 1 ? "¡ENTENDIDO!" : "Siguiente"} <ChevronRight size={16} />
            </button>
          </div>
          
          <button onClick={onClose} className="text-[10px] text-slate-600 font-black uppercase tracking-widest hover:text-slate-400">
            Saltar Guía
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
