import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Briefcase,
  Layers,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  X,
  Search,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Car,
  Tag
} from 'lucide-react';
import { DadosEmpresa, SetorEmpresa, EquipeCampoERP } from '../types/empresa';
import { empresaService } from '../services/empresaService';
import { authService } from '../services/authService';
import { UsuarioSistema, PerfilUsuario, StatusFuncionario } from '../types/auth';

interface SistemaERPViewProps {
  onIrParaRotas?: () => void;
  onIrParaUploadPlanilha?: () => void;
}

export const SistemaERPView: React.FC<SistemaERPViewProps> = ({
  onIrParaRotas,
  onIrParaUploadPlanilha,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'empresa' | 'setores' | 'funcionarios' | 'equipes'>('empresa');
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresa>(empresaService.getDadosEmpresa());
  const [setores, setSetores] = useState<SetorEmpresa[]>(empresaService.getAllSetores());
  const [equipes, setEquipes] = useState<EquipeCampoERP[]>(empresaService.getAllEquipes());
  const [funcionarios, setFuncionarios] = useState<UsuarioSistema[]>(authService.getAllFuncionarios());

  // Feedbacks
  const [feedback, setFeedback] = useState<string | null>(null);

  // Estados dos Modais / Formulários
  const [modalSetorAberto, setModalSetorAberto] = useState(false);
  const [setorEditando, setSetorEditando] = useState<Partial<SetorEmpresa> | null>(null);

  const [modalFuncionarioAberto, setModalFuncionarioAberto] = useState(false);
  const [funcionarioEditando, setFuncionarioEditando] = useState<Partial<UsuarioSistema> | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [modalEquipeAberta, setModalEquipeAberta] = useState(false);
  const [equipeEditando, setEquipeEditando] = useState<Partial<EquipeCampoERP> | null>(null);

  const [termoBuscaFuncionario, setTermoBuscaFuncionario] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('TODOS');

  useEffect(() => {
    const unsubEmpresa = empresaService.subscribeEmpresa(setDadosEmpresa);
    const unsubSetores = empresaService.subscribeSetores(setSetores);
    const unsubEquipes = empresaService.subscribeEquipes(setEquipes);
    const unsubFuncionarios = authService.subscribeFuncionarios(setFuncionarios);

    return () => {
      unsubEmpresa();
      unsubSetores();
      unsubEquipes();
      unsubFuncionarios();
    };
  }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Salvar Dados da Empresa
  const handleSalvarEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    empresaService.salvarDadosEmpresa(dadosEmpresa);
    showFeedback('Dados cadastrais da empresa salvos com sucesso!');
  };

  // Salvar Setor
  const handleSalvarSetorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorEditando || !setorEditando.nome) return;
    empresaService.salvarSetor(setorEditando);
    setModalSetorAberto(false);
    setSetorEditando(null);
    showFeedback('Setor / Departamento salvo com sucesso!');
  };

  // Excluir Setor
  const handleExcluirSetor = (id: string, nome: string) => {
    if (confirm(`Deseja realmente remover o setor "${nome}"?`)) {
      empresaService.excluirSetor(id);
      showFeedback(`Setor "${nome}" removido.`);
    }
  };

  // Salvar Funcionário com E-mail e Senha
  const handleSalvarFuncionarioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionarioEditando || !funcionarioEditando.nome || !funcionarioEditando.email) {
      alert('Preencha ao menos Nome e E-mail de acesso do colaborador.');
      return;
    }

    authService.salvarFuncionario({
      ...funcionarioEditando,
      senha: funcionarioEditando.senha || '123',
    });

    setModalFuncionarioAberto(false);
    setFuncionarioEditando(null);
    showFeedback(`Colaborador ${funcionarioEditando.nome} salvo com sucesso!`);
  };

  // Excluir Funcionário
  const handleExcluirFuncionario = (id: string, nome: string) => {
    if (confirm(`Deseja realmente excluir o colaborador "${nome}"?`)) {
      const ok = authService.excluirFuncionario(id);
      if (ok) {
        showFeedback(`Colaborador "${nome}" removido.`);
      } else {
        alert('Não é possível remover o colaborador que está logado no momento.');
      }
    }
  };

  // Salvar Equipe
  const handleSalvarEquipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipeEditando || !equipeEditando.nome) return;
    empresaService.salvarEquipe(equipeEditando);
    setModalEquipeAberta(false);
    setEquipeEditando(null);
    showFeedback('Equipe de campo salva com sucesso!');
  };

  // Filtros de Funcionários
  const funcionariosFiltrados = funcionarios.filter((f) => {
    const matchBusca =
      f.nome.toLowerCase().includes(termoBuscaFuncionario.toLowerCase()) ||
      f.email.toLowerCase().includes(termoBuscaFuncionario.toLowerCase()) ||
      f.matriculaFuncional.toLowerCase().includes(termoBuscaFuncionario.toLowerCase()) ||
      f.cargo.toLowerCase().includes(termoBuscaFuncionario.toLowerCase());

    const matchSetor = filtroSetor === 'TODOS' || f.setorId === filtroSetor;

    return matchBusca && matchSetor;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner ERP */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-sky-950 p-6 text-white shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shadow-inner">
              <Building2 className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Módulo ERP Corporativo
                </span>
                <span className="text-slate-400 text-xs">Gestão Organizacional</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-1">
                {dadosEmpresa.nomeFantasia || 'Cadastro da Empresa'}
              </h1>
              <p className="text-xs text-slate-300">
                CNPJ: {dadosEmpresa.cnpj} • {dadosEmpresa.numeroContrato}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onIrParaUploadPlanilha && (
              <button
                type="button"
                onClick={onIrParaUploadPlanilha}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload Planilha de OS</span>
              </button>
            )}
            {onIrParaRotas && (
              <button
                type="button"
                onClick={onIrParaRotas}
                className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Rotas & Matrículas</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumo de Indicadores da Estrutura */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">Setores Ativos</span>
            <strong className="text-xl font-black text-indigo-300">{setores.filter(s => s.ativo).length}</strong>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">Colaboradores</span>
            <strong className="text-xl font-black text-emerald-400">{funcionarios.length}</strong>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">Cadastristas de Campo</span>
            <strong className="text-xl font-black text-sky-300">
              {funcionarios.filter(f => f.perfil === 'CADASTRISTA_CAMPO').length}
            </strong>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">Equipes de Frente</span>
            <strong className="text-xl font-black text-amber-300">{equipes.filter(e => e.ativo).length}</strong>
          </div>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Abas de Navegação ERP */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setAbaAtiva('empresa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
            abaAtiva === 'empresa'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Dados da Empresa</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('setores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
            abaAtiva === 'setores'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Setores & Departamentos ({setores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('funcionarios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
            abaAtiva === 'funcionarios'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3. Funcionários & Acesso ({funcionarios.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('equipes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
            abaAtiva === 'equipes'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>4. Equipes & Frentes ({equipes.length})</span>
        </button>
      </div>

      {/* ================= ABA 1: DADOS DA EMPRESA ================= */}
      {abaAtiva === 'empresa' && (
        <form onSubmit={handleSalvarEmpresa} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cadastro Cadastral e Contratual da Empresa</h2>
              <p className="text-xs text-slate-500">
                Informações da concessionária/prestadora que constarão nos relatórios técnicos, formulários e cabeçalhos.
              </p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social *</label>
              <input
                type="text"
                required
                value={dadosEmpresa.razaoSocial}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, razaoSocial: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia *</label>
              <input
                type="text"
                required
                value={dadosEmpresa.nomeFantasia}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, nomeFantasia: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ *</label>
              <input
                type="text"
                required
                value={dadosEmpresa.cnpj}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cnpj: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inscrição Estadual</label>
              <input
                type="text"
                value={dadosEmpresa.inscricaoEstadual}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, inscricaoEstadual: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Número do Contrato *</label>
              <input
                type="text"
                required
                value={dadosEmpresa.numeroContrato}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, numeroContrato: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Órgão / Concessionária Contratante</label>
              <input
                type="text"
                value={dadosEmpresa.orgaoContratante}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, orgaoContratante: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Principal</label>
              <input
                type="text"
                value={dadosEmpresa.telefone}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, telefone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Institucional</label>
              <input
                type="text"
                value={dadosEmpresa.whatsapp}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, whatsapp: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Corporativo Oficial</label>
              <input
                type="email"
                value={dadosEmpresa.emailCorporativo}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, emailCorporativo: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Responsável Legal / Diretor</label>
              <input
                type="text"
                value={dadosEmpresa.responsavelLegal}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, responsavelLegal: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cargo do Responsável</label>
              <input
                type="text"
                value={dadosEmpresa.cargoResponsavel}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cargoResponsavel: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Website / Portal</label>
              <input
                type="text"
                value={dadosEmpresa.site || ''}
                onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, site: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-xs text-slate-900 mb-3 uppercase tracking-wider text-indigo-900">
              Endereço da Sede Operacional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Logradouro / Avenida</label>
                <input
                  type="text"
                  value={dadosEmpresa.logradouroSede}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, logradouroSede: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Número</label>
                <input
                  type="text"
                  value={dadosEmpresa.numeroSede}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, numeroSede: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Complemento</label>
                <input
                  type="text"
                  value={dadosEmpresa.complementoSede || ''}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, complementoSede: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bairro</label>
                <input
                  type="text"
                  value={dadosEmpresa.bairroSede}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, bairroSede: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Cidade</label>
                <input
                  type="text"
                  value={dadosEmpresa.cidadeSede}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cidadeSede: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">UF</label>
                <input
                  type="text"
                  value={dadosEmpresa.ufSede}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, ufSede: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">CEP</label>
                <input
                  type="text"
                  value={dadosEmpresa.cepSede}
                  onChange={(e) => setDadosEmpresa({ ...dadosEmpresa, cepSede: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= ABA 2: SETORES & DEPARTAMENTOS ================= */}
      {abaAtiva === 'setores' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Setores e Departamentos da Empresa</h2>
              <p className="text-xs text-slate-500">
                Organize as equipes, responsabilidades e alocações de colaboradores por departamento.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSetorEditando({
                  codigo: `SET-${Math.floor(10 + Math.random() * 90)}`,
                  nome: '',
                  descricao: '',
                  responsavelNome: '',
                  responsavelCargo: '',
                  corTag: 'sky',
                  ativo: true,
                });
                setModalSetorAberto(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Setor / Departamento</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {setores.map((setor) => {
              const totalFuncNoSetor = funcionarios.filter((f) => f.setorId === setor.id).length;

              return (
                <div
                  key={setor.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-400 transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold">
                        {setor.codigo}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          setor.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {setor.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{setor.nome}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{setor.descricao}</p>

                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                      <div className="text-slate-700 font-medium">
                        <strong>Responsável:</strong> {setor.responsavelNome}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        <strong>Cargo:</strong> {setor.responsavelCargo}
                      </div>
                      {setor.emailOuRamal && (
                        <div className="text-slate-500 text-[11px]">
                          <strong>Contato:</strong> {setor.emailOuRamal}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      <Users className="w-3.5 h-3.5" />
                      {totalFuncNoSetor} colaborador{totalFuncNoSetor !== 1 ? 'es' : ''}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSetorEditando({ ...setor });
                          setModalSetorAberto(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Editar Setor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirSetor(setor.id, setor.nome)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remover Setor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= ABA 3: QUADRO DE FUNCIONÁRIOS & SENHAS ================= */}
      {abaAtiva === 'funcionarios' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar colaborador por nome, e-mail, matrícula ou cargo..."
                  value={termoBuscaFuncionario}
                  onChange={(e) => setTermoBuscaFuncionario(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <select
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-700"
              >
                <option value="TODOS">Todos os Setores</option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setFuncionarioEditando({
                  nome: '',
                  email: '',
                  senha: '123',
                  cargo: 'Cadastrista Técnico',
                  perfil: 'CADASTRISTA_CAMPO',
                  setorId: 'setor-operacao',
                  equipe: 'Equipe 01 - Frente Cabula',
                  status: 'ATIVO',
                  matriculaFuncional: `CAD-${Math.floor(1000 + Math.random() * 9000)}`,
                  dataAdmissao: new Date().toISOString().split('T')[0],
                });
                setModalFuncionarioAberto(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Funcionário & Login</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-3.5">Colaborador / E-mail</th>
                    <th className="p-3.5">Setor / Departamento</th>
                    <th className="p-3.5">Cargo / Matrícula</th>
                    <th className="p-3.5">Perfil de Acesso</th>
                    <th className="p-3.5">Senha de Acesso</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {funcionariosFiltrados.map((func) => {
                    const setor = setores.find((s) => s.id === func.setorId);

                    return (
                      <tr key={func.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                              {func.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <strong className="block text-slate-900 font-bold">{func.nome}</strong>
                              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {func.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold">
                            <Tag className="w-3 h-3 text-indigo-500" />
                            {setor?.nome || 'Operações & Campo'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="text-slate-900 font-bold">{func.cargo}</div>
                          <span className="text-[11px] text-slate-500 font-mono">{func.matriculaFuncional}</span>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                            {func.perfil}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            <KeyRound className="w-3 h-3 text-slate-500" />
                            {func.senha || '123'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              func.status === 'ATIVO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {func.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFuncionarioEditando({ ...func });
                                setModalFuncionarioAberto(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-slate-100 transition cursor-pointer"
                              title="Editar Colaborador"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluirFuncionario(func.id, func.nome)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Remover Colaborador"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 4: EQUIPES DE CAMPO ================= */}
      {abaAtiva === 'equipes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Equipes e Frentes de Trabalho</h2>
              <p className="text-xs text-slate-500">
                Distribuição das equipes de campo, veículos operacionais e metas de vistorias diárias.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEquipeEditando({
                  nome: '',
                  setorId: 'setor-operacao',
                  supervisorResponsavel: 'Roberto Mendes',
                  veiculoIdentificacao: '',
                  zonaAtuacaoPrincipal: 'ZA 23',
                  bairrosBase: ['Cabula'],
                  metaDiariaCenso: 40,
                  ativo: true,
                });
                setModalEquipeAberta(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Equipe de Frente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {equipes.map((eq) => {
              const operadores = funcionarios.filter((f) => f.equipe === eq.nome);

              return (
                <div
                  key={eq.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-400 transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {eq.zonaAtuacaoPrincipal}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          eq.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {eq.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{eq.nome}</h3>

                    <div className="text-xs text-slate-600 space-y-1 pt-1">
                      <div>
                        <strong>Supervisor:</strong> {eq.supervisorResponsavel}
                      </div>
                      {eq.veiculoIdentificacao && (
                        <div>
                          <strong>Veículo:</strong> {eq.veiculoIdentificacao}
                        </div>
                      )}
                      <div>
                        <strong>Meta Diária:</strong> {eq.metaDiariaCenso} vistorias/dia
                      </div>
                      <div>
                        <strong>Bairros Base:</strong> {eq.bairrosBase.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                      {operadores.length} operador{operadores.length !== 1 ? 'es' : ''}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEquipeEditando({ ...eq });
                          setModalEquipeAberta(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja excluir a equipe "${eq.nome}"?`)) {
                            empresaService.excluirEquipe(eq.id);
                            showFeedback(`Equipe "${eq.nome}" removida.`);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL DE CADASTRO/EDIÇÃO DE SETOR ================= */}
      {modalSetorAberto && setorEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {setorEditando.id ? 'Editar Setor / Departamento' : 'Novo Setor / Departamento'}
              </h3>
              <button
                type="button"
                onClick={() => setModalSetorAberto(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarSetorSubmit} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={setorEditando.codigo || ''}
                    onChange={(e) => setSetorEditando({ ...setorEditando, codigo: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Setor *</label>
                  <input
                    type="text"
                    required
                    value={setorEditando.nome || ''}
                    onChange={(e) => setSetorEditando({ ...setorEditando, nome: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    placeholder="Ex: Operações de Campo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição das Atividades</label>
                <textarea
                  rows={2}
                  value={setorEditando.descricao || ''}
                  onChange={(e) => setSetorEditando({ ...setorEditando, descricao: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  placeholder="Descreva as responsabilidades operacionais deste setor..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Responsável pelo Setor</label>
                  <input
                    type="text"
                    value={setorEditando.responsavelNome || ''}
                    onChange={(e) => setSetorEditando({ ...setorEditando, responsavelNome: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo do Responsável</label>
                  <input
                    type="text"
                    value={setorEditando.responsavelCargo || ''}
                    onChange={(e) => setSetorEditando({ ...setorEditando, responsavelCargo: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail ou Ramal de Contato</label>
                <input
                  type="text"
                  value={setorEditando.emailOuRamal || ''}
                  onChange={(e) => setSetorEditando({ ...setorEditando, emailOuRamal: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalSetorAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-sm"
                >
                  Salvar Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CADASTRO/EDIÇÃO DE FUNCIONÁRIO & SENHA ================= */}
      {modalFuncionarioAberto && funcionarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {funcionarioEditando.id ? 'Editar Funcionário e Credenciais' : 'Cadastrar Novo Funcionário'}
                </h3>
                <p className="text-xs text-slate-500">
                  O colaborador usará este e-mail e senha para logar no aplicativo mobile ou web.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalFuncionarioAberto(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarFuncionarioSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={funcionarioEditando.nome || ''}
                    onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, nome: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    placeholder="Ex: Adelmo Ribeiro"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula Funcional *</label>
                  <input
                    type="text"
                    required
                    value={funcionarioEditando.matriculaFuncional || ''}
                    onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, matriculaFuncional: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium font-mono"
                    placeholder="CAD-0418"
                  />
                </div>
              </div>

              {/* Login e Senha */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <span className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  🔐 Credenciais de Acesso (Login no APK / Web)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-950 mb-1">E-mail de Login *</label>
                    <input
                      type="email"
                      required
                      value={funcionarioEditando.email || ''}
                      onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-indigo-300 bg-white text-xs font-medium"
                      placeholder="adelmo@consorcior7.com.br"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-950 mb-1">Senha de Acesso *</label>
                    <div className="relative">
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        required
                        value={funcionarioEditando.senha || ''}
                        onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, senha: e.target.value })}
                        className="w-full p-2.5 pr-9 rounded-xl border border-indigo-300 bg-white text-xs font-mono font-bold"
                        placeholder="Senha de acesso"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Setor / Departamento *</label>
                  <select
                    value={funcionarioEditando.setorId || 'setor-operacao'}
                    onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, setorId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={funcionarioEditando.cargo || ''}
                    onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, cargo: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    placeholder="Ex: Cadastrista Técnico"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Perfil de Acesso *</label>
                  <select
                    value={funcionarioEditando.perfil || 'CADASTRISTA_CAMPO'}
                    onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, perfil: e.target.value as PerfilUsuario })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="CADASTRISTA_CAMPO">Cadastrista de Campo (Mobile)</option>
                    <option value="VALIDADOR_AUDITOR">Validador / Auditor Pré-EMBASA</option>
                    <option value="SUPERVISOR_GERAL">Supervisor Geral</option>
                    <option value="ADMIN_CONTRATO">Administrador do Contrato</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Equipe de Campo</label>
                  <select
                    value={funcionarioEditando.equipe || ''}
                    onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, equipe: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  >
                    {equipes.map((eq) => (
                      <option key={eq.id} value={eq.nome}>
                        {eq.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={funcionarioEditando.telefone || ''}
                    onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, telefone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    placeholder="(71) 98842-1049"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Funcional</label>
                  <select
                    value={funcionarioEditando.status || 'ATIVO'}
                    onChange={(e) => setFuncionarioEditando({ ...funcionarioEditando, status: e.target.value as StatusFuncionario })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="FERIAS">FÉRIAS</option>
                    <option value="INATIVO">INATIVO</option>
                    <option value="BLOQUEADO">BLOQUEADO</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalFuncionarioAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-sm"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CADASTRO/EDIÇÃO DE EQUIPE ================= */}
      {modalEquipeAberta && equipeEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {equipeEditando.id ? 'Editar Equipe de Campo' : 'Nova Equipe de Campo'}
              </h3>
              <button
                type="button"
                onClick={() => setModalEquipeAberta(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarEquipeSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Equipe *</label>
                <input
                  type="text"
                  required
                  value={equipeEditando.nome || ''}
                  onChange={(e) => setEquipeEditando({ ...equipeEditando, nome: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  placeholder="Ex: Equipe 04 - Frente Tancredo Neves"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supervisor Responsável</label>
                  <input
                    type="text"
                    value={equipeEditando.supervisorResponsavel || ''}
                    onChange={(e) => setEquipeEditando({ ...equipeEditando, supervisorResponsavel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Veículo / Placa</label>
                  <input
                    type="text"
                    value={equipeEditando.veiculoIdentificacao || ''}
                    onChange={(e) => setEquipeEditando({ ...equipeEditando, veiculoIdentificacao: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    placeholder="Fiat Strada - Placa..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Zona de Abastecimento</label>
                  <input
                    type="text"
                    value={equipeEditando.zonaAtuacaoPrincipal || 'ZA 23'}
                    onChange={(e) => setEquipeEditando({ ...equipeEditando, zonaAtuacaoPrincipal: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meta Diária (Vistorias)</label>
                  <input
                    type="number"
                    value={equipeEditando.metaDiariaCenso || 40}
                    onChange={(e) => setEquipeEditando({ ...equipeEditando, metaDiariaCenso: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEquipeAberta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-sm"
                >
                  Salvar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
