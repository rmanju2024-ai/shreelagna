import { BrowseProfileView } from "@/app/browse/browse-profile-view";
import { ProfilePeek } from "@/app/browse/profile-peek";

export default async function BrowseProfilePeekPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; sent?: string; contact?: string; wa?: string }>;
}) {
  return (
    <ProfilePeek>
      <BrowseProfileView params={params} searchParams={searchParams} />
    </ProfilePeek>
  );
}
