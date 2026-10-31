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
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

type FormErrors = {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
};

type Notice = {
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
};

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function validatePhone(value: string): boolean {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15 && /^\+?[\d\s().-]+$/.test(value);
}

export default function SignupPage() {
    const router = useRouter();
    const { signUp } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(false);

    function validate(): FormErrors {
        const nextErrors: FormErrors = {};

        if (!fullName.trim()) {
            nextErrors.fullName = 'Full name is required.';
        } else if (fullName.trim().length < 2) {
            nextErrors.fullName = 'Full name must be at least 2 characters.';
        }

        if (!email.trim()) {
            nextErrors.email = 'Email address is required.';
        } else if (!EMAIL_PATTERN.test(email.trim())) {
            nextErrors.email = 'Enter a valid email address.';
        }

        if (!phone.trim()) {
            nextErrors.phone = 'Phone number is required.';
        } else if (!validatePhone(phone.trim())) {
            nextErrors.phone = 'Enter a valid phone number (7-15 digits).';
        }

        if (!password) {
            nextErrors.password = 'Password is required.';
        } else if (password.length < 8) {
            nextErrors.password = 'Password must be at least 8 characters.';
        }

        if (!confirmPassword) {
            nextErrors.confirmPassword = 'Please confirm your password.';
        } else if (confirmPassword !== password) {
            nextErrors.confirmPassword = 'Passwords do not match.';
        }

        return nextErrors;
    }

    async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;

        setNotice(null);

        const nextErrors = validate();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setLoading(true);
        let redirectPending = false;

        try {
            const { error, session, profileError } = await signUp(
                email.trim(),
                password,
                fullName.trim(),
                'patient',
                phone.trim()
            );

            if (error) {
                setNotice({
                    type: 'error',
                    text: describeAuthError(error, 'Unable to create your account. Please try again.'),
                });
                return;
            }

            if (session) {
                if (profileError) {
                    setNotice({
                        type: 'warning',
                        text: 'Your account was created, but we could not save your profile details. You can add them later from your profile.',
                    });
                    redirectPending = true;
                    setTimeout(() => {
                        router.push('/');
                        router.refresh();
                    }, 2500);
                    return;
                }
                setNotice({
                    type: 'success',
                    text: 'Account created successfully. Taking you to the homepage...',
                });
                router.push('/');
                router.refresh();
                return;
            }

            setNotice({
                type: 'info',
                text: `Almost there! We sent a confirmation link to ${email.trim()}. Confirm your email, then sign in.`,
            });
        } catch (error) {
            setNotice({
                type: 'error',
                text: describeAuthError(error, 'Unable to create your account. Please try again.'),
            });
        } finally {
            if (!redirectPending) setLoading(false);
        }
    }

    const noticeStyles: Record<Notice['type'], string> = {
        success: 'bg-green-50 text-green-700 border-green-200',
        error: 'bg-red-50 text-red-700 border-red-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        info: 'bg-primary-50 text-primary-700 border-primary-200',
    };

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
                    <h1 className="text-2xl font-bold text-secondary-900">Create your account</h1>
                    <p className="mt-2 text-secondary-500">Find the right doctor near you.</p>
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Sign Up</CardTitle>
                        <CardDescription>Enter your details to create an account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSignup} noValidate className="space-y-4">
                            <div>
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    autoComplete="name"
                                    placeholder="John Doe"
                                    error={errors.fullName}
                                    leftIcon={<User className="h-5 w-5" />}
                                />
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    error={errors.email}
                                    leftIcon={<Mail className="h-5 w-5" />}
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    autoComplete="tel"
                                    placeholder="+91 98765 43210"
                                    error={errors.phone}
                                    leftIcon={<Phone className="h-5 w-5" />}
                                />
                            </div>

                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="At least 8 characters"
                                    error={errors.password}
                                    leftIcon={<Lock className="h-5 w-5" />}
                                    rightIcon={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-secondary-400 hover:text-secondary-600"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    }
                                />
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Re-enter your password"
                                    error={errors.confirmPassword}
                                    leftIcon={<Lock className="h-5 w-5" />}
                                />
                            </div>

                            {notice && (
                                <div
                                    role={notice.type === 'error' ? 'alert' : 'status'}
                                    className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${noticeStyles[notice.type]}`}
                                >
                                    {notice.type === 'success' ? (
                                        <CheckCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                    )}
                                    {notice.text}
                                </div>
                            )}

                            <Button type="submit" className="w-full" size="lg" loading={loading}>
                                Create Account
                            </Button>
                        </form>

                        <p className="mt-4 text-center text-sm text-secondary-500">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
                                Sign In
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
