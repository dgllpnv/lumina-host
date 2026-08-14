import api from './api';

export interface Reservation {
  id: string;
  organizationId: string;
  roomId: string | null;
  roomNumber: string;
  roomType: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  guestDocument: string | null;
  checkinDate: string;
  checkoutDate: string;
  actualCheckin: string | null;
  actualCheckout: string | null;
  status: 'reservado' | 'checkin' | 'checkout' | 'cancelado';
  dailyRate: number;
  totalStay: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  room?: {
    id: string;
    nome: string;
    tipo: string;
  } | null;
  transactions?: any[];
}

export interface CreateReservationData {
  roomId?: string;
  roomNumber?: string;
  roomType?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestDocument?: string;
  checkinDate: string;
  checkoutDate: string;
  dailyRate: number;
  notes?: string;
}

export interface UpdateReservationData {
  roomId?: string;
  roomNumber?: string;
  roomType?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestDocument?: string;
  checkinDate?: string;
  checkoutDate?: string;
  dailyRate?: number;
  totalStay?: number;
  notes?: string;
  status?: 'reservado' | 'checkin' | 'checkout' | 'cancelado';
  actualCheckin?: string;
  actualCheckout?: string;
}

export interface ReservationFilters {
  status?: string;
  roomId?: string;
  startDate?: string;
  endDate?: string;
  guestName?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export const reservationsService = {
  async list(filters?: ReservationFilters): Promise<PaginatedResponse<Reservation>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<PaginatedResponse<Reservation>>(`/reservations?${params}`);
    return response.data;
  },

  async get(id: string): Promise<Reservation> {
    const response = await api.get<Reservation>(`/reservations/${id}`);
    return response.data;
  },

  async create(data: CreateReservationData): Promise<Reservation> {
    const response = await api.post<Reservation>('/reservations', data);
    return response.data;
  },

  async update(id: string, data: UpdateReservationData): Promise<Reservation> {
    const response = await api.put<Reservation>(`/reservations/${id}`, data);
    return response.data;
  },

  async checkIn(id: string): Promise<Reservation> {
    const response = await api.post<Reservation>(`/reservations/${id}/check-in`);
    return response.data;
  },

  async checkOut(id: string, createTransaction: boolean = true): Promise<Reservation> {
    const response = await api.post<Reservation>(`/reservations/${id}/check-out`, { createTransaction });
    return response.data;
  },

  async cancel(id: string): Promise<Reservation> {
    const response = await api.post<Reservation>(`/reservations/${id}/cancel`);
    return response.data;
  },
};

export default reservationsService;
