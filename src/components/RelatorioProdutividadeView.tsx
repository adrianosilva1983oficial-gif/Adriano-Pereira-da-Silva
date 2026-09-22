import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  UserX,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Award,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Building
} from 'lucide-react';
import { OrdemServicoSCIWeb } from '../types/os';
import { CensoRecord } from '../types/censo';
import { osService } from '../services/osService';
import { LISTA_BAIRROS } from '../data/bairrosData';

interface RelatorioProdutividadeViewProps {
  records: CensoRecord[];
}

export const RelatorioProdutividadeView: React.FC<RelatorioProdutividadeViewProps> = ({
  records,
}) => {
  const [selectedBairro, setSelectedBairro] = useState<string>('TODOS');
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('MES_ATUAL');

  const allOS = osService.getAllOS();

  // Filtra por bairro se selecionado
  const filteredOS = allOS.filter((os) =>
    selectedBairro === 'TODOS' ? true : os.bairro === selectedBairro
  );

  // Consolidação de métricas gerais
  const totalAtribuidas = filteredOS.length;
  const totalExecutadas = filteredOS.filter((o) => o.status === 'EXECUTADA').length;
  const totalAusentes = filteredOS.filter((o) => o.status === 'AUSENTE').length;
  const totalImpedidas = filteredOS.filter((o) => o.status === 'IMPEDIDA').length;
  const totalPendentes = filteredOS.filter((o) => o.status === 'ABERTA' || o.status === 'EM_DESLOCAMENTO').length;

  const taxaEficacia = totalAtribuidas > 0 ? Math.round((totalExecutadas / totalAtribuidas) * 100) : 0;

  // Agrupamento de produtividade por colaborador
  const cadastristasMap: Record<
    string,
    {
      nome: string;
      equipe: string;
      atribuidas: number;
      executadas: number;
      ausentes: number;
      impedidas: number;
      pendentes: number;
    }
  > = {};

  filteredOS.forEach((os) => {
    const key = os.cadastristaDesignado || 'Não Atribuído';
    if (!cadastristasMap[key]) {
      cadastristasMap[key] = {
        nome: key,
        equipe: os.equipeDesignada || 'Equipe Geral',
        atribuidas: 0,
        executadas: 0,
        ausentes: 0,
        impedidas: 0,
        pendentes: 0,
      };
    }

    cadastristasMap[key].atribuidas += 1;
    if (os.status === 'EXECUTADA') cadastristasMap[key].executadas += 1;
    else if (os.status === 'AUSENTE') cadastristasMap[key].ausentes += 1;
    else if (os.status === 'IMPEDIDA') cadastristasMap[key].impedidas += 1;
    else cadastristasMap[key].pendentes += 1;
  });

  const rankingColaboradores = Object.values(cadastristasMap).sort(
    (a, b) => b.executadas - a.executadas
  );

  // Consolidação de motivos de impedimento
  const impedimentosMap: Record<string, number> = {
    'Casa Fechada / Trancada': 0,
    'Cão Bravo sem Guia': 0,
    'Área de Risco / Segurança': 0,
    'Recusa Formal do Morador': 0,
    'Lote Vago / Demolido': 0,
    'Outros Motivos': 0,
  };

  filteredOS
    .filter((o) => o.status === 'IMPEDIDA')
    .forEach((o) => {
      if (o.motivoImpedimento === 'CASA_FECHADA') impedimentosMap['Casa Fechada / Trancada']++;
      else if (o.motivoImpedimento === 'CAO_BRAVO') impedimentosMap['Cão Bravo sem Guia']++;
      else if (o.motivoImpedimento === 'AREA_RISCO') impedimentosMap['Área de Risco / Segurança']++;
      else if (o.motivoImpedimento === 'RECUSA_MORADOR') impedimentosMap['Recusa Formal do Morador']++;
      else if (o.motivoImpedimento === 'LOTE_VAGO' || o.motivoImpedimento === 'IMOVEL_DEMOLIDO') impedimentosMap['Lote Vago / Demolido']++;
      else impedimentosMap['Outros Motivos']++;
    });

  // Exportar Relatório CSV
  const handleExportCSV = () => {
    const headers = 'Colaborador;Equipe;Total Atribuídas;Matrículas Executadas;Ausentes;Impedimentos;Pendentes;Taxa Eficácia (%)\n';
    const rows = rankingColaboradores
      .map((c) => {
        const perc = c.atribuidas > 0 ? Math.round((c.executadas / c.atribuidas) * 100) : 0;
        return `"${c.nome}";"${c.equipe}";${c.atribuidas};${c.executadas};${c.ausentes};${c.impedidas};${c.pendentes};${perc}%`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Produtividade_Colaboradores_EMBASA_${new Date().toISOString().substring(0, 10)}.csv`);
    link.click();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner do Relatório */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold">
              Relatório de Produtividade dos Colaboradores & Ocorrências de Campo
            </h2>
          </div>
          <p className="text-xs text-sky-200 mt-1 max-w-2xl leading-relaxed">
            Acompanhamento em tempo real da produtividade das equipes de campo, volumetria de matrículas executadas com morador, ausências e motivos de impedimento físico conforme exigido pelo Contrato EMBASA nº 460024679.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-md transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-700" />
            <span>Exportar Relatório (CSV / Excel)</span>
          </button>
        </div>
      </div>

      {/* Controles de Filtro */}
      <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">Filtrar por Bairro:</span>
            <select
              value={selectedBairro}
              onChange={(e) => setSelectedBairro(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium"
            >
              <option value="TODOS">Todos os Bairros do R7</option>
              {LISTA_BAIRROS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">Período:</span>
            <select
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium"
            >
              <option value="MES_ATUAL">Mês Atual (Setembro/2026)</option>
              <option value="SEMANA_ATUAL">Semana Atual</option>
              <option value="TOTAL_ACUMULADO">Total Acumulado do Contrato</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Base Ativa: <strong>{totalAtribuidas}</strong> Matrículas no R7
        </div>
      </div>

      {/* 4 KPIs Principais Solicitados pelo Usuário */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Executadas */}
        <div className="rounded-2xl bg-white p-4 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider">Matrículas Executadas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalExecutadas}</div>
          <div className="flex items-center justify-between text-xs text-emerald-700 mt-1 font-medium">
            <span>Censo com Morador Realizado</span>
            <span className="font-bold">{taxaEficacia}% de eficácia</span>
          </div>
        </div>

        {/* Ausentes */}
        <div className="rounded-2xl bg-white p-4 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider">Quantidade Ausentes</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <UserX className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalAusentes}</div>
          <div className="flex items-center justify-between text-xs text-amber-700 mt-1 font-medium">
            <span>1ª, 2ª ou 3ª tentativa</span>
            <span className="font-bold">{totalAtribuidas > 0 ? Math.round((totalAusentes / totalAtribuidas) * 100) : 0}%</span>
          </div>
        </div>

        {/* Impedimentos */}
        <div className="rounded-2xl bg-white p-4 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider">Não Executadas (Impedimentos)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalImpedidas}</div>
          <div className="flex items-center justify-between text-xs text-rose-700 mt-1 font-medium">
            <span>Cão, risco, recusa, fechado</span>
            <span className="font-bold">{totalAtribuidas > 0 ? Math.round((totalImpedidas / totalAtribuidas) * 100) : 0}%</span>
          </div>
        </div>

        {/* Pendentes / Em Rota */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs font-bold uppercase tracking-wider">Abertas / Em Rota</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalPendentes}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1 font-medium">
            <span>Aguardando visita</span>
            <span className="font-bold">{totalAtribuidas > 0 ? Math.round((totalPendentes / totalAtribuidas) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Tabela de Produtividade por Colaborador */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Produtividade Individual por Cadastrista de Campo</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Desempenho por colaborador em relação às metas do contrato de cadastramento.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-y border-slate-200">
              <tr>
                <th className="py-3 px-3">Colaborador / Equipe</th>
                <th className="py-3 px-3 text-center">Atribuídas</th>
                <th className="py-3 px-3 text-center text-emerald-700">Executadas (Censo)</th>
                <th className="py-3 px-3 text-center text-amber-700">Ausentes</th>
                <th className="py-3 px-3 text-center text-rose-700">Impedimentos</th>
                <th className="py-3 px-3 text-center text-slate-600">Pendentes</th>
                <th className="py-3 px-3 text-right">Eficácia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankingColaboradores.map((c, idx) => {
                const perc = c.atribuidas > 0 ? Math.round((c.executadas / c.atribuidas) * 100) : 0;
                return (
                  <tr key={c.nome} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0">
                          {c.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{c.nome}</span>
                            {idx === 0 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5" /> Destaque
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{c.equipe}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-slate-700">{c.atribuidas}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/40">{c.executadas}</td>
                    <td className="py-3 px-3 text-center font-semibold text-amber-700 bg-amber-50/40">{c.ausentes}</td>
                    <td className="py-3 px-3 text-center font-semibold text-rose-700 bg-rose-50/40">{c.impedidas}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{c.pendentes}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-bold ${
                          perc >= 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : perc >= 40
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {perc}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discriminação Analítica de Impedimentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Distribuição dos Motivos de Impedimentos</span>
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Causas físicas registradas que impossibilitaram a execução imediata do censo.
          </p>

          <div className="space-y-3">
            {Object.entries(impedimentosMap).map(([motivo, count]) => {
              const perc = totalImpedidas > 0 ? Math.round((count / totalImpedidas) * 100) : 0;
              return (
                <div key={motivo}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{motivo}</span>
                    <span className="font-bold text-slate-900">{count} ({perc}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-2 rounded-full"
                      style={{ width: `${perc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span>Metas Contratuais & SLA de Cobertura R7</span>
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Parâmetros do Contrato EMBASA nº 460024679 para faturamento por ligação censada.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Meta Diária por Cadastrista:</span>
              <span className="font-bold text-slate-900">25 a 30 Matrículas / Dia</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Tolerância Máxima de Ausência sem Reinspeção:</span>
              <span className="font-bold text-amber-700">Até 3 Tentativas em dias alternados</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Exigência de Foto do Hidrômetro com Leitura:</span>
              <span className="font-bold text-emerald-700">100% Obrigatória (SLA 0 Glosa)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Georreferenciamento de Vértices do Lote:</span>
              <span className="font-bold text-indigo-700">Shape Cartográfico Válido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
