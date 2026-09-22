import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Filter,
  Search,
  Eye,
  FileCheck2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Layers,
  MapPin,
  Camera,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { OrdemServicoSCIWeb, StatusValidacaoEmbasa } from '../types/os';
import { CensoRecord } from '../types/censo';
import { osService } from '../services/osService';
import { authService } from '../services/authService';
import { LISTA_BAIRROS } from '../data/bairrosData';

interface ValidacaoEmbasaViewProps {
  records: CensoRecord[];
  onRefreshRecords?: () => void;
}

export const ValidacaoEmbasaView: React.FC<ValidacaoEmbasaViewProps> = ({
  records,
  onRefreshRecords,
}) => {
  const [osList, setOsList] = useState<OrdemServicoSCIWeb[]>(osService.getAllOS());
  const [selectedFilter, setSelectedFilter] = useState<'TODAS' | StatusValidacaoEmbasa>('PENDENTE_VALIDACAO');
  const [selectedBairro, setSelectedBairro] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOS, setActiveOS] = useState<OrdemServicoSCIWeb | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Foto do hidrômetro sem legibilidade clara.');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);
  const [selectedOSIds, setSelectedOSIds] = useState<string[]>([]);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const unsub = osService.subscribe((list) => {
      setOsList(list);
    });
    return () => unsub();
  }, []);

  // Filtros
  const filteredList = osList.filter((os) => {
    const matchesFilter = selectedFilter === 'TODAS' || os.validacaoStatus === selectedFilter;
    const matchesBairro = selectedBairro === 'TODOS' || os.bairro === selectedBairro;
    const matchesQuery =
      searchQuery === '' ||
      os.matriculaEmbasa.includes(searchQuery) ||
      os.numeroOSSCIWeb.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.nomeConsumidorSCIWeb.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.cadastristaDesignado.toLowerCase().includes(searchQuery.toLowerCase()) ||
      os.logradouro.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesBairro && matchesQuery;
  });

  const matchedCenso = activeOS?.censoRecordId
    ? records.find((r) => r.id === activeOS.censoRecordId)
    : records.find((r) => r.matriculaEmbasa === activeOS?.matriculaEmbasa);

  // Ações de Validação
  const handleApprove = (osId: string) => {
    osService.validarOS(osId, true, currentUser.nome);
    setNotification({
      message: `OS homologada com sucesso para envio aos sistemas da Concessionária!`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 3500);
    if (onRefreshRecords) onRefreshRecords();
  };

  const handleOpenReject = (os: OrdemServicoSCIWeb) => {
    setActiveOS(os);
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (!activeOS) return;
    osService.validarOS(activeOS.id, false, currentUser.nome, rejectionReason);
    setShowRejectModal(false);
    setNotification({
      message: `OS devolvida para correção em campo pelo cadastrista.`,
      type: 'warn',
    });
    setTimeout(() => setNotification(null), 3500);
    if (onRefreshRecords) onRefreshRecords();
  };

  const handleTransmitirLote = () => {
    const idsToTransmit = selectedOSIds.length > 0
      ? selectedOSIds
      : osList.filter((os) => os.validacaoStatus === 'APROVADO_SCIWEB').map((os) => os.id);

    if (idsToTransmit.length === 0) {
      alert('Nenhuma OS com status "Aprovado para SCIWeb" selecionada para transmissão.');
      return;
    }

    const { sucessoCount, protocoloLote } = osService.transmitirLoteParaEmbasa(idsToTransmit);
    setSelectedOSIds([]);
    setNotification({
      message: `Lote de ${sucessoCount} cadastros transmitido com sucesso à Concessionária! Protocolo: ${protocoloLote}`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 6000);
    if (onRefreshRecords) onRefreshRecords();
  };

  const toggleSelectOS = (id: string) => {
    setSelectedOSIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const pendentesCount = osList.filter((o) => o.validacaoStatus === 'PENDENTE_VALIDACAO').length;
  const aprovadosCount = osList.filter((o) => o.validacaoStatus === 'APROVADO_SCIWEB').length;
  const rejeitadosCount = osList.filter((o) => o.validacaoStatus === 'REJEITADO_CAMPO').length;
  const transmitidosCount = osList.filter((o) => o.validacaoStatus === 'TRANSMITIDO_EMBASA').length;

  return (
    <div className="space-y-5">
      {/* Top Banner da Mesa Técnica */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold">
              Mesa Técnica de Validação & Auditoria Pré-Envio Concessionária
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Conferência criteriosa dos dados e fotos coletados em campo antes do envio definitivo para os sistemas comerciais da Concessionária. Evita glosas e retrabalho de cadastro.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTransmitirLote}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmitir Lote ({aprovadosCount} Aprovados)</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Cards de Métricas da Fila */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedFilter('PENDENTE_VALIDACAO')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
            selectedFilter === 'PENDENTE_VALIDACAO'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/40'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase">Aguardando Validação</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{pendentesCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Necessitam conferência da mesa</p>
        </button>

        <button
          onClick={() => setSelectedFilter('APROVADO_SCIWEB')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
            selectedFilter === 'APROVADO_SCIWEB'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/40'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase">Homologados Concessionária</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{aprovadosCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Prontos para transmissão</p>
        </button>

        <button
          onClick={() => setSelectedFilter('REJEITADO_CAMPO')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
            selectedFilter === 'REJEITADO_CAMPO'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/40'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase">Rejeitados / Reinspeção</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{rejeitadosCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Devolvidos ao cadastrista</p>
        </button>

        <button
          onClick={() => setSelectedFilter('TRANSMITIDO_EMBASA')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
            selectedFilter === 'TRANSMITIDO_EMBASA'
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/40'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-[11px] font-bold uppercase">Transmitidos Concessionária</span>
            <Send className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{transmitidosCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Enviados com protocolo</p>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Matrícula, OS Comercial, Consumidor ou Cadastrista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:border-sky-500"
            />
          </div>

          <select
            value={selectedBairro}
            onChange={(e) => setSelectedBairro(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="TODOS">Todos os Bairros</option>
            {LISTA_BAIRROS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as any)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="TODAS">Todos os Status</option>
            <option value="PENDENTE_VALIDACAO">Aguardando Validação</option>
            <option value="APROVADO_SCIWEB">Homologados Concessionária</option>
            <option value="REJEITADO_CAMPO">Rejeitados Campo</option>
            <option value="TRANSMITIDO_EMBASA">Transmitidos Concessionária</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Exibindo <strong>{filteredList.length}</strong> ordens de serviço
        </div>
      </div>

      {/* Grid: Lista de OS da Fila + Painel Lateral de Conferência */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Tabela / Lista da Fila de Auditoria */}
        <div className="lg:col-span-7 space-y-3">
          {filteredList.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 border border-slate-200 text-center text-slate-500">
              <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-700">Nenhum registro encontrado nesta categoria.</p>
              <p className="text-xs text-slate-400 mt-1">Selecione outro filtro ou realize uma nova busca.</p>
            </div>
          ) : (
            filteredList.map((os) => {
              const isSelected = activeOS?.id === os.id;
              const isChecked = selectedOSIds.includes(os.id);

              return (
                <div
                  key={os.id}
                  onClick={() => setActiveOS(os)}
                  className={`rounded-2xl p-4 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-400 shadow-sm ring-1 ring-sky-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectOS(os.id);
                        }}
                        className="rounded text-sky-600 mt-1 cursor-pointer"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded">
                            Matrícula {os.matriculaEmbasa}
                          </span>
                          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {os.numeroOSSCIWeb}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {os.quadra} — {os.lote}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm mt-1">{os.nomeConsumidorSCIWeb}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {os.logradouro}, nº {os.numeroPorta} — {os.bairro} ({os.zonaAbastecimento})
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Cadastrista: <strong>{os.cadastristaDesignado}</strong> ({os.equipeDesignada})
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
                          os.validacaoStatus === 'APROVADO_SCIWEB'
                            ? 'bg-emerald-100 text-emerald-800'
                            : os.validacaoStatus === 'REJEITADO_CAMPO'
                            ? 'bg-rose-100 text-rose-800'
                            : os.validacaoStatus === 'TRANSMITIDO_EMBASA'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {os.validacaoStatus === 'APROVADO_SCIWEB' && <CheckCircle2 className="w-3 h-3" />}
                        {os.validacaoStatus === 'REJEITADO_CAMPO' && <XCircle className="w-3 h-3" />}
                        {os.validacaoStatus === 'TRANSMITIDO_EMBASA' && <Send className="w-3 h-3" />}
                        {os.validacaoStatus === 'PENDENTE_VALIDACAO' && <Clock className="w-3 h-3" />}
                        <span>
                          {os.validacaoStatus === 'APROVADO_SCIWEB'
                            ? 'Aprovado'
                            : os.validacaoStatus === 'REJEITADO_CAMPO'
                            ? 'Rejeitado'
                            : os.validacaoStatus === 'TRANSMITIDO_EMBASA'
                            ? 'Transmitido'
                            : 'Pendente'}
                        </span>
                      </span>

                      {os.validadoPor && (
                        <span className="block text-[10px] text-slate-400 mt-1">
                          Por: {os.validadoPor}
                        </span>
                      )}
                    </div>
                  </div>

                  {os.motivoRejeicao && (
                    <div className="mt-2.5 p-2 bg-rose-50 rounded-lg text-rose-800 text-[11px] border border-rose-200">
                      <strong>Motivo de Rejeição:</strong> {os.motivoRejeicao}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Painel Lateral de Conferência e Homologação */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-sky-600" />
                <span>Prontuário de Conferência Técnica</span>
              </h3>
              {activeOS && (
                <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                  {activeOS.matriculaEmbasa}
                </span>
              )}
            </div>

            {activeOS ? (
              <div className="space-y-4 text-xs">
                {/* Dados da OS e do Morador */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">OS SCIWeb:</span>
                    <span className="font-mono font-bold text-slate-900">{activeOS.numeroOSSCIWeb}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consumidor:</span>
                    <span className="font-bold text-slate-900">{activeOS.nomeConsumidorSCIWeb}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Endereço:</span>
                    <span className="text-slate-800 text-right">{activeOS.logradouro}, nº {activeOS.numeroPorta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Localização Cartográfica:</span>
                    <span className="font-bold text-slate-900">Quadra {activeOS.quadra} • Lote {activeOS.lote}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hidrômetro SCIWeb:</span>
                    <span className="font-mono font-bold text-slate-900">{activeOS.hidrometroCadastradoSCIWeb}</span>
                  </div>
                </div>

                {/* Dados de Censo Coletados em Campo */}
                {matchedCenso ? (
                  <div className="p-3 bg-sky-50/50 rounded-xl space-y-1.5 border border-sky-100">
                    <div className="font-bold text-sky-950 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>Coleta de Campo Sincronizada</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Situação da Ligação:</span>
                      <span className="font-bold text-slate-900">{matchedCenso.situacaoLigacao}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Número do Hidrômetro:</span>
                      <span className="font-mono font-bold text-slate-900">{matchedCenso.numeroHidrometro}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Leitura Informada:</span>
                      <span className="font-mono font-bold text-sky-900">{matchedCenso.leituraAtualM3} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estado do Lacre:</span>
                      <span className="font-bold text-slate-900">{matchedCenso.estadoLacre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status da Visita:</span>
                      <span className="font-bold text-slate-900">{matchedCenso.statusVisita}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-800 text-[11px] border border-amber-200">
                    Aguardando sincronização da coleta de campo correspondente.
                  </div>
                )}

                {/* Polígono Cartográfico do Lote */}
                {activeOS.cartografiaLote ? (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                    <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Cartografia do Lote Aferida em Campo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Área Calculada:</span>
                      <span className="font-mono font-bold text-indigo-950">{activeOS.cartografiaLote.areaM2} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Perímetro:</span>
                      <span className="font-mono font-bold text-indigo-950">{activeOS.cartografiaLote.perimetroM} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vértices Georreferenciados:</span>
                      <span className="font-bold text-slate-900">{activeOS.cartografiaLote.vertices.length} pontos</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 text-[11px]">
                    Sem shape cartográfico registrado nesta matrícula.
                  </div>
                )}

                {/* Fotos de Campo */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <span>Registro Fotográfico do Cadastrista</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 text-center">
                      {matchedCenso?.fotoFachada ? (
                        <img
                          src={matchedCenso.fotoFachada}
                          alt="Fachada"
                          className="w-full h-24 object-cover"
                        />
                      ) : (
                        <div className="h-24 flex items-center justify-center text-[10px] text-slate-400">
                          Foto da Fachada
                        </div>
                      )}
                      <span className="block text-[10px] font-semibold py-1 bg-slate-50 text-slate-600">Fachada</span>
                    </div>

                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 text-center">
                      {matchedCenso?.fotoHidrometro ? (
                        <img
                          src={matchedCenso.fotoHidrometro}
                          alt="Hidrômetro"
                          className="w-full h-24 object-cover"
                        />
                      ) : (
                        <div className="h-24 flex items-center justify-center text-[10px] text-slate-400">
                          Foto do Hidrômetro
                        </div>
                      )}
                      <span className="block text-[10px] font-semibold py-1 bg-slate-50 text-slate-600">Hidrômetro</span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação do Auditor */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => handleApprove(activeOS.id)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprovar & Homologar para SCIWeb</span>
                  </button>

                  <button
                    onClick={() => handleOpenReject(activeOS)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rejeitar / Solicitar Reinspeção</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Selecione uma Ordem de Serviço na lista ao lado para auditar os dados e fotos.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Rejeição */}
      {showRejectModal && activeOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Devolver OS para Correção em Campo</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Matrícula <strong>{activeOS.matriculaEmbasa}</strong> — Cadastrista <strong>{activeOS.cadastristaDesignado}</strong>
            </p>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Motivo da Devolução / Inconsistência Encontrada:
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800"
              >
                <option value="Foto do hidrômetro sem legibilidade clara ou foco borrado.">
                  Foto do hidrômetro sem legibilidade clara
                </option>
                <option value="Leitura informada em desacordo com os dígitos visíveis na foto.">
                  Leitura informada em desacordo com a foto
                </option>
                <option value="Foto da fachada não exibe numeração predial do imóvel.">
                  Foto da fachada não exibe número predial
                </option>
                <option value="Divergência entre número de série do hidrômetro físico e digitado.">
                  Divergência no número de série do hidrômetro
                </option>
                <option value="Polígono cartográfico do lote incompatível com o quarteirão.">
                  Polígono cartográfico do lote incompatível
                </option>
                <option value="Imóvel sem hidrômetro registrado incorretamente.">
                  Imóvel sem hidrômetro registrado incorretamente
                </option>
              </select>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Confirmar Devolução
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
