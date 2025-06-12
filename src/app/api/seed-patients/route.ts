// app/api/seed-patients/route.ts
import { NextResponse } from 'next/server';
import { seedPatients } from '@scripts/PatientsSeeder';

export async function POST() {
  try {
    const results = await seedPatients();

    return NextResponse.json({
      status: 200,
      success: true,
      results: results
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 500,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
