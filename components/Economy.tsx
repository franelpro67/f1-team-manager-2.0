
import React from 'react';
import { TeamState, Stock, Investment } from '../types';
import { TrendingUp, TrendingDown, Wallet, BarChart3, ArrowUpRight, ArrowDownRight, Info, DollarSign } from 'lucide-react';

interface EconomyProps {
  team: TeamState;
  stocks: Stock[];
  onBuyStock: (stockId: string, quantity: number, price: number) => void;
  onSellStock: (stockId: string, quantity: number, price: number) => void;
}

const Economy: React.FC<EconomyProps> = ({ team, stocks, onBuyStock, onSellStock }) => {
  const getInvestment = (stockId: string) => team.investments.find(i => i.stockId === stockId);

  const totalPortfolioValue = team.investments.reduce((sum, inv) => {
    const stock = stocks.find(s => s.id === inv.stockId);
    return sum + (inv.shares * (stock?.price || 0));
  }, 0);

  const totalProfit = team.investments.reduce((sum, inv) => {
    const stock = stocks.find(s => s.id === inv.stockId);
    const currentValue = inv.shares * (stock?.price || 0);
    return sum + (currentValue - inv.totalInvested);
  }, 0);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-f1 font-bold text-slate-100 italic tracking-tighter uppercase flex items-center gap-4">
          <TrendingUp className="text-green-500" size={40} /> F1 Stock Exchange
        </h2>
        <p className="text-slate-400 font-medium italic mt-2">Invierte tus beneficios en bolsa. El mercado fluctúa después de cada carrera.</p>
      </div>

      {/* Resumen Portfolio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
           <div className="flex items-center gap-3 text-slate-500 mb-2">
             <Wallet size={18} />
             <span className="text-xs font-black uppercase tracking-widest">Valor de Activos</span>
           </div>
           <p className="text-3xl font-f1 font-bold text-white">${(totalPortfolioValue / 1000).toFixed(1)}k</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
           <div className="flex items-center gap-3 text-slate-500 mb-2">
             <BarChart3 size={18} />
             <span className="text-xs font-black uppercase tracking-widest">P/L Global</span>
           </div>
           <p className={`text-3xl font-f1 font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
             {totalProfit >= 0 ? '+' : ''}${(totalProfit / 1000).toFixed(1)}k
           </p>
        </div>
        <div className="bg-slate-900 border border-green-500/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={60} />
           </div>
           <div className="flex items-center gap-3 text-slate-500 mb-2">
             <DollarSign size={18} />
             <span className="text-xs font-black uppercase tracking-widest">Saldo Disponible</span>
           </div>
           <p className="text-3xl font-f1 font-bold text-green-400">${(team.funds / 1000000).toFixed(2)}M</p>
        </div>
      </div>

      {/* Mercado de Valores */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-12">
        {stocks.map((stock) => {
          const inv = getInvestment(stock.id);
          const shares = inv?.shares || 0;
          const currentVal = shares * stock.price;
          const canBuy = team.funds >= stock.price * 10;
          const profit = shares > 0 ? (currentVal - inv!.totalInvested) : 0;

          return (
            <div key={stock.id} className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 hover:border-slate-700 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <div className="flex items-center gap-3">
                     <h3 className="text-2xl font-f1 font-bold text-white italic tracking-tighter">{stock.name}</h3>
                     <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-2 py-1 rounded">{stock.symbol}</span>
                   </div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{stock.category} • Volatilidad: {(stock.volatility * 100).toFixed(0)}%</p>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-f1 font-bold text-white">${stock.price}</p>
                   <p className={`text-xs font-bold flex items-center justify-end gap-1 ${stock.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                     {stock.trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                     {stock.trend.toFixed(2)}%
                   </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8">
                 {/* Panel de Usuario */}
                 <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/50">
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-3">Tus Acciones</p>
                    <div className="flex justify-between items-end">
                       <span className="text-2xl font-f1 font-bold text-white">{shares}</span>
                       <span className={`text-[10px] font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                         {profit >= 0 ? '+' : ''}${profit.toFixed(0)}
                       </span>
                    </div>
                 </div>

                 {/* Botones de Acción */}
                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => onBuyStock(stock.id, 10, stock.price)}
                      disabled={!canBuy}
                      className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        canBuy ? 'bg-white text-black hover:bg-green-500 hover:text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      Comprar x10
                    </button>
                    <button 
                      onClick={() => onSellStock(stock.id, shares, stock.price)}
                      disabled={shares <= 0}
                      className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        shares > 0 ? 'bg-slate-800 text-white hover:bg-red-600' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      Vender Todo
                    </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-slate-900/40 rounded-3xl border border-slate-800 flex items-start gap-4">
        <Info className="text-blue-500 shrink-0" size={24} />
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Aviso de Riesgo:</strong> El valor de tus inversiones puede fluctuar drásticamente después de cada Gran Premio. Las empresas de alta volatilidad (como Cripto) ofrecen retornos masivos pero pueden perder gran parte de su valor en una sola ronda. Diversifica tu cartera para asegurar el futuro de tu escudería.
        </p>
      </div>
    </div>
  );
};

export default Economy;
