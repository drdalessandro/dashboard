/**
 * Common button styles for healthcare platform
 * 
 * Centralized button style definitions used across practitioner and patient features
 */
import { styled, Button, IconButton, Card, Accordion, Typography, Box } from '@mui/material';

/**
 * Standard Add button for form sections
 * Used for adding new entries like qualifications, addresses, etc.
 */
export const AddButton = styled(Button)({
  color: '#2563eb',
  fontSize: '0.875rem',
  fontWeight: 500,
  textTransform: 'none',
  padding: '8px 16px',
  minWidth: 'auto',
  border: '1px solid #2563eb',
  borderRadius: '6px',
  backgroundColor: 'transparent',
  display: 'flex !important',
  '&:hover': {
    color: '#1d4ed8',
    backgroundColor: '#f0f9ff',
    borderColor: '#1d4ed8'
  },
  '&:disabled': {
    color: '#94a3b8',
    borderColor: '#94a3b8'
  }
});

/**
 * Standard Delete button for form sections
 * Used for removing entries from lists
 */
export const DeleteButton = styled(IconButton)({
  color: '#64748b',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: 'white',
  display: 'flex !important',
  '&:hover': {
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444'
  },
  '&:disabled': {
    color: '#94a3b8',
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  }
});

/**
 * Upload button styling for file uploads
 * Used for photo uploads and file attachments
 */
export const UploadButton = styled(Button)({
  backgroundColor: '#f1f5f9',
  color: '#374151',
  fontSize: '0.875rem',
  fontWeight: 500,
  textTransform: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  height: '36px',
  border: '1px solid #cbd5e1',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: '#e2e8f0',
    boxShadow: 'none'
  }
});

/**
 * Styled card component for form sections
 * Used to match PractitionerForm design exactly
 */
export const StyledCard = styled(Card)({
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  border: '1px solid #e2e8f0',
  overflow: 'hidden'
});

/**
 * Styled accordion component for collapsible sections
 * Used for form section organization
 */
export const StyledAccordion = styled(Accordion)({
  boxShadow: 'none',
  '&:before': { display: 'none' },
  backgroundColor: 'transparent'
});

/**
 * Section header typography for form sections
 * Used for main section titles
 */
export const SectionHeader = styled(Typography)({
  color: '#1e293b',
  fontSize: '1.125rem',
  fontWeight: 600,
  lineHeight: 1.2,
  marginBottom: '0.5rem'
});

/**
 * Section description typography for form sections
 * Used for section subtitles and descriptions
 */
export const SectionDescription = styled(Typography)({
  color: '#64748b',
  fontSize: '0.875rem',
  lineHeight: 1.4
});

/**
 * Credentials upload area styling
 * Used for file upload sections in practitioner forms
 */
export const CredentialsUploadArea = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  borderRadius: '8px',
  border: '2px dashed #cbd5e1',
  padding: '40px 24px',
  backgroundColor: '#f8fafc',
  textAlign: 'center'
});

/**
 * Notes textarea styling
 * Used for notes input fields in forms
 */
export const NotesTextarea = styled('textarea')({
  width: '100%',
  minHeight: '128px',
  padding: '12px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '14px',
  fontFamily: 'inherit',
  resize: 'vertical',
  outline: 'none',
  backgroundColor: 'white',
  '&:focus': {
    outline: '2px solid #3b82f6',
    outlineOffset: '2px',
    borderColor: '#3b82f6'
  },
  '&::placeholder': {
    color: '#94a3b8'
  }
});