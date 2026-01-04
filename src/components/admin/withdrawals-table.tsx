"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { WithdrawalProcessModal } from "./withdrawal-process-modal";

type PendingWithdrawal = {
  id: string;
  amount: number;
  walletId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  proofUrl: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatar: string | null;
  };
};

type WithdrawalsTableProps = {
  withdrawals: PendingWithdrawal[];
};

export function WithdrawalsTable({ withdrawals }: WithdrawalsTableProps) {
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<PendingWithdrawal | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateWallet = (wallet: string | null) => {
    if (!wallet) return "N/A";
    if (wallet.length <= 25) return wallet;
    return `${wallet.slice(0, 12)}...${wallet.slice(-12)}`;
  };

  if (withdrawals.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full overflow-x-auto rounded-lg border border-border bg-background @container/main container">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Wallet Address</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{withdrawal.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {withdrawal.user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  ${withdrawal.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <code className="font-mono text-xs">
                    {truncateWallet(withdrawal.walletId)}
                  </code>
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(withdrawal.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatTime(withdrawal.createdAt)}
                </TableCell>
                <TableCell>
                  {withdrawal.proofUrl ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      Processed
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWithdrawal(withdrawal)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedWithdrawal && (
        <WithdrawalProcessModal
          withdrawal={selectedWithdrawal}
          open={!!selectedWithdrawal}
          onOpenChange={(open) => !open && setSelectedWithdrawal(null)}
        />
      )}
    </>
  );
}
