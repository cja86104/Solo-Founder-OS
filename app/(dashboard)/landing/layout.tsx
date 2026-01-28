import { LandingNav } from "@/components/landing/landing-nav";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="space-y-6">
      <LandingNav />
      {children}
    </div>
  );
}
