"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { FoundersHelmIcon } from "@/components/founders-helm-icon";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ",     href: "#faq"     },
];

export function MarketingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-[#1A0E06]/90 backdrop-blur-xl border-b border-[rgba(196,168,130,0.12)]"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-[#C75B1A] flex items-center justify-center shadow-lg shadow-orange-900/30 group-hover:shadow-orange-900/50 transition-shadow">
                <FoundersHelmIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-[#F2EAD8]">
              Founders <span className="text-[#C75B1A]">Helm</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-[#A89070] hover:text-[#F2EAD8] transition-colors rounded-lg hover:bg-white/5"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[#A89070] hover:text-[#F2EAD8] transition-colors rounded-lg hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C75B1A] text-[#F2EAD8] text-sm font-semibold hover:bg-[#B34E16] transition-colors shadow-lg shadow-orange-900/30"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-[#A89070] hover:text-[#F2EAD8] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#1A0E06]/95 backdrop-blur-xl border-b border-[rgba(196,168,130,0.12)]">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-3 text-base font-medium text-[#A89070] hover:text-[#F2EAD8] hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 space-y-2 border-t border-[rgba(196,168,130,0.12)]">
              <Link
                href="/login"
                className="block w-full text-center px-4 py-3 text-base font-medium text-[#A89070] hover:text-[#F2EAD8] hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block w-full text-center px-4 py-3 rounded-lg bg-[#C75B1A] text-[#F2EAD8] font-semibold hover:bg-[#B34E16] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
