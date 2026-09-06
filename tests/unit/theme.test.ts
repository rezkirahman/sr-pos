import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Theme & Dark/Light Mode Configuration", () => {
  const globalsCss = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf-8");
  const tailwindConfig = fs.readFileSync(path.join(process.cwd(), "tailwind.config.ts"), "utf-8");
  const layout = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf-8");

  it("should have darkMode configured with class strategy in tailwind.config.ts", () => {
    expect(tailwindConfig).toContain('darkMode: ["class"]');
  });

  it("should have ThemeProvider with class attribute in layout.tsx", () => {
    expect(layout).toContain('attribute="class"');
    expect(layout).toContain('defaultTheme="system"');
    expect(layout).toContain("enableSystem");
  });

  it("should define all essential design tokens in :root (light mode)", () => {
    const requiredTokens = [
      "--background:",
      "--foreground:",
      "--card:",
      "--card-foreground:",
      "--primary:",
      "--primary-foreground:",
      "--secondary:",
      "--muted:",
      "--accent:",
      "--destructive:",
      "--border:",
      "--input:",
      "--ring:",
      "--radius:",
      "--chart-1:",
      "--sidebar:",
    ];
    for (const token of requiredTokens) {
      expect(globalsCss).toContain(token);
    }
  });

  it("should define corresponding tokens in .dark (dark mode)", () => {
    expect(globalsCss).toContain(".dark {");
    const darkSection = globalsCss.split(".dark {")[1];
    expect(darkSection).toContain("--background:");
    expect(darkSection).toContain("--foreground:");
    expect(darkSection).toContain("--card:");
    expect(darkSection).toContain("--primary:");
    expect(darkSection).toContain("--border:");
  });

  it("should have valid HSL channels format without invalid oklch or unescaped wrappers", () => {
    const rootBlock = globalsCss.split(":root {")[1].split(".dark {")[0];
    const darkBlock = globalsCss.split(".dark {")[1].split("}")[0];

    expect(rootBlock).not.toContain("oklch");
    expect(darkBlock).not.toContain("oklch");
    expect(rootBlock).not.toContain("hsl(hsl");
  });

  it("should have heading and sans font variables configured", () => {
    expect(tailwindConfig).toContain("--font-sans");
    expect(tailwindConfig).toContain("--font-heading");
    expect(globalsCss).toContain("font-family: var(--font-heading)");
  });
});
