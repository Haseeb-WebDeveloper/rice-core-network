"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, AlertCircle, FileImage, X, Wallet, Calendar } from "lucide-react";
import Image from "next/image";

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

type WithdrawalDetailModalProps = {
  withdrawal: Withdrawal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WithdrawalDetailModal({
  withdrawal,
  open,
  onOpenChange,
}: WithdrawalDetailModalProps) {
  const [showImageModal, setShowImageModal] = useState(false);

  if (!withdrawal) return null;

  const getStatusBadge = (status: Withdrawal["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge
            variant="default"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="default"
            className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
          >
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
            <DialogDescription>
              Complete information about this withdrawal request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Amount and Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-3xl font-bold mt-1">${withdrawal.amount.toFixed(2)}</p>
              </div>
              {getStatusBadge(withdrawal.status)}
            </div>

            {/* Wallet Address */}
            {withdrawal.walletId && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Wallet Address</p>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                  <code className="flex-1 font-mono text-sm break-all">
                    {withdrawal.walletId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(withdrawal.walletId!)}
                    className="shrink-0"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Created At</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(withdrawal.createdAt)}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Last Updated</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(withdrawal.updatedAt)}
                </p>
              </div>
            </div>

            {/* Description */}
            {/* {withdrawal.description && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                  {withdrawal.description}
                </p>
              </div>
            )} */}

            {/* Proof Image */}
            {withdrawal.proofUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Payment Proof</p>
                </div>
                <div
                  className="relative w-full h-56 rounded-lg overflow-hidden border bg-muted/50 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowImageModal(true)}
                >
                  <Image
                    src={withdrawal.proofUrl}
                    alt="Payment proof"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowImageModal(true)}
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  View Full Image
                </Button>
              </div>
            )}

            {/* Transaction ID */}
            {/* <div className="space-y-2">
              <p className="text-sm font-medium">Transaction ID</p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <code className="flex-1 font-mono text-xs break-all">
                  {withdrawal.id}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(withdrawal.id)}
                  className="shrink-0"
                >
                  Copy
                </Button>
              </div>
            </div> */}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Image Modal */}
      {showImageModal && withdrawal.proofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="relative w-full h-full">
              <Image
                src={withdrawal.proofUrl}
                alt="Payment proof - Full view"
                fill
                className="object-contain"
                onClick={(e) => e.stopPropagation()}
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

