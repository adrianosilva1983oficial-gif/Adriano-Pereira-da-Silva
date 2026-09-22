import React, { useEffect } from 'react';
import {
  MapPin,
  Camera,
  Navigation,
  CheckCircle2,
  X,
  Volume2,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building,
  Droplets,
  Layers
} from 'lucide-react';
import { OrdemServicoSCIWeb } from '../types/os';

interface GeofenceProximityModalProps {
  os: OrdemServicoSCIWeb;
  distanciaMetros: number;
  onIniciarCenso: (matricula: string, os: OrdemServicoSCIWeb) => void;
  onAbrirGPS: (os: OrdemServicoSCIWeb) => void;
  onDispensar: () => void;
  onSilenciarTemporario?: () => void;
}

export const GeofenceProximityModal: React.FC<GeofenceProximityModalProps> = ({
  os,
  distanciaMetros,
  onIniciarCenso,
  onAbrirGPS,
  onDispensar,
  onSilenciarTemporario,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Cabeçalho do Alerta com Radar Visual Pulsante */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-4 sm:p-5 relative overflow-hidden">
          {/* Círculos concêntricos simulando sinal de radar de geofence */}
          <div className="absolute right-4 -bottom-6 w-32 h-32 rounded-full border border-white/20 animate-ping opacity-30 pointer-events-none" />
          <div className="absolute right-8 -bottom-2 w-24 h-24 rounded-full border border-white/30 animate-pulse pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-white/20 border border-white/30 text-white backdrop-blur-xs shadow-inner">
                <Radio className="w-6 h-6 animate-pulse text-emerald-200" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                    Geofencing Ativado
                  </span>
                  <span className="text-[10px] font-bold text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    GPS de Alta Precisão
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-tight">
                  Você está no local da OS!
                </h3>
              </div>
            </div>

            <button
              onClick={onDispensar}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
              title="Dispensar alerta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badge de Distância */}
          <div className="mt-3 flex items-center gap-2 bg-emerald-950/40 rounded-xl p-2.5 border border-emerald-400/30 text-xs">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] text-emerald-200">Distância estimada do lote:</span>
              <strong className="text-sm font-black text-white bg-emerald-500/80 px-2 py-0.5 rounded-md">
                {distanciaMetros} metros
              </strong>
            </div>
            <span className="text-[10px] text-emerald-300 font-medium ml-auto">
              (Limite do Geofence: 50m)
            </span>
          </div>
        </div>

        {/* Corpo com Informações do Imóvel & Titular */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Dados Principais */}
          <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-black text-sky-900 bg-sky-100 px-2 py-0.5 rounded-md">
                  Matrícula {os.matriculaEmbasa}
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                  {os.numeroOSSCIWeb}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono font-bold text-[11px] text-slate-700">
                <span className="bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded">{os.quadra}</span>
                <span className="bg-indigo-900 text-white px-2 py-0.5 rounded">{os.lote}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Consumidor / Titular Cadastrado:
              </span>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {os.nomeConsumidorSCIWeb}
              </h4>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-start gap-1.5 text-slate-600">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">
                  {os.logradouro}, nº {os.numeroPorta}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  Bairro {os.bairro} — {os.zonaAbastecimento}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Hidrômetro SCIWeb:</span>
                <span className="font-mono font-bold text-slate-800">
                  {os.hidrometroCadastradoSCIWeb || 'SEM_HIDROMETRO'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sequência na Rota:</span>
                <span className="font-bold text-slate-800">
                  #{os.ordemProgramada || os.sequenciaRota} da frente
                </span>
              </div>
            </div>
          </div>

          {/* Dica Operacional para o Técnico */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              O sensor detectou sua chegada no perímetro. Deseja iniciar a vistoria cadastral agora?
            </span>
          </div>

          {/* Ações Rápidas */}
          <div className="space-y-2 pt-1">
            {/* Botão Primário: Iniciar Censo & Fotos */}
            <button
              type="button"
              onClick={() => onIniciarCenso(os.matriculaEmbasa, os)}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-100" />
              <span>Iniciar Censo & Fotos Deste Imóvel</span>
              <ChevronRight className="w-4 h-4 text-emerald-200" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* Botão Secundário: Abrir GPS Navigator */}
              <button
                type="button"
                onClick={() => onAbrirGPS(os)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                <span>Ver no Guia GPS</span>
              </button>

              {/* Botão de Fechar / Silenciar Temporário */}
              <button
                type="button"
                onClick={() => {
                  if (onSilenciarTemporario) onSilenciarTemporario();
                  onDispensar();
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Dispensar (Continuar Rota)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
