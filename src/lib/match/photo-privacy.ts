export function photosVisible(input: {
  own?: boolean;
  staff?: boolean;
  hideUntilAccept?: boolean | null;
  accepted?: boolean;
  interestReceived?: boolean;
}): boolean {
  if (input.own || input.staff) return true;
  if (input.accepted || input.interestReceived) return true;
  return input.hideUntilAccept === false;
}
