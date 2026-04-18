"use client";

import { useState } from "react";
import Link from "next/link";
import { Quote, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const { data: session } = authClient.useSession();

  async function handleResend() {
    setResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: session?.user?.email || "",
        callbackURL: "/dashboard",
      });
      setResent(true);
    } catch {
      // Silently fail - user can try again
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <Quote className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">
              ex<span className="text-primary">CITE</span>
            </span>
          </Link>
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to{" "}
            {session?.user?.email ? (
              <span className="font-medium text-foreground">{session.user.email}</span>
            ) : (
              "your email address"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Click the link in the email to verify your account. If you don&apos;t see it, check your spam folder.</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resending || resent}
          >
            {resending && <Loader2 className="h-4 w-4 animate-spin" />}
            {resent ? "Email sent!" : "Resend verification email"}
          </Button>
          <p className="text-sm text-muted-foreground">
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
