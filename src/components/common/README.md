# Gandall Healthcare Platform UI Components

This directory contains shared UI components optimized for healthcare applications in Mali and Sub-Saharan Africa, with a focus on offline-first capabilities, FHIR compliance, and multi-language support.

## Overview

These components are designed specifically for the healthcare context of Mali, supporting:

- Offline-first operation in low-connectivity environments
- Bilingual interfaces (French and English)
- FHIR-compliant data structures
- Responsive design for mobile and desktop usage
- Accessibility compliance

## Healthcare-Specific Card Components

### PatientCard

A comprehensive card component for displaying patient information with:
- Demographic data visualization
- Sync status indicators
- Offline mode support
- Compact/expanded display modes
- Action buttons for view/edit/delete operations

```tsx
import { PatientCard } from '../components/common';

<PatientCard
  patient={patientResource}
  syncStatus={SyncStatus.SYNCED}
  onView={handleViewPatient}
  onEdit={handleEditPatient}
  onDelete={handleDeletePatient}
  compact={false}
  isOfflineOnly={false}
/>
```

### MedicationCard

Displays medication request information for patients, with specialized formatting for:
- Medication names and dosage instructions
- Status indicators (active, completed, etc.)
- Visual indicators for critical medications
- Offline sync status

```tsx
import { MedicationCard } from '../components/common';

<MedicationCard
  medicationRequest={medicationRequestResource}
  syncStatus={SyncStatus.SYNCED}
  onView={handleViewMedication}
  onEdit={handleEditMedication}
  onDelete={handleDeleteMedication}
  compact={false}
  isOfflineOnly={false}
/>
```

### ObservationDisplay

Visualizes clinical observations and measurements with:
- Specialized display for vital signs (heart rate, temperature, blood pressure, etc.)
- Reference range indicators
- Visual indicators for abnormal values
- Customized icons for different observation types

```tsx
import { ObservationDisplay } from '../components/common';

<ObservationDisplay
  observation={observationResource}
  compact={false}
  showReferenceRanges={true}
  showVisualIndicator={true}
  onClick={handleObservationClick}
/>
```

## Status and Notification Components

### SyncStatusIndicator

Displays the synchronization status of healthcare data with visual indicators for:
- Synced
- Pending sync
- Sync error
- Offline mode

### OfflineAlert

Alert component that appears when the application is operating in offline mode, with:
- User guidance for offline operation
- Sync options when connectivity returns
- Localized messaging in French and English

## FHIR Resource Selection and Display Components

### FHIRSelect

Dropdown component for selecting FHIR resources with:
- Search capabilities
- Resource-type filtering
- Offline-available options
- Support for custom resource display formats

### FHIRDataGrid

Data grid component for displaying lists of FHIR resources with:
- Customizable columns
- Sorting/filtering
- Pagination with offline support
- Sync status indicators

### FHIRForm

Form component for creating and editing FHIR resources with:
- Validation against FHIR profiles
- Offline-first saving capabilities
- Bilingual form labels
- Support for complex FHIR data structures

## Implementation Best Practices

1. **Offline-First Development**:
   - Always implement offline fallbacks
   - Use local storage for critical patient data
   - Implement sync indicators for all healthcare data

2. **Multi-Language Support**:
   - Use the `useTranslation` hook for all user-facing text
   - Support both French and English interfaces

3. **Performance Optimization**:
   - Keep component rendering efficient for mobile devices
   - Minimize network requests for low-connectivity environments
   - Use progressive loading patterns for large datasets

4. **Security Considerations**:
   - Never display full PHI in shared or public contexts
   - Implement data masking for sensitive information
   - Use secure local storage patterns for offline data

## Utilities and Hooks

These components rely on several shared utilities and hooks:

- `useOfflineData`: Manages data persistence in offline environments
- `useFHIRSearch`: Provides search capabilities for FHIR resources
- `useTranslation`: Handles multilingual support
- `formatDate`, `formatPatientName`, and other FHIR-specific formatters
