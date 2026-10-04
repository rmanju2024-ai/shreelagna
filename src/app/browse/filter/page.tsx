import { BrowsePage } from "@/app/browse/page";

export default async function BrowseFilterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  return <BrowsePage searchParams={Promise.resolve({ ...params, view: "custom", filterPage: "1" })} />;
}
