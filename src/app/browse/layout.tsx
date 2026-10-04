import { ChromeLayout } from "@/components/chrome-layout";

export default function BrowseLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <ChromeLayout>
      {children}
      {modal}
    </ChromeLayout>
  );
}
