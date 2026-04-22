"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200/50 bg-white/50 backdrop-blur-sm mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Pro PDF Toolkit</p>
          <nav className="flex items-center gap-6">
            <Link href="/" className="hover:text-indigo-600 transition-colors duration-200">About</Link>
            <Link href="/" className="hover:text-indigo-600 transition-colors duration-200">Privacy</Link>
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors duration-200">GitHub</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
