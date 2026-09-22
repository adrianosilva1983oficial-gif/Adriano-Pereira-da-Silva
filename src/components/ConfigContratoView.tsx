import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Upload,
  Search,
  Filter,
  Layers,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  Tag,
  Check,
  X
} from 'lucide-react';
import {
  ContractFieldDefinition,
  ContractFieldSection,
  ContractFieldType,
} from '../types/contractFields';
import {
  contractSchemaService,
  DEFAULT_CONTRACT_FIELDS,
  SECTION_NAMES,
} from '../services/contractSchemaService';

export const ConfigContratoView: React.FC = () => {
  const [fields, setFields] = useState<ContractFieldDefinition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'EXCLUDED'>('ALL');

  // Modal de Adicionar / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<ContractFieldDefinition | null>(null);

  // Formulário do Modal
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formSection, setFormSection] = useState<ContractFieldSection>('PERSONALIZADOS');
  const [formType, setFormType] = useState<ContractFieldType>('text');
  const [formRequired, setFormRequired] = useState(false);
  const [formOptionsInput, setFormOptionsInput] = useState('');
  const [formPlaceholder, setFormPlaceholder] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDefaultValue, setFormDefaultValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Notificação temporária
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadFields = async () => {
    const data = await contractSchemaService.getContractFields();
    setFields(data);
  };

  useEffect(() => {
    loadFields();
    const unsub = contractSchemaService.subscribe((updated) => {
      setFields(updated);
    });
    return () => unsub();
  }, []);

  // Abrir Modal para Criar
  const handleOpenAddModal = () => {
    setEditingField(null);
    setFormKey('');
    setFormLabel('');
    setFormSection('PERSONALIZADOS');
    setFormType('text');
    setFormRequired(false);
    setFormOptionsInput('');
    setFormPlaceholder('');
    setFormDescription('');
    setFormDefaultValue('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar
  const handleOpenEditModal = (field: ContractFieldDefinition) => {
    setEditingField(field);
    setFormKey(field.key);
    setFormLabel(field.label);
    setFormSection(field.section);
    setFormType(field.type);
    setFormRequired(field.required);
    setFormOptionsInput(field.options ? field.options.join('\n') : '');
    setFormPlaceholder(field.placeholder || '');
    setFormDescription(field.description || '');
    setFormDefaultValue(field.defaultValue || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Salvar no Modal
  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanKey = formKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanKey) {
      setFormError('Informe o código contratual do campo (ex: COD_SETOR, LACRE_NOVO).');
      return;
    }
    if (!formLabel.trim()) {
      setFormError('Informe um rótulo amigável para o campo.');
      return;
    }

    const options = formType === 'select'
      ? formOptionsInput.split('\n').map((s) => s.trim()).filter(Boolean)
      : undefined;

    if (formType === 'select' && (!options || options.length === 0)) {
      setFormError('Para campos do tipo Seleção, informe pelo menos uma opção (uma por linha).');
      return;
    }

    try {
      if (editingField) {
        // Editando campo existente
        await contractSchemaService.updateField(editingField.id, {
          label: formLabel.trim(),
          section: formSection,
          type: formType,
          required: formRequired,
          options,
          placeholder: formPlaceholder.trim() || undefined,
          description: formDescription.trim() || undefined,
          defaultValue: formDefaultValue.trim() || undefined,
        });
        showToast(`Campo "${cleanKey}" atualizado com sucesso!`);
      } else {
        // Criando novo campo
        await contractSchemaService.addField({
          key: cleanKey,
          label: formLabel.trim(),
          section: formSection,
          type: formType,
          required: formRequired,
          enabled: true,
          isCoreContract: false,
          options,
          placeholder: formPlaceholder.trim() || undefined,
          description: formDescription.trim() || undefined,
          defaultValue: formDefaultValue.trim() || undefined,
        });
        showToast(`Novo campo "${cleanKey}" inserido no Censo com sucesso!`);
      }
      setIsModalOpen(false);
      loadFields();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar campo.');
    }
  };

  // Alternar Inclusão/Exclusão do Campo
  const handleToggleEnabled = async (field: ContractFieldDefinition) => {
    const nextState = !field.enabled;
    await contractSchemaService.toggleFieldEnabled(field.id, nextState);
    showToast(
      nextState
        ? `Campo "${field.key}" incluído no Censo!`
        : `Campo "${field.key}" excluído/desativado do Censo.`,
      nextState ? 'success' : 'warn'
    );
    loadFields();
  };

  // Excluir Campo (se customizado apaga, se core desativa)
  const handleDeleteField = async (field: ContractFieldDefinition) => {
    const confirmMsg = field.isCoreContract
      ? `O campo "${field.key}" é um campo oficial do contrato da empresa. Deseja excluí-lo/desativá-lo do Censo? (Você poderá reativá-lo a qualquer momento).`
      : `Tem certeza que deseja excluir permanentemente o campo personalizado "${field.key}"?`;

    if (window.confirm(confirmMsg)) {
      await contractSchemaService.deleteOrExcludeField(field.id, true);
      showToast(`Campo "${field.key}" ${field.isCoreContract ? 'desativado' : 'excluído'}!`, 'warn');
      loadFields();
    }
  };

  // Restaurar Padrão dos 38 Campos Oficiais
  const handleResetDefaults = async () => {
    if (
      window.confirm(
        'Deseja restaurar o modelo padrão estipulado pela empresa com todos os 38 campos oficiais da EMBASA (Cabula R7)?'
      )
    ) {
      await contractSchemaService.resetToDefaultContract();
      showToast('Modelo padrão da empresa restaurado com sucesso! (38 campos ativos)');
      loadFields();
    }
  };

  // Presets Rápidos
  const handleApplyPreset = async (presetType: 'ALL' | 'HIDROMETRIA' | 'SEM_HISTORICO') => {
    if (presetType === 'ALL') {
      await contractSchemaService.applyActiveKeys(DEFAULT_CONTRACT_FIELDS.map((f) => f.key));
      showToast('Preset aplicado: Todos os 38 campos contratuais ativos.');
    } else if (presetType === 'HIDROMETRIA') {
      const keys = [
        'MATRICULA', 'ZONA_FATU', 'NOME_CONS', 'TIPO_LOGRA', 'ENDERECO', 'PORTA',
        'BAIRRO', 'SIT_AGUA', 'SIT_LIGACA', 'NUM_HIDR', 'DT_INSTAL', 'LOC_HIDR',
        'VAZAO', 'MARCA', 'TIPO', 'DIAMETRO', 'CONS_MED', 'SITIMOVEL'
      ];
      await contractSchemaService.applyActiveKeys(keys);
      showToast('Preset aplicado: Censo Focado em Hidrometria & Troca de Medidores.');
    } else if (presetType === 'SEM_HISTORICO') {
      const excludedHistorico = DEFAULT_CONTRACT_FIELDS.filter(
        (f) => f.section !== 'HISTORICO_FATURAMENTO'
      ).map((f) => f.key);
      await contractSchemaService.applyActiveKeys(excludedHistorico);
      showToast('Preset aplicado: Censo Cadastral Direto (sem histórico de 6 meses).');
    }
    loadFields();
  };

  // Exportar Dicionário do Contrato
  const handleExportSchema = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fields, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Dicionario_Campos_Contrato_EMBASA_R7_${new Date().toISOString().substring(0, 10)}.json`);
    dlAnchor.click();
    showToast('Dicionário de campos exportado em JSON.');
  };

  // Filtragem
  const filteredFields = fields.filter((f) => {
    const q = searchTerm.toLowerCase();
    const matchQuery =
      !q ||
      f.key.toLowerCase().includes(q) ||
      f.label.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q));

    const matchSection = selectedSection === 'ALL' || f.section === selectedSection;

    const matchStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && f.enabled) ||
      (selectedStatus === 'EXCLUDED' && !f.enabled);

    return matchQuery && matchSection && matchStatus;
  });

  const totalFields = fields.length;
  const activeFieldsCount = fields.filter((f) => f.enabled).length;
  const excludedFieldsCount = totalFields - activeFieldsCount;
  const customFieldsCount = fields.filter((f) => !f.isCoreContract).length;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md border ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : toast.type === 'warn'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Banner Principal de Configuração Contratual */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                <SlidersHorizontal className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Gestão de Campos Contratuais do Censo
                </h2>
                <p className="text-xs text-slate-500">
                  Personalização dinâmica de campos de coleta conforme contrato estipulado no AquaSane Pro.
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-slate-700 font-medium">
                Contrato: <strong className="text-slate-900">EMBASA nº 460024679 (R7)</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 px-2.5 py-1 font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {activeFieldsCount} Campos Ativos no Censo
              </span>
              {excludedFieldsCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 px-2.5 py-1 font-semibold border border-amber-200">
                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                  {excludedFieldsCount} Excluídos / Ocultos
                </span>
              )}
              {customFieldsCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 text-purple-800 px-2.5 py-1 font-semibold border border-purple-200">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  +{customFieldsCount} Personalizados
                </span>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Novo Campo</span>
            </button>

            <button
              onClick={handleResetDefaults}
              title="Restaurar os 38 campos originais da EMBASA"
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-semibold transition cursor-pointer border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurar Padrão (38 Campos)</span>
            </button>

            <button
              onClick={handleExportSchema}
              title="Exportar especificação em JSON"
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-semibold transition cursor-pointer border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Dicionário</span>
            </button>
          </div>
        </div>

        {/* Barra de Presets Rápidos */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Modelos Pré-definidos:</span>
          <button
            onClick={() => handleApplyPreset('ALL')}
            className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 font-medium border border-sky-200 transition cursor-pointer"
          >
            Padrão Integral (38 campos)
          </button>
          <button
            onClick={() => handleApplyPreset('HIDROMETRIA')}
            className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium border border-slate-200 transition cursor-pointer"
          >
            Foco Hidrometria & Medidores (18 campos)
          </button>
          <button
            onClick={() => handleApplyPreset('SEM_HISTORICO')}
            className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium border border-slate-200 transition cursor-pointer"
          >
            Censo Direto (Sem histórico 6 meses)
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código (ex: MATRICULA, VAZAO, COD_ANL1) ou nome do campo..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-none w-full sm:w-auto"
          >
            <option value="ALL">Todas as Seções ({totalFields})</option>
            {Object.entries(SECTION_NAMES).map(([secKey, secLabel]) => (
              <option key={secKey} value={secKey}>
                {secLabel}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-none w-full sm:w-auto"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Somente Ativos ({activeFieldsCount})</option>
            <option value="EXCLUDED">Somente Excluídos ({excludedFieldsCount})</option>
          </select>
        </div>
      </div>

      {/* Lista de Campos */}
      <div className="rounded-2xl bg-white shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Campos Encontrados: {filteredFields.length}</span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Clique no interruptor para incluir ou excluir o campo da coleta em campo
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
          {filteredFields.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhum campo encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredFields.map((field) => (
              <div
                key={field.id}
                className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  !field.enabled ? 'bg-slate-50/70 opacity-60' : 'hover:bg-sky-50/30'
                }`}
              >
                {/* Lado Esquerdo: Código, Nome, Seção, Tipo */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-800 text-sky-300 px-2 py-0.5 rounded tracking-wide">
                      {field.key}
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {field.label}
                    </span>
                    {field.required && (
                      <span className="rounded bg-rose-100 text-rose-800 px-1.5 py-0.2 text-[10px] font-bold">
                        Obrigatório
                      </span>
                    )}
                    {field.isCoreContract ? (
                      <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[10px]">
                        Contrato Oficial
                      </span>
                    ) : (
                      <span className="rounded bg-purple-100 text-purple-800 px-1.5 py-0.2 text-[10px] font-semibold">
                        Personalizado
                      </span>
                    )}
                  </div>

                  {field.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{field.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>
                      Seção: <strong className="text-slate-600">{SECTION_NAMES[field.section] || field.section}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Tipo:{' '}
                      <strong className="text-slate-600 uppercase font-mono">{field.type}</strong>
                    </span>
                    {field.options && field.options.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-slate-500">
                          {field.options.length} opções disponíveis
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Chave Ativar/Desativar + Editar + Excluir */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center">
                  {/* Status Indicator / Switch */}
                  <button
                    onClick={() => handleToggleEnabled(field)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      field.enabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                    }`}
                    title={field.enabled ? 'Clique para excluir do censo' : 'Clique para incluir no censo'}
                  >
                    {field.enabled ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ativo</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5 text-slate-400" />
                        <span>Excluído</span>
                      </>
                    )}
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => handleOpenEditModal(field)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition cursor-pointer"
                    title="Editar propriedades do campo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={() => handleDeleteField(field)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                    title={field.isCoreContract ? 'Desativar campo do contrato' : 'Excluir campo personalizado'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Inserir / Editar Campo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingField ? `Editar Campo ${editingField.key}` : 'Inserir Novo Campo no Contrato'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveField} className="space-y-3 text-xs">
              {/* Código Contratual (Key) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Código da Coluna / Chave Contratual *
                </label>
                <input
                  type="text"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value.toUpperCase())}
                  disabled={!!editingField}
                  placeholder="Ex: COD_ROTEIRO, NUM_LACRE_NOVO, OBS_CADASTRO"
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono uppercase bg-slate-50 focus:bg-white"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Utilize letras maiúsculas, números e sublinhados (ex: MATRICULA, ZONA_FATU).
                </p>
              </div>

              {/* Rótulo Amigável */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome / Rótulo do Campo *
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Ex: Código do Roteiro de Leitura"
                  className="w-full rounded-lg border border-slate-300 p-2 focus:bg-white"
                  required
                />
              </div>

              {/* Seção e Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seção / Categoria *</label>
                  <select
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value as ContractFieldSection)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    {Object.entries(SECTION_NAMES).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Dado *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ContractFieldType)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    <option value="text">Texto / Alfanumérico</option>
                    <option value="number">Número Inteiro / Decimal</option>
                    <option value="date">Data (DD/MM/AAAA)</option>
                    <option value="select">Seleção (Múltiplas opções)</option>
                    <option value="boolean">Sim / Não (Booleano)</option>
                  </select>
                </div>
              </div>

              {/* Opções de Seleção se for tipo select */}
              {formType === 'select' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Opções de Seleção (uma por linha) *
                  </label>
                  <textarea
                    rows={4}
                    value={formOptionsInput}
                    onChange={(e) => setFormOptionsInput(e.target.value)}
                    placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Digite cada alternativa em uma linha separada.
                  </p>
                </div>
              )}

              {/* Placeholder & Descrição */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Texto de Dica (Placeholder)</label>
                  <input
                    type="text"
                    value={formPlaceholder}
                    onChange={(e) => setFormPlaceholder(e.target.value)}
                    placeholder="Ex: Digite o número..."
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Padrão</label>
                  <input
                    type="text"
                    value={formDefaultValue}
                    onChange={(e) => setFormDefaultValue(e.target.value)}
                    placeholder="Ex: 0 ou Não Informado"
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instruções para o Cadastrista de Campo
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Orientações de coleta conforme especificação do caderno técnico..."
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              {/* Obrigatório */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="chk-form-req"
                  checked={formRequired}
                  onChange={(e) => setFormRequired(e.target.checked)}
                  className="rounded text-sky-600 h-4 w-4"
                />
                <label htmlFor="chk-form-req" className="font-semibold text-slate-800 cursor-pointer">
                  Campo de Preenchimento Obrigatório no Censo
                </label>
              </div>

              {/* Botões do Modal */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-700 text-white font-bold hover:bg-sky-800 shadow-xs"
                >
                  {editingField ? 'Salvar Alterações' : 'Inserir Campo no Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
