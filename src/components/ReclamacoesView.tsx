import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PhoneCall,
  ShieldAlert,
  Send,
  Sparkles
} from 'lucide-react';
import { BairroR7, ReclamacaoOuvidoria } from '../types/censo';
import { LISTA_BAIRROS } from '../data/bairrosData';
import { getAllReclamacoes, saveReclamacao } from '../services/db';
import { syncManager } from '../services/syncManager';

export const ReclamacoesView: React.FC = () => {
  const [reclamacoes, setReclamacoes] = useState<ReclamacaoOuvidoria[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [bairro, setBairro] = useState<BairroR7>('Sussuarana');
  const [endereco, setEndereco] = useState('');
  const [nomeCidadao, setNomeCidadao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoOcorrencia, setTipoOcorrencia] = useState<'BURACOS_VALAS' | 'INTERRUPCAO_ABASTECIMENTO' | 'POEIRA' | 'RUIDO' | 'DANOS_IMOVEL' | 'OUTRO'>('BURACOS_VALAS');
  const [descricao, setDescricao] = useState('');
  const [canalAtendimento, setCanalAtendimento] = useState<'EQUIPE_CAMPO' | 'CALL_CENTER_0800' | 'WHATSAPP_CAMPO' | 'CANTEIRO_OBRAS'>('EQUIPE_CAMPO');

  const loadData = async () => {
    const list = await getAllReclamacoes();
    if (list.length === 0) {
      const seed: ReclamacaoOuvidoria[] = [
        {
          id: 'rec-1',
          protocolo: 'REC-2026-0041',
          bairro: 'Sussuarana',
          endereco: 'Rua Direta de Sussuarana, em frente ao nº 88',
          nomeCidadao: 'Marcos Vinícius de Jesus',
          telefone: '(71) 99881-2233',
          tipoOcorrencia: 'BURACOS_VALAS',
          descricao: 'Vala aberta para troca de ramal de água ainda sem pavimentação asfáltica dificultando passagem de pedestres.',
          canalAtendimento: 'EQUIPE_CAMPO',
          status: 'EM_ANDAMENTO',
          dataHora: Date.now() - 3600000 * 20, // 20 horas atrás
          prazoSLA48h: Date.now() + 3600000 * 28,
          syncStatus: 'synced',
        },
        {
          id: 'rec-2',
          protocolo: 'REC-2026-0038',
          bairro: 'Cabula',
          endereco: 'Rua Silveira Martins, 400',
          nomeCidadao: 'Dona Arlete Almeida',
          telefone: '(71) 98112-7788',
          tipoOcorrencia: 'POEIRA',
          descricao: 'Poeira gerada por corte de asfalto em horário de almoço.',
          canalAtendimento: 'CALL_CENTER_0800',
          status: 'RESOLVIDO',
          dataHora: Date.now() - 3600000 * 40,
          prazoSLA48h: Date.now() + 3600000 * 8,
          respostaAoCliente: 'Equipe de campo aplicou umectação com caminhão-pipa e concluiu o fechamento do corte.',
          grauSatisfacao: 'OTIMO',
          syncStatus: 'synced',
        },
      ];
      for (const item of seed) {
        await saveReclamacao(item);
      }
      setReclamacoes(seed);
    } else {
      setReclamacoes(list);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endereco || !nomeCidadao || !descricao) return;

    const protocolo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Date.now();

    const newRec: ReclamacaoOuvidoria = {
      id: `rec_${now}`,
      protocolo,
      bairro,
      endereco: endereco.trim(),
      nomeCidadao: nomeCidadao.trim(),
      telefone: telefone.trim(),
      tipoOcorrencia,
      descricao: descricao.trim(),
      canalAtendimento,
      status: 'ABERTO',
      dataHora: now,
      prazoSLA48h: now + 48 * 3600 * 1000,
      syncStatus: syncManager.isEffectiveOnline() ? 'pending' : 'pending',
    };

    await saveReclamacao(newRec);
    setShowModal(false);
    loadData();

    if (syncManager.isEffectiveOnline()) {
      syncManager.triggerAutomaticSync('Nova reclamação de obra registrada');
    }
  };

  const filtered = reclamacoes.filter((r) => {
    const t = searchTerm.toLowerCase();
    return (
      !t ||
      r.protocolo.toLowerCase().includes(t) ||
      r.bairro.toLowerCase().includes(t) ||
      r.nomeCidadao.toLowerCase().includes(t) ||
      r.endereco.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
              <MessageSquareWarning className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Ouvidoria de Campo & Gestão de Demandas da Comunidade
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            SLA obrigatório de 48 horas para resposta e encaminhamento de impactos de obras (Item 14 PGCSA). Atendimento in loco nos 25 bairros do R7 e 0800 0555 0195.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Demanda (SLA 48h)</span>
        </button>
      </div>

      {/* Grid de Canais e SLA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs">
          <span className="text-slate-500 block mb-1">Canais Ativos no R7</span>
          <p className="text-sm font-bold text-slate-900">Equipe de Campo + 0800 0555 0195</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Atendimento volante e canteiro de obras central</p>
        </div>

        <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs">
          <span className="text-slate-500 block mb-1">Meta de SLA Contratual</span>
          <p className="text-sm font-bold text-emerald-700">Retorno em até 48h</p>
          <p className="text-[11px] text-slate-500 mt-0.5">100% das demandas acompanhadas até o encerramento</p>
        </div>

        <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-xs">
          <span className="text-slate-500 block mb-1">Status de Resolução</span>
          <p className="text-sm font-bold text-sky-800">
            {reclamacoes.filter((r) => r.status === 'RESOLVIDO').length} resolvidos / {reclamacoes.length} total
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pesquisa de satisfação pós-atendimento</p>
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
            placeholder="Buscar por protocolo (REC-2026-XXXX), morador, bairro ou rua..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900"
          />
        </div>
      </div>

      {/* Lista de Demandas */}
      <div className="space-y-2.5">
        {filtered.map((item) => {
          const hoursRemaining = Math.max(0, Math.round((item.prazoSLA48h - Date.now()) / 3600000));

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200 text-xs"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                    {item.protocolo}
                  </span>
                  <span className="font-semibold text-slate-700">{item.bairro}</span>
                  <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[10px]">
                    Canal: {item.canalAtendimento}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'RESOLVIDO' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Resolvido no Prazo (SLA OK)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold">
                      <Clock className="w-3 h-3 text-amber-700" />
                      {hoursRemaining}h restantes para vencer SLA
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  {item.tipoOcorrencia.replace(/_/g, ' ')} — {item.endereco}
                </p>
                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                  "{item.descricao}"
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Reclamante: <strong>{item.nomeCidadao}</strong> ({item.telefone})</span>
                  <span>Registrado em {new Date(item.dataHora).toLocaleString('pt-BR')}</span>
                </div>

                {item.respostaAoCliente && (
                  <div className="mt-2.5 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[11px]">
                    <strong>Ação Corretiva Executada:</strong> {item.respostaAoCliente}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nova Reclamação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              Registrar Demanda Comunitária / Ouvidoria (SLA 48h)
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bairro R7 *</label>
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

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Demanda *</label>
                  <select
                    value={tipoOcorrencia}
                    onChange={(e) => setTipoOcorrencia(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    <option value="BURACOS_VALAS">Buraco / Vala Aberta na Via</option>
                    <option value="INTERRUPCAO_ABASTECIMENTO">Interrupção Temporária de Água</option>
                    <option value="POEIRA">Poeira das Obras</option>
                    <option value="RUIDO">Ruído de Máquinas / Equipamentos</option>
                    <option value="DANOS_IMOVEL">Dano ao Passeio / Muro / Calçada</option>
                    <option value="OUTRO">Outra Demanda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Logradouro / Ponto Exato *</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número de porta e ponto de referência"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Munícipe *</label>
                  <input
                    type="text"
                    value={nomeCidadao}
                    onChange={(e) => setNomeCidadao(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full rounded-lg border border-slate-300 p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(71) 90000-0000"
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Canal de Entrada</label>
                <select
                  value={canalAtendimento}
                  onChange={(e) => setCanalAtendimento(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                >
                  <option value="EQUIPE_CAMPO">Equipe de Campo (In Loco)</option>
                  <option value="WHATSAPP_CAMPO">WhatsApp de Campo</option>
                  <option value="CALL_CENTER_0800">Call Center 0800 0555 0195</option>
                  <option value="CANTEIRO_OBRAS">Canteiro de Obras Central</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição Detalhada do Fato *</label>
                <textarea
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Relato detalhado para intervenção imediata da equipe de engenharia e social..."
                  className="w-full rounded-lg border border-slate-300 p-2"
                  required
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-[11px] text-sky-900">
                <strong>Garantia Contratual:</strong> Ao registrar esta demanda, o sistema emite protocolo oficial e aciona o cronômetro de 48 horas para retorno técnico formal ao munícipe.
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
                  className="px-4 py-2 rounded-xl bg-sky-700 text-white font-bold hover:bg-sky-800"
                >
                  Registrar Demanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
