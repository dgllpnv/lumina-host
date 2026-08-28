import api from './api';

export interface IcalFeedConfig {
  id: string;
  tableRoomId: string;
  importUrl: string | null;
  lastSyncedAt: string | null;
  lastSyncStatus: string | null;
  tableRoom?: { id: string; nome: string; tipo: string };
}

export interface ExternalCalendarBlock {
  id: string;
  tableRoomId: string;
  source: string;
  checkin: string;
  checkout: string;
  reservationId: string | null;
  tableRoom?: { id: string; nome: string; tipo: string };
}

export const icalFeedsService = {
  async list(): Promise<IcalFeedConfig[]> {
    const response = await api.get<IcalFeedConfig[]>('/ical-feeds');
    return response.data;
  },
  async upsert(tableRoomId: string, importUrl: string | null): Promise<IcalFeedConfig> {
    const response = await api.put<IcalFeedConfig>(`/ical-feeds/${tableRoomId}`, { importUrl });
    return response.data;
  },
  async syncNow(tableRoomId: string): Promise<{ message: string; eventsProcessed: number }> {
    const response = await api.post(`/ical-feeds/${tableRoomId}/sync-now`);
    return response.data;
  },
  async listUnlinkedBlocks(): Promise<ExternalCalendarBlock[]> {
    const response = await api.get<ExternalCalendarBlock[]>('/ical-feeds/unlinked-blocks');
    return response.data;
  },
  async linkBlock(blockId: string, reservationId: string): Promise<ExternalCalendarBlock> {
    const response = await api.post<ExternalCalendarBlock>(`/ical-feeds/blocks/${blockId}/link`, { reservationId });
    return response.data;
  },
};

export default icalFeedsService;
