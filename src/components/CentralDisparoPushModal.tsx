import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Send,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  Smartphone,
  Radio,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  Volume2,
  MapPin,
  FileSpreadsheet,
  Zap,
  Info
} from 'lucide-react';
import {
  pushNotificationService,
  AlertaUrgentePush,
  TipoAlertaPush,
  NivelUrgenciaPush,
  PushStatusState
} from '../services/pushNotificationService';
import { LISTA_BAIRROS } from '../data/bairrosData';

interface CentralDisparoPushModalProps {
  onClose: () => void;
}

const TEMPLATES_EMERGENCIAS = [
  {
    titulo: '🚨 MANOBRA DE REDE: FECHAMENTO DE MACROMEDIDOR R7',
    mensagem: 'Atenção equipes Cabula/Barreiras: Manobra emergencial em andamento na adutora principal. Evitar aberturas de cavalete sem purga de ar prévia até as 17h.',
    tipo: 'MANOBRA_REDE' as TipoAlertaPush,
    nivelUrgencia: 'CRITICA' as NivelUrgenciaPush,
    bairro: 'Cabula',
  },
  {
    titulo: '⚠️ ALERTA DEFESA CIVIL: RISCO GEOLÓGICO EM ENCOSTAS',
    mensagem: 'Volume de chuvas ultrapassou 45mm no Arenoso e Beiru. Fica suspenso o censo em áreas de risco grave de deslizamento. Manter equipes em áreas pavimentadas.',
    tipo: 'SEGURANCA_RISCO' as TipoAlertaPush,
    nivelUrgencia: 'ALTA' as NivelUrgenciaPush,
    bairro: 'Arenoso',
  },
  {
    titulo: '🎯 PRIORIDADE FISCALIZAÇÃO EMBASA: AUDITORIA CONJUNTA',
    mensagem: 'Equipe de fiscalização da concessionária em rota no setor. Priorizar conferência dupla de lacres de hidrômetro e fotos nítidas da fachada de todas as OSs do dia.',
    tipo: 'PRIORIDADE_EMBASA' as TipoAlertaPush,
    nivelUrgencia: 'ALTA' as NivelUrgenciaPush,
    bairro: 'Pernambués',
  },
  {
    titulo: '💧 OS EMERGENCIAL: VAZAMENTO DE GRANDE PORTE NA VIA',
    mensagem: 'Identificado rompimento de ramal com risco de descalçamento de asfalto. Cadastrista mais próximo deve se deslocar para registro fotográfico e sinalização imediata.',
    tipo: 'OS_EMERGENCIAL' as TipoAlertaPush,
    nivelUrgencia: 'CRITICA' as NivelUrgenciaPush,
    bairro: 'Engomadeira',
  },
];

export const CentralDisparoPushModal: React.FC<CentralDisparoPushModalProps> = ({ onClose }) => {
  const [alertas, setAlertas] = useState<AlertaUrgentePush[]>(pushNotificationService.getAlertas());
  const [status, setStatus] = useState<PushStatusState>(pushNotificationService.getStatus());

  // Formulário de envio
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState<TipoAlertaPush>('MANOBRA_REDE');
  const [nivelUrgencia, setNivelUrgencia] = useState<NivelUrgenciaPush>('CRITICA');
  const [equipeDestino, setEquipeDestino] = useState('TODAS');
  const [bairro, setBairro] = useState('Cabula');
  const [matriculaVinculada, setMatriculaVinculada] = useState('');
  const [remetente, setRemetente] = useState('Supervisão Central EMBASA / UML Cabula');

  const [enviando, setEnviando] = useState(false);
  const [feedbackEnvio, setFeedbackEnvio] = useState<string | null>(null);

  useEffect(() => {
    const unsubAlertas = pushNotificationService.subscribe(setAlertas);
    const unsubStatus = pushNotificationService.subscribeStatus(setStatus);
    return () => {
      unsubAlertas();
      unsubStatus();
    };
  }, []);

  const aplicarTemplate = (tpl: typeof TEMPLATES_EMERGENCIAS[0]) => {
    setTitulo(tpl.titulo);
    setMensagem(tpl.mensagem);
    setTipo(tpl.tipo);
    setNivelUrgencia(tpl.nivelUrgencia);
    if (tpl.bairro) setBairro(tpl.bairro);
  };

  const handleSolicitarPermissaoNativa = async () => {
    const res = await pushNotificationService.solicitarPermissaoNotificacoes();
    if (res === 'granted') {
      setFeedbackEnvio('🔔 Permissão concedida! Service Worker apto a emitir Push em segundo plano.');
    } else {
      setFeedbackEnvio('⚠️ Permissão de notificações pendente ou bloqueada no navegador.');
    }
    setTimeout(() => setFeedbackEnvio(null), 4000);
  };

  const handleEnviarPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) {
      setFeedbackEnvio('Por favor preencha o título e a mensagem do alerta.');
      return;
    }

    setEnviando(true);
    try {
      await pushNotificationService.enviarAlertaUrgenteSupervisao({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo,
        nivelUrgencia,
        equipeDestino,
        bairro: bairro || undefined,
        matriculaVinculada: matriculaVinculada.trim() || undefined,
        remetente: remetente.trim() || 'Supervisão Central PGCSA',
      });

      setFeedbackEnvio('✅ Notificação Push disparada com sucesso para os dispositivos móveis!');
      setTitulo('');
      setMensagem('');
      setMatriculaVinculada('');
      setTimeout(() => setFeedbackEnvio(null), 4000);
    } catch (err) {
      console.error(err);
      setFeedbackEnvio('⚠️ Erro ao disparar alerta push.');
    } finally {
      setEnviando(false);
    }
  };

  const handleDispararTesteRapido = async () => {
    await pushNotificationService.enviarAlertaUrgenteSupervisao({
      titulo: '🚨 TESTE PUSH: CHAMADO OPERACIONAL EM SEGUNDO PLANO',
      mensagem: 'Este é um teste de transmissão push urgente com sirene tática e confirmação para o aplicativo mobile.',
      tipo: 'GERAL',
      nivelUrgencia: 'CRITICA',
      equipeDestino: 'TODAS',
      bairro: 'Cabula',
      remetente: 'Supervisão Central de Campo',
    });
    setFeedbackEnvio('🚀 Notificação de teste disparada!');
    setTimeout(() => setFeedbackEnvio(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600/30 text-rose-400 border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                  Transmissão Operacional de Campo
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Service Worker Push Ativo
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Central de Alertas Push & Notificações de Emergência
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Status do Service Worker e Push */}
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${status.swRegistrado ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
              <span>Service Worker: <strong>{status.swRegistrado ? 'Registrado (/sw.js)' : 'Aguardando'}</strong></span>
            </span>

            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>
                Permissão Notificações:{' '}
                <strong className={status.permissao === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>
                  {status.permissao === 'granted' ? 'Autorizada (Nativa)' : status.permissao === 'denied' ? 'Bloqueada' : 'Pendente'}
                </strong>
              </span>
            </span>

            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Segundo Plano (Background Sync): <strong className="text-purple-300">Habilitado</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {status.permissao !== 'granted' && (
              <button
                type="button"
                onClick={handleSolicitarPermissaoNativa}
                className="px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                <BellRing className="w-3 h-3" />
                <span>Ativar Permissão no Navegador</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDispararTesteRapido}
              className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
            >
              <Zap className="w-3 h-3" />
              <span>Testar Disparo Rápido</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Principal com Rolagem */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Feedback */}
          {feedbackEnvio && (
            <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-900 border border-sky-200 text-xs font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{feedbackEnvio}</span>
            </div>
          )}

          {/* Atalhos com Templates Pré-configurados */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Templates Rápidos de Chamado Operacional (Clique para Preencher)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {TEMPLATES_EMERGENCIAS.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => aplicarTemplate(tpl)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition cursor-pointer flex flex-col justify-between space-y-2 hover:border-sky-400 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      {tpl.bairro}
                    </span>
                    <span className="text-[10px] font-black text-rose-600 uppercase">
                      {tpl.nivelUrgencia}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-sky-700">
                    {tpl.titulo}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Formulário de Envio de Alerta */}
          <form onSubmit={handleEnviarPush} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-600" />
              <span>Compor Alerta Push para Aplicativo Mobile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Alerta
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoAlertaPush)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                >
                  <option value="MANOBRA_REDE">Manobra de Rede Hidráulica</option>
                  <option value="SEGURANCA_RISCO">Alerta de Segurança / Risco</option>
                  <option value="PRIORIDADE_EMBASA">Prioridade Contratual EMBASA</option>
                  <option value="OS_EMERGENCIAL">Ordem de Serviço Emergencial</option>
                  <option value="GERAL">Comunicado Geral da Coordenação</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nível de Urgência
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNivelUrgencia('CRITICA')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      nivelUrgencia === 'CRITICA'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    🚨 CRÍTICA (Sirene Imediata)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNivelUrgencia('ALTA')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      nivelUrgencia === 'ALTA'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    ⚠️ ALTA (Prioridade)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Equipe / Técnico Destino
                </label>
                <select
                  value={equipeDestino}
                  onChange={(e) => setEquipeDestino(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                >
                  <option value="TODAS">📢 Todas as Equipes de Campo (Broadcast)</option>
                  <option value="Equipe 01 - Frente Cabula">Equipe 01 - Frente Cabula</option>
                  <option value="Equipe 02 - Frente Arenoso">Equipe 02 - Frente Arenoso</option>
                  <option value="Equipe 03 - Frente Pernambués">Equipe 03 - Frente Pernambués</option>
                  <option value="Adelmo Ribeiro">Cadastrista: Adelmo Ribeiro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bairro / Setor Operacional
                </label>
                <select
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                >
                  {LISTA_BAIRROS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Matrícula EMBASA (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1098472-1"
                  value={matriculaVinculada}
                  onChange={(e) => setMatriculaVinculada(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título do Alerta (Exibido no Cabeçalho Push)
              </label>
              <input
                type="text"
                placeholder="Ex: 🚨 MANOBRA DE REDE: DESPRESSURIZAÇÃO NO SETOR"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mensagem Detalhada da Coordenação
              </label>
              <textarea
                rows={3}
                placeholder="Instruções operacionais imediatas para os técnicos de campo..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
                required
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-500">
                A notificação será enviada ao Service Worker e exibida mesmo com o app em background.
              </span>

              <button
                type="submit"
                disabled={enviando}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-rose-900/30 transition cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {enviando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{enviando ? 'Disparando Transmissão...' : '🚨 DISPARAR NOTIFICAÇÃO PUSH DE EMERGÊNCIA'}</span>
              </button>
            </div>
          </form>

          {/* Histórico de Alertas e Confirmações em Tempo Real dos Técnicos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Histórico de Alertas & Confirmações de Recebimento em Campo</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {alertas.length} alertas disparados
              </span>
            </div>

            <div className="space-y-2.5">
              {alertas.map((al) => {
                const totalConfirmados = al.confirmadoPor.length;
                return (
                  <div
                    key={al.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            al.nivelUrgencia === 'CRITICA' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {al.tipo}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {new Date(al.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(al.dataHora).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {al.titulo}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {totalConfirmados > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{totalConfirmados} técnico(s) ciente(s)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Aguardando confirmação</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {al.mensagem}
                    </p>

                    {/* Feed de Quem Confirmou */}
                    {totalConfirmados > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-700">Confirmado por:</span>
                        {al.confirmadoPor.map((c, idx) => (
                          <span key={idx} className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-medium">
                            {c.nomeTecnico} às {new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
