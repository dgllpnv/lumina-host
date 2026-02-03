import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Execute all queries in parallel
    const [
      // Financial stats
      monthlyRevenue,
      lastMonthRevenue,
      monthlyExpenses,
      pendingPayments,

      // Room/Table stats
      totalRooms,
      occupiedRooms,

      // Reservation stats
      activeReservations,
      todayCheckins,
      todayCheckouts,

      // Inventory stats
      lowStockItems,

      // Recent transactions
      recentTransactions,

      // Monthly transaction breakdown
      transactionsByCategory,
    ] = await Promise.all([
      // Monthly revenue
      prisma.financialTransaction.aggregate({
        where: {
          organizationId: effectiveOrgId,
          tipo: 'receita',
          status: 'pago',
          createdAt: { gte: startOfMonth },
        },
        _sum: { valor: true },
      }),

      // Last month revenue (for comparison)
      prisma.financialTransaction.aggregate({
        where: {
          organizationId: effectiveOrgId,
          tipo: 'receita',
          status: 'pago',
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { valor: true },
      }),

      // Monthly expenses
      prisma.financialTransaction.aggregate({
        where: {
          organizationId: effectiveOrgId,
          tipo: 'despesa',
          status: 'pago',
          createdAt: { gte: startOfMonth },
        },
        _sum: { valor: true },
      }),

      // Pending payments
      prisma.financialTransaction.aggregate({
        where: {
          organizationId: effectiveOrgId,
          status: { in: ['pendente', 'atrasado'] },
        },
        _sum: { valor: true },
        _count: true,
      }),

      // Total rooms/tables
      prisma.tableRoom.count({
        where: { organizationId: effectiveOrgId },
      }),

      // Occupied rooms
      prisma.tableRoom.count({
        where: {
          organizationId: effectiveOrgId,
          status: 'ocupado',
        },
      }),

      // Active reservations (checkin status)
      prisma.reservation.count({
        where: {
          organizationId: effectiveOrgId,
          status: 'checkin',
        },
      }),

      // Today's check-ins
      prisma.reservation.count({
        where: {
          organizationId: effectiveOrgId,
          checkinDate: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          },
          status: { in: ['reservado', 'checkin'] },
        },
      }),

      // Today's checkouts
      prisma.reservation.count({
        where: {
          organizationId: effectiveOrgId,
          checkoutDate: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          },
          status: 'checkin',
        },
      }),

      // Low stock items
      prisma.inventoryItem.findMany({
        where: {
          organizationId: effectiveOrgId,
          estoqueMinimo: { not: null },
        },
        select: {
          id: true,
          nome: true,
          quantidade: true,
          estoqueMinimo: true,
          unidade: true,
        },
      }),

      // Recent transactions
      prisma.financialTransaction.findMany({
        where: { organizationId: effectiveOrgId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          tipo: true,
          categoria: true,
          descricao: true,
          valor: true,
          status: true,
          createdAt: true,
        },
      }),

      // Transactions by category (this month)
      prisma.financialTransaction.groupBy({
        by: ['categoria', 'tipo'],
        where: {
          organizationId: effectiveOrgId,
          createdAt: { gte: startOfMonth },
        },
        _sum: { valor: true },
        _count: true,
      }),
    ]);

    // Filter low stock items
    const lowStockFiltered = lowStockItems.filter(
      item => item.estoqueMinimo !== null && item.quantidade <= item.estoqueMinimo
    );

    // Calculate growth percentage
    const currentRevenue = monthlyRevenue._sum.valor || 0;
    const previousRevenue = lastMonthRevenue._sum.valor || 0;
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Occupancy rate
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    res.json({
      financial: {
        monthlyRevenue: currentRevenue,
        monthlyExpenses: monthlyExpenses._sum.valor || 0,
        netIncome: currentRevenue - (monthlyExpenses._sum.valor || 0),
        pendingPayments: {
          total: pendingPayments._sum.valor || 0,
          count: pendingPayments._count || 0,
        },
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        transactionsByCategory,
      },
      occupancy: {
        totalRooms,
        occupiedRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        activeReservations,
      },
      today: {
        checkins: todayCheckins,
        checkouts: todayCheckouts,
      },
      inventory: {
        lowStockCount: lowStockFiltered.length,
        lowStockItems: lowStockFiltered.slice(0, 5),
      },
      recentTransactions,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};

export const getRevenueChart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.financialTransaction.findMany({
      where: {
        organizationId: effectiveOrgId,
        createdAt: { gte: startDate },
        status: 'pago',
      },
      select: {
        tipo: true,
        valor: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyData: Record<string, { receita: number; despesa: number }> = {};

    transactions.forEach(t => {
      const dateKey = t.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { receita: 0, despesa: 0 };
      }
      dailyData[dateKey][t.tipo] += t.valor;
    });

    // Fill missing dates
    const result = [];
    const current = new Date(startDate);
    while (current <= new Date()) {
      const dateKey = current.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        receita: dailyData[dateKey]?.receita || 0,
        despesa: dailyData[dateKey]?.despesa || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({ error: 'Failed to get revenue chart data' });
  }
};
