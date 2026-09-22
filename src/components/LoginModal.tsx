import React, { useState } from 'react';
import {
  Users,
  Shield,
  CheckCircle2,
  Lock,
  Mail,
  X,
  UserCheck,
  Building,
  KeyRound,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { PerfilUsuario, UsuarioSistema, USUARIOS_PREDEFINIDOS } from '../types/auth';
import { authService } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: UsuarioSistema) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const currentUser = authService.getCurrentUser();
  const [selectedUser, setSelectedUser] = useState<UsuarioSistema>(currentUser);
  const [emailInput, setEmailInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPredefined = (u: UsuarioSistema) => {
    setSelectedUser(u);
    authService.setCurrentUser(u);
    if (onLoginSuccess) onLoginSuccess(u);
    onClose();
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      setErrorMessage('Informe o e-mail institucional corporativo.');
      return;
    }

    const result = authService.login(emailInput);
    if (result.success && result.user) {
      if (onLoginSuccess) onLoginSuccess(result.user);
      onClose();
    } else {
      setErrorMessage(result.error || 'Credenciais inválidas.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-800 via-sky-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Perfis de Acesso ao Sistema</h3>
              <p className="text-xs text-sky-200 mt-0.5">
                Contrato EMBASA nº 460024679 • R7
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Perfil Atual Logado */}
        <div className="p-4 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sky-700 text-white font-bold flex items-center justify-center text-xs">
              {currentUser.nome.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                Perfil em Uso
              </span>
              <h4 className="font-bold text-slate-900 text-sm leading-tight">{currentUser.nome}</h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {currentUser.matriculaFuncional} • {currentUser.perfil}
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
            Ativo
          </span>
        </div>

        {/* Seleção Rápida de Perfis Corporativos */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Alternar Perfil / Usuário
            </span>
            <span className="text-[11px] text-slate-400">Clique para assumir a função</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {USUARIOS_PREDEFINIDOS.map((u) => {
              const isCurrent = currentUser.id === u.id;

              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectPredefined(u)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isCurrent
                      ? 'bg-sky-50 border-sky-400 shadow-xs ring-1 ring-sky-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        u.perfil === 'CADASTRISTA_CAMPO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.perfil === 'VALIDADOR_AUDITOR'
                          ? 'bg-amber-100 text-amber-800'
                          : u.perfil === 'SUPERVISOR_GERAL'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {u.perfil === 'CADASTRISTA_CAMPO' && 'CAD'}
                      {u.perfil === 'VALIDADOR_AUDITOR' && 'AUD'}
                      {u.perfil === 'SUPERVISOR_GERAL' && 'SUP'}
                      {u.perfil === 'ADMIN_CONTRATO' && 'ADM'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{u.nome}</span>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        {u.equipe}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {u.perfil.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>

          {/* Rodapé do Modal */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Ambiente Seguro Offline-First • Sincronização Automática com SCIWeb
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
