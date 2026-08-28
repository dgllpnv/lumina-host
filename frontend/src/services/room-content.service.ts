import api from './api';

export interface RoomContent {
  id: string;
  tableRoomId: string;
  descricaoLonga: string | null;
  fotos: string[];
  tarifaBaixaTemp: number | null;
  tarifaAltaTemp: number | null;
}

export interface UpsertRoomContentData {
  descricaoLonga?: string | null;
  fotos?: string[];
  tarifaBaixaTemp?: number | null;
  tarifaAltaTemp?: number | null;
}

export const roomContentService = {
  async get(tableRoomId: string): Promise<RoomContent | null> {
    const response = await api.get<RoomContent | null>(`/room-contents/${tableRoomId}`);
    return response.data;
  },

  async upsert(tableRoomId: string, data: UpsertRoomContentData): Promise<RoomContent> {
    const response = await api.put<RoomContent>(`/room-contents/${tableRoomId}`, data);
    return response.data;
  },
};

export default roomContentService;
