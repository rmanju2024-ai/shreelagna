import { redirect } from "next/navigation";

export default async function AlertsPage() {
  redirect("/app/chat?tab=alerts");
}
