import { getSession, userHasPermission } from "@/lib/auth";
import { getCashFlowSummary, getCashFlowLedger } from "@/actions/cashflow";
import { redirect } from "next/navigation";
import { CashFlowClient } from "./cashflow-client";

export default async function CashFlowPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!userHasPermission(session, "cashflow", "view")) {
    redirect("/pos");
  }

  const summary = await getCashFlowSummary();
  const ledger = await getCashFlowLedger();

  return <CashFlowClient initialSummary={summary} initialLedger={ledger} />;
}
