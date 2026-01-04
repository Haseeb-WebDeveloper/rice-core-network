"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signup } from "@/actions/auth/signup";
import { getReferrerByCode } from "@/actions/auth/get-referrer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, User } from "lucide-react";
import Image from "next/image";

type ReferrerInfo = {
  id: string;
  fullName: string;
  avatar: string | null;
  referralCode: string;
};

function SignupForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [loadingReferrer, setLoadingReferrer] = useState(false);

  // Fetch referrer info if ref code exists in URL
  useEffect(() => {
    if (refCode) {
      setLoadingReferrer(true);
      getReferrerByCode(refCode)
        .then((result) => {
          if (result.referrer && !result.error) {
            setReferrer(result.referrer);
          } else if (result.error) {
            setError(result.error);
          }
        })
        .catch((err) => {
          console.error("Error fetching referrer:", err);
          setError("Failed to load referrer information");
        })
        .finally(() => {
          setLoadingReferrer(false);
        });
    }
  }, [refCode]);

  function handleSubmit(formData: FormData) {
    setError(null);

    const email = formData.get("email") as string;

    startTransition(() => {
      signup(formData).then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setUserEmail(email);
          setSuccess(true);
        }
      });
    });
  }

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground">
              We've sent a verification link to{" "}
              <span className="font-medium text-foreground">{userEmail}</span>
            </p>
          </div>
          <div className="text-sm text-muted-foreground w-full">
            {/* <p>
              Please check your email and click on the verification link to
              activate your account. If you don't see the email, check your spam
              folder.
            </p> */}
          </div>
          <div className="grid grid-cols-2 justify-center gap-2 w-full pt-4">
            <button
              onClick={() => {
                setSuccess(false);
                setUserEmail("");
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Back to sign up
            </button>
            <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline">
              <Link href="/login">Go to sign in</Link>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-8 shadow-lg">
      {/* Show referrer info at top if ref code exists */}
      {refCode && (
        <div className="mb-6 pb-6 border-b">
          {loadingReferrer ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading referrer information...</p>
            </div>
          ) : referrer ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Referred by:</span>
                {referrer.avatar ? (
                  <Image
                    src={referrer.avatar}
                    alt={referrer.fullName}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                    <span>
                      {referrer.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                  {referrer.fullName}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <span>Invalid referral code. Please remove it from the URL or enter a valid code.</span>
            </div>
          )}
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold">Create Account</h1>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            required
            minLength={1}
            maxLength={100}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={isPending}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isPending}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 cursor-pointer" />
              ) : (
                <Eye className="h-4 w-4 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        {/* Hide referral code input if ref parameter exists in URL */}
        {!refCode && (
          <div className="space-y-2">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              name="referralCode"
              type="text"
              placeholder="Enter referral code"
              maxLength={20}
              disabled={isPending}
            />
          </div>
        )}
        
        {/* Hidden input to pass referral code from URL if it exists */}
        {refCode && referrer && (
          <input
            type="hidden"
            name="referralCode"
            value={referrer.referralCode}
          />
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline font-medium text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="rounded-lg border bg-card p-8 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
