import api from './api';

export interface PublicRoom {
  id: string;
  nome: string;
  tipo: string;
  capacidade: number | null;
  descricao: string | null;
  precoBase: number | null;
  content: {
    descricaoLonga: string | null;
    fotos: string[];
    tarifaBaixaTemp: number | null;
    tarifaAltaTemp: number | null;
  } | null;
}

export interface PublicPackage {
  id: string;
  nome: string;
  descricao: string | null;
  precoPromocional: number | null;
}

export interface PublicTip {
  id: string;
  tipo: 'passeio' | 'transfer' | 'gastronomia';
  titulo: string;
  descricao: string | null;
  fotos: string[];
  ordem: number;
}

export interface PublicPaymentMethod {
  id: string;
  tipo: 'pix' | 'cartao' | 'dinheiro' | 'transferencia';
  instrucoes: string | null;
}

export interface PublicSiteData {
  organization: { nome: string; logoUrl: string | null };
  rooms: PublicRoom[];
  packages: PublicPackage[];
  tips: PublicTip[];
  paymentMethods: PublicPaymentMethod[];
}

export interface AvailabilityResponse {
  available: boolean;
  blockedRanges: { checkin: string; checkout: string }[];
}

export interface CreatePublicReservationData {
  roomId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkinDate: string;
  checkoutDate: string;
}

export const publicSiteService = {
  async getSite(orgSlug: string): Promise<PublicSiteData> {
    const response = await api.get<PublicSiteData>(`/public/${orgSlug}/site`);
    return response.data;
  },

  async getAvailability(orgSlug: string, roomId: string, checkin: string, checkout: string): Promise<AvailabilityResponse> {
    const response = await api.get<AvailabilityResponse>(
      `/public/${orgSlug}/rooms/${roomId}/availability`,
      { params: { checkin, checkout } }
    );
    return response.data;
  },

  async createReservation(orgSlug: string, data: CreatePublicReservationData) {
    const response = await api.post(`/public/${orgSlug}/reservations`, data);
    return response.data as { reservation: any; message: string };
  },
};

export default publicSiteService;
