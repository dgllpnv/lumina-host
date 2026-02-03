import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { id: 'test-org-1' },
    update: {},
    create: {
      id: 'test-org-1',
      nome: 'Restaurante Sabor & Arte',
      tipo: 'restaurante',
      plano: 'premium',
      ativo: true,
    },
  });

  console.log('Organization created:', org.nome);

  // Hash passwords (minimum 6 characters)
  const superAdminPassword = await bcrypt.hash('super123', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);
  const staffPassword = await bcrypt.hash('staff123', 12);

  // Create Super Admin
  const superAdmin = await prisma.profile.upsert({
    where: { email: 'superadmin@lumina.com' },
    update: { passwordHash: superAdminPassword },
    create: {
      email: 'superadmin@lumina.com',
      passwordHash: superAdminPassword,
      nome: 'Super Admin',
      role: 'super_admin',
      organizationId: null,
    },
  });

  // Create user role for super admin
  await prisma.userRole.upsert({
    where: { id: `role-${superAdmin.id}` },
    update: {},
    create: {
      id: `role-${superAdmin.id}`,
      userId: superAdmin.id,
      role: 'super_admin',
    },
  });

  console.log('Super Admin created:', superAdmin.email);

  // Create Admin
  const admin = await prisma.profile.upsert({
    where: { email: 'admin@lumina.com' },
    update: { passwordHash: adminPassword },
    create: {
      email: 'admin@lumina.com',
      passwordHash: adminPassword,
      nome: 'Admin Restaurante',
      role: 'admin',
      organizationId: org.id,
    },
  });

  await prisma.userRole.upsert({
    where: { id: `role-${admin.id}` },
    update: {},
    create: {
      id: `role-${admin.id}`,
      userId: admin.id,
      role: 'admin',
    },
  });

  console.log('Admin created:', admin.email);

  // Create Staff
  const staff = await prisma.profile.upsert({
    where: { email: 'staff@lumina.com' },
    update: { passwordHash: staffPassword },
    create: {
      email: 'staff@lumina.com',
      passwordHash: staffPassword,
      nome: 'Garçom João',
      role: 'staff',
      organizationId: org.id,
    },
  });

  await prisma.userRole.upsert({
    where: { id: `role-${staff.id}` },
    update: {},
    create: {
      id: `role-${staff.id}`,
      userId: staff.id,
      role: 'staff',
    },
  });

  console.log('Staff created:', staff.email);

  // Create some rooms/tables
  const rooms = [
    { nome: 'Quarto 101', tipo: 'quarto', status: 'livre', andar: 1, capacidade: 2, precoBase: 250 },
    { nome: 'Quarto 102', tipo: 'quarto', status: 'livre', andar: 1, capacidade: 2, precoBase: 250 },
    { nome: 'Quarto 201', tipo: 'quarto', status: 'livre', andar: 2, capacidade: 3, precoBase: 350 },
    { nome: 'Mesa 1', tipo: 'mesa', status: 'livre', capacidade: 4, andar: null, precoBase: null },
    { nome: 'Mesa 2', tipo: 'mesa', status: 'livre', capacidade: 4, andar: null, precoBase: null },
    { nome: 'Mesa 3', tipo: 'mesa', status: 'livre', capacidade: 6, andar: null, precoBase: null },
  ];

  for (const room of rooms) {
    await prisma.tableRoom.upsert({
      where: { id: `room-${room.nome.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `room-${room.nome.toLowerCase().replace(/\s/g, '-')}`,
        organizationId: org.id,
        nome: room.nome,
        tipo: room.tipo,
        status: room.status,
        andar: room.andar,
        capacidade: room.capacidade,
        precoBase: room.precoBase,
      },
    });
  }

  console.log('Rooms/Tables created:', rooms.length);

  // Create some inventory items
  const inventoryItems = [
    { nome: 'Arroz', quantidade: 50, unidade: 'kg', categoria: 'Insumos', estoqueMinimo: 10 },
    { nome: 'Feijão', quantidade: 30, unidade: 'kg', categoria: 'Insumos', estoqueMinimo: 5 },
    { nome: 'Carne Bovina', quantidade: 20, unidade: 'kg', categoria: 'Proteínas', estoqueMinimo: 5 },
    { nome: 'Frango', quantidade: 15, unidade: 'kg', categoria: 'Proteínas', estoqueMinimo: 3 },
    { nome: 'Óleo', quantidade: 10, unidade: 'L', categoria: 'Insumos', estoqueMinimo: 2 },
    { nome: 'Água Mineral', quantidade: 100, unidade: 'un', categoria: 'Bebidas', estoqueMinimo: 20 },
    { nome: 'Refrigerante', quantidade: 48, unidade: 'un', categoria: 'Bebidas', estoqueMinimo: 12 },
    { nome: 'Cerveja', quantidade: 60, unidade: 'un', categoria: 'Bebidas', estoqueMinimo: 24 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { id: `inv-${item.nome.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `inv-${item.nome.toLowerCase().replace(/\s/g, '-')}`,
        organizationId: org.id,
        nome: item.nome,
        quantidade: item.quantidade,
        unidade: item.unidade,
        categoria: item.categoria,
        estoqueMinimo: item.estoqueMinimo,
      },
    });
  }

  console.log('Inventory items created:', inventoryItems.length);

  // Create some sample transactions
  const today = new Date();
  const transactions = [
    { tipo: 'receita', categoria: 'Vendas', descricao: 'Almoço executivo', valor: 45.90, status: 'pago' },
    { tipo: 'receita', categoria: 'Vendas', descricao: 'Marmitex', valor: 25.00, status: 'pago' },
    { tipo: 'receita', categoria: 'Vendas', descricao: 'Porção de batata frita', valor: 28.00, status: 'pago' },
    { tipo: 'receita', categoria: 'hospedagem', descricao: 'Diária Quarto 101', valor: 250.00, status: 'pago' },
    { tipo: 'despesa', categoria: 'Insumos', descricao: 'Compra de verduras', valor: 180.00, status: 'pago' },
    { tipo: 'despesa', categoria: 'Salários', descricao: 'Adiantamento funcionário', valor: 500.00, status: 'pago' },
    { tipo: 'receita', categoria: 'Vendas', descricao: 'Jantar casal', valor: 120.00, status: 'pendente' },
    { tipo: 'despesa', categoria: 'Manutenção', descricao: 'Conserto geladeira', valor: 350.00, status: 'atrasado' },
  ];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    await prisma.financialTransaction.create({
      data: {
        organizationId: org.id,
        tipo: tx.tipo,
        categoria: tx.categoria,
        descricao: tx.descricao,
        valor: tx.valor,
        status: tx.status,
        metodoPagto: tx.status === 'pago' ? 'dinheiro' : null,
        dataPagamento: tx.status === 'pago' ? today : null,
        dataVencimento: tx.status !== 'pago' ? new Date(today.getTime() - (i * 24 * 60 * 60 * 1000)) : null,
      },
    });
  }

  console.log('Transactions created:', transactions.length);

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('\nTest credentials:');
  console.log('  Super Admin: superadmin@lumina.com / super123');
  console.log('  Admin:       admin@lumina.com / admin123');
  console.log('  Staff:       staff@lumina.com / staff123');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
