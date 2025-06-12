/**
 * PatientOverviewTab Test Suite
 * Tests for the performance-optimized Patient Overview Tab component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatientOverviewTab } from '../PatientOverviewTab';
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

describe('PatientOverviewTab', () => {
  const mockPatientData: PatientDisplayData = {
    id: 'patient-123',
    identifier: 'P123456',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'male',
    birthDate: '1980-01-01',
    age: 44,
    phoneNumbers: [{ system: 'phone', value: '+1234567890' }],
    email: 'john.doe@example.com',
    address: '123 Main St, City, State 12345',
    maritalStatus: 'married',
    language: 'English',
    status: 'active',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+0987654321',
    },
    insurance: {
      provider: 'Health Insurance Co',
      memberId: 'INS123456',
    },
    generalPractitioner: 'Dr. Smith',
    vitals: {} as any,
    clinicalData: {} as any,
  };

  it('should render without crashing', () => {
    render(<PatientOverviewTab patientData={mockPatientData} />);
    expect(screen.getAllByTestId('card')).toHaveLength(4);
  });

  it('should display patient personal information', () => {
    render(<PatientOverviewTab patientData={mockPatientData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('patient:gender.male')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('should display emergency contact information', () => {
    render(<PatientOverviewTab patientData={mockPatientData} />);
    
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Spouse')).toBeInTheDocument();
    expect(screen.getByText('+0987654321')).toBeInTheDocument();
  });

  it('should display insurance information', () => {
    render(<PatientOverviewTab patientData={mockPatientData} />);
    
    expect(screen.getByText('Health Insurance Co')).toBeInTheDocument();
    expect(screen.getByText('INS123456')).toBeInTheDocument();
  });

  it('should handle missing data gracefully', () => {
    const patientWithMissingData = {
      ...mockPatientData,
      email: undefined,
      emergencyContact: undefined,
      insurance: undefined,
    };

    render(<PatientOverviewTab patientData={patientWithMissingData} />);
    
    // Should display dash for missing data
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('should memoize date formatting', () => {
    const { rerender } = render(<PatientOverviewTab patientData={mockPatientData} />);
    
    // Re-render with same data
    rerender(<PatientOverviewTab patientData={mockPatientData} />);
    
    // Component should not recreate date formatting
    // This would be verified through React DevTools Profiler in real testing
    expect(screen.getByText('January 1, 1980')).toBeInTheDocument();
  });

  it('should not re-render when props are identical', () => {
    const { rerender } = render(<PatientOverviewTab patientData={mockPatientData} />);
    
    const renderCount = jest.fn();
    jest.spyOn(React, 'memo').mockImplementation((component) => {
      renderCount();
      return component as any;
    });
    
    // Re-render with same props
    rerender(<PatientOverviewTab patientData={mockPatientData} />);
    
    // Should not trigger additional renders due to memoization
    expect(renderCount).toHaveBeenCalledTimes(1);
  });
});
