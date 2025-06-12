// src/app/prescriptions/create/page.tsx
"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import PrescriptionCreatePageV2 from '@/features/prescriptions/pages/PrescriptionCreatePageV2';

/**
 * Prescription Create Route Component
 * 
 * This component acts as a wrapper to integrate the PrescriptionCreatePageV2
 * into the Next.js app router structure
 */
export default function PrescriptionCreateRoute() {
  const searchParams = useSearchParams();
  const patientId = searchParams?.get('patientId') || '';
  
  return <PrescriptionCreatePageV2 initialPatientId={patientId} />;
}
