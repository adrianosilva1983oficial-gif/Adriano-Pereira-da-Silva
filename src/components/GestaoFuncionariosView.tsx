import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Sliders,
  Edit2,
  Trash2,
  UserCheck,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  RotateCcw,
  Save,
  Check,
  X,
  Sparkles,
  Info,
  Lock,
  Unlock,
  KeyRound
} from 'lucide-react';
import {
  UsuarioSistema,
  PerfilUsuario,
  StatusFuncionario,
  DireitosUsoSistema,
  DIREITOS_PADRAO_POR_PERFIL,
} from '../types/auth';
import { authService } from '../services/authService';

const NOMES_PERFIS: Record<PerfilUsuario, string> = {
  CADASTRISTA_CAMPO: 'Cadastrista de Campo',
  VALIDADOR_AUDITOR: 'Validador / Auditor Técnico',
  SUPERVISOR_GERAL: 'Supervisor Geral de Operações',
  ADMIN_CONTRATO: 'Administrador do Contrato',
};

const GRUPOS_DIREITOS: Array<{
  titulo: string;
  icone: any;
  cor: string;
  permissoes: Array<{
    chave: keyof DireitosUsoSistema;
    label: string;
    descricao: string;
  }>;
}> = [
  {
    titulo: '1. Coleta em Campo & Moradores',
    icone: MapPin,
    cor: 'text-sky-600',
    permissoes: [
      {
        chave: 'podeColetarCampo',
        label: 'Executar Censo em Campo',
        descricao: 'Permite abrir e preencher o formulário técnico de vistoria porta a porta.',
      },
      {
        chave: 'podeNavegarGPS',
        label: 'Navegação GPS & Rotas',
        descricao: 'Acessa radar GPS de rota, distâncias em tempo real e abertura no Waze/Google Maps.',
      },
      {
        chave: 'podeDemarcarCartografia',
        label: 'Cartografia do Lote (Vértices)',
        descricao: 'Permite demarcar o polígono do lote via caminhamento GPS ou desenho manual.',
      },
      {
        chave: 'podeEditarRascunho',
        label: 'Gravar Rascunhos Offline',
        descricao: 'Salva formulários parciais no IndexedDB do aparelho sem perda de digitação.',
      },
      {
        chave: 'podeColetarFotosEAssinatura',
        label: 'Fotos Probatórias & Assinatura',
        descricao: 'Captura fotos de hidrômetro/fachada e assinatura digital do consumidor.',
      },
    ],
  },
  {
    titulo: '2. Rotas, Planilhas Excel & Programação',
    icone: Sliders,
    cor: 'text-emerald-600',
    permissoes: [
      {
        chave: 'podeVerRotasOS',
        label: 'Visualizar Rotas e Ordens de Serviço',
        descricao: 'Acesso à lista e sequenciador de ordens de serviço do espelho SCIWeb.',
      },
      {
        chave: 'podeUploadPlanilhaExcel',
        label: 'Upload de Planilhas Excel Embasa',
        descricao: 'Permite carregar arquivos .xlsx/.csv com listas de matrículas e endereços.',
      },
      {
        chave: 'podeReordenarProgramacao',
        label: 'Programar & Reordenar Rota',
        descricao: 'Permite fixar ou reordenar a sequência de visitação dos cadastristas.',
      },
      {
        chave: 'podeAtribuirOSParaEquipe',
        label: 'Atribuir Ordens a Equipes/Agentes',
        descricao: 'Distribui lotes de trabalho para equipes e colaboradores específicos.',
      },
      {
        chave: 'podeRegistrarImpedimento',
        label: 'Registrar Impedimentos em Campo',
        descricao: 'Aplica status de ausente, portão trancado, cão feroz ou lote vago.',
      },
    ],
  },
  {
    titulo: '3. Mesa Técnica & Validação Pré-EMBASA',
    icone: ShieldCheck,
    cor: 'text-indigo-600',
    permissoes: [
      {
        chave: 'podeValidarEmbasa',
        label: 'Acessar Mesa Técnica Pré-EMBASA',
        descricao: 'Audita registros de censo contra as 38 regras contratuais da Embasa.',
      },
      {
        chave: 'podeAprovarReprovarCenso',
        label: 'Aprovar ou Rejeitar Cadastros',
        descricao: 'Emite parecer técnico homologando ou solicitando reinspeção de campo.',
      },
      {
        chave: 'podeTransmitirEmbasa',
        label: 'Transmitir Lotes Homologados',
        descricao: 'Gera protocolo de transmissão e fecha lote para faturamento Embasa.',
      },
    ],
  },
  {
    titulo: '4. Supervisão, Produtividade & Ouvidoria',
    icone: Briefcase,
    cor: 'text-amber-600',
    permissoes: [
      {
        chave: 'podeVerRelatorioProdutividade',
        label: 'Relatório de Produtividade',
        descricao: 'Visualiza gráficos de censos realizados, metas e tempo médio de vistoria.',
      },
      {
        chave: 'podeAcessarSupervisaoGeral',
        label: 'Dashboard de Supervisão Geral',
        descricao: 'Acesso consolidado ao monitoramento operacional de todas as frentes.',
      },
      {
        chave: 'podeGerenciarOuvidoria',
        label: 'Gestão de Ouvidoria SLA 48h',
        descricao: 'Trata reclamações de moradores e anomalias de faturamento.',
      },
      {
        chave: 'podeRealizarNegociacao',
        label: 'Simulador de Tarifa & Negociação',
        descricao: 'Realiza enquadramento tarifário e simulação de parcelamentos de débitos.',
      },
    ],
  },
  {
    titulo: '5. Administração, Contrato & Exportação',
    icone: Shield,
    cor: 'text-purple-600',
    permissoes: [
      {
        chave: 'podeConfigurarContrato',
        label: 'Configurar 38 Campos do Contrato',
        descricao: 'Altera obrigatoriedade, seções e regras de validação de campos.',
      },
      {
        chave: 'podeGerenciarFuncionarios',
        label: 'Cadastrar & Gerenciar Funcionários',
        descricao: 'Cria, edita, ativa, desativa e monitora os colaboradores do sistema.',
      },
      {
        chave: 'podeConfigurarDireitosUso',
        label: 'Configurar Matriz de Direitos (RBAC)',
        descricao: 'Altera as permissões de acesso por perfil e exceções de colaboradores.',
      },
      {
        chave: 'podeExportarDados',
        label: 'Exportação de Dados & Backups',
        descricao: 'Exporta relatórios consolidados em Excel, CSV e efetua backups físicos.',
      },
      {
        chave: 'podeGerarAPK',
        label: 'Central de Download de APK Celular',
        descricao: 'Acesso ao instalador WebAPK e pacotes de compilação mobile.',
      },
    ],
  },
];

export const GestaoFuncionariosView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'funcionarios' | 'matriz_direitos' | 'excecoes'>('funcionarios');
  const [funcionarios, setFuncionarios] = useState<UsuarioSistema[]>(authService.getAllFuncionarios());
  const [currentUser, setCurrentUser] = useState<UsuarioSistema>(authService.getCurrentUser());
  const [matrizDireitos, setMatrizDireitos] = useState<Record<PerfilUsuario, DireitosUsoSistema>>(
    authService.getAllPerfisDireitos()
  );

  // Filtros de funcionários
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('TODAS');

  // Modal de edição/criação de funcionário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Partial<UsuarioSistema> | null>(null);

  // Alerta de feedback
  const [mensagemFeedback, setMensagemFeedback] = useState<{ tipo: 'sucesso' | 'info'; texto: string } | null>(null);

  useEffect(() => {
    const unsubAuth = authService.subscribe((u) => setCurrentUser(u));
    const unsubFunc = authService.subscribeFuncionarios((list) => setFuncionarios(list));
    return () => {
      unsubAuth();
      unsubFunc();
    };
  }, []);

  const exibirAlerta = (texto: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    setMensagemFeedback({ tipo, texto });
    setTimeout(() => setMensagemFeedback(null), 4000);
  };

  // Funcionários filtrados
  const funcionariosFiltrados = funcionarios.filter((f) => {
    const matchesTexto =
      !filtroTexto ||
      f.nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      f.matriculaFuncional.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      f.email.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      f.cargo.toLowerCase().includes(filtroTexto.toLowerCase());

    const matchesPerfil = filtroPerfil === 'TODOS' || f.perfil === filtroPerfil;
    const matchesStatus = filtroStatus === 'TODOS' || f.status === filtroStatus;
    const matchesEquipe = filtroEquipe === 'TODAS' || f.equipe === filtroEquipe;

    return matchesTexto && matchesPerfil && matchesStatus && matchesEquipe;
  });

  const equipesCadastradas = authService.getEquipesCadastradas();

  const handleOpenNovoFuncionario = () => {
    setEditingFuncionario({
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      perfil: 'CADASTRISTA_CAMPO',
      cargo: 'Cadastrista Técnico',
      equipe: equipesCadastradas[0] || 'Equipe 01 - Frente Cabula',
      matriculaFuncional: `CAD-${Math.floor(1000 + Math.random() * 9000)}`,
      zonaAtuacao: 'ZA 23',
      status: 'ATIVO',
      dataAdmissao: new Date().toISOString().split('T')[0],
      observacoes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditarFuncionario = (func: UsuarioSistema) => {
    setEditingFuncionario({ ...func });
    setIsModalOpen(true);
  };

  const handleSalvarFuncionario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFuncionario || !editingFuncionario.nome || !editingFuncionario.email) {
      alert('Por favor, preencha o Nome e o E-mail corporativo do funcionário.');
      return;
    }

    const salvo = authService.salvarFuncionario(editingFuncionario);
    setIsModalOpen(false);
    setEditingFuncionario(null);
    exibirAlerta(`Colaborador "${salvo.nome}" salvo com sucesso na base corporativa!`);
  };

  const handleToggleStatus = (func: UsuarioSistema) => {
    const novoStatus: StatusFuncionario = func.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    authService.alterarStatusFuncionario(func.id, novoStatus);
    exibirAlerta(`Status de "${func.nome}" alterado para ${novoStatus}.`);
  };

  const handleExcluirFuncionario = (func: UsuarioSistema) => {
    if (confirm(`Confirma a exclusão do colaborador "${func.nome}" (${func.matriculaFuncional})?`)) {
      const ok = authService.excluirFuncionario(func.id);
      if (ok) {
        exibirAlerta(`Colaborador removido da base.`, 'info');
      } else {
        alert('Não é permitido excluir o usuário que está conectado no momento.');
      }
    }
  };

  const handleSimularAcesso = (func: UsuarioSistema) => {
    authService.simularAcessoComo(func.id);
    exibirAlerta(`Ambiente alternado! Você agora está operando como "${func.nome}" (${NOMES_PERFIS[func.perfil]}).`);
  };

  // Matriz de Direitos: Alternar permissão
  const handleTogglePermissaoPerfil = (perfil: PerfilUsuario, chave: keyof DireitosUsoSistema) => {
    const atual = matrizDireitos[perfil][chave];
    const novosDireitos: DireitosUsoSistema = {
      ...matrizDireitos[perfil],
      [chave]: !atual,
    };

    const novaMatriz = {
      ...matrizDireitos,
      [perfil]: novosDireitos,
    };

    setMatrizDireitos(novaMatriz);
    authService.atualizarDireitosPerfil(perfil, novosDireitos);
  };

  const handleResetarDireitosPadrao = () => {
    if (confirm('Deseja restaurar a matriz de direitos de uso para a configuração padrão corporativa do AquaSane Pro?')) {
      authService.resetarDireitosParaPadrao();
      setMatrizDireitos(authService.getAllPerfisDireitos());
      exibirAlerta('Direitos de uso restaurados com sucesso para o padrão corporativo!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner de Identificação */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30">
              <Users className="w-3.5 h-3.5" />
              <span>Módulo Corporativo Web • Recursos Humanos & Segurança</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Cadastros de Funcionários & Direitos de Uso</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Gerencie colaboradores de campo, supervisores e auditores. Configure de forma granular os
              privilégios e permissões de acesso (RBAC) do sistema de censo cadastral.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenNovoFuncionario}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Funcionário</span>
            </button>

            <button
              type="button"
              onClick={handleResetarDireitosPadrao}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Restaurar permissões padrão da Embasa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar Padrões</span>
            </button>
          </div>
        </div>

        {/* Notificação Temporária */}
        {mensagemFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{mensagemFeedback.texto}</span>
          </div>
        )}

        {/* Abas Secundárias */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('funcionarios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'funcionarios'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Funcionários ({funcionarios.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matriz_direitos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'matriz_direitos'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Matriz de Direitos de Uso (RBAC)</span>
          </button>
        </div>
      </div>

      {/* ABA 1: LISTAGEM E CADASTRO DE FUNCIONÁRIOS */}
      {activeTab === 'funcionarios' && (
        <div className="space-y-4">
          {/* Barra de Busca e Filtros */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Buscar por nome, matrícula funcional (ex: CAD-0418) ou e-mail..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">Filtros:</span>
              </div>

              {/* Perfil */}
              <select
                value={filtroPerfil}
                onChange={(e) => setFiltroPerfil(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="TODOS">Todos os Perfis</option>
                <option value="CADASTRISTA_CAMPO">Cadastrista de Campo</option>
                <option value="VALIDADOR_AUDITOR">Validador / Auditor</option>
                <option value="SUPERVISOR_GERAL">Supervisor Geral</option>
                <option value="ADMIN_CONTRATO">Administrador</option>
              </select>

              {/* Equipe */}
              <select
                value={filtroEquipe}
                onChange={(e) => setFiltroEquipe(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="TODAS">Todas as Equipes</option>
                {equipesCadastradas.map((eq) => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="ATIVO">Ativos</option>
                <option value="INATIVO">Inativos</option>
                <option value="FERIAS">Férias</option>
                <option value="BLOQUEADO">Bloqueados</option>
              </select>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Cadastrados</span>
              <span className="text-xl font-black text-slate-900">{funcionarios.length}</span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-600 block">Ativos em Operação</span>
              <span className="text-xl font-black text-emerald-700">
                {funcionarios.filter((f) => f.status === 'ATIVO').length}
              </span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-sky-600 block">Frentes de Campo</span>
              <span className="text-xl font-black text-sky-700">{equipesCadastradas.length} Equipes</span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-purple-600 block">Usuário Atual Logado</span>
              <span className="text-xs font-bold text-slate-800 truncate block mt-1" title={currentUser.nome}>
                {currentUser.nome}
              </span>
            </div>
          </div>

          {/* Tabela de Funcionários */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Colaborador</th>
                    <th className="px-3 py-3">Matrícula</th>
                    <th className="px-3 py-3">Cargo / Perfil</th>
                    <th className="px-3 py-3">Equipe & Zona</th>
                    <th className="px-3 py-3">Contato</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {funcionariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        Nenhum colaborador localizado com os filtros informados.
                      </td>
                    </tr>
                  ) : (
                    funcionariosFiltrados.map((func) => {
                      const isMe = currentUser.id === func.id;
                      const badgeStatusCor =
                        func.status === 'ATIVO'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : func.status === 'FERIAS'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : func.status === 'BLOQUEADO'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <tr
                          key={func.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isMe ? 'bg-sky-50/50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-indigo-700 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                {func.nome.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{func.nome}</span>
                                  {isMe && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-sky-600 text-white">
                                      VOCÊ
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 block">{func.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3 font-mono font-semibold text-slate-800">
                            {func.matriculaFuncional}
                          </td>

                          <td className="px-3 py-3">
                            <span className="font-semibold text-slate-900 block">{func.cargo}</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {NOMES_PERFIS[func.perfil]}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <span className="text-slate-800 font-medium block">{func.equipe}</span>
                            <span className="text-[10px] text-slate-500">{func.zonaAtuacao || 'Todas'}</span>
                          </td>

                          <td className="px-3 py-3 text-[11px] text-slate-600">
                            {func.telefone || '—'}
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStatusCor}`}
                            >
                              {func.status}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isMe && (
                                <button
                                  type="button"
                                  onClick={() => handleSimularAcesso(func)}
                                  className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition cursor-pointer"
                                  title={`Simular acesso como ${func.nome}`}
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditarFuncionario(func)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                title="Editar dados cadastrais"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(func)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  func.status === 'ATIVO'
                                    ? 'hover:bg-amber-50 text-slate-400 hover:text-amber-600'
                                    : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                                }`}
                                title={func.status === 'ATIVO' ? 'Desativar colaborador' : 'Ativar colaborador'}
                              >
                                {func.status === 'ATIVO' ? (
                                  <Unlock className="w-3.5 h-3.5" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {!isMe && (
                                <button
                                  type="button"
                                  onClick={() => handleExcluirFuncionario(func)}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  title="Excluir colaborador"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: MATRIZ DE DIREITOS DE USO CONFIGURÁVEIS (RBAC) */}
      {activeTab === 'matriz_direitos' && (
        <div className="space-y-6">
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 mb-1">
                Controle de Acesso Baseado em Perfis (RBAC - Role-Based Access Control)
              </p>
              <p className="leading-relaxed">
                Cada coluna representa um perfil corporativo no contrato Embasa R7. Marque ou desmarque
                as caixas para liberar ou restringir recursos específicos imediatamente para todos os
                usuários do respectivo perfil. As alterações são salvas e refletidas em tempo real nas telas e menus.
              </p>
            </div>
          </div>

          {GRUPOS_DIREITOS.map((grupo) => {
            const IconeGrupo = grupo.icone;
            return (
              <div key={grupo.titulo} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconeGrupo className={`w-4 h-4 ${grupo.cor}`} />
                    <h3 className="font-bold text-slate-900 text-xs">{grupo.titulo}</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    {grupo.permissoes.length} permissões configuráveis
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="px-5 py-2.5 w-1/3">Direito / Funcionalidade</th>
                        <th className="px-3 py-2.5 text-center text-sky-700">Cadastrista</th>
                        <th className="px-3 py-2.5 text-center text-indigo-700">Validador</th>
                        <th className="px-3 py-2.5 text-center text-amber-700">Supervisor</th>
                        <th className="px-3 py-2.5 text-center text-purple-700">Admin Contrato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grupo.permissoes.map((p) => (
                        <tr key={p.chave} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3">
                            <span className="font-bold text-slate-900 block">{p.label}</span>
                            <span className="text-[11px] text-slate-500 block leading-snug">{p.descricao}</span>
                          </td>

                          {/* Cadastrista */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={matrizDireitos.CADASTRISTA_CAMPO[p.chave]}
                              onChange={() => handleTogglePermissaoPerfil('CADASTRISTA_CAMPO', p.chave)}
                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* Validador */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={matrizDireitos.VALIDADOR_AUDITOR[p.chave]}
                              onChange={() => handleTogglePermissaoPerfil('VALIDADOR_AUDITOR', p.chave)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* Supervisor */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={matrizDireitos.SUPERVISOR_GERAL[p.chave]}
                              onChange={() => handleTogglePermissaoPerfil('SUPERVISOR_GERAL', p.chave)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* Admin */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={matrizDireitos.ADMIN_CONTRATO[p.chave]}
                              onChange={() => handleTogglePermissaoPerfil('ADMIN_CONTRATO', p.chave)}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE NOVO/EDITAR FUNCIONÁRIO */}
      {isModalOpen && editingFuncionario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingFuncionario.id ? 'Editar Colaborador' : 'Cadastrar Novo Funcionário'}
                  </h3>
                  <span className="text-xs text-slate-300">
                    Preencha os dados do colaborador para acesso ao sistema
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário com scroll */}
            <form onSubmit={handleSalvarFuncionario} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nome Completo */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome Completo do Funcionário *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFuncionario.nome || ''}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, nome: e.target.value })}
                    placeholder="Ex: Carlos Eduardo de Santana"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingFuncionario.email || ''}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, email: e.target.value })}
                    placeholder="nome.sobrenome@consorcior7.com.br"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>

                {/* Matrícula Funcional */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Matrícula Funcional *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFuncionario.matriculaFuncional || ''}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, matriculaFuncional: e.target.value })}
                    placeholder="CAD-0418"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>

                {/* Telefone / WhatsApp */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingFuncionario.telefone || ''}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, telefone: e.target.value })}
                    placeholder="(71) 98888-0000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={editingFuncionario.cargo || ''}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, cargo: e.target.value })}
                    placeholder="Ex: Cadastrista Técnico Pleno"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>

                {/* Perfil de Acesso */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Perfil de Acesso (RBAC) *
                  </label>
                  <select
                    value={editingFuncionario.perfil || 'CADASTRISTA_CAMPO'}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, perfil: e.target.value as PerfilUsuario })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  >
                    <option value="CADASTRISTA_CAMPO">Cadastrista de Campo</option>
                    <option value="VALIDADOR_AUDITOR">Validador / Auditor Técnico</option>
                    <option value="SUPERVISOR_GERAL">Supervisor Geral</option>
                    <option value="ADMIN_CONTRATO">Administrador do Contrato</option>
                  </select>
                </div>

                {/* Equipe / Frente */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Equipe Designada
                  </label>
                  <input
                    type="text"
                    value={editingFuncionario.equipe || ''}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, equipe: e.target.value })}
                    placeholder="Ex: Equipe 01 - Frente Cabula"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>

                {/* Zona de Atuação */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Zona de Atuação (ZA)
                  </label>
                  <input
                    type="text"
                    value={editingFuncionario.zonaAtuacao || ''}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, zonaAtuacao: e.target.value })}
                    placeholder="Ex: ZA 23 / ZA 25"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status Funcional
                  </label>
                  <select
                    value={editingFuncionario.status || 'ATIVO'}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, status: e.target.value as StatusFuncionario })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="FERIAS">Férias</option>
                    <option value="BLOQUEADO">Bloqueado</option>
                  </select>
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Observações Administrativas
                  </label>
                  <textarea
                    rows={2}
                    value={editingFuncionario.observacoes || ''}
                    onChange={(e) => setEditingFuncionario({ ...editingFuncionario, observacoes: e.target.value })}
                    placeholder="Anotações de RH, treinamentos realizados ou equipamentos sob tutela..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Colaborador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
