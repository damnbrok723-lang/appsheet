import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });
  await prisma.role.upsert({
    where: { name: "MANAGER" },
    update: {},
    create: { name: "MANAGER" },
  });
  await prisma.role.upsert({
    where: { name: "EMPLOYEE" },
    update: {},
    create: { name: "EMPLOYEE" },
  });

  const itDept = await prisma.department.upsert({
    where: { id: "it-dept" },
    update: {},
    create: { id: "it-dept", name: "IT", description: "Information Technology Department" },
  });
  const marketingDept = await prisma.department.upsert({
    where: { id: "marketing-dept" },
    update: {},
    create: { id: "marketing-dept", name: "Marketing", description: "Marketing Department" },
  });

  const devTeam = await prisma.team.upsert({
    where: { id: "dev-team" },
    update: {},
    create: { id: "dev-team", name: "Development", description: "Software Development Team", departmentId: itDept.id },
  });
  const designTeam = await prisma.team.upsert({
    where: { id: "design-team" },
    update: {},
    create: { id: "design-team", name: "Design", description: "Design Team", departmentId: marketingDept.id },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.local" },
    update: { name: "Admin User", username: "kasie", passwordHash: await hash("semangatkompakkerjatuntas", 12), role: "ADMIN", status: "ACTIVE" },
    create: {
      id: "admin-user",
      name: "Admin User",
      username: "kasie",
      email: "admin@example.local",
      passwordHash: await hash("semangatkompakkerjatuntas", 12),
      role: "ADMIN",
      status: "ACTIVE",
      jobTitle: "System Administrator",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.local" },
    update: { name: "Manager User", username: "kadep", passwordHash: await hash("semangatkompakkerjatuntas", 12), role: "MANAGER", departmentId: itDept.id, teamId: devTeam.id, status: "ACTIVE" },
    create: {
      id: "manager-user",
      name: "Manager User",
      username: "kadep",
      email: "manager@example.local",
      passwordHash: await hash("semangatkompakkerjatuntas", 12),
      role: "MANAGER",
      departmentId: itDept.id,
      teamId: devTeam.id,
      status: "ACTIVE",
      jobTitle: "IT Manager",
    },
  });

  await prisma.team.update({ where: { id: devTeam.id }, data: { managerId: manager.id } });

  const andi = await prisma.user.upsert({
    where: { email: "andi@example.local" },
    update: { name: "Andi Pratama", username: "Repro", passwordHash: await hash("semangatkompakkerjatuntas", 12), role: "EMPLOYEE", departmentId: itDept.id, teamId: devTeam.id, status: "ACTIVE" },
    create: {
      id: "andi-user",
      name: "Andi Pratama",
      username: "Repro",
      email: "andi@example.local",
      passwordHash: await hash("semangatkompakkerjatuntas", 12),
      role: "EMPLOYEE",
      departmentId: itDept.id,
      teamId: devTeam.id,
      status: "ACTIVE",
      jobTitle: "Developer",
    },
  });
  const rina = await prisma.user.upsert({
    where: { email: "rina@example.local" },
    update: { name: "Rina", role: "EMPLOYEE", departmentId: marketingDept.id, teamId: designTeam.id, status: "ACTIVE" },
    create: {
      id: "rina-user",
      name: "Rina",
      email: "rina@example.local",
      passwordHash: await hash("password123", 12),
      role: "EMPLOYEE",
      departmentId: marketingDept.id,
      teamId: designTeam.id,
      status: "ACTIVE",
      jobTitle: "UI/UX Designer",
    },
  });
  const doni = await prisma.user.upsert({
    where: { email: "doni@example.local" },
    update: { name: "Doni", role: "EMPLOYEE", departmentId: itDept.id, teamId: devTeam.id, status: "ACTIVE" },
    create: {
      id: "doni-user",
      name: "Doni",
      email: "doni@example.local",
      passwordHash: await hash("password123", 12),
      role: "EMPLOYEE",
      departmentId: itDept.id,
      teamId: devTeam.id,
      status: "ACTIVE",
      jobTitle: "Backend Developer",
    },
  });
  const sinta = await prisma.user.upsert({
    where: { email: "sinta@example.local" },
    update: { name: "Sinta", role: "EMPLOYEE", departmentId: marketingDept.id, teamId: designTeam.id, status: "ACTIVE" },
    create: {
      id: "sinta-user",
      name: "Sinta",
      email: "sinta@example.local",
      passwordHash: await hash("password123", 12),
      role: "EMPLOYEE",
      departmentId: marketingDept.id,
      teamId: designTeam.id,
      status: "ACTIVE",
      jobTitle: "Content Writer",
    },
  });

  await prisma.task.upsert({
    where: { id: "demo-task-report" },
    update: { title: "Prepare monthly operations report", status: "IN_PROGRESS", assignedToId: andi.id },
    create: {
      id: "demo-task-report",
      title: "Prepare monthly operations report",
      description: "Collect warehouse output and submit the monthly report for review.",
      createdById: manager.id,
      assignedToId: andi.id,
      teamId: devTeam.id,
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-09-30T00:00:00.000Z"),
    },
  });
  await prisma.task.upsert({
    where: { id: "demo-task-design" },
    update: { title: "Review production dashboard", status: "WAITING_REVIEW", assignedToId: rina.id },
    create: {
      id: "demo-task-design",
      title: "Review production dashboard",
      description: "Check dashboard labels and report filters before release.",
      createdById: admin.id,
      assignedToId: rina.id,
      teamId: designTeam.id,
      priority: "MEDIUM",
      status: "WAITING_REVIEW",
      dueDate: new Date("2026-09-25T00:00:00.000Z"),
    },
  });
  await prisma.taskComment.upsert({
    where: { id: "demo-comment-report" },
    update: { comment: "The first draft is ready for review.", userId: andi.id },
    create: { id: "demo-comment-report", taskId: "demo-task-report", userId: andi.id, comment: "The first draft is ready for review." },
  });
  await prisma.event.upsert({
    where: { id: "demo-event-standup" },
    update: { title: "Operations standup", teamId: devTeam.id },
    create: {
      id: "demo-event-standup",
      title: "Operations standup",
      description: "Daily coordination for the operations team.",
      createdById: manager.id,
      teamId: devTeam.id,
      startAt: new Date("2026-09-18T02:00:00.000Z"),
      endAt: new Date("2026-09-18T02:30:00.000Z"),
      location: "Main meeting room",
    },
  });
  await prisma.announcement.upsert({
    where: { id: "demo-announcement-safety" },
    update: { title: "Warehouse safety briefing" },
    create: {
      id: "demo-announcement-safety",
      title: "Warehouse safety briefing",
      content: "The monthly safety briefing starts Friday at 09:00.",
      createdById: admin.id,
      publishedAt: new Date("2026-09-17T01:00:00.000Z"),
    },
  });
  await prisma.announcementTarget.upsert({
    where: { id: "demo-announcement-target" },
    update: { userId: sinta.id },
    create: { id: "demo-announcement-target", announcementId: "demo-announcement-safety", userId: sinta.id },
  });
  await prisma.notification.upsert({
    where: { id: "demo-notification-task" },
    update: { title: "Task assigned", message: "You have a new operations report task.", readAt: null },
    create: {
      id: "demo-notification-task",
      userId: andi.id,
      type: "TASK_ASSIGNED",
      title: "Task assigned",
      message: "You have a new operations report task.",
      entityType: "Task",
      entityId: "demo-task-report",
    },
  });
  await prisma.attendance.upsert({
    where: { userId_date: { userId: andi.id, date: new Date("2026-09-16T00:00:00.000Z") } },
    update: { checkIn: new Date("2026-09-16T01:00:00.000Z"), checkOut: new Date("2026-09-16T10:00:00.000Z") },
    create: { userId: andi.id, date: new Date("2026-09-16T00:00:00.000Z"), checkIn: new Date("2026-09-16T01:00:00.000Z"), checkOut: new Date("2026-09-16T10:00:00.000Z") },
  });
  await prisma.monitoringEntry.upsert({
    where: { id: "demo-monitoring-entry" },
    update: { operatorCount: 18, warehouse: "Gudang Utama" },
    create: { id: "demo-monitoring-entry", userId: manager.id, date: new Date("2026-09-16T00:00:00.000Z"), shift: "PAGI", operatorCount: 18, warehouse: "Gudang Utama" },
  });
  await prisma.productionReport.upsert({
    where: { id: "demo-production-report" },
    update: { customer: "PT Nusantara", qtyOk: 420, qtyNg: 8, ncrNumber: "NCR-2609-000", status: "APPROVED", sourceType: "DEMO" },
    create: {
      id: "demo-production-report",
      userId: manager.id,
      reportDate: new Date("2026-09-16T00:00:00.000Z"),
      customer: "PT Nusantara",
      dimensions: "100 x 50 x 3 mm",
      pipeTypes: JSON.stringify(["KOTAK"]),
      batchNumber: "B-260916-01",
      operatorTypes: JSON.stringify(["INTERNAL"]),
      operatorName: doni.name,
      shift: "PAGI",
      qtyOk: 420,
      qtyNg: 8,
      ncrNumber: "NCR-2609-000",
      status: "APPROVED",
      processNotes: "Demo production report",
      sourceType: "DEMO",
    },
  });

  const warehouses = ["Gudang Utama", "Gudang Timur", "Gudang Barat"];
  const shifts = ["PAGI", "SIANG", "MALAM"];
  const monitoringRows = Array.from({ length: 14 }, (_, dayIndex) =>
    shifts.flatMap((shift, shiftIndex) => {
      const date = new Date(Date.UTC(2026, 8, 1 + dayIndex));
      date.setUTCHours(shiftIndex * 8, 0, 0, 0);
      return warehouses.map((warehouse, warehouseIndex) => ({
        id: `demo-monitoring-${dayIndex + 1}-${shiftIndex + 1}-${warehouseIndex + 1}`,
        date,
        shift,
        operatorCount: 8 + ((dayIndex * 3 + shiftIndex * 4 + warehouseIndex) % 15),
        warehouse,
      }));
    }),
  ).flat();

  await prisma.$transaction(
    monitoringRows.map((row) => prisma.monitoringEntry.upsert({
      where: { id: row.id },
      update: { date: row.date, shift: row.shift, operatorCount: row.operatorCount, warehouse: row.warehouse, userId: manager.id },
      create: { ...row, userId: manager.id },
    })),
  );

  const customers = ["PT Nusantara", "PT Sentosa", "PT Maju Bersama", "PT Prima Industri"];
  const reportRows = Array.from({ length: 20 }, (_, index) => {
    const reportDate = new Date(Date.UTC(2026, 8, 1 + (index % 14)));
    const qtyOk = 260 + ((index * 37) % 260);
    const qtyNg = index % 4 === 0 ? 12 : 3 + (index % 5);
    return {
      id: `demo-production-report-${index + 1}`,
      userId: [manager.id, andi.id, doni.id][index % 3],
      reportDate,
      customer: customers[index % customers.length],
      dimensions: index % 2 === 0 ? "100 x 50 x 3 mm" : "80 x 40 x 2 mm",
      pipeTypes: JSON.stringify([index % 3 === 0 ? "BULAT" : "KOTAK"]),
      batchNumber: `B-2609-${String(index + 1).padStart(3, "0")}`,
      ncrNumber: qtyNg > 0 ? `NCR-2609-${String(index + 1).padStart(3, "0")}` : null,
      operatorTypes: JSON.stringify([index % 2 === 0 ? "INTERNAL" : "BORONGAN"]),
      operatorName: [andi.name, doni.name, rina.name][index % 3],
      shift: shifts[index % shifts.length],
      qtyOk,
      qtyNg,
      ngNotes: qtyNg > 10 ? "Pemeriksaan ulang diperlukan pada permukaan produk." : null,
      processNotes: "Data demo untuk pengujian dashboard dan laporan.",
      sourceType: "DEMO",
      photoData: null,
      status: ["DRAFT", "SUBMITTED", "REVISION", "APPROVED", "REJECTED"][index % 5],
    };
  });

  await prisma.$transaction(
    reportRows.map((row) => prisma.productionReport.upsert({
      where: { id: row.id },
      update: { ...row },
      create: row,
    })),
  );

  await prisma.document.upsert({
    where: { id: "demo-document-sap-guide" },
    update: { name: "Panduan Control Daily Repair SAP.xlsx", description: "Dokumen demo untuk pengujian menu Documents.", filePath: "demo/control-daily-repair-guide.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSize: 0, uploadedById: admin.id, teamId: devTeam.id },
    create: { id: "demo-document-sap-guide", name: "Panduan Control Daily Repair SAP.xlsx", description: "Dokumen demo untuk pengujian menu Documents.", filePath: "demo/control-daily-repair-guide.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSize: 0, uploadedById: admin.id, teamId: devTeam.id },
  });

  console.log(`Seed data created successfully: ${monitoringRows.length} monitoring rows and ${reportRows.length} production reports.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
