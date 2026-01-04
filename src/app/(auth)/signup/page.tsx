"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/actions/auth/signup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

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
            <Button
              onClick={() => {
                setSuccess(false);
                setUserEmail("");
              }}
              variant="outline"
              className="w-full"
            >
              Back to sign up
            </Button>
            <Button variant="outline" className="w-full">
              <Link href="/login">Go to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-8 shadow-lg">
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
