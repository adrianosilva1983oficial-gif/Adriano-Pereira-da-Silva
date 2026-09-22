import React from 'react';
import {
  ShieldCheck,
  Building2,
  Smartphone,
  Download,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export type VersaoSistema = 'master' | 'cliente' | 'mobile';

interface VersaoSwitcherBarProps {
  versaoAtiva: VersaoSistema;
  onSelecionarVersao: (versao: VersaoSistema) => void;
  onAbrirModalExecutaveis: () => void;
}

export const VersaoSwitcherBar: React.FC<VersaoSwitcherBarProps> = ({
  versaoAtiva,
  onSelecionarVersao,
  onAbrirModalExecutaveis,
}) => {
  return (
    <div className="bg-slate-950 text-white border-b border-slate-800 px-3 sm:px-4 py-1.5 text-xs font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Identificador de Desmembramento */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-950/80 border border-sky-500/30 text-sky-300 font-bold text-[11px]">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>3 Módulos Desmembrados:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            {/* 1. Web Master */}
            <button
              type="button"
              onClick={() => onSelecionarVersao('master')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                versaoAtiva === 'master'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/60'
              }`}
              title="Módulo Web Master (Uso Restrito - Adriano Silva)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Web Master (Restrito)</span>
            </button>

            {/* 2. Web Cliente ERP */}
            <button
              type="button"
              onClick={() => onSelecionarVersao('cliente')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                versaoAtiva === 'cliente'
                  ? 'bg-sky-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/60'
              }`}
              title="Módulo Web Cliente (Gestão ERP, Planilhas de 111k matrículas e Relatórios)"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Web Cliente (ERP & Planilhas)</span>
            </button>

            {/* 3. App Mobile */}
            <button
              type="button"
              onClick={() => onSelecionarVersao('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                versaoAtiva === 'mobile'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60'
              }`}
              title="Aplicativo Mobile 100% Offline para Cadastristas de Campo"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>App Mobile (Campo)</span>
            </button>
          </div>
        </div>

        {/* Botão de Download dos 3 Executáveis */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAbrirModalExecutaveis}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-black text-[11px] shadow-sm transition active:scale-98 cursor-pointer"
            title="Gera e baixa o executável instalador de cada uma das 3 versões"
          >
            <Download className="w-3.5 h-3.5 text-white animate-bounce" />
            <span>Gerar Executáveis de Instalação (3 Versões)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
