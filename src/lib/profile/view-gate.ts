export function otherProfileLocked(args: {
  own: boolean;
  needComplete?: boolean;
  needPlan?: boolean;
}): boolean {
  return !args.own && Boolean(args.needComplete || args.needPlan);
}
