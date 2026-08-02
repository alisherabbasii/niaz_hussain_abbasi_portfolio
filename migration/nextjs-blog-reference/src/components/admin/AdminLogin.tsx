"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to admin dashboard
        router.push('/admin/blogs');
        router.refresh(); // Important to update the middleware state visually
      } else {
        setError(data.message || 'Invalid credentials');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-custom p-6">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-bold uppercase tracking-wider text-xs rounded-full mb-4">
            Return to Site
          </Link>
          <h1 className="text-3xl font-black text-secondary">Admin Login</h1>
          <p className="text-secondary/60 mt-2 font-medium">Portfolio Management Dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 block"></span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary px-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="email"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white text-secondary font-medium transition-all"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary px-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                name="password"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white text-secondary font-medium transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_8px_20px_rgb(52,211,153,0.3)] hover:shadow-[0_8px_25px_rgb(52,211,153,0.4)] hover:-translate-y-1"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Access Dashboard <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
