'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getAuthCallbackUrl } from '@/lib/env';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    // Get email from localStorage (set during signup)
    const pendingEmail = localStorage.getItem('pending_verification_email');
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) return;

    setResending(true);
    setResendMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });

      if (error) {
        setResendMessage('Failed to resend email. Please try again.');
      } else {
        setResendMessage('Verification email sent! Check your inbox.');
      }
    } catch (_err) {
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('pending_verification_email');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to verify your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-900 text-center font-medium">
                {email}
              </p>
            </div>
          )}

          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Next steps:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Return here and sign in to complete your account setup</li>
            </ol>
          </div>

          {resendMessage && (
            <div className={`rounded-md p-3 text-sm ${
              resendMessage.includes('sent')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}>
              {resendMessage}
            </div>
          )}

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={resending || !email}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Sending...' : 'Resend verification email'}
            </Button>

            <Button
              className="w-full"
              onClick={handleBackToLogin}
            >
              Continue to Login
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            After verifying your email, you&apos;ll be able to sign in and complete your account setup.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
