import "./globals.css";
import Header from "@/components/Header";
import PinnedToolsBar from "@/components/PinnedToolsBar";
import { LanguageProvider } from "@/lib/i18nContext";

export const metadata = {
  title: "Pro PDF Toolkit",
  description: "Fast PDF and document tools: merge, split, compress, convert.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <LanguageProvider>
          <PinnedToolsBar />
          <Header />
          <div className="flex-1">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
