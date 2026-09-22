import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Sparkles,
  Layers,
  FileText,
  Filter,
  Check
} from 'lucide-react';
import {
  parsearDadosSCIWeb,
  EXEMPLO_CSV_SCIWEB,
  ResultadoParserSCIWeb,
} from '../services/sciwebParser';
import { osService } from '../services/osService';

interface MigradorSCIWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigracaoConcluida: (total: number) => void;
}

export const MigradorSCIWebModal: React.FC<MigradorSCIWebModalProps> = ({
  isOpen,
  onClose,
  onMigracaoConcluida,
}) => {
  if (!isOpen) return null;

  const [conteudoTexto, setConteudoTexto] = useState('');
  const [equipePadrao, setEquipePadrao] = useState('Equipe 01 - Cabula');
  const [cadastristaPadrao, setCadastristaPadrao] = useState('Adelmo Ribeiro');
  const [resultado, setResultado] = useState<ResultadoParserSCIWeb | null>(null);
  const [statusMigracao, setStatusMigracao] = useState<{
    sucesso: boolean;
    mensagem: string;
    inseridas: number;
    atualizadas: number;
  } | null>(null);

  const handleCarregarExemplo = () => {
    setConteudoTexto(EXEMPLO_CSV_SCIWEB);
    const parsed = parsearDadosSCIWeb(EXEMPLO_CSV_SCIWEB, equipePadrao, cadastristaPadrao);
    setResultado(parsed);
    setStatusMigracao(null);
  };

  const handleProcessarTexto = (texto: string) => {
    setConteudoTexto(texto);
    if (!texto.trim()) {
      setResultado(null);
      return;
    }
    const parsed = parsearDadosSCIWeb(texto, equipePadrao, cadastristaPadrao);
    setResultado(parsed);
    setStatusMigracao(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      handleProcessarTexto(text);
    };
    reader.readAsText(file);
  };

  const handleExecutarMigracao = () => {
    if (!resultado || resultado.ordens.length === 0) return;

    const { inseridas, atualizadas } = osService.importarOrdensDoSCIWeb(resultado.ordens);

    setStatusMigracao({
      sucesso: true,
      mensagem: `Migração concluída com sucesso! ${inseridas} Ordens de Serviço foram inseridas no espelho SCIWeb em sequência estrita de lotes crescentes.`,
      inseridas,
      atualizadas,
    });

    onMigracaoConcluida(inseridas + atualizadas);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header do Migrador */}
        <div className="bg-gradient-to-r from-sky-900 to-indigo-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-300">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  Migrador de OS do SCIWEB EMBASA
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 text-[10px] font-bold border border-sky-400/30">
                  Espelho Oficial
                </span>
              </div>
              <p className="text-xs text-sky-200/90 mt-0.5">
                Importe planilhas, CSV ou relatórios do SCIWeb e ordene automaticamente por lotes crescentes para campo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* Alerta de Sucesso após migrar */}
          {statusMigracao && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm">{statusMigracao.mensagem}</strong>
                <span className="text-xs text-emerald-700">
                  {statusMigracao.inseridas} novas OS adicionadas • {statusMigracao.atualizadas} atualizadas • Todas disponíveis no módulo Rotas & OS.
                </span>
              </div>
            </div>
          )}

          {/* Área de Entrada: Upload ou Colar Texto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-700" />
                  <span>Conteúdo Exportado do SCIWEB (CSV / TXT / Colar)</span>
                </label>
                <button
                  type="button"
                  onClick={handleCarregarExemplo}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[11px] border border-sky-200 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Carregar Exemplo Real EMBASA (15 OS)</span>
                </button>
              </div>

              <textarea
                value={conteudoTexto}
                onChange={(e) => handleProcessarTexto(e.target.value)}
                rows={6}
                placeholder="Cole aqui as linhas exportadas do SCIWEB da EMBASA (delimitadas por ';' ou tabulação) ou faça o upload do arquivo..."
                className="w-full rounded-2xl border border-slate-300 p-3.5 text-[11px] font-mono leading-relaxed focus:outline-hidden focus:border-sky-600 focus:ring-2 focus:ring-sky-100 transition resize-none bg-slate-50"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Layout suportado: NUMERO_OS; MATRICULA; BAIRRO; LOGRADOURO; PORTA; QUADRA; LOTE; CONSUMIDOR...</span>
                <label className="font-bold text-sky-700 hover:text-sky-800 cursor-pointer flex items-center gap-1">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Selecionar Arquivo</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Configuração de Equipe Alvo */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-indigo-700" />
                <span>Destino de Campo</span>
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Equipe Responsável
                </label>
                <select
                  value={equipePadrao}
                  onChange={(e) => {
                    setEquipePadrao(e.target.value);
                    if (conteudoTexto) handleProcessarTexto(conteudoTexto);
                  }}
                  className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-sky-600"
                >
                  <option value="Equipe 01 - Cabula">Equipe 01 - Cabula</option>
                  <option value="Equipe 02 - Arenoso">Equipe 02 - Arenoso</option>
                  <option value="Equipe 03 - Pernambués">Equipe 03 - Pernambués</option>
                  <option value="Equipe 04 - Mata Escura">Equipe 04 - Mata Escura</option>
                  <option value="Equipe 05 - São Gonçalo">Equipe 05 - São Gonçalo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cadastrista Padrão
                </label>
                <input
                  type="text"
                  value={cadastristaPadrao}
                  onChange={(e) => {
                    setCadastristaPadrao(e.target.value);
                    if (conteudoTexto) handleProcessarTexto(conteudoTexto);
                  }}
                  className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-sky-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-[11px] text-sky-900 leading-snug">
                <strong>Ordem de Lotes Crescentes:</strong> O sistema organiza os lotes automaticamente em sequência (LT-01, LT-02, LT-03...) para orientar o cadastrista de porta em porta.
              </div>
            </div>
          </div>

          {/* Prévia dos Dados Processados */}
          {resultado && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 text-sm">
                    Prévia da Migração: {resultado.totalValidos} OS Identificadas
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                    {resultado.quadrasDetectadas.length} Quadras
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                    {resultado.bairrosDetectados.join(', ')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExecutarMigracao}
                  disabled={resultado.totalValidos === 0}
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-sky-700/20 active:scale-98 transition cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>Confirmar Migração para o SCIWeb Local</span>
                </button>
              </div>

              {/* Tabela de Prévia */}
              <div className="overflow-x-auto max-h-60 rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Sequência / Lote</th>
                      <th className="p-2.5">Quadra</th>
                      <th className="p-2.5">Nº OS SCIWeb</th>
                      <th className="p-2.5">Matrícula</th>
                      <th className="p-2.5">Consumidor</th>
                      <th className="p-2.5">Endereço</th>
                      <th className="p-2.5">Hidrômetro</th>
                      <th className="p-2.5">Bairro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultado.ordens.map((item, idx) => (
                      <tr key={idx} className="hover:bg-sky-50/50 transition">
                        <td className="p-2.5 font-bold font-mono text-indigo-950">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 text-[10px] font-black mr-1">
                            #{idx + 1}
                          </span>
                          {item.lote}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700 font-semibold">{item.quadra}</td>
                        <td className="p-2.5 font-mono text-slate-600">{item.numeroOSSCIWeb}</td>
                        <td className="p-2.5 font-mono font-bold text-sky-700">{item.matriculaEmbasa}</td>
                        <td className="p-2.5 font-medium text-slate-800">{item.nomeConsumidorSCIWeb}</td>
                        <td className="p-2.5 text-slate-600">
                          {item.logradouro}, nº {item.numeroPorta}
                        </td>
                        <td className="p-2.5 font-mono text-slate-500">{item.hidrometroCadastradoSCIWeb}</td>
                        <td className="p-2.5 text-slate-600">{item.bairro}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Formato homologado para carga e espelhamento das Ordens de Serviço do SCIWeb EMBASA.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
