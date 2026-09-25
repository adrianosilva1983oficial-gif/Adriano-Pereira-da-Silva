import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  AlertOctagon,
  Droplets,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Database,
  ArrowUpRight,
  Layers,
  HeartHandshake,
  ShieldAlert,
  BellRing,
  Activity,
  Gauge,
  Target,
  ListOrdered,
  Zap
} from 'lucide-react';
import { CensoRecord } from '../types/censo';
import { OrdemServicoSCIWeb } from '../types/os';
import { osService } from '../services/osService';
import { BAIRROS_DATA, LISTA_BAIRROS, META_TOTAL_LIGACOES_CONTRATO, ZONAS_ABASTECIMENTO } from '../data/bairrosData';
import { SyncState } from '../services/syncManager';
import { GraficoD3Supervisao } from './GraficoD3Supervisao';
import { CentralDisparoPushModal } from './CentralDisparoPushModal';
import { CentralBackupRedundanciaModal } from './CentralBackupRedundanciaModal';

interface SupervisaoDashboardProps {
  records: CensoRecord[];
  syncState: SyncState;
  onExportBackup: () => void;
}

export const SupervisaoDashboard: React.FC<SupervisaoDashboardProps> = ({
  records,
  syncState,
  onExportBackup,
}) => {
  const [bairroFiltroTabela, setBairroFiltroTabela] = useState<string | null>(null);
  const [modalPushAberto, setModalPushAberto] = useState(false);
  const [modalBackupAberto, setModalBackupAberto] = useState(false);
  const [osList, setOsList] = useState<OrdemServicoSCIWeb[]>(() => osService.getAllOS());
  const [horaAtual, setHoraAtual] = useState<string>(() =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );

  // Escuta em tempo real as atualizações de campo nas ordens de serviço
  useEffect(() => {
    const unsubscribe = osService.subscribe((updated) => {
      setOsList(updated);
    });
    const interval = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 15000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // RESUMO DE PRODUTIVIDADE EM TEMPO REAL
  // ==========================================
  // 1. Total de matrículas atribuídas (rotas programadas da planilha/SCIWeb + censos)
  const matriculasAtribuidasSet = new Set<string>();
  osList.forEach((os) => {
    if (os.matriculaEmbasa) matriculasAtribuidasSet.add(os.matriculaEmbasa.trim());
  });
  records.forEach((r) => {
    if (r.matriculaEmbasa) matriculasAtribuidasSet.add(r.matriculaEmbasa.trim());
  });
  const totalAtribuidas = Math.max(matriculasAtribuidasSet.size, osList.length, records.length);

  // 2. Total visitadas (efetuadas/executadas, ausentes ou impedimentos registrados em campo)
  const matriculasVisitadasSet = new Set<string>();
  let countExecutadas = 0;
  let countAusentes = 0;
  let countImpedidas = 0;

  osList.forEach((os) => {
    if (os.status === 'EXECUTADA') {
      matriculasVisitadasSet.add(os.matriculaEmbasa?.trim() || os.id);
      countExecutadas++;
    } else if (os.status === 'AUSENTE') {
      matriculasVisitadasSet.add(os.matriculaEmbasa?.trim() || os.id);
      countAusentes++;
    } else if (os.status === 'IMPEDIDA') {
      matriculasVisitadasSet.add(os.matriculaEmbasa?.trim() || os.id);
      countImpedidas++;
    }
  });

  // Também assegura a contabilização de registros de censo efetuados
  records.forEach((r) => {
    const mat = r.matriculaEmbasa?.trim() || r.id;
    if (!matriculasVisitadasSet.has(mat)) {
      matriculasVisitadasSet.add(mat);
      countExecutadas++;
    }
  });

  const totalVisitadas = matriculasVisitadasSet.size;
  const totalPendentes = Math.max(0, totalAtribuidas - totalVisitadas);

  // 3. Percentual de conclusão
  const percentualConclusao = totalAtribuidas > 0
    ? Math.min(100, Math.round((totalVisitadas / totalAtribuidas) * 1000) / 10)
    : 0;

  // 4. Média de visitas por hora
  const timestampsVisitas: number[] = [];
  records.forEach((r) => {
    const ts = r.atualizadoEm || r.criadoEm || r.coordenadas?.timestamp;
    if (ts && ts > 0) timestampsVisitas.push(ts);
  });
  osList.forEach((os) => {
    if (os.status === 'EXECUTADA' || os.status === 'AUSENTE' || os.status === 'IMPEDIDA') {
      const ts = os.dataUltimaTentativa || os.atualizadoEm || os.criadoEm;
      if (ts && ts > 0) timestampsVisitas.push(ts);
    }
  });
  timestampsVisitas.sort((a, b) => a - b);

  let horasDecorridas = 1;
  if (timestampsVisitas.length >= 2) {
    const diffMs = timestampsVisitas[timestampsVisitas.length - 1] - timestampsVisitas[0];
    const diffHoras = diffMs / (1000 * 60 * 60);
    if (diffHoras >= 0.25) {
      horasDecorridas = Math.max(0.5, Math.min(diffHoras, 8)); // Normalizado para a janela do turno de trabalho
    }
  }

  const mediaVisitasHora = totalVisitadas > 0
    ? (totalVisitadas / horasDecorridas).toFixed(1)
    : '0.0';

  // Cadastristas com vistorias em campo
  const cadastristasEmCampo = new Set(
    osList
      .filter((o) => o.status === 'EXECUTADA' || o.status === 'AUSENTE' || o.status === 'IMPEDIDA')
      .map((o) => o.cadastristaDesignado)
      .filter(Boolean)
  ).size || 1;

  const mediaPorCadastristaHora = totalVisitadas > 0
    ? (Number(mediaVisitasHora) / Math.max(1, cadastristasEmCampo)).toFixed(1)
    : '0.0';

  // Cálculos consolidados gerais
  const totalColetados = records.length;
  const totalSincronizados = records.filter((r) => r.syncStatus === 'synced').length;
  const totalPendentesOffline = records.filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'syncing').length;

  const totalClandestinas = records.filter((r) => r.situacaoLigacao === 'CLANDESTINA_GATO').length;
  const totalInativas = records.filter((r) => r.situacaoLigacao === 'INATIVA' || r.situacaoLigacao === 'CORTADA' || r.situacaoLigacao === 'SUPRIMIDA').length;
  const totalVazamentos = records.filter((r) => r.tipoVazamento !== 'NENHUM').length;
  const totalTarifaSocial = records.filter((r) => r.possuiCadUnicoBolsaFamilia || r.interesseTarifaSocial).length;
  const totalMulheresChefes = records.filter((r) => r.sexoResponsavel === 'FEMININO').length;
  const percMulheres = totalColetados > 0 ? Math.round((totalMulheresChefes / totalColetados) * 100) : 55;

  return (
    <div className="space-y-6">
      {/* CARD: Resumo de Produtividade em Tempo Real */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/90 relative overflow-hidden">
        {/* Gradiente sutil de fundo */}
        <div className="absolute top-0 right-0 w-96 h-32 bg-gradient-to-l from-sky-50 via-teal-50/40 to-transparent pointer-events-none" />

        <div className="relative z-10">
          {/* Cabeçalho do Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Resumo de Produtividade em Tempo Real
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Ao Vivo
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Acompanhamento instantâneo do avanço das equipes de campo no Sistema R7
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Atualizado: {horaAtual}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>{cadastristasEmCampo} {cadastristasEmCampo === 1 ? 'cadastrista em campo' : 'cadastristas em campo'}</span>
              </div>
            </div>
          </div>

          {/* Grid dos 4 Indicadores Principais Solicitados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* 1. Total de Matrículas Atribuídas */}
            <div className="rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Total Atribuídas
                </span>
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <ListOrdered className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalAtribuidas.toLocaleString('pt-BR')}{' '}
                <span className="text-xs font-semibold text-slate-400">matrículas</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                <span>Fila programada</span>
                <span className="font-bold text-slate-700">{totalPendentes} pendentes</span>
              </div>
            </div>

            {/* 2. Total Visitadas */}
            <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-50/50 via-white to-white border border-emerald-200/80 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-emerald-800 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Total Visitadas
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                {totalVisitadas.toLocaleString('pt-BR')}{' '}
                <span className="text-xs font-semibold text-emerald-600/80">vistorias</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-800/80 mt-2.5 pt-2 border-t border-emerald-100/60">
                <span className="font-bold text-emerald-700">{countExecutadas} efetuadas</span>
                <span className="font-semibold text-slate-500">{countAusentes + countImpedidas} ausentes/imp.</span>
              </div>
            </div>

            {/* 3. Percentual de Conclusão */}
            <div className="rounded-xl p-4 bg-gradient-to-br from-teal-50/50 via-white to-white border border-teal-200/80 shadow-xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between text-teal-800 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  % de Conclusão
                </span>
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-teal-700 tracking-tight">
                  {percentualConclusao}%
                </span>
                <span className="text-xs font-medium text-slate-500">do lote atribuído</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(percentualConclusao > 0 ? 4 : 0, percentualConclusao))}%` }}
                />
              </div>
            </div>

            {/* 4. Média de Visitas por Hora */}
            <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-50/50 via-white to-white border border-indigo-200/80 shadow-xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between text-indigo-800 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  Média Visitas / Hora
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Gauge className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-indigo-700 tracking-tight">
                  {mediaVisitasHora}
                </span>
                <span className="text-xs font-medium text-slate-500">visitas / hora</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-indigo-100/60">
                <span>Ritmo individual</span>
                <span className="font-bold text-indigo-800">~{mediaPorCadastristaHora} /h por cad.</span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso Segmentada Detalhada */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 mb-2 gap-1">
              <span className="font-semibold text-slate-700">Composição do Lote Operacional:</span>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  <span className="font-medium text-slate-700">{countExecutadas} Executadas ({totalAtribuidas > 0 ? Math.round((countExecutadas / totalAtribuidas) * 100) : 0}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                  <span className="font-medium text-slate-700">{countAusentes + countImpedidas} Ausentes / Impedidas ({totalAtribuidas > 0 ? Math.round(((countAusentes + countImpedidas) / totalAtribuidas) * 100) : 0}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" />
                  <span className="font-medium text-slate-500">{totalPendentes} Pendentes ({totalAtribuidas > 0 ? Math.round((totalPendentes / totalAtribuidas) * 100) : 0}%)</span>
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${totalAtribuidas > 0 ? (countExecutadas / totalAtribuidas) * 100 : 0}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`${countExecutadas} Executadas`}
              />
              <div
                style={{ width: `${totalAtribuidas > 0 ? ((countAusentes + countImpedidas) / totalAtribuidas) * 100 : 0}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`${countAusentes + countImpedidas} Ausentes / Impedidas`}
              />
              <div
                style={{ width: `${totalAtribuidas > 0 ? (totalPendentes / totalAtribuidas) * 100 : 100}%` }}
                className="bg-slate-200 h-full transition-all duration-500"
                title={`${totalPendentes} Pendentes`}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Top Banner de Supervisão */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-5 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-[11px] font-bold text-sky-300 border border-sky-500/30">
                Painel Gerencial PGCSA • R7
              </span>
              <span className="text-slate-400 text-xs">Contrato EMBASA nº 460024679</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">
              Supervisão de Atualização Cadastral & Redução de Perdas
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Monitoramento das 8 Zonas de Abastecimento (ZA 23 a 32) do Sistema de Reservação R7 (UML Cabula). Meta contratual de 111.765 ligações com tolerância zero a perda de dados em campo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setModalBackupAberto(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 text-xs font-bold transition shadow-md shadow-emerald-900/30 cursor-pointer active:scale-98"
              title="Configurar e monitorar a redundância automática (Cloud Storage + Download Local) por grande volume"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span>🛡️ Redundância & Backup Automático</span>
            </button>

            <button
              onClick={() => setModalPushAberto(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-3.5 py-2 text-xs font-bold transition shadow-md shadow-rose-900/30 cursor-pointer active:scale-98"
              title="Disparar notificações push urgentes para os dispositivos móveis das equipes de campo"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-rose-200" />
              <span>🚨 Central de Alertas Push (Campo)</span>
            </button>

            <button
              onClick={onExportBackup}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 text-xs font-bold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Base Completa (JSON/SCI)</span>
            </button>
          </div>
        </div>

        {/* Indicadores Principais em Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-xl bg-slate-800/80 p-3.5 border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Progresso Contratual</span>
              <Database className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {totalColetados}{' '}
              <span className="text-xs font-normal text-slate-400">/ {META_TOTAL_LIGACOES_CONTRATO.toLocaleString('pt-BR')}</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, (totalColetados / META_TOTAL_LIGACOES_CONTRATO) * 100))}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-800/80 p-3.5 border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Sincronização SCIWeb</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {totalSincronizados}{' '}
              <span className="text-xs font-normal text-slate-400">enviados</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{totalPendentesOffline} pendentes no celular</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-800/80 p-3.5 border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Combate a Perdas (Fraudes)</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-400">
              {totalClandestinas}{' '}
              <span className="text-xs font-normal text-slate-400">clandestinas</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {totalVazamentos} vazamentos rastreados
            </div>
          </div>

          <div className="rounded-xl bg-slate-800/80 p-3.5 border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Adesão Tarifa Social</span>
              <HeartHandshake className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-300">
              {totalTarifaSocial}{' '}
              <span className="text-xs font-normal text-slate-400">famílias</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {percMulheres}% lares chefiados por mulheres
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO INTERATIVO D3.JS: VOLUME DE COLETAS POR BAIRRO E POR EQUIPE DE CAMPO EM TEMPO REAL */}
      <GraficoD3Supervisao
        records={records}
        onSelectBairro={(b) => setBairroFiltroTabela(b === bairroFiltroTabela ? null : b)}
      />

      {/* Tabela de Acompanhamento por Bairro do R7 */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Diagnóstico Situacional & Coleta nos 25 Bairros de Abrangência
              </h3>
              {bairroFiltroTabela && (
                <span className="inline-flex items-center gap-1 rounded bg-sky-100 text-sky-800 px-2 py-0.5 text-[10px] font-bold">
                  Filtrado: {bairroFiltroTabela}
                  <button
                    onClick={() => setBairroFiltroTabela(null)}
                    className="ml-1 text-sky-600 hover:text-sky-900"
                    title="Limpar filtro"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Dados demográficos do Censo IBGE cruzados com as vistorias de campo do AquaSane Pro
            </p>
          </div>
          <div className="flex items-center gap-2">
            {bairroFiltroTabela && (
              <button
                type="button"
                onClick={() => setBairroFiltroTabela(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Ver todos os 25 bairros
              </button>
            )}
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              UML Salvador
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Bairro</th>
                <th className="py-2.5 px-3">Zona (ZA)</th>
                <th className="py-2.5 px-3">População (2022)</th>
                <th className="py-2.5 px-3">Domicílios</th>
                <th className="py-2.5 px-3">Meta Ligações</th>
                <th className="py-2.5 px-3">Censos Realizados</th>
                <th className="py-2.5 px-3">% Mulheres Chefes</th>
                <th className="py-2.5 px-3">Status Coleta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {LISTA_BAIRROS.filter((b) => (bairroFiltroTabela ? b === bairroFiltroTabela : true)).map((nomeBairro) => {
                const info = BAIRROS_DATA[nomeBairro];
                const countInBairro = records.filter((r) => r.bairro === nomeBairro).length;
                const perc = Math.round((countInBairro / Math.max(1, info.metaLigacoes)) * 100);

                return (
                  <tr key={nomeBairro} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {nomeBairro}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                        {info.zonas.join(', ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{info.populacaoCenso2022.toLocaleString('pt-BR')} hab</td>
                    <td className="py-2.5 px-3">{info.domicilios.toLocaleString('pt-BR')}</td>
                    <td className="py-2.5 px-3 font-mono">{info.metaLigacoes.toLocaleString('pt-BR')}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{countInBairro}</span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, perc))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{info.percentualMulheresChefes}%</td>
                    <td className="py-2.5 px-3">
                      {countInBairro > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Em campo
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px]">
                          Fila de visita
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relatório Técnico de Redução de Perdas (SINISA / EMBASA) */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 mb-2">
          Referência Técnica & Metas de Desperdício (SINISA & Portaria MDR 490/2021)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Índice Atual de Perdas em Salvador</span>
            <p className="text-lg font-black text-rose-600">54,47% da água tratada</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Perdas físicas por vazamentos na rede e comerciais por ligações clandestinas e fraudes.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Meta Nacional do Marco Legal (2034)</span>
            <p className="text-lg font-black text-emerald-600">≤ 25% de perdas</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Limite estabelecido pelo MDR de no máximo 216 litros por ligação/dia.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Unidades Alimentadoras do R7</span>
            <p className="font-semibold text-slate-900 mt-0.5">ETA Principal & ETA Parque da Bolandeira</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Adutora Principal e ETAs Teodoro Sampaio e Vieira de Mello abastecendo as 8 ZAs.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Central de Disparo de Alertas Push */}
      {modalPushAberto && (
        <CentralDisparoPushModal onClose={() => setModalPushAberto(false)} />
      )}

      {/* Modal Central de Redundância e Backup Automático */}
      <CentralBackupRedundanciaModal
        isOpen={modalBackupAberto}
        onClose={() => setModalBackupAberto(false)}
      />
    </div>
  );
};
