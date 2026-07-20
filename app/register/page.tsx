'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/layout/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiErrorShape, Role } from '@/lib/types';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const ROLES: Extract<Role, 'parent' | 'teacher'>[] = ['parent', 'teacher'];

export default function RegisterPage() {
  const { register, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({ name: '', email: '', password: '', role: 'parent' });
  const [error, setError] = useState<string | string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      await login({ email: form.email, password: form.password });
      router.push('/dashboard');
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6">
          <h1 className="mb-1 text-xl font-semibold text-brand-900">Create your account</h1>
          <p className="mb-6 text-sm text-muted">Start guiding reading sessions in a few minutes.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <span className="label">I am a</span>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                      form.role === r
                        ? 'border-brand-900 bg-brand-900 text-white'
                        : 'border-border text-brand-900 hover:bg-bg'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Name"
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Alert>{error}</Alert>
            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
