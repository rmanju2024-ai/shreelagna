import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Use", description: "Terms for using Shree Lagna Matrimony." };

export default function TermsPage() {
  return <LegalPage
    kicker="Clear rules, calmer journeys"
    title="Terms of Use"
    summary="The simple agreement for using Shree Lagna Matrimony respectfully and safely."
    sections={[
      { title: "Who can use Shree Lagna", body: ["You must be 18 or older and legally able to marry under applicable law. Create a profile only for yourself or with the clear consent of the person whose profile you manage.", "Use accurate information. Do not impersonate anyone, create duplicate accounts, or use the service for commercial, unlawful, or deceptive purposes."] },
      { title: "Your profile and interactions", body: ["You control what you share, but you are responsible for the information, photos, video, messages, and documents you submit. We may limit, hide, suspend, or remove content or accounts that break these terms or create a safety risk.", "A match, interest, message, trust tier, or profile visibility is not a promise of compatibility, identity, background, marriage, or conduct. Please make your own careful decisions."] },
      { title: "Respectful use", body: ["Follow our Community Rules. Do not harass, threaten, discriminate, scam, solicit money, send sexual content without consent, scrape data, or try to bypass privacy controls.", "Use the report and block tools if an interaction feels unsafe. For urgent danger, contact local emergency services rather than relying on this website."] },
      { title: "Service and changes", body: ["We may improve, change, pause, or discontinue features to protect members and operate the service. We will make reasonable efforts to communicate material changes through the service where appropriate.", "These terms are governed by applicable Indian law. Nothing here removes rights that cannot legally be excluded."] },
    ]}
  />;
}
