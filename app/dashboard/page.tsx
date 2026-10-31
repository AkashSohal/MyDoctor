
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Profile = {
    full_name: string | null;
    phone: string | null;
    role: string;
};

export default function DashboardPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            let redirectingToLogin = false;

            try {
                const { data, error } = await supabase.auth.getUser();

                if (error || !data.user) {
                    redirectingToLogin = true;
                    router.replace('/auth/login');
                    return;
                }

                setEmail(data.user.email ?? '');

                const { data: profileData, error: profileError } =
                    await supabase
                        .from('profiles')
                        .select('full_name, phone, role')
                        .eq('id', data.user.id)
                        .maybeSingle();

                if (!profileError && profileData) {
                    setProfile(profileData);
                }
            } catch (error) {
                // A failed request must not leave the page on "Loading...".
                console.error('Error loading dashboard profile:', error);
            } finally {
                // Never stay stuck on "Loading..." if a request failed.
                if (!redirectingToLogin) {
                    setLoading(false);
                }
            }
        }

        loadProfile();
    }, [router]);

    async function handleSignOut() {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                alert('We could not sign you out. Please try again.');
                return;
            }

            router.replace('/auth/login');
            router.refresh();
        } catch (error) {
            console.error('Error signing out:', error);
            alert('We could not sign you out. Please try again.');
        }
    }

    if (loading) {
        return (
            <main className="p-10 text-center text-gray-600">
                Loading your account...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow">
                <h1 className="text-3xl font-bold text-blue-700">
                    MyDoctor
                </h1>

                <h2 className="mt-6 text-2xl font-semibold text-gray-900">
                    Welcome, {profile?.full_name || 'User'}!
                </h2>

                <div className="mt-6 space-y-3 text-gray-700">
                    <p>
                        <strong>Email:</strong> {email}
                    </p>
                    <p>
                        <strong>Phone:</strong> {profile?.phone || 'Not provided'}
                    </p>
                    <p>
                        <strong>Account type:</strong> {profile?.role || 'Profile not found'}
                    </p>
                </div>

                <button
                    onClick={handleSignOut}
                    className="mt-8 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
                >
                    Sign Out
                </button>
            </div>
        </main>
    );
}
