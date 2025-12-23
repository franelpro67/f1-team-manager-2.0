
import React, { useState } from 'react';
import { LayoutDashboard, Users, Wrench, Trophy, Info, Briefcase, Coins, RotateCcw, Save, CheckCircle, Dumbbell, TrendingUp, HelpCircle } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasNewOffers?: boolean;
  onReset?: () => void;
  onSave?: () => void;
  onOpenTutorial?: () => void;
  teamColor?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, hasNewOffers, onReset, onSave, onOpenTutorial, teamColor = 'red' }) => {
  const [savedStatus, setSavedStatus] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'HQ Dashboard', icon: LayoutDashboard },
    { id: 'market', label: 'Driver Market', icon: Users },
    { id: 'training', label: 'Entrenamiento', icon: Dumbbell },
    { id: 'engineering', label: 'Dpto. Técnico', icon: Briefcase },
    { id: 'economy', label: 'Economía', icon: TrendingUp },
    { id: 'sponsors', label: 'Sponsors', icon: Coins, notify: hasNewOffers },
    { id: 'factory', label: 'R&D Factory', icon: Wrench },
    { id: 'season', label: 'Season Stats', icon: Trophy },
  ];

  const handleManualSave = () => {
    if (onSave) onSave();
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const accentClass = teamColor === 'cyan' ? 'bg-cyan-500 shadow-cyan-900/20' : 'bg-red-600 shadow-red-900/20';
  const logoClass = teamColor === 'cyan' ? 'text-cyan-400' : 'text-red-500';

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className={`text-2xl font-f1 font-bold ${logoClass} tracking-tighter italic text-center transition-colors duration-500`}>F1 TYCOON</h1>
      </div>
      
      <nav className="flex-1 mt-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? `${accentClass} text-white shadow-lg` 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon size={20} />
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
              {item.notify && !isActive && (
                <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)] ${teamColor === 'cyan' ? 'bg-cyan-400' : 'bg-red-500'}`} />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 border-t border-slate-800">
        <button
          onClick={onOpenTutorial}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all text-sm font-semibold"
        >
          <HelpCircle size={16} className="text-blue-400" />
          <span>Cómo Jugar</span>
        </button>
        <button
          onClick={handleManualSave}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
            savedStatus 
            ? 'bg-green-600/20 text-green-500' 
            : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {savedStatus ? <CheckCircle size={16} /> : <Save size={16} />}
            <span>{savedStatus ? 'Guardado' : 'Guardar'}</span>
          </div>
        </button>
        <button
          onClick={onReset}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all text-sm font-semibold"
        >
          <RotateCcw size={16} />
          <span>Reset Game</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
