# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Seeding Commands
- `npm run seed:patients` - Seed patient data to local Medplum server
- `npm run seed:clinical` - Seed clinical data with more options
- `npm run seed:clinical:help` - Show help for clinical seeding options
- `npm run sync-rxnorm` - Sync RxNorm medication data

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router (pages in `src/app/`)
- **Data Layer**: Medplum FHIR server for healthcare data
- **UI Framework**: Material-UI (MUI) with custom design system
- **State Management**: Refine.dev framework with custom hooks
- **Offline Support**: IndexedDB caching with sync capabilities
- **Internationalization**: i18next with French/English support

### Key Architectural Patterns

#### 1. Feature-Based Organization
Code is organized by healthcare domains in `src/features/`:
- `patients/` - Patient management and clinical data
- `practitioners/` - Healthcare provider management  
- `prescriptions/` - Medication and prescription handling
- `dashboard/` - Analytics and overview components

#### 2. FHIR Resource Hooks System
The app uses a sophisticated hook factory system (`src/hooks/factory/createResourceHook.ts`) that generates type-safe hooks for FHIR resources:
- Combines CRUD operations, caching, enhancement, and state management
- Provides offline-first capabilities with automatic sync
- Includes validation, error handling, and connection state management

#### 3. Medplum Integration
- **Client**: Configured in `src/lib/medplum/client.ts` with offline detection
- **Data Provider**: `src/providers/data-provider/medplum/index.ts` implements Refine interface
- **Services**: Modular services in `src/services/medplum/` for connection, caching, sync, and errors

#### 4. Offline-First Design
- Local caching with IndexedDB
- Pending operation queues for sync when back online
- Connection state monitoring throughout the app
- Graceful degradation when server unavailable

### Environment Configuration

The app requires these environment variables:
- `NEXT_PUBLIC_MEDPLUM_BASE_URL` - Medplum server URL (default: http://localhost:8103)
- `NEXT_PUBLIC_MEDPLUM_CLIENT_ID` - OAuth client ID for Medplum
- `NEXT_PUBLIC_MEDPLUM_CLIENT_SECRET` - OAuth client secret

### Path Aliases
- `@/*` - Maps to `src/*`
- `@/components/*` - Maps to `src/components/*`
- `@/features/*` - Maps to `src/features/*`
- `@/utils/*` - Maps to `src/utils/*`
- `@/hooks/*` - Maps to `src/hooks/*`
- `@/types/*` - Maps to `src/types/*`

### Development Notes

#### Hook Usage Patterns
- Use feature-specific hooks (e.g., `usePatientDetails`) for complex operations
- Generated resource hooks provide consistent CRUD interfaces
- Always handle offline states and loading conditions
- Leverage enhanced resources for computed properties

#### Code Organization
- Place new components in feature folders, not generic `/components`
- Use the design system components in `src/components/designSystem/`
- Follow FHIR resource naming conventions
- Maintain TypeScript strict mode compliance

#### Data Handling
- All FHIR resources flow through the Medplum data provider
- Use proper FHIR resource types from `@medplum/fhirtypes`
- Handle both single resources and arrays in hook responses
- Implement proper error boundaries for data operations

#### Testing
- Patient seeding available for development data
- Use debug panels in `src/components/debug/` for troubleshooting
- Connection diagnostics available in the Medplum client