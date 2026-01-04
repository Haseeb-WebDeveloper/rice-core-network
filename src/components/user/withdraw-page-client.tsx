"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WithdrawFormModal } from "./withdraw-form-modal";
import { Plus, Wallet } from "lucide-react";

type WithdrawPageClientProps = {
  availableBalance: number;
};

export function WithdrawPageClient({ availableBalance }: WithdrawPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Available Balance
              </p>
              <p className="text-3xl font-bold mt-1">
                ${availableBalance.toFixed(2)}
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={availableBalance < 5}
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Withdrawal
            </Button>
          </div>
          {availableBalance < 5 && (
            <p className="text-sm text-muted-foreground mt-4">
              Minimum withdrawal amount is $5.00
            </p>
          )}
        </CardContent>
      </Card>

      <WithdrawFormModal
        availableBalance={availableBalance}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}

