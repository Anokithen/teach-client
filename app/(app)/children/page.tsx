'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { childrenApi } from '@/lib/endpoints';
import { useAuth } from '@/lib/auth-context';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ChildFormModal } from '@/components/children/ChildFormModal';
import { ApiErrorShape, Child } from '@/lib/types';

export default function ChildrenPage() {
  const { isAdmin } = useAuth();
  const [children, setChildren] = useState<Child[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await childrenApi.list();
      setChildren(res.data.children);
    } catch (err) {
      setError((err as ApiErrorShape).message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Children</h1>
          <p className="mt-1 text-sm text-muted">
            {isAdmin ? 'Every child profile on the platform.' : 'Manage the children you read with.'}
          </p>
        </div>
        {!isAdmin && <Button onClick={() => setModalOpen(true)}>Add child</Button>}
      </div>

      <div className="mt-6">
        {!children && !error && (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        )}
        {error && <Alert>{error}</Alert>}
        {children && children.length === 0 && (
          <EmptyState
            title="No children yet"
            description={
              isAdmin
                ? 'No child profiles have been created on the platform yet.'
                : 'Add your first child profile to start assigning books.'
            }
            action={
              !isAdmin && (
                <Button onClick={() => setModalOpen(true)}>Add child</Button>
              )
            }
          />
        )}
        {children && children.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/children/${child.id}`}
                className="card block p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-base font-semibold text-brand-900">{child.name}</h3>
                  <Badge tone="brand">{child.reading_level}</Badge>
                </div>
                <p className="text-sm text-muted">Age {child.age}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ChildFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(child) => setChildren((prev) => [...(prev || []), child])}
      />
    </div>
  );
}
