import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display, Source_Serif_4 } from "next/font/google";
import { ChromeLayout } from "@/components/chrome-layout";
import { WebVitals } from "@/components/web-vitals";
import { Butterflies } from "@/components/butterflies";
import "./globals.css";
import "./search-modern.css";
import "./theme-genz.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-british",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shree Lagna Matrimony",
    template: "%s · Shree Lagna",
  },
  description:
    "A private Indian matrimonial house for families.",
  applicationName: "Shree Lagna",
  appleWebApp: {
    capable: true,
    title: "Shree Lagna",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4eadc",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${sourceSerif.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-dvh w-full overflow-x-clip">
        <ChromeLayout>{children}</ChromeLayout>
        <Butterflies />
        <WebVitals />
      </body>
    </html>
  );
}
