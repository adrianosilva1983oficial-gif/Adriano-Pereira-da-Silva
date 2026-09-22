import React from 'react';
import { Route, Plus, List, ShieldCheck, Download, Smartphone, Building2 } from 'lucide-react';
import { UnifiedActiveTab } from './Header';

interface MobileBottomNavProps {
  activeTab: UnifiedActiveTab;
  onSelectTab: (tab: UnifiedActiveTab) => void;
  onOpenMoreMenu: () => void;
  onOpenCentralDownload: () => void;
  recordsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMoreMenu,
  onOpenCentralDownload,
  recordsCount,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white px-1 py-1.5 shadow-2xl safe-area-inset-bottom">
      <div className="grid grid-cols-5 gap-0.5 items-center justify-around text-center">
        
        {/* Aba App Campo Fluido do Colaborador */}
        <button
          type="button"
          onClick={() => onSelectTab('mobile_colaborador')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'mobile_colaborador' ? 'text-emerald-400 font-black bg-emerald-950/60 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Modo Campo do Colaborador com Login e Rota Pronta"
        >
          <Smartphone className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight font-bold">📱 Campo</span>
        </button>

        {/* Aba Rotas OS */}
        <button
          type="button"
          onClick={() => onSelectTab('rotas_os')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'rotas_os' ? 'text-sky-400 font-bold bg-slate-800/80' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Route className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Rotas OS</span>
        </button>

        {/* Aba Formulário Censo */}
        <button
          type="button"
          onClick={() => onSelectTab('form')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer relative ${
            activeTab === 'form' ? 'text-sky-400 font-bold bg-slate-800/80' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center -mt-3 shadow-md shadow-sky-600/50">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Novo Censo</span>
        </button>

        {/* Aba Ligações */}
        <button
          type="button"
          onClick={() => onSelectTab('list')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer relative ${
            activeTab === 'list' ? 'text-sky-400 font-bold bg-slate-800/80' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <List className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Cadastros</span>
          {recordsCount > 0 && (
            <span className="absolute top-0.5 right-2 px-1 rounded-full bg-emerald-500 text-[9px] font-bold text-white leading-none">
              {recordsCount}
            </span>
          )}
        </button>

        {/* Mais / Download / Central APK */}
        <button
          type="button"
          onClick={onOpenCentralDownload}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-teal-400 hover:text-teal-300 transition cursor-pointer"
          title="Baixar APK, instalar no celular e backup offline"
        >
          <Download className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight font-bold">APK / App</span>
        </button>

      </div>
    </div>
  );
};
