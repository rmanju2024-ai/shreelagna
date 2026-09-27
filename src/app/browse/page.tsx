import { BrowseClient } from "@/app/browse/browse-client";
import type { BrowseCardNote } from "@/app/browse/browse-card";
import { PageShell } from "@/components/site-chrome";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { parseBrowseFilters } from "@/lib/match/browse-filters";
import {
  browseRank,
  emptyBrowseBuckets,
  parseBrowseView,
  type BrowseScoreRow,
  type BrowseView,
} from "@/lib/match/browse-match";
import { kmApart, nearbyLabel, sameCommunity } from "@/lib/geo/city-distance";
import { inboxLastOnline, publicMediaUrl } from "@/lib/match/inbox-card";
import {
  BROWSE_LIST_LIMIT,
  BROWSE_PROFILE_SELECT,
  BROWSE_PROFILE_SELECT_STAR,
  loadBrowsePhotoMap,
} from "@/lib/match/browse-query";
import { formatIstDate, parseInstant } from "@/lib/time/ist";
import { yearsFromDob } from "@/lib/profile/completeness";
import { loadFaithCatalog } from "@/lib/profile/load-form-lists";
import { formatHeightImperial, matchSelfFromProfile } from "@/lib/profile/match-compare";
import { isPublicProfileStatus, oppositeType, type ProfileType } from "@/lib/profile/visibility";
import { displayFirstName, profileKindLabel } from "@/lib/profile/options";
import { fetchAdminUserIds } from "@/lib/desk/admin-ids";
import { createServiceClient } from "@/lib/supabase/server";

function nestedName(value: unknown): string | null {
  if (Array.isArray(value) && value[0] && typeof value[0] === "object" && value[0] && "name" in value[0]) {
    return String((value[0] as { name: unknown }).name);
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return null;
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function viewedWhen(iso: string | null | undefined): string {
  const at = parseInstant(iso);
  if (!at) return "Viewed";
  return `Viewed ${formatIstDate(at, false)}`;
}

function cardFromRow(row: Record<string, unknown>, photoMap: Map<string, string>, now: number): BrowseCardNote {
  const community = nestedName(row.communities);
  const age = typeof row.date_of_birth === "string" ? yearsFromDob(row.date_of_birth) : null;
  const height = typeof row.height_cm === "number" ? formatHeightImperial(row.height_cm) : null;
  return {
    id: String(row.id),
    href: `/browse/${row.id}`,
    name: displayFirstName(typeof row.subject_full_name === "string" ? row.subject_full_name : "Profile"),
    photoUrl: publicMediaUrl(photoMap.get(String(row.id))),
    lastOnline: inboxLastOnline(
      Boolean(row.hide_last_seen),
      typeof row.last_seen_at === "string" ? row.last_seen_at : null,
      now,
      typeof row.status === "string" ? row.status : "active",
    ),
    age: age != null ? `${age} yrs` : null,
    height,
    religion: nestedName(row.religions),
    community,
    city: asText(row.current_city),
    state: asText(row.current_state) || asText(row.native_state),
    education: asText(row.qualification),
    occupation: asText(row.occupation),
    date_of_birth: asText(row.date_of_birth),
    current_country: asText(row.current_country),
    diet: asText(row.diet),
    income_band: asText(row.income_band),
    score: null,
  };
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    page?: string;
    view?: string;
    age_min?: string;
    age_max?: string;
    country?: string;
    state?: string;
    city?: string;
    religion?: string;
    community?: string;
    lifestyle?: string;
    education?: string;
    income?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = parseBrowseFilters(params);
  const view = parseBrowseView(params.view);
  const { error } = params;
  const { supabase, user } = await getAuth();
  const faithPromise = loadFaithCatalog();

  let notice: string | null = null;
  let lookingFor: string | null = null;
  const catalog: Record<string, BrowseCardNote> = {};
  const lists = emptyBrowseBuckets<BrowseScoreRow>();
  const viewNotes: Partial<Record<BrowseView, string>> = {};

  if (!supabase || !user) {
    notice = "Sign in and create a profile to search families.";
  } else {
    const me = await ensureAppUser(supabase, user);
    if (!me?.active_profile_id) {
      notice = "Create a profile first, then search.";
    } else {
      const db = supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, value: string) => {
              maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
              neq: (col: string, value: string) => {
                order: (
                  col: string,
                  opts: { ascending: boolean },
                ) => {
                  limit: (n: number) => Promise<{
                    data: Record<string, unknown>[] | null;
                    error: { message?: string } | null;
                  }> & {
                    eq: (
                      col: string,
                      value: string,
                    ) => Promise<{ data: Record<string, unknown>[] | null; error: { message?: string } | null }>;
                  };
                };
              };
              in: (
                col: string,
                values: string[],
              ) => Promise<{ data: Record<string, unknown>[] | null; error: { message?: string } | null }>;
              order: (
                col: string,
                opts: { ascending: boolean },
              ) => {
                limit: (n: number) => Promise<{
                  data: { viewer_profile_id: string; viewed_profile_id: string; viewed_at: string }[] | null;
                }>;
              };
            };
          };
        };
      };
      const mineSlim = await db.from("profiles").select(BROWSE_PROFILE_SELECT).eq("id", me.active_profile_id).maybeSingle();
      const mine =
        mineSlim.data ??
        (await db.from("profiles").select(BROWSE_PROFILE_SELECT_STAR).eq("id", me.active_profile_id).maybeSingle())
          .data;
      if (!isPublicProfileStatus(mine?.status as string | undefined)) {
        notice = "Hidden or inactive profiles cannot search other families.";
      } else if (mine) {
        const want =
          mine.profile_type === "vadhu" || mine.profile_type === "vara"
            ? oppositeType(mine.profile_type as ProfileType)
            : null;
        lookingFor = want ? profileKindLabel(want) : null;
        const mediaClient = createServiceClient() ?? supabase;
        const mineId = String(mine.id);
        const listQuery = async (cols: string) => {
          const query = db
            .from("profiles")
            .select(cols)
            .eq("status", "active")
            .neq("id", mineId)
            .order("updated_at", { ascending: false })
            .limit(BROWSE_LIST_LIMIT);
          const result = want ? await query.eq("profile_type", want) : await query;
          return result as { data: Record<string, unknown>[] | null; error: { message?: string } | null };
        };
        const viewCols = "viewer_profile_id, viewed_profile_id, viewed_at";
        const viewedYouPromise = db
          .from("profile_views")
          .select(viewCols)
          .eq("viewed_profile_id", mineId)
          .order("viewed_at", { ascending: false })
          .limit(40);
        const youViewedPromise = db
          .from("profile_views")
          .select(viewCols)
          .eq("viewer_profile_id", mineId)
          .order("viewed_at", { ascending: false })
          .limit(40);
        const adminPromise =
          me.role === "admin" ? Promise.resolve(new Set<string>()) : fetchAdminUserIds(mediaClient as never);
        const listResult = await listQuery(BROWSE_PROFILE_SELECT);
        const listData = listResult.error ? await listQuery(BROWSE_PROFILE_SELECT_STAR) : listResult;
        const viewedYou = await viewedYouPromise;
        const youViewed = await youViewedPromise;
        const adminIds = await adminPromise;
        if (listData.error) {
          notice = "Matches could not load just now. Please try again shortly.";
        } else {
          const rows = listData.data ?? [];
          const listedIds = new Set(rows.map((row) => String(row.id)));
          const myPlace = { city: asText(mine.current_city), state: asText(mine.current_state) };
          const myCommunity = nestedName(mine.communities);
          if (!myPlace.city) {
            viewNotes.nearby = "Add your current city on the profile to see families within 100 km.";
          }
          if (!myCommunity) {
            viewNotes.community = "Add your community on the profile to use this list.";
          }
          const viewRows = [...(viewedYou.data ?? []), ...(youViewed.data ?? [])];
          const extraIds = new Set<string>();
          for (const visit of viewRows) {
            const other =
              visit.viewer_profile_id === mineId ? visit.viewed_profile_id : visit.viewer_profile_id;
            if (other && other !== mineId && !listedIds.has(other)) extraIds.add(other);
          }
          let extra: Record<string, unknown>[] = [];
          if (extraIds.size) {
            const extraQuery = (cols: string) =>
              db.from("profiles").select(cols).eq("status", "active").in("id", [...extraIds]);
            const extraSlim = await extraQuery(BROWSE_PROFILE_SELECT);
            extra = ((extraSlim.error ? await extraQuery(BROWSE_PROFILE_SELECT_STAR) : extraSlim).data ??
              []) as unknown as Record<string, unknown>[];
          }
          const keepHouse = (row: Record<string, unknown>) =>
            me.role === "admin" || String(row.created_by) === me.id || !adminIds.has(String(row.created_by));
          const listed = rows.filter(keepHouse);
          extra = extra.filter(keepHouse);
          const allRows = [...listed, ...extra];
          const photoMap = await loadBrowsePhotoMap(
            mediaClient,
            allRows.map((row) => String(row.id)),
          );
          const now = Date.now();
          const mySelf = matchSelfFromProfile(mine, {
            religion: nestedName(mine.religions),
            community: myCommunity,
          });
          for (const row of listed) {
            const community = nestedName(row.communities);
            const theirSelf = matchSelfFromProfile(row, {
              religion: nestedName(row.religions),
              community,
            });
            const card = cardFromRow(row, photoMap, now);
            catalog[card.id] = card;
            lists.custom.push({ id: card.id, score: null });
            const km = kmApart(myPlace, { city: card.city, state: card.state });
            if (km != null && km <= 100) lists.nearby.push({ id: card.id, score: nearbyLabel(km) });
            if (sameCommunity(myCommunity, community)) {
              lists.community.push({ id: card.id, score: community ?? "Same community" });
            }
            (["fits", "prefers", "kundali"] as const).forEach((key) => {
              const rank = browseRank(key, mine, row, mySelf, theirSelf);
              if (!rank.pass) return;
              lists[key].push({ id: card.id, score: rank.label });
            });
          }
          for (const row of extra) {
            const card = cardFromRow(row, photoMap, now);
            catalog[card.id] = card;
          }
          for (const visit of viewRows) {
            if (visit.viewed_profile_id === mineId && catalog[visit.viewer_profile_id]) {
              lists.viewed_you.push({ id: visit.viewer_profile_id, score: viewedWhen(visit.viewed_at) });
            }
            if (visit.viewer_profile_id === mineId && catalog[visit.viewed_profile_id]) {
              lists.you_viewed.push({ id: visit.viewed_profile_id, score: viewedWhen(visit.viewed_at) });
            }
          }
          (["fits", "prefers", "kundali"] as BrowseView[]).forEach((key) => {
            lists[key].sort((a, b) => Number.parseInt(b.score ?? "0", 10) - Number.parseInt(a.score ?? "0", 10));
          });
          lists.nearby.sort((a, b) => {
            const ka = a.score === "Same city" ? 0 : Number.parseInt(a.score ?? "999", 10);
            const kb = b.score === "Same city" ? 0 : Number.parseInt(b.score ?? "999", 10);
            return ka - kb;
          });
        }
      }
    }
  }

  const faith = await faithPromise;

  return (
    <PageShell>
      <BrowseClient
        lookingFor={lookingFor}
        notice={notice}
        user={Boolean(user)}
        error={error}
        initialView={view}
        initialFilters={filters}
        catalog={catalog}
        lists={lists}
        viewNotes={viewNotes}
        religions={[...new Set(faith.religions.map((row) => row.name).filter(Boolean))]}
        communities={[...new Set(faith.communities.map((row) => row.name).filter(Boolean))]}
      />
    </PageShell>
  );
}
