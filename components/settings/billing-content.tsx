"use client";

import { Check, Sparkles, Crown, Zap } from "lucide-react";
import type { Subscription } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BillingContentProps {
  subscription: Subscription | null;
}

const planDetails: Record<string, {
  name: string;
  icon: typeof Sparkles;
  color: string;
  badgeClass: string;
  borderClass: string;
  description: string;
}> = {
  free: {
    name: "Free",
    icon: Zap,
    color: "text-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    borderClass: "border-blue-500/30",
    description: "Get started with essential tools for your business",
  },
  pro: {
    name: "Pro",
    icon: Sparkles,
    color: "text-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    borderClass: "border-primary/50",
    description: "Everything you need to grow your business",
  },
  lifetime: {
    name: "Lifetime",
    icon: Crown,
    color: "text-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    borderClass: "border-amber-500/50",
    description: "Unlimited access forever with a one-time payment",
  },
};

const planFeatures: Record<string, string[]> = {
  free: [
    "3 Landing Pages",
    "100 Contacts",
    "1,000 Page Views/mo",
    "5 Vault Items",
    "Community Support",
  ],
  pro: [
    "Unlimited Landing Pages",
    "10,000 Contacts",
    "100,000 Page Views/mo",
    "Unlimited Vault Items",
    "5 Team Members",
    "Priority Support",
    "Custom Domain",
    "Advanced Analytics",
    "AI Advisor",
    "Content Engine",
    "All Future Updates",
  ],
  lifetime: [
    "Everything in Pro",
    "Unlimited Team Members",
    "Unlimited Everything",
    "Priority Support Forever",
    "All Future Updates",
  ],
};

export function BillingContent({ subscription }: BillingContentProps) {
  const currentPlan = subscription?.plan || "free";
  const details = planDetails[currentPlan] || planDetails.free;
  const features = planFeatures[currentPlan] || planFeatures.free;
  const Icon = details.icon;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className={`border-2 ${details.borderClass}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${details.color}`} />
            {details.name} Plan
            <Badge variant="outline" className={details.badgeClass}>
              {subscription?.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
          <CardDescription>{details.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className={`h-4 w-4 ${details.color} flex-shrink-0`} />
                {feature}
              </div>
            ))}
          </div>

          {currentPlan === "free" && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade to Pro to unlock all features and grow your business.
              </p>
              <Button asChild>
                <a href="/settings/billing">View Upgrade Options</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
