import React, { useState, useEffect } from 'react';
import {
  Handshake,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bike,
  HeartHandshake,
  FileCheck,
  Building,
  DollarSign
} from 'lucide-react';
import { BairroR7, NegociacaoDebito } from '../types/censo';
import { LISTA_BAIRROS } from '../data/bairrosData';
import { getAllNegociacoes, saveNegociacao } from '../services/db';
import { syncManager } from '../services/syncManager';

export const NegociacaoView: React.FC = () => {
  const [negociacoes, setNegociacoes] = useState<NegociacaoDebito[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form
  const [matricula, setMatricula] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [bairro, setBairro] = useState<BairroR7>('Pernambués');
  const [statusLigacao, setStatusLigacao] = useState<'INATIVA' | 'SUPRIMIDA' | 'DEBITO_ATIVO'>('INATIVA');
  const [tentativaNegociacao, setTentativaNegociacao] = useState<1 | 2 | 3>(1);
  const [tipoTentativa, setTipoTentativa] = useState<'MOTO_NEGOCIADOR' | 'VISITA_SOCIAL' | 'UNIDADE_MOVEL'>('MOTO_NEGOCIADOR');
  const [propostaAcordo, setPropostaAcordo] = useState('Parcelamento em até 24x sem juros e isenção de taxa de religação');
  const [adesaoTarifaSocial, setAdesaoTarifaSocial] = useState(true);
  const [resultado, setResultado] = useState<'ACORDO_FECHADO' | 'EM_ANALISE' | 'RECUSADO' | 'ENCAMINHADO_ENGENHARIA'>('ACORDO_FECHADO');

  const loadData = async () => {
    const list = await getAllNegociacoes();
    if (list.length === 0) {
      // Seed inicial
      const seed: NegociacaoDebito[] = [
        {
          id: 'neg-1',
          matricula: '10928471',
          nomeCliente: 'Joilson da Silva Santos',
          telefone: '(71) 98722-1122',
          bairro: 'Arenoso',
          statusLigacao: 'INATIVA',
          tentativaNegociacao: 1,
          tipoTentativa: 'MOTO_NEGOCIADOR',
          propostaAcordo: 'Inclusão imediata no CadÚnico + Tarifa Social e anistia de juros acumulados.',
          adesaoTarifaSocial: true,
          resultado: 'ACORDO_FECHADO',
          dataTentativa: Date.now() - 3600000 * 8,
          syncStatus: 'synced',
        },
        {
          id: 'neg-2',
          matricula: '20491823',
          nomeCliente: 'Maria Conceição das Neves',
          telefone: '(71) 99182-3344',
          bairro: 'Pernambués',
          statusLigacao: 'SUPRIMIDA',
          tentativaNegociacao: 2,
          tipoTentativa: 'VISITA_SOCIAL',
          propostaAcordo: 'Parcelamento em 12 parcelas sociais e restabelecimento da ligação com novo hidrômetro.',
          adesaoTarifaSocial: true,
          resultado: 'EM_ANALISE',
          dataTentativa: Date.now() - 3600000 * 3,
          syncStatus: 'pending',
        },
      ];
      for (const item of seed) {
        await saveNegociacao(item);
      }
      setNegociacoes(seed);
    } else {
      setNegociacoes(list);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula || !nomeCliente) return;

    const newNeg: NegociacaoDebito = {
      id: `neg_${Date.now()}`,
      matricula: matricula.trim(),
      nomeCliente: nomeCliente.trim(),
      telefone: telefone.trim(),
      bairro,
      statusLigacao,
      tentativaNegociacao,
      tipoTentativa,
      propostaAcordo: propostaAcordo.trim(),
      adesaoTarifaSocial,
      resultado,
      dataTentativa: Date.now(),
      syncStatus: syncManager.isEffectiveOnline() ? 'pending' : 'pending',
    };

    await saveNegociacao(newNeg);
    setShowModal(false);
    loadData();

    if (syncManager.isEffectiveOnline()) {
      syncManager.triggerAutomaticSync('Nova negociação registrada');
    }
  };

  const filtered = negociacoes.filter((n) => {
    const t = searchTerm.toLowerCase();
    return (
      !t ||
      n.matricula.toLowerCase().includes(t) ||
      n.nomeCliente.toLowerCase().includes(t) ||
      n.bairro.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Handshake className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Negociação de Débitos & Adesão à Tarifa Social
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Procedimento contratual para recuperação de ligações inativas/suprimidas (Item 10 PGCSA): até 3 tentativas amigáveis com moto-negociadores e 1 visita da assistência social.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Negociação em Campo</span>
        </button>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs">
          <div className="text-slate-500 mb-1 flex items-center justify-between">
            <span>Tentativas Amigáveis com Moto</span>
            <Bike className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">5 Equipes de Moto</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Equipes 01 a 05 com app Digiteam em campo</p>
        </div>

        <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs">
          <div className="text-slate-500 mb-1 flex items-center justify-between">
            <span>Adesões à Tarifa Social</span>
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700">
            {negociacoes.filter((n) => n.adesaoTarifaSocial).length} clientes
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Desconto garantido para Bolsa Família / CadÚnico</p>
        </div>

        <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs">
          <div className="text-slate-500 mb-1 flex items-center justify-between">
            <span>Acordos Fechados</span>
            <FileCheck className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl font-bold text-sky-800">
            {negociacoes.filter((n) => n.resultado === 'ACORDO_FECHADO').length} de {negociacoes.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Religações e regularizações autorizadas</p>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar negociação por matrícula, cliente ou bairro..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900"
          />
        </div>
      </div>

      {/* Lista de Negociações */}
      <div className="space-y-2.5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                  Matr. {item.matricula}
                </span>
                <span className="font-semibold text-slate-700">{item.bairro}</span>
                <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[10px]">
                  {item.tentativaNegociacao}ª Tentativa ({item.tipoTentativa})
                </span>
              </div>
              <h4 className="font-bold text-slate-900">{item.nomeCliente}</h4>
              <p className="text-slate-600 text-[11px] mt-0.5">{item.propostaAcordo}</p>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  item.resultado === 'ACORDO_FECHADO'
                    ? 'bg-emerald-100 text-emerald-800'
                    : item.resultado === 'EM_ANALISE'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {item.resultado === 'ACORDO_FECHADO' && <CheckCircle2 className="w-3 h-3" />}
                {item.resultado === 'ACORDO_FECHADO' ? 'Acordo Formalizado' : item.resultado}
              </span>

              {item.adesaoTarifaSocial && (
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Tarifa Social Ativada
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Negociação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              Registrar Negociação & Regularização de Ligação
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Matrícula EMBASA *</label>
                  <input
                    type="text"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    placeholder="Ex: 10928471"
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bairro *</label>
                  <select
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value as BairroR7)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    {LISTA_BAIRROS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone de Contato</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(71) 90000-0000"
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status da Ligação</label>
                  <select
                    value={statusLigacao}
                    onChange={(e) => setStatusLigacao(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    <option value="INATIVA">Inativa</option>
                    <option value="SUPRIMIDA">Suprimida</option>
                    <option value="DEBITO_ATIVO">Ativa com Débito</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tentativa Amigável</label>
                  <select
                    value={tentativaNegociacao}
                    onChange={(e) => setTentativaNegociacao(Number(e.target.value) as any)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    <option value={1}>1ª Tentativa (Moto)</option>
                    <option value={2}>2ª Tentativa (Moto)</option>
                    <option value={3}>3ª Tentativa (Visita Social)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Abordagem</label>
                  <select
                    value={tipoTentativa}
                    onChange={(e) => setTipoTentativa(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    <option value="MOTO_NEGOCIADOR">Negociador de Moto</option>
                    <option value="VISITA_SOCIAL">Visita da Assistente Social</option>
                    <option value="UNIDADE_MOVEL">Tenda / Unidade Móvel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposta de Acordo</label>
                <textarea
                  rows={2}
                  value={propostaAcordo}
                  onChange={(e) => setPropostaAcordo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adesaoTarifaSocial}
                    onChange={(e) => setAdesaoTarifaSocial(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-emerald-950">
                    Enquadrar na Tarifa Social (Bolsa Família / CadÚnico)
                  </span>
                </label>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Garante desconto substancial e restauração contínua do fornecimento de água potável.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resultado da Negociação</label>
                <select
                  value={resultado}
                  onChange={(e) => setResultado(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 p-2 font-semibold"
                >
                  <option value="ACORDO_FECHADO">Acordo Fechado / Religação Solicitada</option>
                  <option value="EM_ANALISE">Em Análise pelo Cliente</option>
                  <option value="RECUSADO">Recusado pelo Morador</option>
                  <option value="ENCAMINHADO_ENGENHARIA">Encaminhado para Equipe de Engenharia</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Salvar Negociação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
