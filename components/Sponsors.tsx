
import React from 'react';
import { TeamState, Sponsor } from '../types';
import { AVAILABLE_SPONSORS } from '../constants';
import { Coins, Check, X, TrendingUp, Target, Award, Mail, AlertCircle } from 'lucide-react';

interface SponsorsProps {
  team: TeamState;
  onAcceptSponsor: (sponsor: Sponsor) => void;
  onRejectSponsor: (sponsorId: string) => void;
  onCancelActive: (sponsorId: string) => void;
}

const Sponsors: React.FC<SponsorsProps> = ({ team, onAcceptSponsor, onRejectSponsor, onCancelActive }) => {
  const activeSponsors = AVAILABLE_SPONSORS.filter(s => team.activeSponsorIds.includes(s.id));
  const offers = team.sponsorOffers;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-f1 font-bold text-slate-100 flex items-center gap-3 italic">
            <Coins className="text-red-500" /> Commercial Dashboard
          </h2>
          <p className="text-slate-400 font-medium italic">Sponsors send offers based on your team's reputation. Manage your active contracts below.</p>
        </div>
      </header>

      {/* Active Contracts */}
      <section>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Award size={16} /> Active Partnerships ({activeSponsors.length}/3)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map(index => {
            const sponsor = activeSponsors[index];
            return (
              <div key={index} className={`min-h-[180px] rounded-3xl border-2 p-6 flex flex-col justify-between transition-all ${
                sponsor ? 'bg-slate-900 border-green-500/30' : 'bg-slate-950 border-dashed border-slate-800'
              }`}>
                {sponsor ? (
                  <>
                    <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 rounded-xl ${sponsor.logoColor} flex items-center justify-center text-white font-bold text-xl`}>
                        {sponsor.name.charAt(0)}
                      </div>
                      <button onClick={() => onCancelActive(sponsor.id)} className="text-slate-600 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase truncate">{sponsor.name}</h4>
                      <p className="text-[10px] text-green-500 font-bold uppercase">Contract Signed</p>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                       <span className="text-[10px] text-slate-500 font-bold uppercase">Race Goal</span>
                       <span className="font-f1 text-white">Top {sponsor.targetPosition}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 opacity-20">
                    <Target size={32} className="mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting Brand</span>
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
          <Mail size={16} className="text-red-500" /> Commercial Proposals ({offers.length})
        </h3>
        {offers.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center">
            <AlertCircle size={48} className="text-slate-700 mb-4" />
            <p className="text-slate-500 italic font-medium">No new offers from sponsors at the moment. Keep racing to gain visibility.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col hover:border-red-500/50 transition-all shadow-xl group">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-16 h-16 rounded-2xl ${offer.logoColor} flex items-center justify-center text-white font-bold text-3xl shadow-lg transform group-hover:scale-110 transition-all`}>
                    {offer.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{offer.category}</p>
                    <p className="text-xl font-bold text-white uppercase italic">{offer.name}</p>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl p-5 mb-8 space-y-4 border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-widest">Signing Bonus</span>
                    <span className="font-f1 text-white">${(offer.signingBonus / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-widest">Race Payout</span>
                    <span className="font-f1 text-green-400">${(offer.payoutPerRace / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="h-px bg-slate-800" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-widest">Target</span>
                    <span className="font-f1 text-red-500">Top {offer.targetPosition}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => onAcceptSponsor(offer)}
                    className="flex-1 bg-white text-black py-4 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> ACCEPT DEAL
                  </button>
                  <button
                    onClick={() => onRejectSponsor(offer.id)}
                    className="px-6 border border-slate-800 text-slate-500 py-4 rounded-xl font-bold text-xs hover:bg-slate-800 hover:text-white transition-all"
                  >
                    REJECT
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
