import { getSession } from "@/lib/auth";
import { getCashFlowSummary, getCashFlowLedger } from "@/actions/cashflow";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { CashFlowClient } from "./cashflow-client";

export default async function CashFlowPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== Role.OWNER) {
    redirect("/pos");
  }

  const summary = await getCashFlowSummary();
  const ledger = await getCashFlowLedger();

  return <CashFlowClient initialSummary={summary} initialLedger={ledger} />;
}
