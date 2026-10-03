import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Verification Standard", description: "How Shree Lagna handles profile verification requests." };

export default function VerificationPage() {
  return <LegalPage
    kicker="Trust without shortcuts"
    title="Verification Standard"
    summary="A badge is shown only after the relevant check is completed. A submitted document is never public."
    sections={[
      { title: "What we may review", body: ["Identity: government-issued photo identification used only to compare name and age. Education: a degree, marksheet, or institution record. Employment: a current employer letter, work ID, or official work email confirmation.", "We do not ask for Aadhaar, PAN, bank statements, passwords, OTPs, or any document that exposes financial or authentication information."] },
      { title: "Who can review", body: ["Only authorised Shree Lagna administrators may approve or reject a document-based verification case. General support staff can assist with a request but cannot issue an identity, education, or employment approval.", "Review decisions, reviewer identity, timestamps, and reason notes are recorded in the internal audit trail."] },
      { title: "Retention and re-checks", body: ["Verification evidence must be held in private access-controlled storage only for the review purpose and deleted within 90 days. The verification outcome may remain as a minimal audit record after the evidence is deleted.", "Identity, education, and employment checks are re-checked every 24 months, or earlier if a member updates the relevant profile detail or a safety concern is raised."] },
      { title: "If a request is rejected", body: ["We provide a reason where it is safe and appropriate. A member can submit one appeal with corrected information or replacement evidence. An administrator who did not make the original decision should review the appeal where practical.", "A verification outcome is not a background check, guarantee, endorsement, or promise about a person’s conduct or compatibility."] },
    ]}
  />;
}
