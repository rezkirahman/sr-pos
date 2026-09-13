import { describe, it, expect } from "vitest";
import {
  PaymentType,
  MovementType,
  DebtType,
  DebtStatus,
  CashFlowType,
} from "@prisma/client";

describe("Prisma Schema & Enum Definitions", () => {
  it("should have correct system role codes", () => {
    const systemRoleCodes = ["SUPERADMIN", "OWNER", "CASHIER", "WAREHOUSE"];
    expect(systemRoleCodes).toContain("SUPERADMIN");
    expect(systemRoleCodes).toContain("OWNER");
    expect(systemRoleCodes).toContain("CASHIER");
  });

  it("should have correct PaymentType enums", () => {
    expect(PaymentType.CASH).toBe("CASH");
    expect(PaymentType.TRANSFER).toBe("TRANSFER");
    expect(PaymentType.DEBT).toBe("DEBT");
  });

  it("should have correct MovementType enums", () => {
    expect(MovementType.IN).toBe("IN");
    expect(MovementType.OUT).toBe("OUT");
    expect(MovementType.ADJUSTMENT).toBe("ADJUSTMENT");
  });

  it("should have correct DebtType enums", () => {
    expect(DebtType.RECEIVABLE).toBe("RECEIVABLE");
    expect(DebtType.DEBT).toBe("DEBT");
  });

  it("should have correct DebtStatus enums", () => {
    expect(DebtStatus.UNPAID).toBe("UNPAID");
    expect(DebtStatus.PARTIAL).toBe("PARTIAL");
    expect(DebtStatus.PAID).toBe("PAID");
  });

  it("should have correct CashFlowType enums", () => {
    expect(CashFlowType.INCOME).toBe("INCOME");
    expect(CashFlowType.EXPENSE).toBe("EXPENSE");
  });
});
