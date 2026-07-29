"use client";

import React from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import Logo from "@/components/marketing/logo";
import { brand, footer } from "@/lib/marketing/content";
import { scrollToId } from "@/lib/marketing/motion";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.07] bg-[#0A0A0A] pb-10 pt-16 sm:pt-20">
      <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-[#A8A8A8]">{brand.tagline}</p>
            <button
              type="button"
              onClick={() => scrollToId("top")}
              className="group mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.26em] text-[#A8A8A8] transition-colors hover:text-[#f97316]"
            >
              <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
              Back to the top
            </button>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#f97316]">{col.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("#") ? (
                        /* Same-page anchor: a real href so it works without JS
                           and survives copy-link, with scrollToId only taking
                           over the scroll behaviour. */
                        <a
                          href={link.href}
                          onClick={(event) => {
                            event.preventDefault();
                            scrollToId(link.href);
                          }}
                          className="text-[14px] text-[#A8A8A8] transition-colors duration-300 hover:text-[#F5F5F0]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[14px] text-[#A8A8A8] transition-colors duration-300 hover:text-[#F5F5F0]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-[#5f5f5f]">
            © {year} {brand.name}. All rights reserved.
          </p>
          <p className="font-mono text-[11px] text-[#5f5f5f]">
            {brand.builtOn}{" "}
            <a
              href={brand.creditHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A8A8A8] transition-colors duration-300 hover:text-[#f97316]"
            >
              {brand.creditLabel}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
