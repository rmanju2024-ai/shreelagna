import { redirect } from "next/navigation";

export default async function DeskMemberFileRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ peek?: string; thread?: string; tab?: string; section?: string; saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const extra = await searchParams;
  const q = new URLSearchParams();
  q.set("open", id);
  if (extra.peek) q.set("peek", extra.peek);
  if (extra.tab) q.set("tab", extra.tab);
  if (extra.thread) q.set("thread", extra.thread);
  if (extra.section) q.set("section", extra.section);
  if (extra.saved) q.set("saved", extra.saved);
  if (extra.error) q.set("error", extra.error);
  redirect(`/desk/people?${q.toString()}`);
}
