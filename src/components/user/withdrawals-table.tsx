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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, AlertCircle, Eye } from "lucide-react";
import { WithdrawalDetailModal } from "./withdrawal-detail-modal";

type Withdrawal = {
  id: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  walletId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  proofUrl: string | null;
};

type WithdrawalsTableProps = {
  withdrawals: Withdrawal[];
};

export function WithdrawalsTable({ withdrawals }: WithdrawalsTableProps) {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewDetails = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: Withdrawal["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="default" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
    if (wallet.length <= 20) return wallet;
    return `${wallet.slice(0, 10)}...${wallet.slice(-10)}`;
  };

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>Your withdrawal requests will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No withdrawals yet</p>
            <p className="text-sm mt-2">Create your first withdrawal request to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal History</CardTitle>
        <CardDescription>
          View all your withdrawal requests and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Wallet Address</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell className="font-semibold">
                  ${withdrawal.amount.toFixed(2)}
                </TableCell>
                <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {truncateWallet(withdrawal.walletId)}
                </TableCell>
                <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                <TableCell>{formatTime(withdrawal.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(withdrawal)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <WithdrawalDetailModal
        withdrawal={selectedWithdrawal}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </Card>
  );
}

