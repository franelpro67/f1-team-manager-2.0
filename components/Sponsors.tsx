
import React from 'react';
import { TeamState, Sponsor } from '../types';
import { AVAILABLE_SPONSORS } from '../constants';
import { Coins, Check, X, TrendingUp, Target, Award, Mail, AlertCircle, Lock } from 'lucide-react';

interface SponsorsProps {
  onAcceptSponsor: (sponsor: Sponsor) => void;
  onRejectSponsor: (sponsorId: string) => void;
  onCancelActive: (sponsorId: string) => void;
  team: TeamState;
}

const Sponsors: React.FC<SponsorsProps> = ({ team, onAcceptSponsor, onRejectSponsor, onCancelActive }) => {
  const uniqueActiveIds = Array.from(new Set(team.activeSponsorIds));
  const activeSponsors = AVAILABLE_SPONSORS.filter(s => uniqueActiveIds.includes(s.id));
  const offers = team.sponsorOffers;
  const isAtLimit = activeSponsors.length >= 3;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-f1 font-bold text-slate-100 flex items-center gap-3 italic">
            <Coins className="text-red-500" /> Commercial Dashboard
          </h2>
          <p className="text-slate-400 font-medium italic mt-2">
            GESTIÓN COMERCIAL: Gestiona tus alianzas estratégicas para maximizar los ingresos adicionales de tu escudería.
          </p>
        </div>
        {isAtLimit && (
          <div className="bg-red-600/20 border border-red-600/40 px-6 py-2 rounded-xl flex items-center gap-3 text-red-500 font-black uppercase tracking-widest text-[10px]">
            <Lock size={14} /> Cartera de Socios Llena (3/3)
          </div>
        )}
      </header>

      {/* Active Contracts */}
      <section>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Award size={16} /> Alianzas Activas ({activeSponsors.length}/3)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map(index => {
            const sponsor = activeSponsors[index];
            return (
              <div key={index} className={`min-h-[180px] rounded-3xl border-2 p-6 flex flex-col justify-between transition-all ${
                sponsor ? 'bg-slate-900 border-green-500/30 shadow-xl shadow-green-900/10' : 'bg-slate-950 border-dashed border-slate-800'
              }`}>
                {sponsor ? (
                  <>
                    <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 rounded-xl ${sponsor.logoColor} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                        {sponsor.name.charAt(0)}
                      </div>
                      <button onClick={() => onCancelActive(sponsor.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase truncate text-lg tracking-tight">{sponsor.name}</h4>
                      <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Contrato en Vigor</p>
                    </div>
                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-800">
                       <div className="flex flex-col">
                          <span className="text-[8px] text-slate-500 font-black uppercase">Objetivo</span>
                          <span className="font-f1 text-white text-sm">Top {sponsor.targetPosition}</span>
                       </div>
                       <div className="text-right">
                          <span className="text-[8px] text-slate-500 font-black uppercase">Pago/Carrera</span>
                          <p className="font-f1 text-green-400 text-sm">${(sponsor.payoutPerRace / 1000000).toFixed(1)}M</p>
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 opacity-20">
                    <Target size={32} className="mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Espacio Publicitario Libre</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Incoming Proposals */}
      <section className="pt-8">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Mail size={16} className="text-red-500" /> Propuestas Comerciales ({offers.length})
        </h3>
        {offers.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center">
            <AlertCircle size={48} className="text-slate-700 mb-4" />
            <p className="text-slate-500 italic font-medium">No hay ofertas nuevas. Gana reputación en pista para atraer a las grandes marcas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col hover:border-red-500/50 transition-all shadow-xl group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Coins size={120} />
                </div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl ${offer.logoColor} flex items-center justify-center text-white font-bold text-3xl shadow-lg transform group-hover:scale-110 transition-all`}>
                    {offer.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">{offer.category}</p>
                    <p className="text-2xl font-bold text-white uppercase italic tracking-tighter">{offer.name}</p>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl p-6 mb-8 space-y-4 border border-slate-800 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Bono por Firma</span>
                    <span className="font-f1 text-white text-lg">${(offer.signingBonus / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Ingreso por GP</span>
                    <span className="font-f1 text-green-400 text-lg">${(offer.payoutPerRace / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="h-px bg-slate-800" />
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Requisito</span>
                       <span className="text-[8px] text-slate-600 font-bold">Posición mínima necesaria</span>
                    </div>
                    <span className="font-f1 text-red-500 text-lg">Top {offer.targetPosition}</span>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <button
                    disabled={isAtLimit}
                    onClick={() => onAcceptSponsor(offer)}
                    className={`flex-1 py-5 rounded-xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest ${
                      isAtLimit 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
                      : 'bg-white text-black hover:bg-red-600 hover:text-white transform hover:-translate-y-1'
                    }`}
                  >
                    {isAtLimit ? <Lock size={16} /> : <Check size={16} />} 
                    {isAtLimit ? 'SIN ESPACIO' : 'FIRMAR CONTRATO'}
                  </button>
                  <button
                    onClick={() => onRejectSponsor(offer.id)}
                    className="px-6 border border-slate-800 text-slate-500 py-5 rounded-xl font-black text-[10px] hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest"
                  >
                    RECHAZAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Sponsors;
