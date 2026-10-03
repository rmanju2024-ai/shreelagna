export const DELETE_PROFILE_WORD = "DELETE";

export function hasDeleteConfirmation(value: unknown) {
  return typeof value === "string" && value.trim().toUpperCase() === DELETE_PROFILE_WORD;
}
