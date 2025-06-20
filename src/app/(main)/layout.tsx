import { AppLayout } from '@/components/layout/app-layout';
import React from 'react';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
