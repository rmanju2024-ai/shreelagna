import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { EVIDENCE_RETENTION_NOTICE } from "@/lib/verification/copy";

export const metadata: Metadata = { title: "Verification Standard", description: "How MarriageConnect handles profile verification requests." };

export default function VerificationPage() {
  return <LegalPage
    kicker="Trust without shortcuts"
    title="Verification Standard"
    summary="A badge is shown only after the relevant check is completed. A submitted document is never public."
    sections={[
      { title: "What we may review", body: ["Identity only: a government-issued photo ID used to confirm name, age and date of birth. We do not collect or review education or employment documents.", "We do not ask for Aadhaar numbers in full, PAN, bank statements, passwords, OTPs, or any document that exposes financial or authentication information."] },
      { title: "Who can review", body: ["Only authorised MarriageConnect administrators may approve or reject an identity verification case. General support staff can assist with a request but cannot issue an identity approval.", "Review decisions, reviewer identity, timestamps, and reason notes are recorded in the internal audit trail."] },
      { title: "Retention and re-checks", body: [EVIDENCE_RETENTION_NOTICE, "Identity checks are re-checked every 24 months, or earlier if a member updates name or date of birth, or a safety concern is raised."] },
      { title: "If a request is rejected", body: ["We provide a reason where it is safe and appropriate. A member can submit one appeal with corrected information or replacement evidence. An administrator who did not make the original decision should review the appeal where practical.", "A verification outcome is not a background check, guarantee, endorsement, or promise about a person’s conduct or compatibility."] },
    ]}
  />;
}
