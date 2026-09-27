type DbError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
} | null | undefined;

export function errorHaystack(error: DbError): string {
  if (!error) return "";
  return [error.code, error.message, error.details, error.hint].filter(Boolean).join(" ").toLowerCase();
}

export function isMissingColumnError(error: DbError, column: string): boolean {
  const hay = errorHaystack(error);
  if (!hay) return false;
  return (
    hay.includes(column.toLowerCase()) ||
    hay.includes("schema cache") ||
    error?.code === "PGRST204" ||
    error?.code === "42703"
  );
}

/** Column in `payload` that PostgREST/Postgres says is missing. */
export function missingPayloadColumn(
  error: DbError,
  payload: Record<string, unknown>,
): string | null {
  if (!error) return null;
  const hay = errorHaystack(error);
  const quoted =
    hay.match(/'([a-z_]+)' column/) ??
    hay.match(/column "([a-z_]+)"/) ??
    hay.match(/could not find the '([a-z_]+)' column/);
  if (quoted?.[1] && quoted[1] in payload) return quoted[1];
  const details = String(error.details ?? "").trim().toLowerCase();
  if (details && details in payload) return details;
  if (error.code === "PGRST204" || error.code === "42703" || hay.includes("schema cache") || hay.includes("does not exist")) {
    for (const key of Object.keys(payload)) {
      if (hay.includes(key.toLowerCase())) return key;
    }
  }
  return null;
}

export function isUniqueViolation(error: DbError): boolean {
  const hay = errorHaystack(error);
  return error?.code === "23505" || hay.includes("duplicate") || hay.includes("unique");
}

export function saveErrorMessage(error: DbError): string {
  const hay = errorHaystack(error);
  if (!hay) return "We could not save just now. Please try again.";
  if (hay.includes("21") || hay.includes("age_adult") || hay.includes("date_of_birth")) {
    return "The bride or groom must be 21 or older.";
  }
  if (hay.includes("row-level security") || hay.includes("42501") || hay.includes("permission denied")) {
    return "The profile could not be saved just now. Please try Save again.";
  }
  if (hay.includes("about") || hay.includes("profiles_about_len")) {
    return "The about section must stay within the character limit.";
  }
  if (hay.includes("religion") || hay.includes("community")) {
    return "Pick a religion from the list, or keep prefer not to share community.";
  }
  if (hay.includes("creator_relationship") || hay.includes("invalid input value")) {
    return "Choose who is registering, then save again.";
  }
  if (
    hay.includes("one profile") ||
    hay.includes("duplicate") ||
    hay.includes("23505") ||
    hay.includes("profiles_one_per_account")
  ) {
    return "This email already has a profile. Open it to update details.";
  }
  return "We could not save just now. Please try again.";
}
