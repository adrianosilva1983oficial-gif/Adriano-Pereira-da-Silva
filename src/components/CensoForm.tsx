import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Home,
  Gauge,
  Calendar,
  SlidersHorizontal,
  FileSpreadsheet,
  Layers,
  Upload,
  Trash2,
  Info,
  Sparkles,
  RotateCcw,
  Navigation
} from 'lucide-react';
import {
  BairroR7,
  CensoRecord,
  CondicaoOcupacao,
  EscolaridadeChefe,
  EstadoHidrometro,
  EstadoLacre,
  FaixaRenda,
  SituacaoLigacao,
  StatusVisita,
  TentativaVisita,
  TipoAbrigo,
  TipoImovel,
  TipoVazamento,
  ZonaAbastecimento,
} from '../types/censo';
import { BAIRROS_DATA, LISTA_BAIRROS, ZONAS_ABASTECIMENTO } from '../data/bairrosData';
import { clearDraftCenso, getDraftCenso, saveCensoRecord, saveDraftCenso } from '../services/db';
import { syncManager } from '../services/syncManager';
import {
  contractSchemaService,
  populateContractValuesFromRecord,
  DEFAULT_CONTRACT_FIELDS,
  SECTION_NAMES,
} from '../services/contractSchemaService';
import { ContractFieldDefinition, ContractFieldSection } from '../types/contractFields';
import { osService } from '../services/osService';
import { GPSNavigatorModal } from './GPSNavigatorModal';
import { CartografiaLoteModal } from './CartografiaLoteModal';
import { OrdemServicoSCIWeb } from '../types/os';

interface CensoFormProps {
  onCensoCreated: (record: CensoRecord) => void;
  onCancel?: () => void;
  prefillData?: Partial<CensoRecord>;
  prefillOS?: OrdemServicoSCIWeb;
  onNavigateToConfig?: () => void;
}

export const CensoForm: React.FC<CensoFormProps> = ({
  onCensoCreated,
  onCancel,
  prefillData,
  prefillOS,
  onNavigateToConfig,
}) => {
  // Estado principal do formulário
  const [matriculaEmbasa, setMatriculaEmbasa] = useState(prefillData?.matriculaEmbasa || prefillOS?.matriculaEmbasa || '');
  const [numeroOS, setNumeroOS] = useState(prefillData?.numeroOS || prefillOS?.numeroOSSCIWeb || `OS-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [bairro, setBairro] = useState<BairroR7>(prefillData?.bairro || (prefillOS?.bairro as BairroR7) || 'Cabula');
  const [zonaAbastecimento, setZonaAbastecimento] = useState<ZonaAbastecimento>('ZA 25');
  const [logradouro, setLogradouro] = useState(prefillData?.logradouro || prefillOS?.logradouro || '');
  const [numeroPorta, setNumeroPorta] = useState(prefillData?.numeroPorta || prefillOS?.numeroPorta || '');
  const [quadra, setQuadra] = useState(prefillData?.quadra || prefillOS?.quadra || 'QD-');
  const [lote, setLote] = useState(prefillData?.lote || prefillOS?.lote || 'LT-');
  const [complemento, setComplemento] = useState(prefillData?.complemento || '');

  // Modais de Apoio em Campo
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [showCartografiaModal, setShowCartografiaModal] = useState(false);

  // GPS
  const [latitude, setLatitude] = useState<number>(prefillData?.coordenadas?.latitude || prefillOS?.coordenadas.latitude || -12.9567);
  const [longitude, setLongitude] = useState<number>(prefillData?.coordenadas?.longitude || prefillOS?.coordenadas.longitude || -38.4691);
  const [precisaoGps, setPrecisaoGps] = useState<number | undefined>(prefillData?.coordenadas?.precisaoMetros || 4.5);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Dados do Cliente
  const [nomeCliente, setNomeCliente] = useState(prefillData?.nomeCliente || '');
  const [cpfCnpj, setCpfCnpj] = useState(prefillData?.cpfCnpj || '');
  const [telefoneContato, setTelefoneContato] = useState(prefillData?.telefoneContato || '');
  const [sexoResponsavel, setSexoResponsavel] = useState<'FEMININO' | 'MASCULINO' | 'OUTRO'>(prefillData?.sexoResponsavel || 'FEMININO');
  const [faixaEtariaResponsavel, setFaixaEtariaResponsavel] = useState(prefillData?.faixaEtariaResponsavel || '25 a 49 anos');
  const [escolaridade, setEscolaridade] = useState<EscolaridadeChefe>(prefillData?.escolaridade || '4_A_7_ANOS');
  const [faixaRenda, setFaixaRenda] = useState<FaixaRenda>(prefillData?.faixaRenda || '0_A_1_SM');
  const [numeroMoradores, setNumeroMoradores] = useState<number>(prefillData?.numeroMoradores || 3);
  const [possuiCadUnicoBolsaFamilia, setPossuiCadUnicoBolsaFamilia] = useState<boolean>(prefillData?.possuiCadUnicoBolsaFamilia ?? true);
  const [interesseTarifaSocial, setInteresseTarifaSocial] = useState<boolean>(prefillData?.interesseTarifaSocial ?? true);

  // Características do Imóvel
  const [tipoImovel, setTipoImovel] = useState<TipoImovel>(prefillData?.tipoImovel || 'CASA');
  const [numeroPavimentos, setNumeroPavimentos] = useState<number>(prefillData?.numeroPavimentos || 1);
  const [condicaoOcupacao, setCondicaoOcupacao] = useState<CondicaoOcupacao>(prefillData?.condicaoOcupacao || 'PROPRIO');
  const [tipoEsgotamento, setTipoEsgotamento] = useState<'REDE_PUBLICA' | 'FOSSA' | 'VALA_CEU_ABERTO' | 'DIRETO_RIO'>(prefillData?.tipoEsgotamento || 'REDE_PUBLICA');

  // Hidrometria & Situação Comercial
  const [situacaoLigacao, setSituacaoLigacao] = useState<SituacaoLigacao>(prefillData?.situacaoLigacao || 'ATIVA');
  const [numeroHidrometro, setNumeroHidrometro] = useState(prefillData?.numeroHidrometro || 'A24N' + Math.floor(100000 + Math.random() * 900000));
  const [leituraAtualM3, setLeituraAtualM3] = useState<number>(prefillData?.leituraAtualM3 || 120);
  const [estadoHidrometro, setEstadoHidrometro] = useState<EstadoHidrometro>(prefillData?.estadoHidrometro || 'NORMAL');
  const [estadoLacre, setEstadoLacre] = useState<EstadoLacre>(prefillData?.estadoLacre || 'INTACTO');
  const [tipoAbrigo, setTipoAbrigo] = useState<TipoAbrigo>(prefillData?.tipoAbrigo || 'PADRAO_EMBASA_MURO');
  const [tipoVazamento, setTipoVazamento] = useState<TipoVazamento>(prefillData?.tipoVazamento || 'NENHUM');
  const [prioridadeEmergencia, setPrioridadeEmergencia] = useState<boolean>(
    Boolean(prefillData?.isEmergency) ||
      prefillData?.tipoVazamento === 'CAVALETE' ||
      prefillData?.tipoVazamento === 'REDE_EXTERNA'
  );
  const [observacaoTecnica, setObservacaoTecnica] = useState(prefillData?.observacaoTecnica || '');

  // Fluxo de Visita
  const [tentativaVisita, setTentativaVisita] = useState<TentativaVisita>(prefillData?.tentativaVisita || 1);
  const [statusVisita, setStatusVisita] = useState<StatusVisita>(prefillData?.statusVisita || 'REALIZADA_COM_CLIENTE');
  const [diaAlternativoVisita, setDiaAlternativoVisita] = useState<boolean>(prefillData?.diaAlternativoVisita || false);

  // Fotos
  const [fotoFachada, setFotoFachada] = useState<string | undefined>(prefillData?.fotoFachada);
  const [fotoHidrometro, setFotoHidrometro] = useState<string | undefined>(prefillData?.fotoHidrometro);
  const [fotoIrregularidade, setFotoIrregularidade] = useState<string | undefined>(prefillData?.fotoIrregularidade);

  // Negociação & Reclamação
  const [solicitouNegociacaoDebito, setSolicitouNegociacaoDebito] = useState<boolean>(prefillData?.solicitouNegociacaoDebito || false);
  const [registrouReclamacao, setRegistrouReclamacao] = useState<boolean>(prefillData?.registrouReclamacao || false);
  const [tipoReclamacao, setTipoReclamacao] = useState(prefillData?.tipoReclamacao || '');
  const [descricaoReclamacao, setDescricaoReclamacao] = useState(prefillData?.descricaoReclamacao || '');

  // Equipe
  const [equipeCadastrista, setEquipeCadastrista] = useState('Equipe 03 - Frente Cabula');
  const [nomeCadastrista, setNomeCadastrista] = useState('Adelmo Ribeiro (Cadastrista I)');

  // Campos Contratuais Dinâmicos (EMBASA 38 Campos + Customizados)
  const [contractFields, setContractFields] = useState<ContractFieldDefinition[]>([]);
  const [contractValues, setContractValues] = useState<Record<string, any>>(prefillData?.contractValues || {});
  const [formMode, setFormMode] = useState<'PADRAO' | 'CONTRATO'>('PADRAO');

  // Carrega e sincroniza campos contratuais
  useEffect(() => {
    contractSchemaService.getContractFields().then((fields) => {
      setContractFields(fields);
    });
    const unsub = contractSchemaService.subscribe((fields) => {
      setContractFields(fields);
    });
    return () => unsub();
  }, []);

  const handleSetContractValue = (key: string, val: any) => {
    setContractValues((prev) => ({ ...prev, [key]: val }));

    if (key === 'MATRICULA') setMatriculaEmbasa(String(val));
    else if (key === 'NOME_CONS') setNomeCliente(String(val));
    else if (key === 'ENDERECO') setLogradouro(String(val));
    else if (key === 'PORTA') setNumeroPorta(String(val));
    else if (key === 'QUADRA') setQuadra(String(val));
    else if (key === 'LOTE') setLote(String(val));
    else if (key === 'COMPLEMENTO') setComplemento(String(val));
    else if (key === 'CPF_CNPJ') setCpfCnpj(String(val));
    else if (key === 'FONE') setTelefoneContato(String(val));
    else if (key === 'SEXO') setSexoResponsavel(val as any);
    else if (key === 'FAIXA_REND') setFaixaRenda(val as any);
    else if (key === 'ESCOLARID') setEscolaridade(val as any);
    else if (key === 'QTDE_MORAD') setNumeroMoradores(Number(val));
    else if (key === 'CAD_UNICO') setPossuiCadUnicoBolsaFamilia(Boolean(val));
    else if (key === 'SIT_LIGACA') setSituacaoLigacao(val as any);
    else if (key === 'NUM_HIDR') setNumeroHidrometro(String(val));
    else if (key === 'LEITURA') setLeituraAtualM3(Number(val));
    else if (key === 'EST_HIDR') setEstadoHidrometro(val as any);
    else if (key === 'EST_LACRE') setEstadoLacre(val as any);
    else if (key === 'TIPO_ABRIG') setTipoAbrigo(val as any);
    else if (key === 'TIPO_VAZAM') setTipoVazamento(val as any);
    else if (key === 'OBSERVACAO') setObservacaoTecnica(String(val));
    else if (key === 'CONDICAO_OCUPACAO') setCondicaoOcupacao(val as any);
    else if (key === 'SITIMOVEL') {
      if (String(val).toLowerCase().includes('comerc')) setTipoImovel('COMERCIAL');
      else setTipoImovel('CASA');
    }
    else if (key === 'BAIRRO') {
      if (LISTA_BAIRROS.includes(val as any)) setBairro(val as any);
    }
  };

  // Auto-Save Feedback
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastDraftTime, setLastDraftTime] = useState<string | null>(null);
  const [hasDraftToRestore, setHasDraftToRestore] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const autoSaveTimeout = useRef<any>(null);

  // Atualiza zona de abastecimento automaticamente quando o bairro muda
  useEffect(() => {
    const bairroInfo = BAIRROS_DATA[bairro];
    if (bairroInfo && bairroInfo.zonas.length > 0) {
      setZonaAbastecimento(bairroInfo.zonas[0]);
      // Se as coordenadas não foram editadas manualmente, sincroniza com o centro do bairro
      if (!prefillData?.coordenadas) {
        setLatitude(bairroInfo.coordenadasCentro.lat);
        setLongitude(bairroInfo.coordenadasCentro.lng);
      }
    }
  }, [bairro]);

  // Checa se há rascunho anterior pendente
  useEffect(() => {
    getDraftCenso().then((draft) => {
      if (draft && draft.matriculaEmbasa && draft.matriculaEmbasa !== matriculaEmbasa) {
        setHasDraftToRestore(true);
      }
    });
  }, []);

  // Mecanismo de Auto-Save para o IndexedDB (Anti-Perda de dados em campo)
  useEffect(() => {
    if (!matriculaEmbasa && !logradouro && !nomeCliente) return;

    setDraftStatus('saving');
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

    autoSaveTimeout.current = setTimeout(() => {
      saveDraftCenso({
        matriculaEmbasa,
        numeroOS,
        bairro,
        zonaAbastecimento,
        logradouro,
        numeroPorta,
        quadra,
        lote,
        complemento,
        coordenadas: { latitude, longitude, precisaoMetros: precisaoGps, timestamp: Date.now() },
        nomeCliente,
        cpfCnpj,
        telefoneContato,
        sexoResponsavel,
        faixaEtariaResponsavel,
        escolaridade,
        faixaRenda,
        numeroMoradores,
        possuiCadUnicoBolsaFamilia,
        interesseTarifaSocial,
        tipoImovel,
        numeroPavimentos,
        condicaoOcupacao,
        tipoEsgotamento,
        situacaoLigacao,
        numeroHidrometro,
        leituraAtualM3,
        estadoHidrometro,
        estadoLacre,
        tipoAbrigo,
        tipoVazamento,
        observacaoTecnica,
        tentativaVisita,
        statusVisita,
        diaAlternativoVisita,
        fotoFachada,
        fotoHidrometro,
        fotoIrregularidade,
        solicitouNegociacaoDebito,
        registrouReclamacao,
        tipoReclamacao,
        descricaoReclamacao,
      }).then(() => {
        setDraftStatus('saved');
        const now = new Date();
        setLastDraftTime(now.toLocaleTimeString('pt-BR'));
      });
    }, 800);

    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  }, [
    matriculaEmbasa,
    numeroOS,
    bairro,
    logradouro,
    numeroPorta,
    nomeCliente,
    telefoneContato,
    situacaoLigacao,
    numeroHidrometro,
    leituraAtualM3,
    estadoHidrometro,
    estadoLacre,
    fotoFachada,
    fotoHidrometro,
  ]);

  const handleRestoreDraft = async () => {
    const draft = await getDraftCenso();
    if (!draft) return;

    if (draft.matriculaEmbasa) setMatriculaEmbasa(draft.matriculaEmbasa);
    if (draft.numeroOS) setNumeroOS(draft.numeroOS);
    if (draft.bairro) setBairro(draft.bairro);
    if (draft.zonaAbastecimento) setZonaAbastecimento(draft.zonaAbastecimento);
    if (draft.logradouro) setLogradouro(draft.logradouro);
    if (draft.numeroPorta) setNumeroPorta(draft.numeroPorta);
    if (draft.quadra) setQuadra(draft.quadra);
    if (draft.lote) setLote(draft.lote);
    if (draft.nomeCliente) setNomeCliente(draft.nomeCliente);
    if (draft.telefoneContato) setTelefoneContato(draft.telefoneContato);
    if (draft.numeroHidrometro) setNumeroHidrometro(draft.numeroHidrometro);
    if (draft.leituraAtualM3 !== undefined) setLeituraAtualM3(draft.leituraAtualM3);
    if (draft.fotoFachada) setFotoFachada(draft.fotoFachada);
    if (draft.fotoHidrometro) setFotoHidrometro(draft.fotoHidrometro);
    if (draft.fotoIrregularidade) setFotoIrregularidade(draft.fotoIrregularidade);

    setHasDraftToRestore(false);
  };

  const handleCaptureGPS = () => {
    setIsCapturingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocalização não suportada neste aparelho. Usando centro do bairro.');
      setIsCapturingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setPrecisaoGps(Math.round(pos.coords.accuracy));
        setIsCapturingGps(false);
      },
      (err) => {
        console.warn('Erro GPS:', err);
        setGpsError('Sinal GPS fraco no momento. Utilizando estimativa por bairro.');
        const bInfo = BAIRROS_DATA[bairro];
        if (bInfo) {
          setLatitude(bInfo.coordenadasCentro.lat);
          setLongitude(bInfo.coordenadasCentro.lng);
        }
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Processador de Imagem com Redimensionamento e Compactação (para não estourar memória offline)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'fachada' | 'hidrometro' | 'irregularidade') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          // Adiciona carimbo d'água técnico de comprovação de campo
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, height - 32, width, 32);
          ctx.fillStyle = '#ffffff';
          ctx.font = '13px monospace';
          const stamp = `EMBASA R7 | ${bairro} | Matr: ${matriculaEmbasa || 'NOVA'} | ${new Date().toLocaleDateString('pt-BR')}`;
          ctx.fillText(stamp, 10, height - 12);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          if (target === 'fachada') setFotoFachada(compressedDataUrl);
          if (target === 'hidrometro') setFotoHidrometro(compressedDataUrl);
          if (target === 'irregularidade') setFotoIrregularidade(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Gerador de foto de simulação em campo para testes sem câmera física
  const handleGenerateSamplePhoto = (target: 'fachada' | 'hidrometro') => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo
    ctx.fillStyle = target === 'fachada' ? '#334155' : '#0f172a';
    ctx.fillRect(0, 0, 640, 480);

    // Gráfico estilizado de casa ou hidrômetro
    ctx.fillStyle = target === 'fachada' ? '#0284c7' : '#06b6d4';
    if (target === 'fachada') {
      ctx.beginPath();
      ctx.moveTo(320, 100);
      ctx.lineTo(520, 220);
      ctx.lineTo(120, 220);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(160, 220, 320, 200);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(280, 290, 80, 130);
    } else {
      ctx.beginPath();
      ctx.arc(320, 240, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(320, 240, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${leituraAtualM3.toString().padStart(5, '0')} m³`, 320, 250);
      ctx.font = '16px sans-serif';
      ctx.fillText(`Nº ${numeroHidrometro}`, 320, 285);
    }

    // Carimbo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 445, 640, 35);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`CONSÓRCIO CABULA EFICIENTE • R7 • ${bairro} • ${new Date().toLocaleTimeString('pt-BR')}`, 15, 467);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    if (target === 'fachada') setFotoFachada(dataUrl);
    if (target === 'hidrometro') setFotoHidrometro(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validações essenciais de campo
    if (!matriculaEmbasa.trim()) {
      setValidationError('Por favor informe a Matrícula Embasa (ou digite "NOVA" se for ligação não cadastrada).');
      return;
    }
    if (!logradouro.trim()) {
      setValidationError('O nome do logradouro (Rua, Travessa, Avenida) é obrigatório.');
      return;
    }
    if (!numeroPorta.trim()) {
      setValidationError('O número da porta é obrigatório (ou "S/N" se sem número).');
      return;
    }

    // Validação dinâmica dos campos contratuais ativos e obrigatórios
    const activeRequiredFields = contractFields.filter((f) => f.enabled && f.required);
    for (const rf of activeRequiredFields) {
      const val =
        rf.key === 'MATRICULA' ? matriculaEmbasa :
        rf.key === 'ENDERECO' ? logradouro :
        rf.key === 'PORTA' ? numeroPorta :
        rf.key === 'BAIRRO' ? bairro :
        rf.key === 'NOME_CONS' ? nomeCliente :
        contractValues[rf.key];

      if (val === undefined || val === null || String(val).trim() === '') {
        setValidationError(`O campo obrigatório "${rf.label}" (${rf.key}) deve ser preenchido antes de finalizar.`);
        return;
      }
    }

    const isOnline = syncManager.isEffectiveOnline();

    const record: CensoRecord = {
      id: `censo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      matriculaEmbasa: matriculaEmbasa.trim(),
      numeroOS: numeroOS.trim(),
      zonaAbastecimento,
      bairro,
      logradouro: logradouro.trim(),
      numeroPorta: numeroPorta.trim(),
      quadra: quadra.trim() || 'QD-01',
      lote: lote.trim() || 'LT-01',
      complemento: complemento.trim(),
      coordenadas: {
        latitude,
        longitude,
        precisaoMetros: precisaoGps,
        timestamp: Date.now(),
      },
      nomeCliente: nomeCliente.trim() || 'Cliente Não Identificado',
      cpfCnpj: cpfCnpj.trim(),
      telefoneContato: telefoneContato.trim(),
      sexoResponsavel,
      faixaEtariaResponsavel,
      escolaridade,
      faixaRenda,
      numeroMoradores: Number(numeroMoradores) || 1,
      possuiCadUnicoBolsaFamilia,
      interesseTarifaSocial,
      tipoImovel,
      numeroPavimentos: Number(numeroPavimentos) || 1,
      condicaoOcupacao,
      tipoEsgotamento,
      situacaoLigacao,
      numeroHidrometro: numeroHidrometro.trim(),
      leituraAtualM3: Number(leituraAtualM3) || 0,
      estadoHidrometro,
      estadoLacre,
      tipoAbrigo,
      tipoVazamento,
      observacaoTecnica: observacaoTecnica.trim(),
      tentativaVisita,
      statusVisita,
      diaAlternativoVisita,
      fotoFachada,
      fotoHidrometro,
      fotoIrregularidade,
      solicitouNegociacaoDebito,
      registrouReclamacao,
      tipoReclamacao: registrouReclamacao ? tipoReclamacao : undefined,
      descricaoReclamacao: registrouReclamacao ? descricaoReclamacao : undefined,
      equipeCadastrista,
      nomeCadastrista,
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
      syncStatus: isOnline ? 'pending' : 'pending', // Fica pending para acionar o SyncManager
      syncAttempts: 0,

      // Sistema de Fila Prioritária (Emergências sobem primeiro ao detectar conexão)
      priority:
        tipoVazamento === 'REDE_EXTERNA' || tipoVazamento === 'CAVALETE' || prioridadeEmergencia
          ? 'CRITICA'
          : tipoVazamento === 'INTERNO_SUSPEITO'
          ? 'ALTA'
          : 'NORMAL',
      isEmergency:
        tipoVazamento === 'REDE_EXTERNA' || tipoVazamento === 'CAVALETE' || prioridadeEmergencia,
      emergencyReason:
        tipoVazamento === 'REDE_EXTERNA'
          ? 'Emergência de Vazamento na Rede Externa (Via Pública)'
          : tipoVazamento === 'CAVALETE'
          ? 'Emergência de Vazamento no Cavalete / Hidrômetro'
          : prioridadeEmergencia
          ? 'Emergência Priorizada pelo Cadastrista de Campo'
          : undefined,
      prioritizedAt:
        tipoVazamento === 'REDE_EXTERNA' || tipoVazamento === 'CAVALETE' || prioridadeEmergencia
          ? Date.now()
          : undefined,

      contractValues: {
        ...contractValues,
        MATRICULA: matriculaEmbasa.trim(),
        NOME_CONS: nomeCliente.trim() || 'Cliente Não Identificado',
        ENDERECO: logradouro.trim(),
        PORTA: numeroPorta.trim(),
        QUADRA: quadra.trim() || 'QD-01',
        LOTE: lote.trim() || 'LT-01',
        BAIRRO: bairro,
        NUM_HIDR: numeroHidrometro.trim(),
        SIT_LIGACA: situacaoLigacao,
      },
    };

    try {
      // 1. Grava no IndexedDB local de forma transacional e atômica
      await saveCensoRecord(record);

      // 2. Limpa o rascunho de preenchimento
      await clearDraftCenso();

      // 2.5 Atualiza Ordem de Serviço espelhada do SCIWeb da EMBASA se existir
      const matchingOS = osService.getOSByMatricula(record.matriculaEmbasa);
      if (matchingOS) {
        const newStatus =
          record.statusVisita === 'REALIZADA_COM_CLIENTE'
            ? 'EXECUTADA'
            : record.statusVisita === 'MORADOR_AUSENTE'
            ? 'AUSENTE'
            : 'IMPEDIDA';

        osService.updateOSStatus(matchingOS.id, newStatus, {
          censoRecordId: record.id,
          observacaoImpedimento: record.observacaoTecnica || undefined,
        });
      }

      // 3. Notifica componente pai
      onCensoCreated(record);

      // 4. Se estiver online, aciona o dreno de sincronização imediata em segundo plano
      if (isOnline) {
        syncManager.triggerAutomaticSync('Novo censo finalizado');
      }
    } catch (err: any) {
      console.error('Erro ao gravar censo:', err);
      setValidationError(`Erro ao salvar no banco local: ${err?.message || 'Falha de armazenamento'}`);
    }
  };

  const activeContractFields = contractFields.filter((f) => f.enabled);

  const isFieldEnabled = (key: string): boolean => {
    const f = contractFields.find((item) => item.key === key.toUpperCase());
    return f ? f.enabled : true;
  };

  const getCustomFieldsForSection = (section: ContractFieldSection): ContractFieldDefinition[] => {
    return activeContractFields.filter((f) => f.section === section && !f.isCoreContract);
  };

  const renderDynamicContractField = (field: ContractFieldDefinition) => {
    const value = contractValues[field.key] ?? field.defaultValue ?? '';

    if (field.type === 'select') {
      return (
        <div key={field.id} className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              {field.label} {field.required && <span className="text-rose-500">*</span>}
            </label>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
              {field.key}
            </span>
          </div>
          <select
            value={value}
            onChange={(e) => handleSetContractValue(field.key, e.target.value)}
            required={field.required}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-sky-500"
          >
            <option value="">Selecione...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {field.description && <p className="text-[11px] text-slate-400">{field.description}</p>}
        </div>
      );
    }

    if (field.type === 'boolean') {
      return (
        <div key={field.id} className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id={`chk-${field.key}`}
            checked={Boolean(value)}
            onChange={(e) => handleSetContractValue(field.key, e.target.checked)}
            className="rounded text-sky-600 mt-0.5"
          />
          <div>
            <label htmlFor={`chk-${field.key}`} className="text-xs font-semibold text-slate-800 cursor-pointer">
              {field.label} {field.required && <span className="text-rose-500">*</span>}
            </label>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold ml-1.5">
              {field.key}
            </span>
            {field.description && <p className="text-[11px] text-slate-400">{field.description}</p>}
          </div>
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </label>
          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
            {field.key}
          </span>
        </div>
        <input
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => handleSetContractValue(field.key, e.target.value)}
          placeholder={field.placeholder || `Informe ${field.label.toLowerCase()}`}
          required={field.required}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-sky-500 font-mono"
        />
        {field.description && <p className="text-[11px] text-slate-400">{field.description}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Banner de Rascunho Recuperável */}
      {hasDraftToRestore && (
        <div className="mb-4 rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Existe um rascunho salvo anteriormente não finalizado. Deseja restaurar os dados?
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRestoreDraft}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 font-semibold transition"
            >
              Restaurar
            </button>
            <button
              onClick={() => {
                clearDraftCenso();
                setHasDraftToRestore(false);
              }}
              className="rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho do Formulário */}
      <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/80 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-sky-100 text-sky-800 px-2 py-0.5 text-xs font-bold font-mono">
                {numeroOS}
              </span>
              <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold">
                Setor R7 • Cabula
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Ficha Eletrônica de Censo & Recadastramento
            </h2>
            <p className="text-xs text-slate-500">
              Coleta tabular e gráfica em campo conforme ANEXO I (PBL Perdas R7) e Procedimentos do Contrato 460024679
            </p>
          </div>

          {/* Auto-save badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            {draftStatus === 'saving' && (
              <span className="flex items-center gap-1 text-slate-400">
                <RotateCcw className="w-3 h-3 animate-spin" /> Salvando...
              </span>
            )}
            {draftStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Salvo offline {lastDraftTime ? `às ${lastDraftTime}` : ''}</span>
              </span>
            )}
          </div>
        </div>

        {validationError && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Toggle de Modo de Preenchimento */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-slate-100 rounded-2xl">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFormMode('PADRAO')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                formMode === 'PADRAO'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Coleta de Campo Completa</span>
            </button>
            <button
              type="button"
              onClick={() => setFormMode('CONTRATO')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                formMode === 'CONTRATO'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Campos Contratuais EMBASA ({activeContractFields.length})</span>
            </button>
          </div>

          {onNavigateToConfig && (
            <button
              type="button"
              onClick={onNavigateToConfig}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-200 transition cursor-pointer self-end sm:self-auto"
              title="Inserir ou excluir campos do contrato estipulados pela empresa"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Inserir / Excluir Campos</span>
            </button>
          )}
        </div>

        {/* Barra de Apoio de Campo: Guia GPS e Cartografia */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-sky-50/70 rounded-xl border border-sky-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-950">Apoio em Campo:</span>
            <span className="text-[11px] text-slate-600 font-mono">
              Matrícula {matriculaEmbasa || 'Nova'} • Lote {lote} ({quadra})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGPSModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-sky-800 text-xs font-bold border border-sky-200 shadow-2xs transition cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span>Guia GPS até a Matrícula</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCartografiaModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-indigo-800 text-xs font-bold border border-indigo-200 shadow-2xs transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cartografia do Lote</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {formMode === 'CONTRATO' ? (
            /* Modo de Especificação Contratual EMBASA */
            <div className="space-y-6">
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-sky-700" />
                    <span>Formulário Oficial de Especificação Contratual (EMBASA)</span>
                  </h3>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Exibindo os {activeContractFields.length} campos ativos conforme estipulado no contrato. Qualquer campo excluído ou desativado não é exigido nesta coleta.
                  </p>
                </div>
                {onNavigateToConfig && (
                  <button
                    type="button"
                    onClick={onNavigateToConfig}
                    className="px-3 py-1.5 rounded-lg bg-sky-700 text-white font-bold text-xs hover:bg-sky-800 transition shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    Gerenciar Campos
                  </button>
                )}
              </div>

              {Object.entries(SECTION_NAMES).map(([secKey, secLabel]) => {
                const secFields = activeContractFields.filter((f) => f.section === secKey);
                if (secFields.length === 0) return null;

                return (
                  <div key={secKey} className="rounded-xl bg-slate-50/70 p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <span>{secLabel}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded-full">
                          {secFields.length} campos
                        </span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {secFields.map((field) => renderDynamicContractField(field))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
          {/* SEÇÃO 1: LOCALIZAÇÃO E CARTOGRAFIA */}
          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>1. Dados Cartográficos e Identificação da Ligação</span>
              </h3>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                {zonaAbastecimento}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Matrícula EMBASA *
                </label>
                <input
                  id="input-matricula"
                  type="text"
                  value={matriculaEmbasa}
                  onChange={(e) => setMatriculaEmbasa(e.target.value)}
                  placeholder="Ex: 10928471 ou 'NOVA'"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bairro do Setor R7 *
                </label>
                <select
                  id="select-bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value as BairroR7)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  {LISTA_BAIRROS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zona de Abastecimento (ZA)
                </label>
                <select
                  value={zonaAbastecimento}
                  onChange={(e) => setZonaAbastecimento(e.target.value as ZonaAbastecimento)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900"
                >
                  {ZONAS_ABASTECIMENTO.map((z) => (
                    <option key={z.zona} value={z.zona}>
                      {z.zona} — {z.bairros.join(', ').substring(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Logradouro (Rua / Av / Travessa) *
                </label>
                <input
                  id="input-logradouro"
                  type="text"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  placeholder="Ex: Rua Thomaz Gonzaga / Rua Barão de Mauá"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:col-span-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nº Porta *</label>
                  <input
                    type="text"
                    value={numeroPorta}
                    onChange={(e) => setNumeroPorta(e.target.value)}
                    placeholder="120 ou S/N"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quadra</label>
                  <input
                    type="text"
                    value={quadra}
                    onChange={(e) => setQuadra(e.target.value)}
                    placeholder="QD-04"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lote</label>
                  <input
                    type="text"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    placeholder="LT-12"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complemento / Ponto de Referência
                </label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Ex: Casa verde, próx. ao mercadinho ou final de linha"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>

              {/* Coordenadas GPS */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Georreferenciamento (GPS)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    disabled={isCapturingGps}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white px-3 py-2 text-xs font-semibold shadow-xs transition"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isCapturingGps ? 'animate-spin' : ''}`} />
                    <span>{isCapturingGps ? 'Obtendo GPS...' : 'Capturar GPS'}</span>
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-mono">{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
                  {precisaoGps && <span className="text-emerald-700 font-medium">±{precisaoGps}m</span>}
                </div>
                {gpsError && <span className="text-[10px] text-amber-700 block mt-0.5">{gpsError}</span>}
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS DO CLIENTE & PERFIL SOCIOECONÔMICO */}
          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-sky-600" />
              <span>2. Identificação do Usuário e Perfil Socioeconômico</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Cliente / Morador Entrevistado
                </label>
                <input
                  type="text"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Nome completo do responsável"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CPF ou RG (Opcional)
                </label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp para contato
                </label>
                <input
                  type="tel"
                  value={telefoneContato}
                  onChange={(e) => setTelefoneContato(e.target.value)}
                  placeholder="(71) 90000-0000"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sexo do(a) Chefe da Família
                </label>
                <select
                  value={sexoResponsavel}
                  onChange={(e) => setSexoResponsavel(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="FEMININO">Feminino (Mulher responsável)</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="OUTRO">Outro / Não declarado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faixa de Renda do Responsável
                </label>
                <select
                  value={faixaRenda}
                  onChange={(e) => setFaixaRenda(e.target.value as FaixaRenda)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="0_A_1_SM">Até 1 Salário Mínimo</option>
                  <option value="1_A_3_SM">1 a 3 Salários Mínimos</option>
                  <option value="3_A_5_SM">3 a 5 Salários Mínimos</option>
                  <option value="5_A_10_SM">5 a 10 Salários Mínimos</option>
                  <option value="SEM_RENDIMENTO">Sem rendimento formal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grau de Escolaridade
                </label>
                <select
                  value={escolaridade}
                  onChange={(e) => setEscolaridade(e.target.value as EscolaridadeChefe)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="SEM_INSTRUCAO">Sem instrução / Não alfabetizado</option>
                  <option value="1_A_3_ANOS">1 a 3 anos de estudo</option>
                  <option value="4_A_7_ANOS">4 a 7 anos de estudo</option>
                  <option value="8_A_10_ANOS">8 a 10 anos de estudo</option>
                  <option value="11_A_14_ANOS">11 a 14 anos (Ensino Médio)</option>
                  <option value="SUPERIOR">15 anos ou mais (Superior)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nº de Moradores no Domicílio
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={numeroMoradores}
                  onChange={(e) => setNumeroMoradores(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col justify-center bg-sky-50/70 p-3 rounded-lg border border-sky-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={possuiCadUnicoBolsaFamilia}
                    onChange={(e) => {
                      setPossuiCadUnicoBolsaFamilia(e.target.checked);
                      if (e.target.checked) setInteresseTarifaSocial(true);
                    }}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Inscrito no CadÚnico ou Bolsa Família (Elegível à Tarifa Social Embasa)
                  </span>
                </label>
                {possuiCadUnicoBolsaFamilia && (
                  <p className="text-[11px] text-sky-800 mt-1 pl-6">
                    Adesão recomendada: orientar cliente sobre desconto na fatura conforme Seção 10 do PGCSA.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: CARACTERÍSTICAS DO IMÓVEL */}
          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-sky-600" />
              <span>3. Características Físicas do Imóvel</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Imóvel</label>
                <select
                  value={tipoImovel}
                  onChange={(e) => setTipoImovel(e.target.value as TipoImovel)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="CASA">Casa (Unifamiliar)</option>
                  <option value="APARTAMENTO">Apartamento</option>
                  <option value="VILA_CONDOMINIO">Vila / Condomínio</option>
                  <option value="COMERCIAL">Comercial</option>
                  <option value="MISTO">Misto (Residencial + Comercial)</option>
                  <option value="PUBLICO">Prédio Público</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nº de Pavimentos</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={numeroPavimentos}
                  onChange={(e) => setNumeroPavimentos(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condição de Ocupação</label>
                <select
                  value={condicaoOcupacao}
                  onChange={(e) => setCondicaoOcupacao(e.target.value as CondicaoOcupacao)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="PROPRIO">Próprio</option>
                  <option value="ALUGADO">Alugado</option>
                  <option value="CEDIDO">Cedido</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Esgotamento Sanitário</label>
                <select
                  value={tipoEsgotamento}
                  onChange={(e) => setTipoEsgotamento(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="REDE_PUBLICA">Rede Pública da Embasa</option>
                  <option value="FOSSA">Fossa Séptica</option>
                  <option value="VALA_CEU_ABERTO">Vala a céu aberto</option>
                  <option value="DIRETO_RIO">Córrego / Rio local</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: HIDROMETRIA & SITUAÇÃO DA LIGAÇÃO (COMBATE A PERDAS) */}
          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4 text-sky-600" />
              <span>4. Situação Comercial, Hidrometria e Rastreamento de Vazamentos</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Situação Cadastral da Ligação
                </label>
                <select
                  value={situacaoLigacao}
                  onChange={(e) => setSituacaoLigacao(e.target.value as SituacaoLigacao)}
                  className={`w-full rounded-lg border px-3 py-2 text-xs font-bold ${
                    situacaoLigacao === 'CLANDESTINA_GATO'
                      ? 'bg-rose-50 border-rose-400 text-rose-800'
                      : situacaoLigacao === 'INATIVA' || situacaoLigacao === 'CORTADA'
                      ? 'bg-amber-50 border-amber-400 text-amber-800'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="ATIVA">ATIVA (Ligação Regular)</option>
                  <option value="INATIVA">INATIVA (Passível de Regularização)</option>
                  <option value="CORTADA">CORTADA</option>
                  <option value="SUPRIMIDA">SUPRIMIDA</option>
                  <option value="POTENCIAL">POTENCIAL (Rede na porta, sem ligação)</option>
                  <option value="FACTIVEL">FACTÍVEL</option>
                  <option value="CLANDESTINA_GATO">LIGAÇÃO CLANDESTINA / GATO (Irregular)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nº do Hidrômetro
                </label>
                <input
                  type="text"
                  value={numeroHidrometro}
                  onChange={(e) => setNumeroHidrometro(e.target.value)}
                  placeholder="Ex: A24N123456 ou 'SEM'"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Leitura Atual (m³)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={leituraAtualM3}
                  onChange={(e) => setLeituraAtualM3(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-sky-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado do Medidor</label>
                <select
                  value={estadoHidrometro}
                  onChange={(e) => setEstadoHidrometro(e.target.value as EstadoHidrometro)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="NORMAL">Normal em funcionamento</option>
                  <option value="PARADO">Parado / Travado</option>
                  <option value="INVERTIDO">Invertido</option>
                  <option value="ILEGIVEL">Ilegível / Visor fosco</option>
                  <option value="CUPULA_DANIFICADA">Cúpula Quebrada / Trincada</option>
                  <option value="SEM_HIDROMETRO">Sem hidrômetro instalado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Integridade do Lacre</label>
                <select
                  value={estadoLacre}
                  onChange={(e) => setEstadoLacre(e.target.value as EstadoLacre)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="INTACTO">Lacre Intacto</option>
                  <option value="VIOLADO">Lacre Violado / Rompido</option>
                  <option value="SEM_LACRE">Sem Lacre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Abrigo</label>
                <select
                  value={tipoAbrigo}
                  onChange={(e) => setTipoAbrigo(e.target.value as TipoAbrigo)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="PADRAO_EMBASA_MURO">Padrão Embasa Mureta Frontal</option>
                  <option value="INTERNO">Cavalete Interno no Imóvel</option>
                  <option value="EMBUTIDO">Embutido na Parede</option>
                  <option value="CAIXA_CHAO">Caixa no Piso / Passeio</option>
                  <option value="SEM_ABRIGO">Desprotegido / Sem abrigo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rastreamento de Vazamento
                </label>
                <select
                  value={tipoVazamento}
                  onChange={(e) => {
                    const val = e.target.value as TipoVazamento;
                    setTipoVazamento(val);
                    if (val === 'CAVALETE' || val === 'REDE_EXTERNA') {
                      setPrioridadeEmergencia(true);
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-xs font-bold ${
                    tipoVazamento !== 'NENHUM'
                      ? 'bg-amber-50 border-amber-400 text-amber-900'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="NENHUM">Nenhum vazamento detectado</option>
                  <option value="CAVALETE">Vazamento no Cavalete / Conexão</option>
                  <option value="REDE_EXTERNA">Vazamento na Rede Externa da Rua</option>
                  <option value="INTERNO_SUSPEITO">Vazamento Interno Visível / Suspeito</option>
                </select>

                {/* Destaque de Prioridade de Emergência */}
                {(tipoVazamento === 'CAVALETE' || tipoVazamento === 'REDE_EXTERNA' || prioridadeEmergencia) && (
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1 text-rose-800 text-[11px]">
                        🚨 Prioridade Crítica de Envio
                      </span>
                      <label className="flex items-center gap-1 text-[11px] font-bold cursor-pointer text-rose-700">
                        <input
                          type="checkbox"
                          checked={prioridadeEmergencia}
                          onChange={(e) => setPrioridadeEmergencia(e.target.checked)}
                          className="w-3.5 h-3.5 text-rose-600 rounded border-rose-300"
                        />
                        <span>Subir em 1º Lugar</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-rose-700 leading-tight">
                      Ordem classificada com <strong>Prioridade Máxima</strong> na fila local. Ao detectar sinal de internet, esta ocorrência subirá primeiro aos servidores centrais.
                    </p>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Técnicas do Cadastrista
                </label>
                <input
                  type="text"
                  value={observacaoTecnica}
                  onChange={(e) => setObservacaoTecnica(e.target.value)}
                  placeholder="Ex: Troca de ramal necessária, cavalete amassado, etc."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: FLUXO DE VISITAS EM CAMPO (SEÇÃO 11.2 DO PGCSA) */}
          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>5. Fluxo de Tentativas e Efetividade da Visita</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tentativa da Visita (1ª, 2ª ou 3ª)
                </label>
                <div className="flex gap-2">
                  {([1, 2, 3] as TentativaVisita[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTentativaVisita(t);
                        if (t === 3) setDiaAlternativoVisita(true);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        tentativaVisita === t
                          ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {t}ª Visita
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resultado / Status do Atendimento
                </label>
                <select
                  value={statusVisita}
                  onChange={(e) => setStatusVisita(e.target.value as StatusVisita)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="REALIZADA_COM_CLIENTE">
                    Realizada com Sucesso (Cliente presente e censo concluído)
                  </option>
                  <option value="CASA_FECHADA">
                    Casa Fechada (Morador ausente no momento)
                  </option>
                  <option value="MORADOR_IMPEDIU">
                    Morador Impediu / Recusou a entrevista
                  </option>
                  <option value="COLETA_EXTERNA_3A_VISITA">
                    Coleta Externa (3ª Visita sem contato - dados visíveis sem cliente)
                  </option>
                </select>
              </div>
            </div>

            {statusVisita === 'COLETA_EXTERNA_3A_VISITA' && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <strong>Procedimento 11.2 EMBASA:</strong> Na terceira visita sem contato em dia alternativo, foram coletadas as informações externas que independem do morador (hidrômetro, abrigo, pavimentação e fachada com fotos).
              </div>
            )}
          </div>

          {/* SEÇÃO 6: REGISTRO FOTOGRÁFICO OBRIGATÓRIO */}
          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>6. Registro Fotográfico Obrigatório em Campo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Foto 1: Fachada */}
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center">
                <div className="font-semibold text-xs text-slate-700 mb-2 flex items-center justify-center gap-1">
                  <span>Fachada do Imóvel</span>
                  <span className="text-rose-500">*</span>
                </div>

                {fotoFachada ? (
                  <div className="relative group">
                    <img
                      src={fotoFachada}
                      alt="Fachada"
                      className="w-full h-32 object-cover rounded-lg shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFotoFachada(undefined)}
                      className="absolute top-1 right-1 rounded-full bg-rose-600 text-white p-1 shadow-sm hover:bg-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                    <label className="inline-block cursor-pointer rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 border border-sky-200 hover:bg-sky-100">
                      Tirar Foto / Anexar
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'fachada')}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGenerateSamplePhoto('fachada')}
                      className="block mx-auto text-[10px] text-slate-500 hover:text-sky-600 underline"
                    >
                      Simular Foto Fachada
                    </button>
                  </div>
                )}
              </div>

              {/* Foto 2: Hidrômetro */}
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center">
                <div className="font-semibold text-xs text-slate-700 mb-2 flex items-center justify-center gap-1">
                  <span>Hidrômetro & Cavalete</span>
                  <span className="text-rose-500">*</span>
                </div>

                {fotoHidrometro ? (
                  <div className="relative group">
                    <img
                      src={fotoHidrometro}
                      alt="Hidrômetro"
                      className="w-full h-32 object-cover rounded-lg shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFotoHidrometro(undefined)}
                      className="absolute top-1 right-1 rounded-full bg-rose-600 text-white p-1 shadow-sm hover:bg-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <Gauge className="w-8 h-8 text-slate-400 mx-auto" />
                    <label className="inline-block cursor-pointer rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 border border-sky-200 hover:bg-sky-100">
                      Tirar Foto / Anexar
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'hidrometro')}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGenerateSamplePhoto('hidrometro')}
                      className="block mx-auto text-[10px] text-slate-500 hover:text-sky-600 underline"
                    >
                      Simular Foto Visor
                    </button>
                  </div>
                )}
              </div>

              {/* Foto 3: Irregularidade / Ocorrência */}
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center">
                <div className="font-semibold text-xs text-slate-700 mb-2 flex items-center justify-center gap-1">
                  <span>Irregularidade / Vazamento</span>
                  <span className="text-slate-400">(Se houver)</span>
                </div>

                {fotoIrregularidade ? (
                  <div className="relative group">
                    <img
                      src={fotoIrregularidade}
                      alt="Irregularidade"
                      className="w-full h-32 object-cover rounded-lg shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFotoIrregularidade(undefined)}
                      className="absolute top-1 right-1 rounded-full bg-rose-600 text-white p-1 shadow-sm hover:bg-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                    <label className="inline-block cursor-pointer rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100">
                      Anexar Foto
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'irregularidade')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO 9: CAMPOS PERSONALIZADOS DA EMPRESA (se houver algum ativo) */}
          {activeContractFields.filter((f) => f.section === 'PERSONALIZADOS').length > 0 && (
            <div className="rounded-xl bg-purple-50/50 p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3 border-b border-purple-200/60 pb-2">
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Campos Adicionais Inseridos no Contrato</span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-full">
                    {activeContractFields.filter((f) => f.section === 'PERSONALIZADOS').length}
                  </span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeContractFields
                  .filter((f) => f.section === 'PERSONALIZADOS')
                  .map((field) => renderDynamicContractField(field))}
              </div>
            </div>
          )}
          </>
          )}

          {/* BOTÕES DE AÇÃO */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Cadastrista: <strong>{nomeCadastrista}</strong> ({equipeCadastrista})
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 sm:flex-initial rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
              )}
              <button
                id="btn-submit-censo"
                type="submit"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white px-5 py-3 text-sm font-bold shadow-md shadow-sky-700/20 active:scale-98 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Censo Offline & Sincronizar</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal Guia GPS em Tempo Real */}
      {showGPSModal && (
        <GPSNavigatorModal
          os={
            prefillOS || {
              id: `os_temp_${matriculaEmbasa}`,
              numeroOSSCIWeb: numeroOS,
              matriculaEmbasa: matriculaEmbasa || '123456789',
              nomeConsumidorSCIWeb: nomeCliente || 'Consumidor',
              bairro: bairro,
              logradouro: logradouro || 'Rua Principal',
              numeroPorta: numeroPorta || 'S/N',
              quadra: quadra || 'QD-01',
              lote: lote || 'LT-01',
              numeroLoteNumerico: 1,
              coordenadas: { latitude, longitude, precisaoMetros: 4, timestamp: Date.now() },
              sequenciaRota: 1,
              categoriaImovel: 'RESIDENCIAL',
              zonaAbastecimento: zonaAbastecimento,
              hidrometroCadastradoSCIWeb: numeroHidrometro || 'A23N102930',
              equipeDesignada: equipeCadastrista,
              cadastristaDesignado: nomeCadastrista,
              status: 'ABERTA',
              tentativasAusente: 0,
              criadaEm: Date.now(),
              atualizadaEm: Date.now(),
            }
          }
          onClose={() => setShowGPSModal(false)}
          onIniciarCenso={() => setShowGPSModal(false)}
          onIniciarCartografia={() => {
            setShowGPSModal(false);
            setShowCartografiaModal(true);
          }}
          onRegistrarAusente={() => {
            setStatusVisita('MORADOR_AUSENTE');
            setShowGPSModal(false);
          }}
          onRegistrarImpedimento={() => {
            setStatusVisita('RECUSA_VISITA');
            setShowGPSModal(false);
          }}
        />
      )}

      {/* Modal Demarcação Cartográfica de Lote / Quadra */}
      {showCartografiaModal && (
        <CartografiaLoteModal
          os={
            prefillOS || {
              id: `os_temp_${matriculaEmbasa}`,
              numeroOS: numeroOS,
              numeroOSSCIWeb: numeroOS,
              matriculaEmbasa: matriculaEmbasa || '123456789',
              nomeConsumidorSCIWeb: nomeCliente || 'Consumidor',
              bairro: bairro,
              logradouro: logradouro || 'Rua Principal',
              numeroPorta: numeroPorta || 'S/N',
              quadra: quadra || 'QD-01',
              lote: lote || 'LT-01',
              numeroLoteNumerico: 1,
              coordenadas: { latitude, longitude, precisaoMetros: 4, timestamp: Date.now() },
              sequenciaRota: 1,
              categoriaImovel: 'RESIDENCIAL',
              zonaAbastecimento: zonaAbastecimento,
              hidrometroCadastradoSCIWeb: numeroHidrometro || 'A23N102930',
              equipeDesignada: equipeCadastrista,
              cadastristaDesignado: nomeCadastrista,
              status: 'ABERTA',
              tentativasAusente: 0,
              criadaEm: Date.now(),
              atualizadaEm: Date.now(),
            }
          }
          onClose={() => setShowCartografiaModal(false)}
        />
      )}
    </div>
  );
};
