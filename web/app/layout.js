import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import PinnedToolsBar from "@/components/PinnedToolsBar";

export const metadata = {
  title: "Pro PDF Toolkit",
  description: "Fast PDF and document tools: merge, split, compress, convert.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Providers>
          <Header />
          <PinnedToolsBar />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
