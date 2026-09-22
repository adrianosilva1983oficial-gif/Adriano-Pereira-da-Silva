import React, { useState } from 'react';
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
  BellRing
} from 'lucide-react';
import { CensoRecord } from '../types/censo';
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

  // Cálculos consolidados
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
