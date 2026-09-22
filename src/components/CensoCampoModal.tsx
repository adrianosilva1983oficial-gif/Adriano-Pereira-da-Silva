import React, { useState } from 'react';
import {
  X,
  FileCheck,
  CheckCircle2,
  Gauge,
  Home,
  User,
  AlertTriangle,
  Save,
  Check,
  Building,
  Info,
  Zap,
  Droplets,
} from 'lucide-react';
import { OrdemServicoSCIWeb, CensoRapidoOS } from '../types/os';
import { osService } from '../services/osService';
import { syncManager } from '../services/syncManager';

interface CensoCampoModalProps {
  os: OrdemServicoSCIWeb;
  onClose: () => void;
  onSalvo?: () => void;
}

export const CensoCampoModal: React.FC<CensoCampoModalProps> = ({ os, onClose, onSalvo }) => {
  const dadosIniciais = os.censoDados || {};

  const [situacaoLigacao, setSituacaoLigacao] = useState(dadosIniciais.situacaoLigacao || 'ATIVA');
  const [numeroHidrometroEncontrado, setNumeroHidrometroEncontrado] = useState(
    dadosIniciais.numeroHidrometroEncontrado || os.hidrometroCadastradoSCIWeb || ''
  );
  const [leituraAtualM3, setLeituraAtualM3] = useState<number>(dadosIniciais.leituraAtualM3 || 0);
  const [estadoHidrometro, setEstadoHidrometro] = useState(dadosIniciais.estadoHidrometro || 'NORMAL');
  const [estadoLacre, setEstadoLacre] = useState(dadosIniciais.estadoLacre || 'INTACTO');
  const [tipoAbrigo, setTipoAbrigo] = useState(dadosIniciais.tipoAbrigo || 'PADRAO_EMBASA_MURO');
  const [tipoVazamento, setTipoVazamento] = useState(dadosIniciais.tipoVazamento || 'NENHUM');
  const [prioridadeEmergencia, setPrioridadeEmergencia] = useState<boolean>(
    dadosIniciais.tipoVazamento === 'CAVALETE' || dadosIniciais.tipoVazamento === 'REDE_EXTERNA'
  );

  const [tipoImovel, setTipoImovel] = useState(dadosIniciais.tipoImovel || os.categoriaImovel || 'RESIDENCIAL');
  const [nomeMorador, setNomeMorador] = useState(dadosIniciais.nomeMoradorEntrevistado || os.nomeConsumidorSCIWeb || '');
  const [telefoneContato, setTelefoneContato] = useState(dadosIniciais.telefoneContato || '');
  const [numeroMoradores, setNumeroMoradores] = useState<number>(dadosIniciais.numeroMoradores || 3);
  const [possuiBolsaFamilia, setPossuiBolsaFamilia] = useState<boolean>(dadosIniciais.possuiBolsaFamilia ?? true);
  const [interesseTarifaSocial, setInteresseTarifaSocial] = useState<boolean>(dadosIniciais.interesseTarifaSocial ?? true);
  const [observacoes, setObservacoes] = useState(dadosIniciais.observacoes || '');

  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async (concluirOS: boolean = true) => {
    setSalvando(true);

    const isVazamento = tipoVazamento === 'CAVALETE' || tipoVazamento === 'REDE_EXTERNA';
    const isCritica = prioridadeEmergencia || isVazamento;

    const censoAtualizado: CensoRapidoOS = {
      situacaoLigacao,
      numeroHidrometroEncontrado,
      leituraAtualM3,
      estadoHidrometro,
      estadoLacre,
      tipoAbrigo,
      tipoVazamento,
      tipoImovel,
      nomeMoradorEntrevistado: nomeMorador,
      telefoneContato,
      numeroMoradores,
      possuiBolsaFamilia,
      interesseTarifaSocial,
      observacoes: isCritica
        ? `[🚨 EMERGÊNCIA DE VAZAMENTO PRIORITÁRIA] ${observacoes}`.trim()
        : observacoes,
      atualizadoEm: Date.now(),
    };

    osService.salvarCensoOS(os.id, censoAtualizado, concluirOS);

    if (isCritica) {
      await syncManager.prioritizeByMatricula(
        os.matriculaEmbasa,
        `Emergência de Vazamento (${tipoVazamento}) - Priorizado pelo operador de campo`
      );
    }

    setTimeout(() => {
      setSalvando(false);
      if (onSalvo) onSalvo();
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-sans">
        {/* Header do Censo Mobile */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between border-b border-sky-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/30 border border-sky-400/30 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Vistoria e Censo de Campo</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-mono font-bold">
                  OFICIAL R7
                </span>
              </div>
              <p className="text-[11px] text-sky-200">
                Matrícula: <strong className="font-mono text-white">{os.matriculaEmbasa}</strong> • {os.logradouro}, {os.numeroPorta}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* 1. Hidrometria & Situação Comercial */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-200 pb-1.5">
              <Gauge className="w-4 h-4 text-sky-600" />
              <span>1. Situação da Ligação de Água & Hidrômetro</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Situação da Ligação</label>
                <select
                  value={situacaoLigacao}
                  onChange={(e) => setSituacaoLigacao(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ATIVA">Ativa e Regular</option>
                  <option value="CORTADA">Cortada</option>
                  <option value="SUPRIMIDA">Suprimida / Desligada</option>
                  <option value="CLANDESTINA_GATO">Clandestina (Gato / By-pass)</option>
                  <option value="POTENCIAL">Potencial (Sem ramal físico)</option>
                  <option value="FACTIVEL">Factível (Rede em frente)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nº do Hidrômetro em Campo</label>
                <input
                  type="text"
                  value={numeroHidrometroEncontrado}
                  onChange={(e) => setNumeroHidrometroEncontrado(e.target.value)}
                  placeholder="Ex: A24N123456"
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Leitura Atual no Visor (m³)</label>
                <input
                  type="number"
                  min="0"
                  value={leituraAtualM3}
                  onChange={(e) => setLeituraAtualM3(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-sky-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Estado do Hidrômetro</label>
                <select
                  value={estadoHidrometro}
                  onChange={(e) => setEstadoHidrometro(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="NORMAL">Normal / Funcionando</option>
                  <option value="PARADO">Parado / Travado</option>
                  <option value="INVERTIDO">Invertido</option>
                  <option value="ILEGIVEL">Ilegível / Visor fosco</option>
                  <option value="SEM_HIDROMETRO">Sem Hidrômetro Instalado</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Integridade do Lacre</label>
                <select
                  value={estadoLacre}
                  onChange={(e) => setEstadoLacre(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="INTACTO">Lacre Intacto / Original</option>
                  <option value="VIOLADO">Lacre Violado / Rompido</option>
                  <option value="SEM_LACRE">Sem Lacre</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Abrigo / Caixa</label>
                <select
                  value={tipoAbrigo}
                  onChange={(e) => setTipoAbrigo(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="PADRAO_EMBASA_MURO">Padrão Embasa Muro / Mureta</option>
                  <option value="INTERNO">Cavalete Interno no Lote</option>
                  <option value="EMBUTIDO">Embutido na Parede</option>
                  <option value="CAIXA_CHAO">Caixa no Piso / Calçada</option>
                  <option value="SEM_ABRIGO">Desprotegido / Sem Abrigo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Detecção de Vazamento</label>
              <select
                value={tipoVazamento}
                onChange={(e) => {
                  const val = e.target.value;
                  setTipoVazamento(val);
                  if (val === 'CAVALETE' || val === 'REDE_EXTERNA') {
                    setPrioridadeEmergencia(true);
                  }
                }}
                className={`w-full px-2.5 py-2 rounded-xl border font-bold ${
                  tipoVazamento !== 'NENHUM'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="NENHUM">Nenhum vazamento detectado</option>
                <option value="CAVALETE">Vazamento no Cavalete / Conexões</option>
                <option value="REDE_EXTERNA">Vazamento na Rede Externa da Rua</option>
                <option value="INTERNO_SUSPEITO">Vazamento Interno Visível / Suspeito</option>
              </select>

              {/* Destaque de Prioridade de Emergência no syncManager */}
              {(tipoVazamento === 'CAVALETE' || tipoVazamento === 'REDE_EXTERNA' || prioridadeEmergencia) && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-rose-800">
                        🚨 OCORRÊNCIA CRÍTICA DE VAZAMENTO
                      </span>
                      <label className="flex items-center gap-1 text-[11px] font-bold cursor-pointer text-rose-700 hover:text-rose-900">
                        <input
                          type="checkbox"
                          checked={prioridadeEmergencia}
                          onChange={(e) => setPrioridadeEmergencia(e.target.checked)}
                          className="w-3.5 h-3.5 text-rose-600 rounded border-rose-400 focus:ring-rose-500"
                        />
                        <span>Subir em 1º Lugar</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-rose-700 leading-tight">
                      Esta ordem de serviço será enviada com <strong>Prioridade Crítica Máxima</strong> pelo <code className="font-mono bg-rose-200/60 px-1 rounded">syncManager</code>, subindo antes de qualquer outra ordem assim que o sinal de rede for detectado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Titular e Perfil do Usuário */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-200 pb-1.5">
              <User className="w-4 h-4 text-sky-600" />
              <span>2. Titular e Dados do Morador</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Entrevistado</label>
                <input
                  type="text"
                  value={nomeMorador}
                  onChange={(e) => setNomeMorador(e.target.value)}
                  placeholder="Nome do responsável"
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={telefoneContato}
                  onChange={(e) => setTelefoneContato(e.target.value)}
                  placeholder="(71) 90000-0000"
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoria do Imóvel</label>
                <select
                  value={tipoImovel}
                  onChange={(e) => setTipoImovel(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="RESIDENCIAL">Residencial</option>
                  <option value="COMERCIAL">Comercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="PUBLICO">Público / Institucional</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nº de Moradores</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={numeroMoradores}
                  onChange={(e) => setNumeroMoradores(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={possuiBolsaFamilia}
                  onChange={(e) => setPossuiBolsaFamilia(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-800">Possui CadÚnico / Bolsa Família</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={interesseTarifaSocial}
                  onChange={(e) => setInteresseTarifaSocial(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-800">Interesse em Tarifa Social</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Observações Técnicas de Campo</label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Detalhes adicionais da ligação, ponto de referência ou ocorrência..."
                className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Info className="w-3.5 h-3.5 text-sky-600" />
            <span>Dados gravados automaticamente de forma offline no aparelho.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={salvando}
              onClick={() => handleSalvar(false)}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Salvar Parcial
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={() => handleSalvar(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Vistoria / O.S.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
