"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

/**
 * Help drawer — a side-drawer overlay that loads the full user manual in
 * an iframe. The manual is served as a static HTML file from
 * /public/USER-MANUAL.html so its own styling (gradient hero, TOC,
 * anchored sections) is preserved.
 *
 * Architecture: the drawer's open/closed state lives in a small React
 * context so multiple triggers can share a single drawer instance — the
 * "?" button in the header and the Operations Manual button in the
 * sidebar both call openHelp() from the same context, opening the same
 * iframe (rather than spawning a second one).
 *
 * Width: full on mobile, ~70/60/50 vw on tablet/desktop/widescreen,
 * capped at 960px on huge displays for comfortable reading.
 */

interface HelpDrawerContextValue {
  isOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
}

const HelpDrawerContext = createContext<HelpDrawerContextValue | null>(null);

export function HelpDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openHelp = useCallback(() => setIsOpen(true), []);
  const closeHelp = useCallback(() => setIsOpen(false), []);

  const value = useMemo<HelpDrawerContextValue>(
    () => ({ isOpen, openHelp, closeHelp }),
    [isOpen, openHelp, closeHelp]
  );

  return (
    <HelpDrawerContext.Provider value={value}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="flex flex-col gap-0 p-0 w-full sm:max-w-none sm:w-[70vw] lg:w-[60vw] xl:w-[50vw] 2xl:max-w-[960px]"
        >
          <SheetHeader className="px-6 py-4 border-b flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="min-w-0 flex-1 pr-8">
              <SheetTitle className="text-lg">
                Operations Manual
              </SheetTitle>
              <SheetDescription className="text-xs">
                Complete reference for every feature. Click any section in
                the table of contents to jump to it.
              </SheetDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="shrink-0 mr-8"
              title="Open the manual in a new tab"
            >
              <a
                href="/USER-MANUAL.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open in new tab
              </a>
            </Button>
          </SheetHeader>
          <div className="flex-1 min-h-0 bg-background">
            <iframe
              src="/USER-MANUAL.html"
              title="Founders Helm Operations Manual"
              className="h-full w-full border-0"
            />
          </div>
        </SheetContent>
      </Sheet>
    </HelpDrawerContext.Provider>
  );
}

export function useHelpDrawer(): HelpDrawerContextValue {
  const ctx = useContext(HelpDrawerContext);
  if (!ctx) {
    throw new Error(
      "useHelpDrawer must be used within a HelpDrawerProvider"
    );
  }
  return ctx;
}

/**
 * Header trigger — the "?" icon next to the theme toggle. Compact icon
 * button suitable for the dense header row.
 */
export function HelpDrawerHeaderTrigger() {
  const { openHelp } = useHelpDrawer();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openHelp}
      aria-label="Open operations manual"
      title="Operations Manual"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}
