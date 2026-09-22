import React, { useState } from 'react';
import {
  Building2,
  User,
  Mail,
  Lock,
  FileText,
  CheckCircle2,
  X,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { tenantService } from '../services/tenantService';
import { authService } from '../services/authService';
import { UsuarioSistema } from '../types/auth';

interface CadastroClienteWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: (user: UsuarioSistema) => void;
}

export const CadastroClienteWebModal: React.FC<CadastroClienteWebModalProps> = ({
  isOpen,
  onClose,
  onSucesso,
}) => {
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nomeFantasia.trim()) {
      setErro('Por favor, informe o Nome Fantasia da sua empresa.');
      return;
    }
    if (!nomeAdmin.trim()) {
      setErro('Por favor, informe o Nome do Administrador.');
      return;
    }
    if (!emailAdmin.trim() || !emailAdmin.includes('@')) {
      setErro('Por favor, informe um e-mail válido para o seu login.');
      return;
    }
    if (!senhaAdmin.trim() || senhaAdmin.length < 4) {
      setErro('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    try {
      // 1. Cadastra o novo Tenant / Empresa no tenantService
      const resultadoTenant = tenantService.criarNovoCliente({
        razaoSocial: razaoSocial.trim() || nomeFantasia.trim(),
        nomeFantasia: nomeFantasia.trim(),
        cnpj: cnpj.trim() || 'ISENTO',
        contratoNumero: `CT-${Math.floor(100000 + Math.random() * 900000)}`,
        emailAdmin: emailAdmin.trim(),
        senhaAdminInicial: senhaAdmin.trim(),
        limiteAparelhos: 15,
        diasValidadeLicenca: 365,
      });

      // 2. Cria o Usuário Administrador no authService vinculado a esta empresa
      const novoAdmin = authService.salvarFuncionario({
        nome: nomeAdmin.trim(),
        email: emailAdmin.trim(),
        senha: senhaAdmin.trim(),
        telefone: telefone.trim(),
        cpf: cnpj.trim(),
        perfil: 'ADMIN_CONTRATO',
        cargo: 'Gestor do Contrato / Administrador',
        setorId: 'setor-diretoria',
        equipe: 'Diretoria Geral',
        status: 'ATIVO',
      });

      // 3. Define como usuário logado e tenant ativo
      authService.setCurrentUser(novoAdmin);
      tenantService.setActiveTenant(resultadoTenant.cliente.id);

      setSucesso(true);
      setTimeout(() => {
        onSucesso(novoAdmin);
      }, 1000);
    } catch (err: any) {
      setErro(err?.message || 'Erro ao criar cadastro. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-sky-500/30 animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-950 p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Criar Login do Cliente (Sistema Web)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Acesso Imediato
                </span>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Preencha os dados da sua empresa para acessar o painel de gestão de OS.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto space-y-4 text-xs">
          {sucesso ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Login Criado com Sucesso!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Seja bem-vindo, <strong>{nomeAdmin}</strong>. Seu acesso administrativo à empresa{' '}
                <strong>{nomeFantasia}</strong> foi ativado. Entrando no painel...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {erro}
                </div>
              )}

              {/* Seção 1: Dados da Empresa */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  1. Dados da Empresa Prestadora
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nome Fantasia / Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                      placeholder="Ex: Sanepar Serviços"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      CNPJ da Empresa
                    </label>
                    <input
                      type="text"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Razão Social Completa (Opcional)
                  </label>
                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Ex: Sanepar Soluções e Saneamento Ltda"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Seção 2: Login do Administrador */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  2. Seu Login de Acesso Administrativo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nome do Gestor / Admin *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeAdmin}
                      onChange={(e) => setNomeAdmin(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(71) 99999-9999"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={emailAdmin}
                    onChange={(e) => setEmailAdmin(e.target.value)}
                    placeholder="seuemail@empresa.com.br"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Crie sua Senha de Acesso *
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      required
                      value={senhaAdmin}
                      onChange={(e) => setSenhaAdmin(e.target.value)}
                      placeholder="Mínimo de 4 dígitos"
                      className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-98 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Criar Meu Login e Acessar o Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[11px] text-slate-400 text-center pt-1">
                Ao criar seu login, você terá acesso completo ao módulo de gestão, roteirização e importação de ordens de serviço.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
