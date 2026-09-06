import { describe, it, expect } from "vitest";
import { getDueDateStatus, calculateDaysDifference } from "@/lib/due-date";

describe("Due Date Reminder Logic", () => {
  const baseDate = new Date(2026, 8, 6, 12, 0, 0); // 2026-09-06

  it("should calculate days difference accurately", () => {
    const today = new Date(2026, 8, 6);
    const tomorrow = new Date(2026, 8, 7);
    const yesterday = new Date(2026, 8, 5);

    expect(calculateDaysDifference(today, baseDate)).toBe(0);
    expect(calculateDaysDifference(tomorrow, baseDate)).toBe(1);
    expect(calculateDaysDifference(yesterday, baseDate)).toBe(-1);
  });

  it("should return PAID status if already paid regardless of date", () => {
    const pastDate = new Date(2026, 8, 1);
    const status = getDueDateStatus(pastDate, true, baseDate);
    expect(status.status).toBe("PAID");
    expect(status.badgeVariant).toBe("success");
    expect(status.label).toBe("LUNAS");
  });

  it("should return OVERDUE status (Red) when due date was yesterday", () => {
    const yesterday = new Date(2026, 8, 5);
    const status = getDueDateStatus(yesterday, false, baseDate);
    expect(status.status).toBe("OVERDUE");
    expect(status.badgeVariant).toBe("danger");
    expect(status.label).toContain("LEWAT TEMPO");
  });

  it("should return DUE_TODAY status (Red) when due date is today", () => {
    const today = new Date(2026, 8, 6, 23, 59, 59);
    const status = getDueDateStatus(today, false, baseDate);
    expect(status.status).toBe("DUE_TODAY");
    expect(status.badgeVariant).toBe("danger");
    expect(status.label).toContain("JATUH TEMPO HARI INI");
  });

  it("should return APPROACHING status (Yellow) when due date is 1-3 days ahead", () => {
    const in2Days = new Date(2026, 8, 8);
    const status = getDueDateStatus(in2Days, false, baseDate);
    expect(status.status).toBe("APPROACHING");
    expect(status.badgeVariant).toBe("warning");
    expect(status.label).toContain("MENDEKATI TEMPO");
  });

  it("should return SAFE status (Normal) when due date is more than 3 days ahead", () => {
    const in10Days = new Date(2026, 8, 16);
    const status = getDueDateStatus(in10Days, false, baseDate);
    expect(status.status).toBe("SAFE");
    expect(status.badgeVariant).toBe("outline");
    expect(status.label).toContain("AMAN");
  });
});
