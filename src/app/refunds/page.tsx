import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Refund Policy", description: "MarriageConnect subscription fees are not refunded." };

export default function RefundsPage() {
  return <LegalPage
    kicker="Read this before you pay"
    title="Refund Policy"
    summary="Subscription fees are not refunded. The fee is kept small. Think carefully before you take a plan."
    sections={[
      { title: "No refunds", body: ["A plan fee, once paid, is not refunded. This includes a change of mind, unused days, fewer contacts than you expected, a match that did not proceed, or closing your profile before the plan ends.", "The subscription fee is kept minimal so a family can begin without a heavy payment. Because the fee is already small, we do not offer refunds, partial refunds, or credits."] },
      { title: "Think before you avail the service", body: ["Read the plan, the number of families you may contact, the daily limit, and the end date before you pay. Take the plan only if you intend to use it.", "A welcome or complimentary period, where offered, is not a paid subscription and does not create a refund."] },
      { title: "What we can still help with", body: ["If a payment failed but money left your account, or the same plan was charged twice by mistake, write to the Support Centre with the account email, payment date, plan name, and transaction reference. We will look into a duplicate or failed charge. That review is not a refund of a successful subscription.", "Do not post payment details in chat or on a public profile."] },
    ]}
  />;
}
