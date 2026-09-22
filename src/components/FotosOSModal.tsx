import React, { useState } from 'react';
import {
  Camera,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  Clock,
  MapPin,
  FileImage,
  UploadCloud,
  Maximize2
} from 'lucide-react';
import { OrdemServicoSCIWeb, FotoRegistroOS, TipoFotoOS } from '../types/os';
import { osService } from '../services/osService';

interface FotosOSModalProps {
  os: OrdemServicoSCIWeb;
  onClose: () => void;
  onSalvar?: (fotos: FotoRegistroOS[]) => void;
}

const CATEGORIAS_FOTOS_SUGERIDAS: { tipo: TipoFotoOS; titulo: string; obrigatoria?: boolean }[] = [
  { tipo: 'FACHADA', titulo: '1. Fachada do Imóvel', obrigatoria: true },
  { tipo: 'HIDROMETRO', titulo: '2. Hidrômetro (Visor de Leitura)', obrigatoria: true },
  { tipo: 'CAVALETE', titulo: '3. Cavalete & Conexão de Entrada' },
  { tipo: 'LACRE', titulo: '4. Lacre de Segurança' },
  { tipo: 'ABRIGO', titulo: '5. Tipo de Abrigo / Mureta' },
  { tipo: 'RAMAL_LIGACAO', titulo: '6. Ramal Predial & Calçada' },
  { tipo: 'IRREGULARIDADE', titulo: '7. Irregularidade / Vazamento' },
  { tipo: 'LOTE_GERAL', titulo: '8. Visão Geral do Lote' },
  { tipo: 'DOCUMENTO', titulo: '9. Comprovante / Documento' },
  { tipo: 'OUTRA', titulo: '10. Foto Livre / Complementar' },
];

export const FotosOSModal: React.FC<FotosOSModalProps> = ({ os, onClose, onSalvar }) => {
  const [fotos, setFotos] = useState<FotoRegistroOS[]>(os.fotos || []);
  const [fotoSelecionadaPreview, setFotoSelecionadaPreview] = useState<FotoRegistroOS | null>(null);
  const [tipoNovo, setTipoNovo] = useState<TipoFotoOS>('FACHADA');
  const [rotuloCustomizado, setRotuloCustomizado] = useState('');
  const [isProcessandoFoto, setIsProcessandoFoto] = useState(false);
  const [notificacao, setNotificacao] = useState<string | null>(null);

  const LIMITE_MAXIMO_FOTOS = 10;
  const totalFotos = fotos.length;
  const atingiuLimite = totalFotos >= LIMITE_MAXIMO_FOTOS;

  // Compactador de imagem via Canvas HTML5 para não estourar memória do aparelho
  const compactarImagem = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensiona proporcionalmente para largura máx de 1024px
          const MAX_WIDTH = 1024;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Desenha carimbo d'água probatório com matrícula e timestamp
          const agora = new Date();
          const textoCarimbo = `AQUASANE PRO • MAT: ${os.matriculaEmbasa} • ${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')} • GPS: ${os.coordenadas.latitude.toFixed(5)}, ${os.coordenadas.longitude.toFixed(5)}`;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, height - 28, width, 28);
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px monospace';
          ctx.fillText(textoCarimbo, 10, height - 9);

          // Converte para JPEG com compressão de 75%
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCapturaFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (atingiuLimite) {
      setNotificacao('Limite máximo de 10 fotos atingido para esta O.S.');
      setTimeout(() => setNotificacao(null), 3000);
      return;
    }

    setIsProcessandoFoto(true);
    try {
      const file = files[0];
      const dataUrl = await compactarImagem(file);

      const categoriaDefinida = CATEGORIAS_FOTOS_SUGERIDAS.find((c) => c.tipo === tipoNovo);
      const rotuloFinal = rotuloCustomizado.trim() || categoriaDefinida?.titulo || `Foto ${totalFotos + 1}`;

      const novaFoto: FotoRegistroOS = {
        id: `foto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tipo: tipoNovo,
        rotulo: rotuloFinal,
        dataUrl,
        timestamp: Date.now(),
        dataHoraFormatada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        coordenadas: {
          latitude: os.coordenadas.latitude,
          longitude: os.coordenadas.longitude,
        },
      };

      const novaLista = [...fotos, novaFoto].slice(0, LIMITE_MAXIMO_FOTOS);
      setFotos(novaLista);

      // Avança a sugestão do próximo tipo de foto automaticamente
      const proximaSugestao = CATEGORIAS_FOTOS_SUGERIDAS[novaLista.length % CATEGORIAS_FOTOS_SUGERIDAS.length];
      if (proximaSugestao) {
        setTipoNovo(proximaSugestao.tipo);
        setRotuloCustomizado('');
      }

      setNotificacao(`Foto "${rotuloFinal}" adicionada com sucesso! (${novaLista.length}/10)`);
      setTimeout(() => setNotificacao(null), 3000);
    } catch (err) {
      console.error(err);
      setNotificacao('Erro ao processar imagem da câmera.');
      setTimeout(() => setNotificacao(null), 3000);
    } finally {
      setIsProcessandoFoto(false);
      e.target.value = '';
    }
  };

  // Gerador de foto simulada rápida para teste em campo/desenvolvimento
  const handleAdicionarFotoSimulada = () => {
    if (atingiuLimite) return;

    const categoria = CATEGORIAS_FOTOS_SUGERIDAS[fotos.length % CATEGORIAS_FOTOS_SUGERIDAS.length];
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo realista
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 480);

    // Gradiente e texto
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#0369a1');
    grad.addColorStop(1, '#065f46');
    ctx.fillStyle = grad;
    ctx.fillRect(20, 20, 600, 440);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`FOTO: ${categoria.titulo}`, 320, 210);

    ctx.font = '16px monospace';
    ctx.fillText(`Matrícula da Ligação: ${os.matriculaEmbasa}`, 320, 250);
    ctx.fillText(`Endereço: ${os.logradouro}, ${os.numeroPorta} - ${os.bairro}`, 320, 280);
    ctx.fillText(`Quadra ${os.quadra} • Lote ${os.lote}`, 320, 310);

    const agora = new Date();
    ctx.font = '13px monospace';
    ctx.fillText(`${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')} • GPS: ${os.coordenadas.latitude.toFixed(5)}, ${os.coordenadas.longitude.toFixed(5)}`, 320, 360);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    const novaFoto: FotoRegistroOS = {
      id: `foto_sim_${Date.now()}_${fotos.length}`,
      tipo: categoria.tipo,
      rotulo: categoria.titulo,
      dataUrl,
      timestamp: Date.now(),
      dataHoraFormatada: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      coordenadas: {
        latitude: os.coordenadas.latitude,
        longitude: os.coordenadas.longitude,
      },
    };

    const novaLista = [...fotos, novaFoto].slice(0, LIMITE_MAXIMO_FOTOS);
    setFotos(novaLista);

    const proximaSugestao = CATEGORIAS_FOTOS_SUGERIDAS[novaLista.length % CATEGORIAS_FOTOS_SUGERIDAS.length];
    if (proximaSugestao) {
      setTipoNovo(proximaSugestao.tipo);
    }
  };

  const handleRemoverFoto = (id: string) => {
    const novaLista = fotos.filter((f) => f.id !== id);
    setFotos(novaLista);
    if (fotoSelecionadaPreview?.id === id) {
      setFotoSelecionadaPreview(null);
    }
  };

  const handleSalvarEFechar = () => {
    osService.salvarFotosOS(os.id, fotos);
    if (onSalvar) onSalvar(fotos);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-sans">
        {/* Header do Modal */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between border-b border-sky-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/30 border border-sky-400/30 flex items-center justify-center">
              <Camera className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Registro Fotográfico de Campo</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                  atingiuLimite ? 'bg-amber-500 text-slate-950' : 'bg-sky-500/30 text-sky-200 border border-sky-400/40'
                }`}>
                  {totalFotos} / {LIMITE_MAXIMO_FOTOS} FOTOS
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

        {/* Notificação Temporária */}
        {notificacao && (
          <div className="p-2.5 bg-sky-50 border-b border-sky-200 text-sky-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{notificacao}</span>
          </div>
        )}

        {/* Corpo com Rolagem */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Painel de Captura de Nova Foto */}
          {!atingiuLimite ? (
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Categoria da Foto ({totalFotos + 1}ª de 10):</span>
                </label>

                <select
                  value={tipoNovo}
                  onChange={(e) => {
                    const t = e.target.value as TipoFotoOS;
                    setTipoNovo(t);
                    const cat = CATEGORIAS_FOTOS_SUGERIDAS.find((c) => c.tipo === t);
                    if (cat) setRotuloCustomizado(cat.titulo);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  {CATEGORIAS_FOTOS_SUGERIDAS.map((c) => (
                    <option key={c.tipo} value={c.tipo}>
                      {c.titulo} {c.obrigatoria ? '(*)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botões de Ação da Câmera / Upload */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Botão Principal: Câmera do Smartphone */}
                <label className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer text-center">
                  <Camera className="w-4 h-4" />
                  <span>{isProcessandoFoto ? 'Processando...' : 'Abrir Câmera'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={isProcessandoFoto}
                    onChange={handleCapturaFoto}
                    className="hidden"
                  />
                </label>

                {/* Botão Secundário: Galeria / Arquivos */}
                <label className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 active:scale-98 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer text-center">
                  <UploadCloud className="w-4 h-4 text-slate-600" />
                  <span>Da Galeria</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isProcessandoFoto}
                    onChange={handleCapturaFoto}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Botão auxiliar para testes rápidos em ambiente de desenvolvimento */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>GPS vinculado: {os.coordenadas.latitude.toFixed(4)}, {os.coordenadas.longitude.toFixed(4)}</span>
                <button
                  type="button"
                  onClick={handleAdicionarFotoSimulada}
                  className="text-sky-700 hover:underline font-semibold cursor-pointer"
                >
                  + Simular Foto de Teste
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Limite de 10 fotos preenchido!</strong> Para adicionar outra imagem, exclua uma das fotos anexadas abaixo.
              </span>
            </div>
          )}

          {/* Grade com as Fotos Anexadas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Fotos Salvas na O.S. ({fotos.length}/10)
              </span>
              <span className="text-[11px] text-slate-500">
                {10 - fotos.length} vagas restantes
              </span>
            </div>

            {fotos.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-slate-400 space-y-2">
                <Camera className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">Nenhuma foto anexada nesta O.S. ainda.</p>
                <p className="text-[11px] text-slate-400">
                  Tire fotos da fachada, hidrômetro, cavalete e lacre. Permite até 10 fotos com carimbo probatório.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {fotos.map((foto, index) => (
                  <div
                    key={foto.id}
                    className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex flex-col"
                  >
                    <div className="aspect-4/3 w-full relative overflow-hidden bg-slate-950">
                      <img
                        src={foto.dataUrl}
                        alt={foto.rotulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200 cursor-pointer"
                        onClick={() => setFotoSelecionadaPreview(foto)}
                      />

                      {/* Tag do Número da Foto */}
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white font-extrabold text-[10px] backdrop-blur-xs">
                        #{index + 1}
                      </span>

                      {/* Botões de Ação sobre a Foto */}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFotoSelecionadaPreview(foto)}
                          className="p-1 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition cursor-pointer"
                          title="Ampliar foto"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoverFoto(foto.id)}
                          className="p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
                          title="Excluir foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Rodapé da Foto com Rótulo e Data */}
                    <div className="p-2 bg-white flex-1 flex flex-col justify-between">
                      <p className="text-[11px] font-bold text-slate-900 truncate" title={foto.rotulo}>
                        {foto.rotulo}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                        <span>{foto.dataHoraFormatada}</span>
                        <span className="text-emerald-700 font-bold">GPS ✓</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Zoom / Preview em Tela Cheia */}
        {fotoSelecionadaPreview && (
          <div className="fixed inset-0 z-60 bg-black/95 flex flex-col p-4 animate-in fade-in">
            <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-sm">{fotoSelecionadaPreview.rotulo}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Matrícula {os.matriculaEmbasa} • Registrado às {fotoSelecionadaPreview.dataHoraFormatada}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFotoSelecionadaPreview(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
              <img
                src={fotoSelecionadaPreview.dataUrl}
                alt={fotoSelecionadaPreview.rotulo}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* Footer com Botões de Confirmação */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <strong>{fotos.length}</strong> de <strong>{LIMITE_MAXIMO_FOTOS}</strong> fotos anexadas
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSalvarEFechar}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Fotos na O.S.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
