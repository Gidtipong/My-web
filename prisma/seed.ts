import { PrismaClient, UserRole, DeviceRole, DeviceStatus, TaskType, TaskPriority, TaskStatus, CaseCategory, CaseSeverity } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NetTask database on Supabase...');

  // 0. Clean old data if any
  await prisma.auditLog.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.checklist.deleteMany({});
  await prisma.case.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.site.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create User
  const user = await prisma.user.create({
    data: {
      email: 'netadmin@company.com',
      name: 'Chaiwat S. (Senior Network Engineer)',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ User created:', user.name);

  // 2. Load and create Sites
  const sitesRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'sites.json'), 'utf8'));
  const createdSites = [];
  for (const s of sitesRaw) {
    const site = await prisma.site.create({ data: s });
    createdSites.push(site);
  }
  console.log('✅ ' + createdSites.length + ' Sites created');

  // 3. Load and create Devices
  const devicesRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'devices.json'), 'utf8'));
  const now = new Date();
  const createdDevices = [];
  for (const d of devicesRaw) {
    const site = createdSites[d.siteIndex];
    const dev = await prisma.device.create({
      data: {
        hostname: d.hostname,
        ipAddress: d.ipAddress,
        vendor: d.vendor,
        model: d.model,
        serialNumber: d.serialNumber,
        role: d.role as DeviceRole,
        status: d.status as DeviceStatus,
        siteId: site.id,
        purchaseDate: new Date('2023-01-15'),
        warrantyEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        licenseEnd: d.isExpiring ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        notes: d.notes,
      },
    });
    createdDevices.push(dev);
  }
  console.log('✅ ' + createdDevices.length + ' Devices created');

  // 4. Load and create Tasks
  const tasksRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'tasks.json'), 'utf8'));
  for (let i = 0; i < tasksRaw.length; i++) {
    const t = tasksRaw[i];
    const site = createdSites[t.siteIndex];
    const device = t.deviceIndex !== undefined ? createdDevices[t.deviceIndex] : null;

    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        type: t.type as TaskType,
        priority: t.priority as TaskPriority,
        status: t.status as TaskStatus,
        siteId: site ? site.id : null,
        deviceId: device ? device.id : null,
        assigneeId: user.id,
        ticketRef: t.ticketRef || null,
        rollbackPlan: t.rollbackPlan || null,
        dueDate: t.daysOffset ? new Date(now.getTime() + t.daysOffset * 24 * 60 * 60 * 1000) : null,
        completedAt: t.completedOffset ? new Date(now.getTime() + t.completedOffset * 24 * 60 * 60 * 1000) : null,
      },
    });

    if (i < 6) {
      await prisma.checklist.createMany({
        data: [
          { taskId: task.id, text: 'ตรวจสอบค่าพารามิเตอร์และการเชื่อมต่อ', done: true, order: 1 },
          { taskId: task.id, text: 'บันทึก running-config ก่อนดำเนินการ', done: true, order: 2 },
          { taskId: task.id, text: 'ทดสอบ Ping และ Routing หลังทำรายการ', done: t.status === 'DONE', order: 3 },
          { taskId: task.id, text: 'แจ้งอัปเดตสถานะในกลุ่มวิศวกร', done: t.status === 'DONE', order: 4 },
        ],
      });

      await prisma.note.create({
        data: {
          taskId: task.id,
          content: 'บันทึกการปฏิบัติงาน: เข้าตรวจสอบระบบและดำเนินการตาม Standard Operation Procedure (SOP)',
        },
      });
    }
  }
  console.log('✅ ' + tasksRaw.length + ' Tasks created with Checklists & Notes');

  // 5. Load and create Cases
  const casesRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8'));
  for (const c of casesRaw) {
    const site = createdSites[c.siteIndex];
    const device = c.deviceIndex !== undefined ? createdDevices[c.deviceIndex] : null;

    await prisma.case.create({
      data: {
        caseNumber: c.caseNumber,
        title: c.title,
        symptom: c.symptom,
        cause: c.cause || null,
        solution: c.solution,
        prevention: c.prevention || null,
        category: c.category as CaseCategory,
        severity: c.severity as CaseSeverity,
        vendor: c.vendor || null,
        tags: c.tags,
        siteId: site ? site.id : null,
        deviceId: device ? device.id : null,
        timeToFix: c.timeToFix,
        viewCount: c.viewCount,
        recurrenceCount: c.recurrenceCount,
        isFavorite: c.isFavorite,
        isPinned: c.isPinned,
        occurredAt: new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - Math.floor(Math.random() * 25) * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log('✅ ' + casesRaw.length + ' Network Troubleshooting Cases created');
  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });