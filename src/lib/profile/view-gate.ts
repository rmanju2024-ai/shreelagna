export function otherProfileLocked(args: {
  own: boolean;
  needComplete?: boolean;
  needPlan?: boolean;
  targetAwaitingReview?: boolean;
}): boolean {
  return !args.own && Boolean(args.needComplete || args.needPlan || args.targetAwaitingReview);
}
