"use client";

import { useState, useTransition } from "react";
import { updateWithdrawPin } from "@/actions/user/update-withdraw-pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, ShieldCheck, Shield } from "lucide-react";

type WithdrawPinSectionProps = {
  hasPin: boolean;
};

export function WithdrawPinSection({ hasPin }: WithdrawPinSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  function handlePinInput(e: React.ChangeEvent<HTMLInputElement>, maxLength: number = 4) {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, "");
    // Limit to maxLength
    e.target.value = value.slice(0, maxLength);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(() => {
      updateWithdrawPin(formData).then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(true);
          // Reset form
          e.currentTarget.reset();
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(false), 3000);
        }
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Withdraw PIN</CardTitle>
            <CardDescription>
              {hasPin
                ? "Change your withdraw PIN for secure transactions"
                : "Set a 4-digit PIN for withdraw requests"}
            </CardDescription>
          </div>
          {hasPin && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>PIN is set</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current PIN (only if PIN exists) */}
          {hasPin && (
            <div className="space-y-2">
              <Label htmlFor="currentPin">Current PIN</Label>
              <div className="relative">
                <Input
                  id="currentPin"
                  name="currentPin"
                  type={showCurrentPin ? "text" : "password"}
                  required
                  disabled={isPending}
                  maxLength={4}
                  placeholder="0000"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  onChange={(e) => handlePinInput(e, 4)}
                  className="pr-10 font-mono tracking-widest text-center text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                >
                  {showCurrentPin ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* New PIN */}
          <div className="space-y-2">
            <Label htmlFor="pin">New PIN</Label>
            <div className="relative">
              <Input
                id="pin"
                name="pin"
                type={showNewPin ? "text" : "password"}
                required
                disabled={isPending}
                maxLength={4}
                placeholder="0000"
                inputMode="numeric"
                pattern="[0-9]{4}"
                onChange={(e) => handlePinInput(e, 4)}
                className="pr-10 font-mono tracking-widest text-center text-lg"
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                {showNewPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter exactly 4 digits
            </p>
          </div>

          {/* Confirm PIN */}
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm New PIN</Label>
            <div className="relative">
              <Input
                id="confirmPin"
                name="confirmPin"
                type={showConfirmPin ? "text" : "password"}
                required
                disabled={isPending}
                maxLength={4}
                placeholder="0000"
                inputMode="numeric"
                pattern="[0-9]{4}"
                onChange={(e) => handlePinInput(e, 4)}
                className="pr-10 font-mono tracking-widest text-center text-lg"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                {showConfirmPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-600 dark:text-emerald-400">
              {hasPin ? "PIN updated successfully" : "PIN set successfully"}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasPin ? (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Update PIN
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Set PIN
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

