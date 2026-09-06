export type DueDateCategory = "PAID" | "OVERDUE" | "DUE_TODAY" | "APPROACHING" | "SAFE";

export interface DueDateStatus {
  status: DueDateCategory;
  badgeVariant: "success" | "warning" | "danger" | "outline" | "default";
  label: string;
  daysDiff: number;
}

export function calculateDaysDifference(targetDate: Date, referenceDate: Date = new Date()): number {
  // Normalize both dates to midnight local time
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffTime = target.getTime() - ref.getTime();
  return Math.round(diffTime / msPerDay);
}

export function getDueDateStatus(
  dueDate: Date,
  isPaid: boolean,
  referenceDate: Date = new Date()
): DueDateStatus {
  if (isPaid) {
    return {
      status: "PAID",
      badgeVariant: "success",
      label: "LUNAS",
      daysDiff: 0,
    };
  }

  const daysDiff = calculateDaysDifference(dueDate, referenceDate);

  if (daysDiff < 0) {
    return {
      status: "OVERDUE",
      badgeVariant: "danger",
      label: `LEWAT TEMPO (${Math.abs(daysDiff)} hari)`,
      daysDiff,
    };
  }

  if (daysDiff === 0) {
    return {
      status: "DUE_TODAY",
      badgeVariant: "danger",
      label: "JATUH TEMPO HARI INI",
      daysDiff,
    };
  }

  if (daysDiff <= 3) {
    return {
      status: "APPROACHING",
      badgeVariant: "warning",
      label: `MENDEKATI TEMPO (${daysDiff} hari)`,
      daysDiff,
    };
  }

  return {
    status: "SAFE",
    badgeVariant: "outline",
    label: `AMAN (${daysDiff} hari lagi)`,
    daysDiff,
  };
}
