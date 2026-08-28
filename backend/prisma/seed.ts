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

  // ==========================================================
  // Pousada Algas Marinhas — primeiro cliente real do Lumina
  // (Praia do Forte, Bahia). Fotos reais já coletadas; tarifas,
  // pacote e dicas de passeio/transfer marcados como EXEMPLO —
  // a proprietária vai revisar e ajustar. URL de export ICS da
  // Booking.com ainda não coletada (fica pendente, null).
  // ==========================================================
  const UPLOADS = '/uploads/algas-marinhas';

  const algasMarinhas = await prisma.organization.upsert({
    where: { id: 'algas-marinhas' },
    update: {},
    create: {
      id: 'algas-marinhas',
      nome: 'Pousada Algas Marinhas',
      tipo: 'pousada',
      plano: 'premium',
      ativo: true,
      contractStatus: 'ativo',
      contractStart: new Date(),
      siteSlug: 'algas-marinhas',
      sitePublished: true,
      logoUrl: `${UPLOADS}/crest-logo.jpeg`,
    },
  });

  console.log('Organization created:', algasMarinhas.nome);

  const algasAdminPassword = await bcrypt.hash('algas123', 12);
  const algasAdmin = await prisma.profile.upsert({
    where: { email: 'admin@algasmarinhas.com' },
    update: { passwordHash: algasAdminPassword },
    create: {
      email: 'admin@algasmarinhas.com',
      passwordHash: algasAdminPassword,
      nome: 'Admin Algas Marinhas',
      role: 'admin',
      organizationId: algasMarinhas.id,
    },
  });

  await prisma.userRole.upsert({
    where: { id: `role-${algasAdmin.id}` },
    update: {},
    create: { id: `role-${algasAdmin.id}`, userId: algasAdmin.id, role: 'admin' },
  });

  console.log('Admin created:', algasAdmin.email);

  // Quartos — nomes e capacidades confirmados; tarifas de exemplo.
  const roomsData = [
    { id: 'algas-quarto-duplo', nome: 'Duplo', capacidade: 2, precoBase: 220, tarifaBaixa: 220, tarifaAlta: 320, foto: 'quarto-duplo.jpg', desc: 'Quarto duplo aconchegante, cama de casal, ideal para casais.' },
    { id: 'algas-quarto-duplo-amplo', nome: 'Duplo Amplo', capacidade: 2, precoBase: 280, tarifaBaixa: 280, tarifaAlta: 390, foto: 'quarto-duplo-amplo.jpg', desc: 'Versão ampliada do Duplo, com mais espaço e acabamento em madeira.' },
    { id: 'algas-quarto-triplo', nome: 'Triplo', capacidade: 3, precoBase: 330, tarifaBaixa: 330, tarifaAlta: 450, foto: 'quarto-triplo-detalhe.jpg', desc: 'Quarto para até 3 hóspedes, com TV e frigobar.' },
    { id: 'algas-quarto-quadruplo', nome: 'Quádruplo', capacidade: 4, precoBase: 400, tarifaBaixa: 400, tarifaAlta: 540, foto: 'quarto-quadruplo-loft.jpg', desc: 'Quarto em formato loft com mezanino, para até 4 hóspedes.' },
  ];

  for (const r of roomsData) {
    const room = await prisma.tableRoom.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        organizationId: algasMarinhas.id,
        nome: r.nome,
        tipo: 'quarto',
        status: 'livre',
        capacidade: r.capacidade,
        precoBase: r.precoBase,
        descricao: r.desc,
      },
    });

    await prisma.roomContent.upsert({
      where: { tableRoomId: room.id },
      update: {},
      create: {
        tableRoomId: room.id,
        descricaoLonga: `${r.desc} Tarifas de exemplo — a proprietária irá revisar e ajustar por temporada.`,
        fotos: [`${UPLOADS}/${r.foto}`],
        tarifaBaixaTemp: r.tarifaBaixa,
        tarifaAltaTemp: r.tarifaAlta,
      },
    });

    // Feed de iCal gratuito (Fase 01) — configurado, mas sem URL ainda;
    // fica pendente até a proprietária coletar o link de export da Booking.com.
    await prisma.icalFeedConfig.upsert({
      where: { tableRoomId: room.id },
      update: {},
      create: { tableRoomId: room.id, importUrl: null },
    });
  }

  console.log('Rooms created for Algas Marinhas:', roomsData.length);

  // Gastronomia (reaproveita ContentTip com tipo "gastronomia") — café da
  // manhã é da própria pousada; Il Cantuccio é restaurante PARCEIRO, ao lado,
  // não pertence à pousada.
  const gastronomiaTips = [
    {
      id: 'algas-gastro-cafe',
      titulo: 'Café da manhã',
      descricao: 'Buffet completo servido pela própria pousada — um dos pontos mais elogiados pelos hóspedes no Booking.com.',
      fotos: [`${UPLOADS}/comum-varanda.jpg`],
      ordem: 0,
    },
    {
      id: 'algas-gastro-cantuccio',
      titulo: 'Il Cantuccio',
      descricao: 'Restaurante parceiro que fica colado com a pousada — cozinha italiana para almoço, jantar e happy hour. Não é operado pela Algas Marinhas.',
      fotos: [`${UPLOADS}/il-cantuccio-fachada-1.jpg`, `${UPLOADS}/il-cantuccio-fachada-2.jpg`],
      ordem: 1,
    },
  ];

  for (const t of gastronomiaTips) {
    await prisma.contentTip.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, organizationId: algasMarinhas.id, tipo: 'gastronomia', ...t },
    });
  }

  // Dicas de passeio e transfer — EXEMPLO, a proprietária vai revisar.
  const otherTips = [
    { id: 'algas-passeio-tamar', tipo: 'passeio', titulo: 'Projeto Tamar', descricao: '[Exemplo] Santuário de tartarugas marinhas a poucos passos da pousada.', ordem: 0 },
    { id: 'algas-passeio-praia', tipo: 'passeio', titulo: 'Praia do Porto', descricao: '[Exemplo] A praia mais próxima, a poucos minutos a pé.', ordem: 1 },
    { id: 'algas-transfer-aeroporto', tipo: 'transfer', titulo: 'Aeroporto de Salvador → Praia do Forte', descricao: '[Exemplo] Cerca de 1h30 de carro; transfer privado ou van compartilhada.', ordem: 0 },
  ];

  for (const t of otherTips) {
    await prisma.contentTip.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, organizationId: algasMarinhas.id, fotos: [], ...t },
    });
  }

  console.log('Content tips created for Algas Marinhas:', gastronomiaTips.length + otherTips.length);

  // Pacote promocional — EXEMPLO temático de Praia do Forte.
  await prisma.package.upsert({
    where: { id: 'algas-pacote-escapada' },
    update: {},
    create: {
      id: 'algas-pacote-escapada',
      organizationId: algasMarinhas.id,
      nome: 'Escapada Praia do Forte',
      descricao: '[Exemplo] Diária + welcome drink — pacote de exemplo, a proprietária irá revisar e ajustar.',
      precoPromocional: 380,
      ativo: true,
    },
  });

  // Formas de pagamento confirmadas: Pix e Cartão.
  const paymentMethods = [
    { id: 'algas-pagto-pix', tipo: 'pix', instrucoes: 'Chave Pix informada após confirmação da reserva.' },
    { id: 'algas-pagto-cartao', tipo: 'cartao', instrucoes: 'Cartão de crédito ou débito na chegada.' },
  ];

  for (const p of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, organizationId: algasMarinhas.id, ativo: true },
    });
  }

  console.log('Payment methods created for Algas Marinhas:', paymentMethods.length);

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('\nTest credentials:');
  console.log('  Super Admin: superadmin@lumina.com / super123');
  console.log('  Admin:       admin@lumina.com / admin123');
  console.log('  Staff:       staff@lumina.com / staff123');
  console.log('\nAlgas Marinhas (cliente real):');
  console.log('  Admin: admin@algasmarinhas.com / algas123');
  console.log('  Site:  GET /api/public/algas-marinhas/site');
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
