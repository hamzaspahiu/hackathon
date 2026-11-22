import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
export const metadata = {
  title: "Flag Frenzy — The Geography Arcade",
  description:
    "One globe. Hundreds of flags. Play the geography arcade: identify flags, beat the clock, and draw the world from memory.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};
export const viewport = {
  colorScheme: "light dark",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1e9" },
    { media: "(prefers-color-scheme: dark)", color: "#17231f" },
  ],
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
