import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Home,
  Gauge,
  Camera,
  ShieldCheck,
  FileText,
  Printer,
  Share2,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { CensoRecord } from '../types/censo';
import { contractSchemaService, populateContractValuesFromRecord } from '../services/contractSchemaService';
import { ContractFieldDefinition } from '../types/contractFields';

interface CensoDetailModalProps {
  record: CensoRecord | null;
  onClose: () => void;
}

export const CensoDetailModal: React.FC<CensoDetailModalProps> = ({ record, onClose }) => {
  const [contractFields, setContractFields] = useState<ContractFieldDefinition[]>([]);
  const [showOnlyContractFields, setShowOnlyContractFields] = useState(false);

  useEffect(() => {
    contractSchemaService.getContractFields().then((fields) => {
      setContractFields(fields);
    });
  }, []);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const contractValues = populateContractValuesFromRecord(record, contractFields);
  const activeFields = contractFields.filter((f) => f.enabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded">
                Matrícula {record.matriculaEmbasa}
              </span>
              <span className="text-xs font-mono text-slate-300">{record.numeroOS}</span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                {record.zonaAbastecimento}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Prontuário Cadastral Eletrônico
            </h2>
            <p className="text-xs text-slate-300">
              {record.logradouro}, Nº {record.numeroPorta} — {record.bairro} (Salvador/BA)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Imprimir Prontuário"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              {record.syncStatus === 'synced' ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Sincronizado na Base Central SCIWeb
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Salvo Localmente (Aguardando Sincronização)
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              Coletado em: <strong>{new Date(record.criadoEm).toLocaleString('pt-BR')}</strong>
            </div>
          </div>

          {/* Sub-Navegação de Visualização */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setShowOnlyContractFields(false)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                !showOnlyContractFields
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ficha Resumida de Campo
            </button>
            <button
              onClick={() => setShowOnlyContractFields(true)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                showOnlyContractFields
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Campos Oficiais do Contrato ({activeFields.length})</span>
            </button>
          </div>

          {showOnlyContractFields ? (
            /* Visualização dos Campos do Contrato */
            <div className="space-y-3">
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-950 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs">Especificação Contratual EMBASA • R7</p>
                  <p className="text-[11px] text-sky-700 mt-0.5">
                    {activeFields.length} campos ativos conforme especificação contratual da empresa.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 bg-sky-200 text-sky-900 rounded font-bold">
                  SCIWeb / GSAN
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-2.5">Código Contratual</th>
                      <th className="p-2.5">Descrição / Rótulo</th>
                      <th className="p-2.5">Valor Coletado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeFields.map((f) => {
                      const val = contractValues[f.key];
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-mono font-bold text-sky-900 bg-sky-50/40 w-1/3">
                            {f.key}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {f.label}
                          </td>
                          <td className="p-2.5 font-medium text-slate-900">
                            {val !== undefined && val !== null && String(val).trim() !== '' ? (
                              typeof val === 'boolean' ? (
                                val ? 'Sim' : 'Não'
                              ) : (
                                String(val)
                              )
                            ) : (
                              <span className="text-slate-300 italic">Não informado</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
          {/* Dados do Cliente */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <User className="w-4 h-4 text-sky-600" />
              <span>Titular & Perfil Socioeconômico</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">NOME</span>
                <span className="font-semibold text-slate-800">{record.nomeCliente}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">CPF/RG</span>
                <span className="font-mono text-slate-800">{record.cpfCnpj || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">CONTATO</span>
                <span className="text-slate-800">{record.telefoneContato || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">CHEFIA FAMILIAR</span>
                <span className="text-slate-800">{record.sexoResponsavel}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">RENDA</span>
                <span className="text-slate-800">{record.faixaRenda}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">MORADORES</span>
                <span className="text-slate-800">{record.numeroMoradores} pessoas</span>
              </div>
            </div>

            {record.possuiCadUnicoBolsaFamilia && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-50 text-emerald-900 text-[11px] border border-emerald-200">
                <strong>Tarifa Social Cadastrada:</strong> Família enquadrada com direito a desconto conforme o CadÚnico / Bolsa Família.
              </div>
            )}
          </div>

          {/* Hidrometria & Equipamentos */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Gauge className="w-4 h-4 text-sky-600" />
              <span>Hidrometria, Medição e Regularidade</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">SITUAÇÃO</span>
                <span className="font-bold text-slate-900">{record.situacaoLigacao}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Nº HIDRÔMETRO</span>
                <span className="font-mono font-semibold text-slate-900">{record.numeroHidrometro}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">LEITURA</span>
                <span className="font-mono font-bold text-sky-800">{record.leituraAtualM3} m³</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">ESTADO DO LACRE</span>
                <span className="font-semibold text-slate-900">{record.estadoLacre}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">ESTADO MEDIDOR</span>
                <span className="text-slate-800">{record.estadoHidrometro}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">TIPO DE ABRIGO</span>
                <span className="text-slate-800">{record.tipoAbrigo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">VAZAMENTO</span>
                <span className="font-semibold text-rose-700">{record.tipoVazamento}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">COORDENADAS</span>
                <span className="font-mono text-[10px] text-slate-600">
                  {record.coordenadas.latitude.toFixed(4)}, {record.coordenadas.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {record.observacaoTecnica && (
              <div className="p-2 rounded-lg bg-slate-50 text-slate-700 text-[11px] border border-slate-200">
                <strong>Obs. do Cadastrista:</strong> {record.observacaoTecnica}
              </div>
            )}
          </div>

          {/* Galeria de Fotos */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>Registro Fotográfico da Ligação</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Fachada</span>
                {record.fotoFachada ? (
                  <img
                    src={record.fotoFachada}
                    alt="Fachada"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[11px]">
                    Sem foto
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Hidrômetro</span>
                {record.fotoHidrometro ? (
                  <img
                    src={record.fotoHidrometro}
                    alt="Hidrômetro"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[11px]">
                    Sem foto
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Ocorrência</span>
                {record.fotoIrregularidade ? (
                  <img
                    src={record.fotoIrregularidade}
                    alt="Irregularidade"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[11px]">
                    Sem irregularidade
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Cadastrista: <strong>{record.nomeCadastrista}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
