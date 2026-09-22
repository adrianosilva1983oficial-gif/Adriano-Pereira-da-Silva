import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Users,
  Route,
  Play,
  RotateCcw,
  Download,
  Check,
  X,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  MapPin,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from 'lucide-react';
import {
  processarArquivoExcelEmbasa,
  baixarPlanilhaModeloEmbasa,
  programarRotasPelaOrdemPlanilha,
  programarRotasPelaOrdemPlanilhaAsync,
  ResultadoLeituraExcel,
  LinhaPlanilhaEmbasa,
  ConfigProgramacaoRota,
} from '../services/excelProgramacaoService';
import { authService } from '../services/authService';
import { BairroR7 } from '../types/censo';
import { LISTA_BAIRROS } from '../data/bairrosData';

interface UploadPlanilhaExcelViewProps {
  onIrParaRotasOS: () => void;
}

export const UploadPlanilhaExcelView: React.FC<UploadPlanilhaExcelViewProps> = ({
  onIrParaRotasOS,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [carregandoArquivo, setCarregandoArquivo] = useState(false);
  const [progressoCarregamento, setProgressoCarregamento] = useState<{ processados: number; total: number; pct: number } | null>(null);
  const [progressoGravacao, setProgressoGravacao] = useState<{ processados: number; total: number; pct: number } | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [resultadoLeitura, setResultadoLeitura] = useState<ResultadoLeituraExcel | null>(null);
  const [linhasOrdenadas, setLinhasOrdenadas] = useState<LinhaPlanilhaEmbasa[]>([]);
  const [abaAtual, setAbaAtual] = useState<string>('');
  const [termoBuscaPrevia, setTermoBuscaPrevia] = useState('');

  // Parâmetros de Programação da Rota
  const [dataProgramada, setDataProgramada] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [equipeSelecionada, setEquipeSelecionada] = useState<string>('Equipe 01 - Frente Cabula');
  const [cadastristaSelecionado, setCadastristaSelecionado] = useState<string>('Adelmo Ribeiro');
  const [bairroPadrao, setBairroPadrao] = useState<BairroR7>('Cabula');
  const [sobrescreverExistentes, setSobrescreverExistentes] = useState(true);

  // Modalidade de Distribuição das OS da Planilha (Requisito do Usuário)
  const [modoDistribuicao, setModoDistribuicao] = useState<'HORARIO_COMERCIAL' | 'MANUAL_QUANTIDADES' | 'UNICO'>('HORARIO_COMERCIAL');
  const [matriculasPorDiaComercial, setMatriculasPorDiaComercial] = useState<number>(25); // ~18 a 20 min por censo em 8h comerciais
  const [distribuicaoManualMap, setDistribuicaoManualMap] = useState<Record<string, number>>({});

  // Paginação e Performance na Tabela
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(50);
  const [isProgramando, setIsProgramando] = useState(false);

  // Status após execução da programação
  const [resultadoProgramacao, setResultadoProgramacao] = useState<{
    sucesso: boolean;
    totalInseridas: number;
    totalAtualizadas: number;
    mensagem: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega lista de funcionários cadastristas ativos com escuta em tempo real
  const [funcionariosAtivos, setFuncionariosAtivos] = useState(() => authService.getFuncionariosAtivos());

  useEffect(() => {
    const unsub = authService.subscribeFuncionarios((todos) => {
      setFuncionariosAtivos(todos.filter((f) => f.status === 'ATIVO'));
    });
    return unsub;
  }, []);

  const cadastristasDisponiveis = funcionariosAtivos.filter(
    (f) => f.perfil === 'CADASTRISTA_CAMPO' || f.perfil === 'SUPERVISOR_GERAL' || f.perfil === 'ADMIN_CONTRATO'
  );

  const equipesDisponiveis = Array.from(
    new Set(funcionariosAtivos.map((f) => f.equipe).filter(Boolean))
  ) as string[];

  if (equipesDisponiveis.length === 0) {
    equipesDisponiveis.push('Equipe 01 - Frente Cabula');
  }

  useEffect(() => {
    if (cadastristasDisponiveis.length > 0 && !cadastristaSelecionado) {
      setCadastristaSelecionado(cadastristasDisponiveis[0].nome);
    }
    if (equipesDisponiveis.length > 0 && !equipeSelecionada) {
      setEquipeSelecionada(equipesDisponiveis[0]);
    }
  }, [cadastristasDisponiveis, equipesDisponiveis, cadastristaSelecionado, equipeSelecionada]);

  const handleProcessarArquivo = async (file: File, abaAlvo?: string) => {
    setCarregandoArquivo(true);
    setProgressoCarregamento({ processados: 0, total: 100, pct: 5 });
    setErroArquivo(null);
    setResultadoProgramacao(null);
    setPaginaAtual(1);

    try {
      const res = await processarArquivoExcelEmbasa(
        file,
        abaAlvo,
        (processados, total, pct) => {
          setProgressoCarregamento({ processados, total, pct });
        }
      );
      setResultadoLeitura(res);
      setAbaAtual(res.abaSelecionada);
      // Mantém estritamente a ordem da planilha
      setLinhasOrdenadas([...res.linhas]);
    } catch (err: any) {
      setErroArquivo(err.message || 'Erro ao processar a planilha Excel.');
      setResultadoLeitura(null);
      setLinhasOrdenadas([]);
    } finally {
      setCarregandoArquivo(false);
      setProgressoCarregamento(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessarArquivo(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessarArquivo(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Mover linha para cima na ordem de atendimento
  const handleMoverLinha = (index: number, direcao: 'cima' | 'baixo') => {
    const novoIndex = direcao === 'cima' ? index - 1 : index + 1;
    if (novoIndex < 0 || novoIndex >= linhasOrdenadas.length) return;

    const copia = [...linhasOrdenadas];
    const temp = copia[index];
    copia[index] = copia[novoIndex];
    copia[novoIndex] = temp;

    // Recalcula ordens manuais sequenciais
    copia.forEach((item, idx) => {
      item.ordemManual = idx + 1;
    });

    setLinhasOrdenadas(copia);
  };

  // Restaurar para a ordem física original do arquivo Excel
  const handleRestaurarOrdemPlanilha = () => {
    if (!resultadoLeitura) return;
    const restaurado = [...resultadoLeitura.linhas].sort((a, b) => a.linhaOriginal - b.linhaOriginal);
    restaurado.forEach((item) => {
      item.ordemManual = undefined;
    });
    setLinhasOrdenadas(restaurado);
  };

  // Inverter ordem de atendimento (do último para o primeiro)
  const handleInverterOrdem = () => {
    const invertido = [...linhasOrdenadas].reverse();
    invertido.forEach((item, idx) => {
      item.ordemManual = idx + 1;
    });
    setLinhasOrdenadas(invertido);
  };

  // Programar a rota com a sequência definida
  const handleExecutarProgramacao = async () => {
    if (!resultadoLeitura || linhasOrdenadas.length === 0 || isProgramando) return;

    setIsProgramando(true);
    setResultadoProgramacao(null);
    setErroArquivo(null);
    setProgressoGravacao({ processados: 0, total: linhasOrdenadas.length, pct: 5 });

    // Constrói lista manual se aplicável
    const distribuicaoManualList = cadastristasDisponiveis.map((c) => ({
      cadastrista: c.nome,
      equipe: c.equipe || equipeSelecionada,
      quantidade: Number(distribuicaoManualMap[c.nome]) || 0,
    })).filter((d) => d.quantidade > 0);

    try {
      const config: ConfigProgramacaoRota = {
        nomeArquivoOrigem: resultadoLeitura.nomeArquivo,
        equipeDesignada: equipeSelecionada,
        cadastristaDesignado: cadastristaSelecionado,
        dataProgramacao: dataProgramada,
        bairroPadraoSeVazio: bairroPadrao,
        sobrescreverExistentes,
        reiniciarStatusParaAberta: true,
        modoDistribuicao,
        matriculasPorDiaComercial,
        cadastristasParaDistribuicao: cadastristasDisponiveis.map((c) => ({ nome: c.nome, equipe: c.equipe })),
        distribuicaoManual: distribuicaoManualList,
      };

      const { inseridas, atualizadas } = await programarRotasPelaOrdemPlanilhaAsync(
        linhasOrdenadas,
        config,
        (processados, total, pct) => {
          setProgressoGravacao({ processados, total, pct });
        }
      );

      let descModo = '';
      if (modoDistribuicao === 'HORARIO_COMERCIAL') {
        descModo = ` (Distribuídas automaticamente com meta de ${matriculasPorDiaComercial} OS/dia por colaborador no horário comercial)`;
      } else if (modoDistribuicao === 'MANUAL_QUANTIDADES') {
        descModo = ` (Distribuídas por quantidades indicadas manualmente pelo programador)`;
      }

      setResultadoProgramacao({
        sucesso: true,
        totalInseridas: inseridas,
        totalAtualizadas: atualizadas,
        mensagem: `Programação realizada com sucesso! Foram geradas e roteirizadas ${linhasOrdenadas.length.toLocaleString('pt-BR')} ordens de serviço da Embasa estritamente na ordem da planilha${descModo} (${inseridas.toLocaleString('pt-BR')} novas inseridas no banco IndexedDB, ${atualizadas.toLocaleString('pt-BR')} existentes atualizadas).`,
      });
    } catch (err: any) {
      setErroArquivo(`Erro ao programar rotas: ${err.message || 'Falha inesperada'}`);
    } finally {
      setIsProgramando(false);
      setProgressoGravacao(null);
    }
  };

  const linhasFiltradasPrevia = linhasOrdenadas.filter((l) => {
    if (!termoBuscaPrevia) return true;
    const termo = termoBuscaPrevia.toLowerCase();
    return (
      l.matriculaEmbasa.includes(termo) ||
      l.nomeConsumidor.toLowerCase().includes(termo) ||
      l.logradouro.toLowerCase().includes(termo) ||
      l.quadra.toLowerCase().includes(termo) ||
      l.lote.toLowerCase().includes(termo)
    );
  });

  // Cálculos de paginação
  const totalItens = linhasFiltradasPrevia.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const paginaCorrente = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicioIndice = (paginaCorrente - 1) * itensPorPagina;
  const fimIndice = Math.min(inicioIndice + itensPorPagina, totalItens);
  const linhasPaginadas = linhasFiltradasPrevia.slice(inicioIndice, fimIndice);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-sky-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Importador Oficial • Planilhas Excel de OS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Upload de Planilha Excel & Programação por Ordem Estrita</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Carregue a planilha Excel (.xlsx, .xls ou .csv) contendo as matrículas, endereços e lotes
              da Embasa. O sistema respeita rigorosamente a sequência de linhas da planilha para
              roteirizar o atendimento de campo (1º, 2º, 3º...).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => baixarPlanilhaModeloEmbasa('xlsx')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
              title="Baixar modelo em Excel com cabeçalhos oficiais da Embasa"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Planilha Modelo (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => baixarPlanilhaModeloEmbasa('csv')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Baixar modelo em formato CSV delimitado por vírgula"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Modelo .CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE UPLOAD (DRAG AND DROP) */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-10 text-center transition cursor-pointer ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-300 bg-white hover:border-emerald-500 hover:bg-slate-50/60 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            {carregandoArquivo ? (
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              {carregandoArquivo ? 'Processando e Indexando Planilha...' : 'Clique ou arraste a planilha Excel aqui'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Formatos suportados: <strong className="text-slate-700">.xlsx</strong>, <strong className="text-slate-700">.xls</strong> ou <strong className="text-slate-700">.csv</strong>
            </p>
          </div>

          {/* Barra de Progresso durante a Leitura */}
          {carregandoArquivo && progressoCarregamento && (
            <div className="w-full bg-slate-100 rounded-full p-1 border border-slate-200 mt-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-sky-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(progressoCarregamento.pct, 5)}%` }}
              />
              <span className="text-[10px] font-bold text-slate-600 block mt-1">
                Lendo: {progressoCarregamento.processados.toLocaleString('pt-BR')} registros ({progressoCarregamento.pct}%)
              </span>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Banco IndexedDB Otimizado • Capacidade Liberada até 1.500.000 Matrículas</span>
          </div>
        </div>
      </div>

      {/* Mensagem de Erro se houver */}
      {erroArquivo && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-rose-950">Falha na leitura da planilha:</span>
            <span>{erroArquivo}</span>
          </div>
        </div>
      )}

      {/* RESULTADO DA PROGRAMAÇÃO EXECUTADA */}
      {resultadoProgramacao && (
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-950">
                Rotas Programadas Conforme a Ordem da Planilha!
              </h4>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                {resultadoProgramacao.mensagem}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-emerald-900">
                <span>📅 Data: {dataProgramada}</span>
                <span>👥 Equipe: {equipeSelecionada}</span>
                <span>👤 Cadastrista: {cadastristaSelecionado}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onIrParaRotasOS}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
          >
            <Route className="w-4 h-4" />
            <span>Abrir Rota de Atendimento</span>
          </button>
        </div>
      )}

      {/* SE PLANILHA CARREGADA: VISUALIZAÇÃO E PROGRAMAÇÃO */}
      {resultadoLeitura && (
        <div className="space-y-5">
          {/* Painel de Parâmetros de Programação */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Programação da Rota de Campo (Ordem da Planilha)
                </h3>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                Arquivo: <strong className="text-slate-800">{resultadoLeitura.nomeArquivo}</strong> ({resultadoLeitura.totalLinhasLidas} registros)
              </span>
            </div>

            {/* SELEÇÃO DO MODO DE PROGRAMAÇÃO SOLICITADA PELO USUÁRIO */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Distribuição de Ordens de Serviço (OS):</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Total de matrículas na planilha: <strong className="text-slate-900">{linhasOrdenadas.length}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setModoDistribuicao('HORARIO_COMERCIAL')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    modoDistribuicao === 'HORARIO_COMERCIAL'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block font-bold text-xs mb-0.5 text-emerald-700">
                    ⚡ Horário Comercial Automático
                  </span>
                  <span className="text-[11px] text-slate-600 leading-tight block">
                    Calcula a quantidade ideal que cada colaborador executa em 8h de expediente (~25 OS).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoDistribuicao('MANUAL_QUANTIDADES')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    modoDistribuicao === 'MANUAL_QUANTIDADES'
                      ? 'bg-sky-50 border-sky-500 text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block font-bold text-xs mb-0.5 text-sky-700">
                    🎯 Indicação Manual por Quantidade
                  </span>
                  <span className="text-[11px] text-slate-600 leading-tight block">
                    O programador digita a quantidade exata de matrículas para cada colaborador.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoDistribuicao('UNICO')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    modoDistribuicao === 'UNICO'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block font-bold text-xs mb-0.5 text-indigo-700">
                    👤 Cadastrista Único
                  </span>
                  <span className="text-[11px] text-slate-600 leading-tight block">
                    Direciona todo o lote da planilha integralmente para um único profissional.
                  </span>
                </button>
              </div>

              {/* Sub-painel: Horário Comercial */}
              {modoDistribuicao === 'HORARIO_COMERCIAL' && (
                <div className="p-3 bg-white rounded-xl border border-emerald-200/80 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-bold text-slate-700">
                      Capacidade por Cadastrista no Horário Comercial (8h):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={matriculasPorDiaComercial}
                        onChange={(e) => setMatriculasPorDiaComercial(Math.max(5, parseInt(e.target.value, 10) || 25))}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-center"
                      />
                      <span className="text-slate-500 text-[11px]">matrículas / colaborador / dia</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Com {cadastristasDisponiveis.length} cadastristas ativos cadastrados e meta de {matriculasPorDiaComercial} censos/dia,
                    o sistema sequenciará até {cadastristasDisponiveis.length * matriculasPorDiaComercial} matrículas sem sobrecarregar a jornada comercial.
                  </p>
                </div>
              )}

              {/* Sub-painel: Indicação Manual de Quantidades */}
              {modoDistribuicao === 'MANUAL_QUANTIDADES' && (
                <div className="p-3 bg-white rounded-xl border border-sky-200/80 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      Indique a quantidade de matrículas para cada cadastrista:
                    </span>
                    <span className="text-[11px] font-bold text-sky-700">
                      Total Atribuído: {Object.values(distribuicaoManualMap).reduce((acc: number, v: number) => acc + (Number(v) || 0), 0)} / {linhasOrdenadas.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {cadastristasDisponiveis.map((cad) => {
                      const qtd = distribuicaoManualMap[cad.nome] ?? 0;
                      return (
                        <div key={cad.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-800 text-[11px] truncate mr-2">
                            {cad.nome}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={linhasOrdenadas.length}
                            value={qtd}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setDistribuicaoManualMap((prev) => ({
                                ...prev,
                                [cad.nome]: val,
                              }));
                            }}
                            className="w-16 px-1.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-bold text-center"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Data da Programação */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Data da Rota de Campo *</span>
                </label>
                <input
                  type="date"
                  value={dataProgramada}
                  onChange={(e) => setDataProgramada(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Equipe Designada */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Equipe Designada *</span>
                </label>
                <select
                  value={equipeSelecionada}
                  onChange={(e) => setEquipeSelecionada(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {equipesDisponiveis.map((eq) => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>

              {/* Cadastrista Designado */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cadastrista Responsável *</span>
                </label>
                <select
                  value={cadastristaSelecionado}
                  onChange={(e) => setCadastristaSelecionado(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {cadastristasDisponiveis.map((cad) => (
                    <option key={cad.id} value={cad.nome}>
                      {cad.nome} ({cad.matriculaFuncional})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bairro Padrão */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bairro Base se Vazio</span>
                </label>
                <select
                  value={bairroPadrao}
                  onChange={(e) => setBairroPadrao(e.target.value as BairroR7)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {LISTA_BAIRROS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox e Botão Principal de Programação */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
              {isProgramando && progressoGravacao && (
                <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Gravando e indexando no banco de dados persistente (IndexedDB)...</span>
                    </span>
                    <span>{progressoGravacao.pct}%</span>
                  </div>
                  <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(progressoGravacao.pct, 5)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-emerald-800 mt-1 block">
                    {progressoGravacao.processados.toLocaleString('pt-BR')} de {progressoGravacao.total.toLocaleString('pt-BR')} ordens de serviço indexadas
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={sobrescreverExistentes}
                    onChange={(e) => setSobrescreverExistentes(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Atualizar registros já existentes com o mesmo número de matrícula</span>
                </label>

                <button
                  type="button"
                  disabled={isProgramando}
                  onClick={handleExecutarProgramacao}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
                >
                  {isProgramando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Gravando {linhasOrdenadas.length.toLocaleString('pt-BR')} Matrículas no IndexedDB...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Programar Rota pela Ordem da Planilha ({linhasOrdenadas.length.toLocaleString('pt-BR')} Matrículas)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* TABELA DE PRÉVIA DA SEQUÊNCIA PROGRAMADA */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            {/* Header da Tabela com ferramentas de ordenação */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">
                  Sequenciador de Atendimento Porta a Porta
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {linhasOrdenadas.length} registros sequenciados
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Busca rápida */}
                <div className="relative min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={termoBuscaPrevia}
                    onChange={(e) => {
                      setTermoBuscaPrevia(e.target.value);
                      setPaginaAtual(1);
                    }}
                    placeholder="Filtrar prévia..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRestaurarOrdemPlanilha}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Restaurar a ordem exata do arquivo original Excel"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ordem Original Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleInverterOrdem}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Inverter a ordem de atendimento"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inverter Ordem</span>
                </button>
              </div>
            </div>

            {/* Tabela com scroll seguro e paginação */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-20">Ordem Rota</th>
                    <th className="px-3 py-2.5">Linha Excel</th>
                    <th className="px-3 py-2.5">Matrícula Embasa</th>
                    <th className="px-4 py-2.5">Consumidor / Titular</th>
                    <th className="px-4 py-2.5">Endereço & Número</th>
                    <th className="px-3 py-2.5">Bairro</th>
                    <th className="px-3 py-2.5">Quadra / Lote</th>
                    <th className="px-3 py-2.5">Hidrômetro</th>
                    <th className="px-3 py-2.5 text-center">Ajustar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {linhasPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        Nenhum registro corresponde ao filtro de busca.
                      </td>
                    </tr>
                  ) : (
                    linhasPaginadas.map((item) => {
                      const indexReal = linhasOrdenadas.findIndex((l) => l.matriculaEmbasa === item.matriculaEmbasa);
                      const ordemVisual = item.ordemManual || (indexReal >= 0 ? indexReal + 1 : 1);
                      return (
                        <tr key={`${item.matriculaEmbasa}-${item.linhaOriginal}`} className="hover:bg-slate-50 transition">
                          {/* Ordem Programada da Rota */}
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-xs">
                              {ordemVisual}º
                            </span>
                          </td>

                          {/* Linha Original no Excel */}
                          <td className="px-3 py-2.5 font-mono text-slate-500 text-[11px]">
                            Linha {item.linhaOriginal}
                          </td>

                          {/* Matrícula */}
                          <td className="px-3 py-2.5 font-mono font-bold text-sky-800">
                            {item.matriculaEmbasa}
                          </td>

                          {/* Consumidor */}
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {item.nomeConsumidor}
                          </td>

                          {/* Endereço */}
                          <td className="px-4 py-2.5">
                            <span>{item.logradouro}</span>
                            <span className="text-slate-500 font-medium">, {item.numeroPorta}</span>
                            {item.complemento && (
                              <span className="text-[10px] text-slate-400 block">{item.complemento}</span>
                            )}
                          </td>

                          {/* Bairro */}
                          <td className="px-3 py-2.5 font-medium text-slate-800">
                            {item.bairro}
                          </td>

                          {/* Quadra / Lote */}
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-slate-900">{item.quadra}</span>
                            <span className="text-slate-500"> / {item.lote}</span>
                          </td>

                          {/* Hidrômetro */}
                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                            {item.hidrometroCadastrado || '—'}
                          </td>

                          {/* Ações de Reordenação Manual */}
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                disabled={indexReal <= 0}
                                onClick={() => handleMoverLinha(indexReal, 'cima')}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                title="Subir na ordem de visitação"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={indexReal >= linhasOrdenadas.length - 1}
                                onClick={() => handleMoverLinha(indexReal, 'baixo')}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                title="Descer na ordem de visitação"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Barra de Paginação e Navegação Responsiva */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Exibindo <strong>{totalItens === 0 ? 0 : inicioIndice + 1}</strong> a <strong>{fimIndice}</strong> de <strong>{totalItens}</strong> registros
                </span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Por página:</span>
                  <select
                    value={itensPorPagina}
                    onChange={(e) => {
                      setItensPorPagina(Number(e.target.value));
                      setPaginaAtual(1);
                    }}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={paginaCorrente <= 1}
                    onClick={() => setPaginaAtual(1)}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Primeira página"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={paginaCorrente <= 1}
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-3 py-1 font-semibold text-slate-800 bg-white rounded-lg border border-slate-200 text-[11px]">
                    Página {paginaCorrente} de {totalPaginas}
                  </span>

                  <button
                    type="button"
                    disabled={paginaCorrente >= totalPaginas}
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Próxima página"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={paginaCorrente >= totalPaginas}
                    onClick={() => setPaginaAtual(totalPaginas)}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Última página"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
