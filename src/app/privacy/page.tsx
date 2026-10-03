import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy", description: "How Shree Lagna Matrimony handles member information." };

export default function PrivacyPage() {
  return <LegalPage
    kicker="Your details, your control"
    title="Privacy Policy"
    summary="We collect only what helps operate introductions, keep members safe, and improve the service."
    sections={[
      { title: "Information we collect", body: ["We collect account details, profile information, photos or videos you choose to upload, preferences, messages, support requests, safety reports, and basic technical information needed to operate and secure the service.", "Some profile fields may be sensitive. Do not upload identity, financial, medical, or other documents unless Shree Lagna specifically asks through a defined verification flow."] },
      { title: "How we use it", body: ["We use information to create and show profiles, suggest relevant matches, enable interests and chat, apply your privacy settings, respond to support requests, prevent abuse, and meet legal obligations.", "We do not sell your personal data. We do not display private contact details unless your settings and the relevant interaction allow it."] },
      { title: "Who can see it", body: ["Other members can see only the fields, photos, and contact details you permit through your profile privacy controls. Staff access is limited to what is needed to operate support, moderation, safety, and administration.", "Service providers may process limited information for hosting, authentication, storage, email, security, or support under appropriate safeguards."] },
      { title: "Your choices", body: ["You can update profile visibility and privacy settings, block members, report concerns, and request account deletion. Some records may be retained where necessary for security, fraud prevention, disputes, or legal compliance.", "For privacy questions or deletion help, use the Support Centre and select the privacy or account option."] },
      { title: "Security", body: ["We use reasonable technical and organisational safeguards, but no online service can guarantee absolute security. Keep your sign-in secure and report suspected account misuse promptly."] },
    ]}
  />;
}
