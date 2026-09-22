import React from 'react';
import { X, BookOpen, FileCheck, CheckCircle2, ShieldAlert, Award, MapPin } from 'lucide-react';

interface CadernoTecnicoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CadernoTecnicoModal: React.FC<CadernoTecnicoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="bg-gradient-to-r from-sky-900 to-indigo-950 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <BookOpen className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Caderno Técnico PGCSA & Diretrizes EMBASA</h3>
              <p className="text-xs text-sky-200">Contrato nº 460024679 • UML Salvador • Setor R7</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200">
            <h4 className="font-bold text-sky-950 text-sm flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-sky-700" />
              <span>Ordem de Execução por Lotes Crescentes (SCIWeb)</span>
            </h4>
            <p className="text-slate-700">
              As Ordens de Serviço (OS) devem ser obrigatoriamente abertas e executadas espelhando o SCIWeb da EMBASA, organizadas rigorosamente em sequência de <strong>lotes crescentes (LT-01, LT-02, LT-03...)</strong> por quadra e logradouro, garantindo o pente-fino cadastral em cada setor do R7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Navegação & Cartografia Mobile</span>
              </div>
              <p className="text-slate-600">
                O colaborador deve ser guiado pelo GPS em tempo real até a coordenada da matrícula alvo. No local, realiza a demarcação dos vértices cartográficos do lote/quadra no aplicativo.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Validação Prévia Obrigatória</span>
              </div>
              <p className="text-slate-600">
                Nenhum censo é remetido à EMBASA sem a homologação prévia da mesa técnica na tela de validação. Dados com leitura inconsistente ou divergência documental passam por auditoria.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2">
            <h4 className="font-bold text-slate-900">SLA e Procedimentos com Moradores Ausentes</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Morador Ausente:</strong> Devem ser realizadas no mínimo 2 visitas em dias ou horários alternativos (inclusive sábados) antes de encerrar como não localizado.</li>
              <li><strong>Impedimento Físico:</strong> Cão bravo, casa fechada sem acesso ou recusa formal devem ser fotografados e registrados com carimbo de coordenadas e hora.</li>
              <li><strong>Ouvidoria de Campo:</strong> Reclamações de moradores sobre vazamentos na rede ou danos em calçadas têm SLA contratual de até 48 horas para resposta.</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Entendido & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
