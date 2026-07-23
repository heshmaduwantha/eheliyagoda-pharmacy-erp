import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";

serverOnly();

export const DEFAULT_EXPIRY_ALERT_MONTHS = 6;

export function addCalendarMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export async function getExpiryAlertMonths() {
  const setting = await prisma.inventorySetting.findUnique({ where: { id: 1 }, select: { expiryAlertMonths: true } });
  return setting?.expiryAlertMonths ?? DEFAULT_EXPIRY_ALERT_MONTHS;
}
