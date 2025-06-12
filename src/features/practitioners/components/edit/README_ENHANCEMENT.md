# Practitioners Edit Feature Enhancement - FHIR Complete

## Overview

The practitioners' edit feature has been enhanced to support the complete FHIR Practitioner resource schema, adding four new fields:
- **address**: Multiple address support 
- **birthDate**: Date of birth field
- **photo**: Photo upload with headshot functionality
- **communication**: Languages practitioner can communicate in

## New Features Added

### 1. Personal Information Enhancement
- **Added**: `birthDate` field with date picker
- **Validation**: Date format, realistic age constraints
- **Icon**: Cake icon for visual consistency

### 2. Address Management
- **New Section**: `AddressSection.tsx`
- **Features**: Multiple addresses with add/remove functionality
- **Fields**: use, line[], city, district, state, postalCode, country
- **Display**: Address chips with formatted display

### 3. Photo Upload System
- **New Section**: `PhotoSection.tsx`
- **Features**: 
  - Drag-and-drop photo upload
  - Image preview with 120x120 avatar display
  - File format validation (image types only)
  - File size validation (max 5MB)
  - Base64 encoding for FHIR compliance
- **User Experience**: Click-to-upload interface with visual feedback

### 4. Communication Languages
- **New Section**: `CommunicationSection.tsx`
- **Features**: 
  - Dropdown selection from common regional languages
  - Dynamic add/remove functionality
  - Language chips display
  - FHIR CodeableConcept compliance
- **Languages**: Optimized for Sub-Saharan Africa/Mali region:
  - English, French, Bambara, Arabic, Swahili, Hausa, Yoruba, Igbo

## Technical Implementation

### Enhanced Data Structures

```typescript
// New interfaces added to PractitionerAdapter
interface AddressFormData {
  use?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface PhotoFormData {
  contentType?: string;
  data?: string; // base64 encoded
  size?: number;
  title?: string;
  url?: string;
}

interface CommunicationFormData {
  language: string; // ISO language code
  text: string; // display name
}

// Enhanced PractitionerFormValues
interface PractitionerFormValues {
  // ... existing fields
  birthDate?: string;
  address: AddressFormData[];
  photo: PhotoFormData[];
  communication: CommunicationFormData[];
}
```

### FHIR Compliance

All new fields map directly to FHIR Practitioner resource specification:

- **address**: Maps to `Practitioner.address[]` (Address datatype)
- **birthDate**: Maps to `Practitioner.birthDate` (date)
- **photo**: Maps to `Practitioner.photo[]` (Attachment datatype)
- **communication**: Maps to `Practitioner.communication[]` (CodeableConcept)

### Component Architecture

```
src/features/practitioners/components/edit/
├── PersonalInfoSection.tsx     # Enhanced with birthDate
├── AddressSection.tsx          # NEW - Multiple addresses
├── PhotoSection.tsx            # NEW - Photo upload
├── CommunicationSection.tsx    # NEW - Languages
├── ContactInfoSection.tsx      # Existing - Contact info
├── QualificationsSection.tsx   # Existing - Qualifications
├── FormCard.tsx               # Existing - Reusable wrapper
└── DynamicFieldManager.tsx    # Existing - Dynamic fields utility
```

## Form Flow and User Experience

The enhanced form follows a logical progression:

1. **Personal Information** - Basic identity + birth date
2. **Photo Upload** - Visual identification  
3. **Address Information** - Location details
4. **Contact Information** - Communication methods
5. **Languages** - Communication capabilities
6. **Professional Qualifications** - Credentials

## File Upload Implementation

### Photo Upload Features
- **Format Support**: JPG, PNG, GIF, WebP
- **Size Limit**: 5MB maximum
- **Validation**: Real-time format and size checking
- **Preview**: Immediate visual feedback
- **Storage**: Base64 encoding in FHIR resource
- **Error Handling**: User-friendly error messages

### Technical Implementation
```typescript
// File handling with validation
const handleFileSelect = (file: File) => {
  // Format validation
  if (!file.type.startsWith('image/')) {
    setError('Please select a valid image file');
    return;
  }
  
  // Size validation  
  if (file.size > 5 * 1024 * 1024) {
    setError('File size must be less than 5MB');
    return;
  }
  
  // Convert to base64 for FHIR storage
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Data = e.target.result;
    // Store in form values
  };
  reader.readAsDataURL(file);
};
```

## Language Support

### Regional Optimization
Languages selected based on target market (Sub-Saharan Africa/Mali):

| Language | Code | Region Relevance |
|----------|------|------------------|
| French | fr | Official language in Mali |
| English | en | Widely used in healthcare |
| Bambara | bm | Most common local language in Mali |
| Arabic | ar | Common in North/West Africa |
| Swahili | sw | East Africa |
| Hausa | ha | West/Central Africa |
| Yoruba | yo | West Africa |
| Igbo | ig | West Africa |

## Validation Enhancements

### New Validation Rules
- **Birth Date**: Must be in past, reasonable age limits
- **Address**: Either street address or city required
- **Photo**: Valid format and size constraints
- **Communication**: Valid language code and display text
- **File Upload**: Real-time validation with user feedback

### Error Handling
- Section-level validation display
- Form-level validation summary  
- Real-time validation feedback
- User-friendly error messages

## Performance Optimizations

### Photo Handling
- **Efficient Preview**: Immediate base64 conversion
- **Memory Management**: Single photo limit to prevent memory issues
- **Lazy Loading**: Preview only when image selected

### Form Performance
- **React.memo**: All sections memoized
- **useCallback**: Event handlers optimized
- **Conditional Rendering**: Dynamic sections only render when needed

## Backward Compatibility

### Preserved Features
- ✅ All existing fields maintained
- ✅ Existing business logic preserved
- ✅ Same API integration patterns
- ✅ usePractitioner hook integration
- ✅ Offline-first capabilities
- ✅ Internationalization support

### Migration Notes
- Previous form values automatically migrate
- New fields default to empty arrays/values
- No breaking changes to existing functionality

## Testing Strategy

### Component Testing
- **PersonalInfoSection**: Birth date validation
- **AddressSection**: Multiple address add/remove
- **PhotoSection**: File upload, validation, preview
- **CommunicationSection**: Language selection, chips
- **Integration**: Complete form submission flow

### Validation Testing
- **Date Validation**: Invalid dates, future dates, unrealistic ages
- **File Validation**: Wrong formats, large files, corrupted files
- **Address Validation**: Empty fields, required field combinations
- **Language Validation**: Duplicate languages, invalid codes

## Deployment Checklist

### Pre-deployment
- [ ] All new components tested individually
- [ ] Form validation working correctly
- [ ] Photo upload functionality verified
- [ ] FHIR resource mapping validated
- [ ] Backward compatibility confirmed
- [ ] Performance benchmarks met

### Post-deployment  
- [ ] Monitor photo upload performance
- [ ] Validate FHIR resource creation
- [ ] Check offline functionality
- [ ] Verify mobile responsiveness
- [ ] Monitor error rates

## Future Enhancements

### Short-term (Next Sprint)
- **Multiple Photos**: Support multiple practitioner photos
- **Advanced Validation**: Real-time address validation
- **Language Auto-detect**: Browser language detection
- **Photo Optimization**: Image compression before storage

### Long-term (Future Versions)
- **Cloud Storage**: Move photos to external storage service
- **Advanced Upload**: Drag-and-drop interface improvements
- **Internationalization**: More language options
- **Accessibility**: Enhanced screen reader support

This enhancement brings the practitioners' edit feature to full FHIR Practitioner resource compliance while maintaining the modular, maintainable architecture and excellent user experience.
