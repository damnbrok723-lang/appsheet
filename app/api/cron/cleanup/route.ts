import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET || "keepalive-clean-secret";

    if (secret && secret !== cronSecret) {
      return NextResponse.json({ success: false, message: "Unauthorized secret" }, { status: 401 });
    }

    // Cutoff: 180 days ago (6 months)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 180);

    // Logs cutoff: 60 days ago
    const logsCutoff = new Date();
    logsCutoff.setDate(logsCutoff.getDate() - 60);

    const [deletedReports, deletedMonitoring, deletedLogs, deletedNotifications] = await prisma.$transaction([
      prisma.productionReport.deleteMany({
        where: {
          reportDate: { lt: cutoffDate },
        },
      }),
      prisma.monitoringEntry.deleteMany({
        where: {
          date: { lt: cutoffDate },
        },
      }),
      prisma.activityLog.deleteMany({
        where: {
          createdAt: { lt: logsCutoff },
        },
      }),
      prisma.notification.deleteMany({
        where: {
          createdAt: { lt: logsCutoff },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Purge cleanup executed successfully",
      cutoffDate: cutoffDate.toISOString(),
      summary: {
        deletedReports: deletedReports.count,
        deletedMonitoring: deletedMonitoring.count,
        deletedLogs: deletedLogs.count,
        deletedNotifications: deletedNotifications.count,
      },
    });
  } catch (error) {
    console.error("Cleanup cron failed", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
