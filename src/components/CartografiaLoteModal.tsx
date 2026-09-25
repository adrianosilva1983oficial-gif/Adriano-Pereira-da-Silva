import React from 'react';
import { OrdemServicoSCIWeb, LoteCartografia } from '../types/os';
import { MapaCartografiaAbertaModal } from './MapaCartografiaAbertaModal';

interface CartografiaLoteModalProps {
  os: OrdemServicoSCIWeb;
  onClose: () => void;
  onSave?: (cartografia: LoteCartografia) => void;
}

/**
 * CartografiaLoteModal conectado ao motor de Cartografia Aberta Georreferenciada de Alta Precisão
 * com Satélite HD, geocodificação direta no endereço real e ferramentas de desenho fluido do lote.
 */
export const CartografiaLoteModal: React.FC<CartografiaLoteModalProps> = (props) => {
  return <MapaCartografiaAbertaModal {...props} />;
};
