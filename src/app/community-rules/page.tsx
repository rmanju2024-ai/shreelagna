import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Community Rules", description: "Safety and conduct rules for Shree Lagna Matrimony." };

export default function CommunityRulesPage() {
  return <LegalPage
    kicker="Sambandha with respect"
    title="Community Rules"
    summary="A private place for serious introductions—kind, clear, and safe for every member."
    sections={[
      { title: "Be real and respectful", body: ["Represent yourself honestly. Treat every member, family, and staff member with dignity regardless of religion, community, caste, gender, disability, region, language, or background.", "Ask before moving a conversation off-platform or requesting personal contact details. Respect a no, a block, and another member’s privacy choices."] },
      { title: "Never do these things", body: ["Do not ask for money, financial credentials, OTPs, intimate images, identity documents, or travel arrangements. Do not threaten, stalk, shame, harass, manipulate, advertise, or use the platform for unrelated business.", "Do not share another person’s photos, profile, messages, or personal data outside the service without their permission."] },
      { title: "Keep introductions safe", body: ["Use chat and interest tools thoughtfully. Meet only when you feel comfortable; choose public places, tell someone you trust, and arrange your own transport. Stop contact if anything feels wrong.", "Report concerning behaviour and block the member. In an immediate emergency, call local emergency services."] },
      { title: "What happens after a report", body: ["We review reports and may restrict content, hide profiles, suspend accounts, or take other proportionate action. We may not be able to disclose the outcome in detail, but we take safety reports seriously."] },
    ]}
  />;
}
