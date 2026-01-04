"use client";

import { CopyButton } from "@/components/investments/copy-button";
import { maxChar } from "@/lib/max-char";
import { Share2 } from "lucide-react";

type ReferralLinkProps = {
  referralCode: string;
};

export function ReferralLink({ referralCode }: ReferralLinkProps) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const referralUrl = `${baseUrl}/signup?ref=${referralCode}`;

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-muted-foreground">Referral Link:</span>
      <div className="flex items-center gap-2 max-w-md">
        <code className="text-sm font-mono font-semibold text-foreground leading-none truncate">
          {maxChar(referralUrl, 13)}
        </code>
        <CopyButton text={referralUrl} variant="sm" />
      </div>
    </div>
  );
}

