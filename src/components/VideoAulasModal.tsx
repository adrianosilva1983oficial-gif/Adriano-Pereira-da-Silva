import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  BookOpen,
  Smartphone,
  FileSpreadsheet,
  MapPin,
  Camera,
  Layers,
  Sparkles,
  ArrowRight,
  Download,
  Clock,
  ChevronRight,
  ShieldCheck,
  X,
  CreditCard
} from 'lucide-react';
import { UnifiedActiveTab } from './Header';

interface VideoAulasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavegarParaFuncao?: (tab: UnifiedActiveTab) => void;
}

interface ModuloAula {
  id: number;
  titulo: string;
  categoria: 'WEB_SISTEMA' | 'MOBILE_APK' | 'CAMPO_GIS' | 'FINANCEIRO';
  duracao: string;
  duracaoSegundos: number;
  descricao: string;
  tabDestino: UnifiedActiveTab;
  capitulos: { tempo: string; seg: number; texto: string }[];
  transcricao: string[];
  checklistPratico: string[];
  visualSimulador: {
    telaTitulo: string;
    subtitulo: string;
    icone: 'smartphone' | 'spreadsheet' | 'map' | 'camera' | 'shield' | 'card';
    pontosDestaque: string[];
  };
}

const MODULOS_AULAS: ModuloAula[] = [
  {
    id: 1,
    titulo: 'Módulo 1: Visão Geral e Arquitetura do AquaSane Pro (Web e APK)',
    categoria: 'WEB_SISTEMA',
    duracao: '08:45',
    duracaoSegundos: 525,
    descricao: 'Aprenda como o AquaSane Pro funciona de ponta a ponta: armazenamento 100% offline, instalação do APK no celular e segurança de dados isolados por cliente.',
    tabDestino: 'erp_empresa',
    capitulos: [
      { tempo: '00:00', seg: 0, texto: 'Introdução e conceito de operação 100% offline' },
      { tempo: '02:15', seg: 135, texto: 'Instalação do APK no celular Android / iOS sem loja' },
      { tempo: '04:40', seg: 280, texto: 'Banco de dados local no aparelho e isolamento por empresa' },
      { tempo: '07:10', seg: 430, texto: 'Controle de vigência da licença e sincronização' },
    ],
    transcricao: [
      'Bem-vindo ao curso oficial do AquaSane Pro. Nesta aula introdutória, você verá como nossa arquitetura foi projetada para que a equipe trabalhe em campo mesmo sem sinal de celular.',
      'O sistema web serve para a gestão da empresa, importação de planilhas de corte e roteirização. Já o aplicativo mobile APK é instalado nos smartphones dos cadastristas.',
      'Todos os dados residem localmente no navegador e no banco IndexedDB do dispositivo, eliminando risco de perda de medições ou fotos de campo.',
    ],
    checklistPratico: [
      'Acessar o sistema pelo link fixado da empresa',
      'Verificar o status "SISTEMA SALVO • 100% ATIVO"',
      'Baixar o pacote do app no celular ou abrir pelo navegador móvel',
      'Conferir a vigência da licença ativa de 30 dias',
    ],
    visualSimulador: {
      telaTitulo: 'Arquitetura Integrada AquaSane Pro',
      subtitulo: 'Sincronização em Background e Banco Local Isolado por Empresa',
      icone: 'shield',
      pontosDestaque: [
        'Base de dados IndexedDB local em cada smartphone',
        'Operação ininterrupta sem dependência de internet',
        'Gestão comercial por licença mensal de 30 dias',
      ],
    },
  },
  {
    id: 2,
    titulo: 'Módulo 2: Importação de Planilhas e Roteirização por Horário Comercial',
    categoria: 'WEB_SISTEMA',
    duracao: '12:10',
    duracaoSegundos: 730,
    descricao: 'Passo a passo da importação de arquivos Excel/SCIWeb e uso da distribuição inteligente por capacidade de 8 horas diárias entre cadastristas ativos.',
    tabDestino: 'upload_excel',
    capitulos: [
      { tempo: '00:00', seg: 0, texto: 'Estrutura da planilha oficial (Matrícula, Bairro, Quadra, Lote)' },
      { tempo: '03:20', seg: 200, texto: 'Upload e validação de consistência dos dados' },
      { tempo: '06:05', seg: 365, texto: 'Geração automática por horário comercial (25 censos/dia)' },
      { tempo: '09:15', seg: 555, texto: 'Indicação manual de quantidades por colaborador' },
    ],
    transcricao: [
      'Nesta aula, ensinamos o processo de importação de lotes de serviço. O sistema aceita planilhas comerciais e de concessionárias de saneamento em formato .xlsx ou .csv.',
      'A roteirização comercial calcula a produtividade padrão de 25 censos por turno de 8 horas. Isso garante que nenhum cadastrista receba sobrecarga de trabalho.',
      'Você também pode digitar manualmente a quantidade exata para cada profissional, visualizando o saldo restante em tempo real.',
    ],
    checklistPratico: [
      'Arrastar a planilha .xlsx ou selecionar o arquivo',
      'Conferir se o total de matrículas foi lido com sucesso',
      'Escolher "Distribuição por Horário Comercial" ou "Indicação Manual"',
      'Clicar em "Confirmar e Despachar O.S. para os Colaboradores"',
    ],
    visualSimulador: {
      telaTitulo: 'Módulo de Despacho & Programação',
      subtitulo: 'Importador Excel SCIWeb com Divisão Equitativa de Carga',
      icone: 'spreadsheet',
      pontosDestaque: [
        'Cálculo de capacidade diária (8h de jornada = ~25 censos)',
        'Ordenação por Bairro, Logradouro, Quadra e Lote',
        'Despacho instantâneo para a fila do cadastrista',
      ],
    },
  },
  {
    id: 3,
    titulo: 'Módulo 3: Operação de Campo no Aplicativo Mobile (APK)',
    categoria: 'MOBILE_APK',
    duracao: '14:30',
    duracaoSegundos: 870,
    descricao: 'Como o colaborador utiliza o app em campo: login com e-mail, atendimento em sequência (1º, 2º...), registro de até 10 fotos probatórias com GPS e finalização.',
    tabDestino: 'mobile_colaborador',
    capitulos: [
      { tempo: '00:00', seg: 0, texto: 'Tela de login enxuta e identificação do cadastrista' },
      { tempo: '03:10', seg: 190, texto: 'Acesso à lista roteirizada de Ordens de Serviço' },
      { tempo: '06:40', seg: 400, texto: 'Captura de até 10 fotos com carimbo GPS e data/hora' },
      { tempo: '10:20', seg: 620, texto: 'Finalização de atendimento e registro de impedimento' },
    ],
    transcricao: [
      'O aplicativo mobile foi desenhado para máxima agilidade e ergonomia sob sol e movimento. O topo exibe apenas o nome AquaSane Pro e a empresa ativa.',
      'Ao logar com seu e-mail, o colaborador visualiza suas tarefas numeradas na ordem exata de caminhada pela rua: 1º da rota, 2º da rota, e assim por diante.',
      'Cada OS possui suporte a até 10 fotos probatórias (fachada, hidrômetro, cavalete, lacre) com carimbo de coordenadas e data gravados na imagem.',
    ],
    checklistPratico: [
      'Fazer login com o e-mail cadastrado pelo administrador',
      'Visualizar a ordem sequencial das O.S. a cumprir',
      'Tirar até 10 fotos com carimbo automático de GPS',
      'Finalizar atendimento ou registrar motivo se o imóvel estiver fechado',
    ],
    visualSimulador: {
      telaTitulo: 'Interface Mobile do Cadastrista',
      subtitulo: 'Operação Roteirizada de Alto Rendimento com Provas Fotográficas',
      icone: 'smartphone',
      pontosDestaque: [
        'Sequência de rua: 1º da Rota, 2º da Rota, 3º...',
        'Até 10 fotos com carimbo indelével de coordenadas GPS',
        'Finalização com 1 toque ou registro de impedimento',
      ],
    },
  },
  {
    id: 4,
    titulo: 'Módulo 4: Cartografia Cadastral de Lotes com Satélite e Vias OSM',
    categoria: 'CAMPO_GIS',
    duracao: '11:20',
    duracaoSegundos: 680,
    descricao: 'Vetorização e desenho de lotes com fotos aéreas e OpenStreetMap, cálculo automático de área (m²), perímetro e confrontantes em campo sem internet.',
    tabDestino: 'map',
    capitulos: [
      { tempo: '00:00', seg: 0, texto: 'Abrindo a tela de cartografia na O.S.' },
      { tempo: '02:50', seg: 170, texto: 'Alternando entre Satélite e Mapa de Vias' },
      { tempo: '05:30', seg: 330, texto: 'Marcando os vértices do polígono do lote' },
      { tempo: '08:40', seg: 520, texto: 'Cálculo automático de m², perímetro e salvamento' },
    ],
    transcricao: [
      'A cartografia cadastral do AquaSane Pro dispensa softwares pesados. Direto na tela da O.S., o colaborador clica em "Cartografia".',
      'O mapa carrega as imagens aéreas e o arruamento. Com toques na tela, o profissional delimita os limites do lote.',
      'O sistema calcula instantaneamente a área em metros quadrados e o perímetro, salvando a geometria vetorial no cadastro da matrícula.',
    ],
    checklistPratico: [
      'Clicar no botão "Cartografia" do imóvel',
      'Posicionar o mapa sobre o lote atendido',
      'Adicionar 4 ou mais vértices contornando o terreno',
      'Conferir a área calculada em m² e clicar em "Salvar Cartografia"',
    ],
    visualSimulador: {
      telaTitulo: 'Vetorização Cadastral GIS Offline',
      subtitulo: 'Delimitação de Vértices com Imagens Aéreas de Alta Resolução',
      icone: 'map',
      pontosDestaque: [
        'Camadas híbridas: Satélite e Vias OpenStreetMap',
        'Cálculo geométrico em tempo real de m² e perímetro',
        'Exportação compatível com sistemas GIS de concessionárias',
      ],
    },
  },
  {
    id: 5,
    titulo: 'Módulo 5: Execução do Censo Cadastral Completo no Imóvel',
    categoria: 'CAMPO_GIS',
    duracao: '15:40',
    duracaoSegundos: 940,
    descricao: 'Passo a passo da vistoria física: hidrômetro, lacre, leitura de m³, situação da ligação (ativa/cortada/clandestina), dados do morador e Tarifa Social.',
    tabDestino: 'form',
    capitulos: [
      { tempo: '00:00', seg: 0, texto: 'Identificação da ligação de água e esgotamento' },
      { tempo: '04:10', seg: 250, texto: 'Conferência do número de série do hidrômetro e leitura' },
      { tempo: '08:30', seg: 510, texto: 'Identificação de vazamentos e tipo de abrigo' },
      { tempo: '12:00', seg: 720, texto: 'Dados socioeconômicos e solicitação de Tarifa Social' },
    ],
    transcricao: [
      'O formulário de censo contempla todos os 38 campos exigidos pelas concessionárias de saneamento do Brasil.',
      'Verifique o cavalete, padrão de mureta, integridade do lacre de proteção e registre a leitura atual em metros cúbicos.',
      'Se o morador estiver inscrito no CadÚnico do Governo Federal, assinale a opção para enquadramento na Tarifa Social.',
    ],
    checklistPratico: [
      'Preencher situação da ligação (Ativa, Cortada, Clandestina)',
      'Digitar número e leitura do hidrômetro',
      'Avaliar integridade do lacre e padrão de abrigo',
      'Registrar dados do responsável e salvar no aparelho',
    ],
    visualSimulador: {
      telaTitulo: 'Ficha Cadastral Oficial de Saneamento',
      subtitulo: 'Inspeção Técnica de 38 Campos Normatizados',
      icone: 'camera',
      pontosDestaque: [
        'Validação automática de leitura e diâmetro de medidor',
        'Enquadramento de Tarifa Social / CadÚnico',
        'Garantia de auditoria antes da exportação final',
      ],
    },
  },
  {
    id: 6,
    titulo: 'Módulo 6: Gestão de Equipes, Pagamentos e Regra dos 5 Dias de Inadimplência',
    categoria: 'FINANCEIRO',
    duracao: '09:15',
    duracaoSegundos: 555,
    descricao: 'Como gerenciar sua empresa, cadastrar colaboradores, gerar links de pagamento, planos e funcionamento do bloqueio automático após 5 dias de atraso.',
    tabDestino: 'erp_empresa',
    capitulos: [
      { tempo: '00:00', seg: 0, texto: 'Autoconfiguração da empresa e dados contratuais' },
      { tempo: '02:30', seg: 150, texto: 'Cadastro de setores, fiscais e equipes de campo' },
      { tempo: '05:00', seg: 300, texto: 'Planos AquaSane Pro e link automático de pagamento' },
      { tempo: '07:20', seg: 440, texto: 'Regra de 5 dias de tolerância e modo somente leitura' },
    ],
    transcricao: [
      'O cliente tem total autonomia para configurar sua empresa, criar coordenadorias, setores e cadastrar quantos cadastristas forem necessários.',
      'O faturamento é simples e automatizado: o gestor escolhe entre os planos Starter, Pro ou Enterprise e gera links de pagamento instantâneos por PIX ou Cartão.',
      'Atenção à regra de tolerância: após o vencimento, o cliente possui 5 dias de carência. A partir do 6º dia, o sistema entra em modo somente leitura até a confirmação do pagamento.',
    ],
    checklistPratico: [
      'Acessar aba "ERP Empresa" e preencher dados cadastrais',
      'Cadastrar cadastristas na aba "Funcionários"',
      'Conferir faturas e planos na aba "Planos & Assinatura"',
      'Entender o período de 5 dias de carência para evitar bloqueios em campo',
    ],
    visualSimulador: {
      telaTitulo: 'Gestão Financeira & Autonomia Operacional',
      subtitulo: 'Auto-Provisionamento de Banco Local e Controle de Licenciamento',
      icone: 'card',
      pontosDestaque: [
        'Criação de novos bancos de dados isolados por cliente',
        'Emissão de Pix e Link de Cobrança com 1 clique',
        'Bloqueio seguro em modo somente leitura após 5 dias de atraso',
      ],
    },
  },
];

export const VideoAulasModal: React.FC<VideoAulasModalProps> = ({
  isOpen,
  onClose,
  onNavegarParaFuncao,
}) => {
  const [aulaAtiva, setAulaAtiva] = useState<ModuloAula>(MODULOS_AULAS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0); // em segundos
  const [velocidade, setVelocidade] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [abaConteudo, setAbaConteudo] = useState<'conteudo' | 'transcricao' | 'checklist'>('conteudo');

  // Efeito de reprodução simulada do player
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTempoAtual((prev) => {
          if (prev >= aulaAtiva.duracaoSegundos) {
            setIsPlaying(false);
            return aulaAtiva.duracaoSegundos;
          }
          return prev + 1;
        });
      }, 1000 / velocidade);
    }
    return () => clearInterval(interval);
  }, [isPlaying, aulaAtiva.duracaoSegundos, velocidade]);

  if (!isOpen) return null;

  const formatarTempo = (seg: number) => {
    const min = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelecionarAula = (aula: ModuloAula) => {
    setAulaAtiva(aula);
    setTempoAtual(0);
    setIsPlaying(true);
  };

  const progressoPercent = (tempoAtual / aulaAtiva.duracaoSegundos) * 100;

  const handleIrParaPratica = () => {
    if (onNavegarParaFuncao) {
      onNavegarParaFuncao(aulaAtiva.tabDestino);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden my-auto text-slate-800 flex flex-col max-h-[92vh]">
        {/* Cabeçalho Institucional do Treinamento */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center font-black text-lg shadow-md">
              AS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Central de Treinamento & Vídeo Aulas</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  TREINAMENTO OFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aprenda a operar todas as funções do Sistema Web Cliente e do Aplicativo Mobile APK
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout Dividido: Player de Vídeo e Lista de Aulas */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Lado Esquerdo: Player de Vídeo Interativo (8 Colunas) */}
          <div className="lg:col-span-8 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between space-y-4">
            {/* Monitor / Tela do Vídeo com Visualização Interativa do Sistema */}
            <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative flex flex-col aspect-video select-none">
              {/* Topo do Player com Marca D'Água Corporativa */}
              <div className="bg-slate-900/90 backdrop-blur-xs px-4 py-2 flex items-center justify-between border-b border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white text-[11px] truncate max-w-[280px]">
                    {aulaAtiva.titulo}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-sky-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                  <span>1080p HD</span>
                  <span>•</span>
                  <span>AQUASANE PRO</span>
                </div>
              </div>

              {/* Centro da Tela do Vídeo: Demonstração Visual Animada */}
              <div className="flex-1 relative flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden bg-radial from-slate-900 via-slate-950 to-black">
                {/* Grid Decorativo de Fundo */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

                {/* Card de Demonstração da Tela */}
                <div className="relative z-10 max-w-md w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">
                      {aulaAtiva.categoria.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatarTempo(tempoAtual)} / {aulaAtiva.duracao}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">{aulaAtiva.visualSimulador.telaTitulo}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{aulaAtiva.visualSimulador.subtitulo}</p>
                  </div>

                  <div className="space-y-1.5 text-left text-xs text-slate-300 pt-1">
                    {aulaAtiva.visualSimulador.pontosDestaque.map((ponto, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[11px]">{ponto}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botão Gigante de Play sobre a tela quando pausado */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="absolute z-20 w-16 h-16 rounded-full bg-sky-600/90 hover:bg-sky-500 text-white flex items-center justify-center shadow-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                )}
              </div>

              {/* Barra de Controles Inferior do Vídeo */}
              <div className="bg-slate-900/95 backdrop-blur-xs px-4 py-2.5 border-t border-slate-800 space-y-2">
                {/* Linha de Progresso Scrubber */}
                <div
                  className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const novoPercent = clickX / rect.width;
                    setTempoAtual(Math.floor(novoPercent * aulaAtiva.duracaoSegundos));
                  }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${progressoPercent}%` }}
                  />
                </div>

                {/* Botões de Ação do Player */}
                <div className="flex items-center justify-between text-slate-300 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-white transition cursor-pointer"
                      title={isPlaying ? 'Pausar' : 'Reproduzir'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setTempoAtual(0)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Reiniciar Aula"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                      title={isMuted ? 'Ativar Áudio' : 'Mutar Áudio'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <span className="font-mono text-[11px] text-slate-400">
                      {formatarTempo(tempoAtual)} <span className="text-slate-600">/</span> {aulaAtiva.duracao}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Velocidade de Reprodução */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 text-[11px] font-bold">
                      {[1, 1.25, 1.5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVelocidade(v)}
                          className={`px-1.5 py-0.5 rounded transition ${
                            velocidade === v ? 'bg-sky-600 text-white font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {v}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Abas de Detalhes da Aula */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAbaConteudo('conteudo')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      abaConteudo === 'conteudo'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Capítulos ({aulaAtiva.capitulos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaConteudo('checklist')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      abaConteudo === 'checklist'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Checklist de Campo
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaConteudo('transcricao')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      abaConteudo === 'transcricao'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Transcrição da Aula
                  </button>
                </div>

                {/* Botão Praticar no Sistema Agora */}
                <button
                  type="button"
                  onClick={handleIrParaPratica}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-98"
                >
                  <span>Praticar Esta Função Agora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Conteúdo da Aba Selecionada */}
              {abaConteudo === 'conteudo' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 leading-relaxed">{aulaAtiva.descricao}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {aulaAtiva.capitulos.map((cap, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTempoAtual(cap.seg);
                          setIsPlaying(true);
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition flex items-center gap-2.5 text-xs group cursor-pointer"
                      >
                        <span className="font-mono font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded text-[11px]">
                          {cap.tempo}
                        </span>
                        <span className="text-slate-700 group-hover:text-sky-950 font-semibold truncate flex-1">
                          {cap.texto}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {abaConteudo === 'checklist' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-emerald-950 block">
                    Checklist Operacional de Campo:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900">
                    {aulaAtiva.checklistPratico.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {abaConteudo === 'transcricao' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2 max-h-40 overflow-y-auto leading-relaxed">
                  {aulaAtiva.transcricao.map((paragrafo, i) => (
                    <p key={i}>{paragrafo}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Trilha Completa de Aulas (4 Colunas) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Grade de Módulos (6 Aulas)
                </h4>
                <span className="text-[11px] font-bold text-sky-700">100% Gratuito</span>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {MODULOS_AULAS.map((aula, idx) => {
                  const isActive = aulaAtiva.id === aula.id;
                  return (
                    <div
                      key={aula.id}
                      onClick={() => handleSelecionarAula(aula)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left space-y-1.5 ${
                        isActive
                          ? 'bg-white border-sky-600 shadow-md ring-2 ring-sky-500/20'
                          : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`font-black px-2 py-0.5 rounded ${
                            isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          AULA 0{aula.id}
                        </span>
                        <span className="font-mono text-slate-500 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3" />
                          {aula.duracao}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                        {aula.titulo.replace(/Módulo \d+: /, '')}
                      </h5>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {aula.descricao}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rodapé da Coluna Direita com Certificado de Conclusão */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2 text-xs text-sky-950">
                <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0" />
                <span className="text-[11px] leading-tight">
                  Vídeo aulas atualizadas com o padrão de O.S. e censo offline <strong>AquaSane Pro 2026</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
