// API client and utilities
export { default as api, tokenStorage, setSelectedOrganization, getSelectedOrganization } from './api';

// Services
export { authService } from './auth.service';
export type { User, LoginResponse, SystemStatus } from './auth.service';

export { organizationsService } from './organizations.service';
export type { Organization, CreateOrganizationData, UpdateOrganizationData } from './organizations.service';

export { teamService } from './team.service';
export type { TeamMember, UpdateTeamMemberData } from './team.service';

export { transactionsService } from './transactions.service';
export type { Transaction, CreateTransactionData, UpdateTransactionData, TransactionFilters } from './transactions.service';

export { inventoryService } from './inventory.service';
export type { InventoryItem, CreateInventoryItemData, UpdateInventoryItemData, InventoryFilters } from './inventory.service';

export { tablesRoomsService } from './tables-rooms.service';
export type { TableRoom, CreateTableRoomData, UpdateTableRoomData, TableRoomFilters } from './tables-rooms.service';

export { reservationsService } from './reservations.service';
export type { Reservation, CreateReservationData, UpdateReservationData, ReservationFilters } from './reservations.service';

export { dashboardService } from './dashboard.service';
export type { DashboardStats, RevenueChartData } from './dashboard.service';
