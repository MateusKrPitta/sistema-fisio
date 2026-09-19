'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/patients/${resolvedParams.id}/forms/new`);
  }, [resolvedParams.id, router]);

  return null;
}
