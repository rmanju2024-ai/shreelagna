export type ProfileType = "vadhu" | "vara";

export function oppositeType(type: ProfileType): ProfileType {
  return type === "vadhu" ? "vara" : "vadhu";
}

export function isPublicProfileStatus(status: string | null | undefined): boolean {
  return status === "active";
}

export function canViewProfile(args: {
  viewerType: ProfileType | null;
  viewerStatus?: string | null;
  targetType: ProfileType;
  targetStatus: string;
  isOwner: boolean;
  isStaff: boolean;
  linkedByInterest?: boolean;
  targetOwnerIsAdmin?: boolean;
  viewerIsAdmin?: boolean;
}): boolean {
  if (args.isOwner) return true;
  if (args.targetOwnerIsAdmin && !args.viewerIsAdmin) return false;
  if (args.isStaff) return true;
  if (!isPublicProfileStatus(args.targetStatus)) return false;
  if (args.linkedByInterest) return true;
  if (args.viewerStatus != null && !isPublicProfileStatus(args.viewerStatus)) return false;
  if (!args.viewerType) return false;
  return args.targetType === oppositeType(args.viewerType);
}
