import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Healthcare Dashboard | Gandall Health',
  description: 'Overview of healthcare metrics and patient information'
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}

// Server-side translation loading
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }];
}
