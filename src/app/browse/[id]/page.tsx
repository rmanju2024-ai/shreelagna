import { BrowseProfileView } from "@/app/browse/browse-profile-view";
import { InnerShell as PageShell } from "@/components/chrome-layout";

export default async function BrowseProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; sent?: string; contact?: string; wa?: string; safety?: string; from?: string }>;
}) {
  return (
    <PageShell full>
      <BrowseProfileView params={params} searchParams={searchParams} />
    </PageShell>
  );
}
