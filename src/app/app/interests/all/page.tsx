import { InterestsView } from "@/app/app/interests/page";
import { SECTIONS, type SectionId } from "@/lib/match/likes-sections";

export default async function InterestsAllPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const only = SECTIONS.find((item) => item.id === s)?.id as SectionId | undefined;
  return <InterestsView only={only ?? "received"} />;
}
