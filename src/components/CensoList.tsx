import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
  Eye,
  Plus,
  ArrowUpDown,
  Download,
  Phone,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { CensoRecord, BairroR7, ZonaAbastecimento, SyncStatus } from '../types/censo';
import { LISTA_BAIRROS, ZONAS_ABASTECIMENTO } from '../data/bairrosData';
import { contractSchemaService, populateContractValuesFromRecord } from '../services/contractSchemaService';

interface CensoListProps {
  records: CensoRecord[];
  onAddNew: () => void;
  onSelectRecord: (record: CensoRecord) => void;
  onStartNegociacao?: (record: CensoRecord) => void;
  onStartReclamacao?: (record: CensoRecord) => void;
}

export const CensoList: React.FC<CensoListProps> = ({
  records,
  onAddNew,
  onSelectRecord,
  onStartNegociacao,
  onStartReclamacao,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBairro, setSelectedBairro] = useState<string>('TODOS');
  const [selectedZA, setSelectedZA] = useState<string>('TODAS');
  const [syncFilter, setSyncFilter] = useState<'ALL' | 'PENDING' | 'SYNCED'>('ALL');
  const [situacaoFilter, setSituacaoFilter] = useState<string>('TODAS');

  const filteredRecords = records.filter((r) => {
    // Busca por texto
    const term = searchTerm.toLowerCase();
    const matchesTerm =
      !term ||
      r.matriculaEmbasa.toLowerCase().includes(term) ||
      r.numeroOS.toLowerCase().includes(term) ||
      r.nomeCliente.toLowerCase().includes(term) ||
      r.logradouro.toLowerCase().includes(term) ||
      r.numeroHidrometro.toLowerCase().includes(term);

    // Filtro Bairro
    const matchesBairro = selectedBairro === 'TODOS' || r.bairro === selectedBairro;

    // Filtro ZA
    const matchesZA = selectedZA === 'TODAS' || r.zonaAbastecimento === selectedZA;

    // Filtro Sincronização
    const matchesSync =
      syncFilter === 'ALL' ||
      (syncFilter === 'PENDING' && (r.syncStatus === 'pending' || r.syncStatus === 'syncing' || r.syncStatus === 'error')) ||
      (syncFilter === 'SYNCED' && r.syncStatus === 'synced');

    // Filtro Situação
    const matchesSituacao = situacaoFilter === 'TODAS' || r.situacaoLigacao === situacaoFilter;

    return matchesTerm && matchesBairro && matchesZA && matchesSync && matchesSituacao;
  });

  const exportCSV = () => {
    const headers = [
      'ID',
      'Matrícula EMBASA',
      'OS SCIWeb',
      'Zona Abastecimento',
      'Bairro',
      'Logradouro',
      'Nº Porta',
      'Quadra',
      'Lote',
      'Nome Cliente',
      'Telefone',
      'Situação Ligação',
      'Nº Hidrômetro',
      'Leitura m3',
      'Estado Hidrômetro',
      'Lacre',
      'Vazamento',
      'Tentativa Visita',
      'Status Visita',
      'Status Sincronização',
      'Data Coleta',
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      r.matriculaEmbasa,
      r.numeroOS,
      r.zonaAbastecimento,
      r.bairro,
      `"${r.logradouro}"`,
      r.numeroPorta,
      r.quadra,
      r.lote,
      `"${r.nomeCliente}"`,
      r.telefoneContato,
      r.situacaoLigacao,
      r.numeroHidrometro,
      r.leituraAtualM3,
      r.estadoHidrometro,
      r.estadoLacre,
      r.tipoVazamento,
      r.tentativaVisita,
      r.statusVisita,
      r.syncStatus,
      new Date(r.criadoEm).toLocaleString('pt-BR'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Censo_Embasa_R7_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportContractCSV = async () => {
    const activeFields = await contractSchemaService.getActiveFields();
    if (activeFields.length === 0) {
      alert('Nenhum campo contratual está ativo para exportação.');
      return;
    }

    const headers = activeFields.map((f) => f.key);
    const rows = filteredRecords.map((r) => {
      const vals = populateContractValuesFromRecord(r, activeFields);
      return activeFields.map((f) => {
        const v = vals[f.key];
        if (v === undefined || v === null) return '';
        const str = String(v).replace(/"/g, '""');
        return `"${str}"`;
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Censo_Contrato_EMBASA_38Campos_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="rounded-2xl bg-white p-3.5 sm:p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por matrícula, morador, logradouro ou Nº OS..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddNew}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Censo</span>
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition shrink-0"
              title="Exportar dados resumidos para planilha CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">CSV Básico</span>
            </button>

            <button
              onClick={exportContractCSV}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800 transition shrink-0"
              title="Exportar no formato das colunas contratuais da EMBASA (38 campos)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">CSV Contratual EMBASA</span>
            </button>
          </div>
        </div>

        {/* Linha de filtros avançados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Bairro R7
            </label>
            <select
              value={selectedBairro}
              onChange={(e) => setSelectedBairro(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs text-slate-800 font-medium"
            >
              <option value="TODOS">Todos os 25 bairros</option>
              {LISTA_BAIRROS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Zona de Abastecimento
            </label>
            <select
              value={selectedZA}
              onChange={(e) => setSelectedZA(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs text-slate-800 font-medium"
            >
              <option value="TODAS">Todas as ZAs (23 a 32)</option>
              {ZONAS_ABASTECIMENTO.map((z) => (
                <option key={z.zona} value={z.zona}>{z.zona}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sincronização
            </label>
            <select
              value={syncFilter}
              onChange={(e) => setSyncFilter(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs text-slate-800 font-medium"
            >
              <option value="ALL">Todos os registros</option>
              <option value="PENDING">💾 Offline no Aparelho (Pendente)</option>
              <option value="SYNCED">✓ Sincronizados com a Central</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Situação da Ligação
            </label>
            <select
              value={situacaoFilter}
              onChange={(e) => setSituacaoFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs text-slate-800 font-medium"
            >
              <option value="TODAS">Todas as situações</option>
              <option value="ATIVA">Ativa</option>
              <option value="INATIVA">Inativa</option>
              <option value="CLANDESTINA_GATO">Clandestina / Gato</option>
              <option value="CORTADA">Cortada</option>
              <option value="SUPRIMIDA">Suprimida</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Mostrando <strong>{filteredRecords.length}</strong> de {records.length} ligações cadastradas</span>
          <span className="text-[11px]">Ordenado pelas mais recentes</span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center border border-slate-200 shadow-xs">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Nenhum censo encontrado com estes filtros</p>
            <p className="text-xs text-slate-500 mt-1">
              Tente limpar os filtros de busca ou inicie uma nova coleta no campo.
            </p>
            <button
              onClick={onAddNew}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-700 text-white px-4 py-2 text-xs font-bold hover:bg-sky-800"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Novo Censo
            </button>
          </div>
        ) : (
          filteredRecords.map((r) => {
            const isPending = r.syncStatus === 'pending' || r.syncStatus === 'syncing';
            const isClandestina = r.situacaoLigacao === 'CLANDESTINA_GATO';
            const isInativa = r.situacaoLigacao === 'INATIVA' || r.situacaoLigacao === 'CORTADA';
            const hasLeak = r.tipoVazamento !== 'NENHUM';

            return (
              <div
                key={r.id}
                className={`group rounded-2xl bg-white p-4 shadow-xs border transition hover:shadow-md ${
                  isPending
                    ? 'border-amber-300/80 bg-amber-50/20'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      Matr. {r.matriculaEmbasa}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{r.numeroOS}</span>
                    <span className="rounded bg-sky-100 text-sky-800 px-2 py-0.5 text-[10px] font-bold">
                      {r.zonaAbastecimento}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {r.bairro}
                    </span>
                  </div>

                  {/* Sync Status Badge */}
                  <div className="flex items-center gap-2">
                    {r.syncStatus === 'synced' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Sincronizado</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[11px] font-semibold animate-pulse">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>Offline (Salvo no celular)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Localização / Logradouro
                    </span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {r.logradouro}, Nº {r.numeroPorta}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {r.quadra && `${r.quadra} `}{r.lote && `• ${r.lote}`} {r.complemento && `(${r.complemento})`}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Cliente / Morador
                    </span>
                    <p className="font-medium text-slate-900 mt-0.5">{r.nomeCliente}</p>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <span>{r.telefoneContato}</span>
                      {r.possuiCadUnicoBolsaFamilia && (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                          CadÚnico
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Situação & Hidrometria
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isClandestina
                            ? 'bg-rose-100 text-rose-800'
                            : isInativa
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.situacaoLigacao}
                      </span>
                      <span className="text-slate-700 font-mono font-semibold">
                        {r.leituraAtualM3} m³
                      </span>
                      {hasLeak && (
                        <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Vazamento
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[10px] block mt-0.5">
                      Hidr. {r.numeroHidrometro} • {r.estadoLacre === 'INTACTO' ? 'Lacre OK' : 'Lacre Rompido'}
                    </span>
                  </div>
                </div>

                {/* Footer do Card com Fotos e Ações */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span>Fotos:</span>
                      <span className="font-semibold text-slate-700">
                        {[r.fotoFachada, r.fotoHidrometro, r.fotoIrregularidade].filter(Boolean).length}/3
                      </span>
                    </div>
                    <span>•</span>
                    <span>{r.tentativaVisita}ª Visita</span>
                    <span>•</span>
                    <span>Coletado por {r.nomeCadastrista}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onSelectRecord(r)}
                      className="flex items-center gap-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 px-2.5 py-1 font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalhes da OS</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
