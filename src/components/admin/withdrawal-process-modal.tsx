"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { processWithdrawal } from "@/actions/admin/process-withdrawal";
import { Loader2, Check, Upload, X, Eye } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

type WithdrawalProcessModalProps = {
  withdrawal: PendingWithdrawal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WithdrawalProcessModal({
  withdrawal,
  open,
  onOpenChange,
}: WithdrawalProcessModalProps) {
  const router = useRouter();
  const [isProcessing, startProcessing] = useTransition();
  const [showImageModal, setShowImageModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Image must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
  }

  function handleProcess(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Please upload a payment proof screenshot");
      return;
    }

    const formData = new FormData();
    formData.append("transactionId", withdrawal.id);
    formData.append("proofFile", selectedFile);

    startProcessing(() => {
      processWithdrawal(formData).then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          onOpenChange(false);
          router.refresh();
        }
      });
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
            <DialogDescription>
              Review withdrawal details and upload payment proof
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* User Info */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">User</p>
              <p className="text-lg font-semibold mt-1">{withdrawal.user.fullName}</p>
              <p className="text-sm text-muted-foreground">{withdrawal.user.email}</p>
            </div>

            {/* Amount */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold mt-1">${withdrawal.amount.toFixed(2)}</p>
            </div>

            {/* Wallet Address */}
            {withdrawal.walletId && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Wallet Address</p>
                <code className="block p-3 rounded-lg bg-muted/50 border font-mono text-xs break-all">
                  {withdrawal.walletId}
                </code>
              </div>
            )}

            {/* Existing Proof */}
            {withdrawal.proofUrl ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Proof</p>
                <div
                  className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted/50 cursor-pointer hover:opacity-90 transition-opacity"
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
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Image
                </Button>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
                  Withdrawal already processed
                </p>
              </div>
            ) : (
              <form onSubmit={handleProcess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`proof-${withdrawal.id}`}>Upload Payment Proof</Label>
                  {!selectedFile ? (
                    <label
                      htmlFor={`proof-${withdrawal.id}`}
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 5MB)</p>
                      </div>
                      <input
                        id={`proof-${withdrawal.id}`}
                        name="proofFile"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isProcessing}
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <div className="relative w-full h-48 border border-border rounded-lg overflow-hidden bg-muted">
                        {previewUrl && (
                          <Image
                            src={previewUrl}
                            alt="Proof preview"
                            fill
                            className="object-contain"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="absolute top-2 right-2 p-1 bg-background border border-border rounded-full hover:bg-accent transition-colors"
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isProcessing || !selectedFile}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Process Withdrawal
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Image Modal */}
      {showImageModal && withdrawal.proofUrl && (
        <div
          className="fixed inset-0 z-5 flex items-center justify-center bg-black/90 p-4"
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

