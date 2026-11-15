import { redirect } from "next/navigation";

export default async function DeskMemberFileRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ peek?: string; thread?: string; tab?: string }>;
}) {
  const { id } = await params;
  const extra = await searchParams;
  const q = new URLSearchParams();
  q.set("open", id);
  if (extra.peek) q.set("peek", extra.peek);
  if (extra.tab) q.set("tab", extra.tab);
  if (extra.thread) q.set("thread", extra.thread);
  redirect(`/desk/people?${q.toString()}`);
}
