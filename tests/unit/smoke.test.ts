import { describe, it, expect } from "vitest";
import { cn, formatRupiah } from "@/lib/utils";

describe("Smoke Test - Environment & Scaffolding", () => {
  it("should merge class names correctly with cn helper", () => {
    const result = cn("text-red-500", "bg-blue-500", { "font-bold": true });
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-500");
    expect(result).toContain("font-bold");
  });

  it("should format currency to Indonesian Rupiah correctly", () => {
    const formatted = formatRupiah(150000);
    // Expect Rp and 150.000 in output
    expect(formatted).toContain("150.000");
  });
});
