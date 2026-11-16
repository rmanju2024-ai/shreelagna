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

/** Full bio, family, kundali and partner preference — not the name, age, city intro. */
export function detailsVisible(input: {
  own?: boolean;
  staff?: boolean;
  hideUntilAccept?: boolean | null;
  accepted?: boolean;
}): boolean {
  if (input.own || input.staff) return true;
  if (input.accepted) return true;
  return input.hideUntilAccept === false;
}
