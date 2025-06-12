/**
 * PatientClinicalTab Test Suite
 * Tests for the performance-optimized Patient Clinical Tab component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatientClinicalTab } from '../PatientClinicalTab';
import { PatientDisplayData } from '@features/patients/utils/patientDataUtils';

// Mock translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock UI components
jest.mock('@/components/ui', () => ({
  Card: ({ title, children }: any) => (
    <div data-testid="card">
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));

describe('PatientClinicalTab', () => {
  const mockPatientData: PatientDisplayData = {
    id: 'patient-123',
    name: 'John Doe',
    status: 'active',
    vitals: {} as any,
    clinicalData: {
      allergies: [
        { name: 'Peanuts', severity: 'high' },
        { name: 'Penicillin', severity: 'moderate' },
      ],
      conditions: [
        { name: 'Hypertension', status: 'active' },
        { name: 'Diabetes Type 2', status: 'active' },
      ],
      immunizations: [
        { name: 'COVID-19', date: '2023-01-15' },
        { name: 'Flu Shot', date: '2023-10-01' },
      ],
      medications: [
        { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
      ],
    },
    phoneNumbers: [],
  } as PatientDisplayData;

  it('should render all clinical data sections', () => {
    render(<PatientClinicalTab patientData={mockPatientData} />);
    
    // Should render 4 cards
    expect(screen.getAllByTestId('card')).toHaveLength(4);
    
    // Check section titles
    expect(screen.getByText('patient:detail.allergies.title')).toBeInTheDocument();
    expect(screen.getByText('patient:detail.conditions.title')).toBeInTheDocument();
    expect(screen.getByText('patient:detail.immunizations.title')).toBeInTheDocument();
    expect(screen.getByText('patient:detail.medications.title')).toBeInTheDocument();
  });

  it('should display allergies with severity indicators', () => {
    render(<PatientClinicalTab patientData={mockPatientData} />);
    
    expect(screen.getByText('Peanuts')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('Penicillin')).toBeInTheDocument();
    expect(screen.getByText('moderate')).toBeInTheDocument();
  });

  it('should display conditions with status', () => {
    render(<PatientClinicalTab patientData={mockPatientData} />);
    
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Diabetes Type 2')).toBeInTheDocument();
    expect(screen.getAllByText('active')).toHaveLength(2);
  });

  it('should display immunizations with dates', () => {
    render(<PatientClinicalTab patientData={mockPatientData} />);
    
    expect(screen.getByText('COVID-19')).toBeInTheDocument();
    expect(screen.getByText('2023-01-15')).toBeInTheDocument();
    expect(screen.getByText('Flu Shot')).toBeInTheDocument();
    expect(screen.getByText('2023-10-01')).toBeInTheDocument();
  });

  it('should display medications with dosage and frequency', () => {
    render(<PatientClinicalTab patientData={mockPatientData} />);
    
    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.getByText('500mg - Twice daily')).toBeInTheDocument();
    expect(screen.getByText('Lisinopril')).toBeInTheDocument();
    expect(screen.getByText('10mg - Once daily')).toBeInTheDocument();
  });

  it('should handle empty clinical data', () => {
    const emptyData = {
      ...mockPatientData,
      clinicalData: {
        allergies: [],
        conditions: [],
        immunizations: [],
        medications: [],
      },
    };

    render(<PatientClinicalTab patientData={emptyData} />);
    
    expect(screen.getByText('patient:detail.allergies.noAllergies')).toBeInTheDocument();
    expect(screen.getByText('patient:detail.conditions.noConditions')).toBeInTheDocument();
    expect(screen.getByText('patient:detail.immunizations.noImmunizations')).toBeInTheDocument();
    expect(screen.getByText('patient:detail.medications.noMedications')).toBeInTheDocument();
  });

  it('should only re-render when clinical data changes', () => {
    const { rerender } = render(<PatientClinicalTab patientData={mockPatientData} />);
    
    // Change non-clinical data
    const updatedData = {
      ...mockPatientData,
      name: 'Jane Doe', // Changed name
    };
    
    // Spy on component render
    const renderSpy = jest.fn();
    jest.spyOn(React, 'createElement').mockImplementation((type, props, ...children) => {
      if (props?.['data-testid'] === 'card') {
        renderSpy();
      }
      return React.createElement(type, props, ...children);
    });
    
    rerender(<PatientClinicalTab patientData={updatedData} />);
    
    // Should not re-render due to custom memo comparison
    expect(renderSpy).not.toHaveBeenCalled();
  });
});
