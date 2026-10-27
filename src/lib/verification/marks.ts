export const VERIFY_DOC_KINDS = [
  { id: "identity", label: "Identity" },
] as const;

export type VerifyMark = { id: string; label: string; on: boolean; optional?: boolean };

export function verificationMarks(input: {
  mobile: boolean;
  email: boolean;
  cases?: Array<{ document_type?: string | null; status?: string | null } | null> | null;
}): VerifyMark[] {
  const approved = new Set(
    (input.cases ?? [])
      .filter((row) => row?.status === "approved" && row.document_type)
      .map((row) => String(row!.document_type)),
  );
  return [
    { id: "mobile", label: "Mobile", on: Boolean(input.mobile) },
    { id: "email", label: "Email", on: Boolean(input.email) },
    ...VERIFY_DOC_KINDS.map((kind) => ({
      id: kind.id,
      label: kind.label,
      on: approved.has(kind.id),
      optional: true,
    })),
  ];
}

/** Identity document check is optional — hide it on public profiles until approved. */
export function visibleVerificationMarks(marks: VerifyMark[], own: boolean): VerifyMark[] {
  if (own) return marks;
  return marks.filter((item) => item.on || !item.optional);
}
