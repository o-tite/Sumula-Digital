import { listReferees } from "@/application/use-cases/referees";
import { RefereesManager } from "./referees-manager";

export default async function RefereesPage() {
  const referees = await listReferees();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mesários</h1>
      <RefereesManager initial={referees} />
    </div>
  );
}
