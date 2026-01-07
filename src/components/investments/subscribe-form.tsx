"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { subscribeToPlan } from "@/actions/investments/subscribe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

type SubscribeFormProps = {
  planId: string;
  minInvestment: number;
  maxInvestment: number;
};

export function SubscribeForm({ planId, minInvestment, maxInvestment }: SubscribeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Image must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Create preview
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Please upload a payment proof screenshot");
      return;
    }

    const formData = new FormData();
    formData.append("planId", planId);
    formData.append(
      "amount",
      (e.currentTarget.elements.namedItem("amount") as HTMLInputElement).value
    );
    formData.append("paymentProof", selectedFile);

    startTransition(() => {
      subscribeToPlan(formData).then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          // Redirect to investments page
          router.push("/user");
          router.refresh();
        }
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Investment Amount (USD)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min={minInvestment}
          max={maxInvestment}
          placeholder={`Min: $${minInvestment.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} - Max: $${maxInvestment.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          required
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Investment range: ${minInvestment.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} - ${maxInvestment.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentProof">Payment Proof Screenshot</Label>
        {!selectedFile ? (
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="paymentProof"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP (MAX. 5MB)
                </p>
              </div>
              <input
                id="paymentProof"
                name="paymentProof"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isPending}
              />
            </label>
          </div>
        ) : (
          <div className="relative">
            <div className="relative w-full h-48 border border-border rounded-lg overflow-hidden bg-muted">
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Payment proof preview"
                  fill
                  className="object-contain"
                />
              )}
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-2 right-2 p-1 bg-background border border-border rounded-full hover:bg-accent transition-colors"
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
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
        className="w-full font-medium mt-2 text-md h-12"
        variant="default"
        disabled={isPending || !selectedFile}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Subscribing...
          </>
        ) : (
          "Subscribe to Plan"
        )}
      </Button>
    </form>
  );
}
