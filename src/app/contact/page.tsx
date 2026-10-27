import { redirect } from "next/navigation";

/**
 * /contact is now part of the combined About & Help page.
 * Redirect permanently so old links, bookmarks, and nav entries still work.
 */
export default function ContactPage() {
  redirect("/about?tab=help");
}
