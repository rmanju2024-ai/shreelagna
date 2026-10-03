import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Refund Policy", description: "Refund terms for Shree Lagna Matrimony plans." };

export default function RefundsPage() {
  return <LegalPage
    kicker="Straight answers on plans"
    title="Refund Policy"
    summary="This policy will apply when paid subscriptions are introduced. Free access does not require a refund."
    sections={[
      { title: "Before paid plans launch", body: ["Shree Lagna is currently offering free access. No subscription payment is being collected through the service, so there is no paid-plan refund process at this time."] },
      { title: "When subscriptions begin", body: ["Before accepting a payment, we will show the plan price, duration, included features, renewal terms, cancellation method, and applicable refund conditions. The version of this policy available at checkout will apply to that purchase.", "We will not silently convert free access into a paid plan. Any paid renewal or recurring charge will require clear member consent."] },
      { title: "How to ask for help", body: ["If a payment issue occurs after paid plans launch, contact the Support Centre with the account email, payment date, plan name, and transaction reference. Do not post payment details in chat or public profile fields."] },
    ]}
  />;
}
