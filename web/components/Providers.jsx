"use client";
import { I18nProvider } from "@/components/I18nProvider";

export default function Providers({ children }) {
  return <I18nProvider>{children}</I18nProvider>;
}
