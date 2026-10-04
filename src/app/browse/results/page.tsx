import { BrowsePage } from "@/app/browse/page";

export default async function BrowseResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  return <BrowsePage searchParams={Promise.resolve({ ...params, all: "1" })} />;
}
