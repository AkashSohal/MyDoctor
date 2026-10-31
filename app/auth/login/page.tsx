'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { describeAuthError } from '@/lib/auth-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setMessage('');

    if (!email.trim() || !password) {
      setMessage('Enter your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const { error, session } = await signIn(email.trim(), password);

      if (error) {
        setMessage(describeAuthError(error, 'Unable to sign in. Please try again.'));
        return;
      }

      if (!session) {
        setMessage('Your session could not be created. Please try again.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setMessage(describeAuthError(error, 'Unable to sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-secondary-900">MyDoctor</span>
          </Link>
          <h1 className="text-2xl font-bold text-secondary-900">Welcome back</h1>
          <p className="mt-2 text-secondary-500">Sign in to your account.</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              {message && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {message}
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-5 w-5" />}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  leftIcon={<Lock className="h-5 w-5" />}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign In
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-secondary-500">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-700">
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
