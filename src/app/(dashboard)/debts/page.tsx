import { getSession } from "@/lib/auth";
import { getDebts, getDebtsSummary } from "@/actions/debt";
import { DebtType, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { DebtsClient } from "./debts-client";

export default async function DebtsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const isOwner = session.role === Role.OWNER;
  const summary = await getDebtsSummary();
  const receivables = await getDebts(DebtType.RECEIVABLE);
  const payables = isOwner ? await getDebts(DebtType.DEBT) : [];

  return (
    <DebtsClient
      summary={summary}
      initialReceivables={receivables}
      initialPayables={payables}
      isOwner={isOwner}
    />
  );
}
