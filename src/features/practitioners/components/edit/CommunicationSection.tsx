/**
 * CommunicationSection.tsx
 * 
 * Form section for managing practitioner communication languages
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Stack,
  Chip
} from '@mui/material';
import { Grid } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import AddIcon from '@mui/icons-material/Add';
import LanguageIcon from '@mui/icons-material/Language';

import { PractitionerFormValues, PractitionerCommunicationFormData } from '../../../../adapters/PractitionerAdapter';
import { FormCard } from './FormCard';
import { practitionerAdapter } from '../../../../adapters/PractitionerAdapter';

interface CommunicationSectionProps {
  formValues: PractitionerFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<PractitionerFormValues>>;
  errors: Partial<Record<keyof PractitionerFormValues, string>>;
  isSubmitting?: boolean;
}

export const CommunicationSection = React.memo<CommunicationSectionProps>(({
  formValues,
  setFormValues,
  errors,
  isSubmitting = false
}) => {
  const { t } = useTranslation(['practitioner', 'common']);

  // Local state for adding communication languages
  const [communication, setCommunication] = useState<PractitionerCommunicationFormData>({
    language: '',
    text: ''
  });

  // Get available languages
  const availableLanguages = React.useMemo(() =>
    practitionerAdapter.getCommonLanguages(),
    []
  );

  // Handle language selection
  const handleLanguageChange = React.useCallback((languageCode: string) => {
    const selectedLanguage = availableLanguages.find(lang => lang.code === languageCode);
    if (selectedLanguage) {
      setCommunication({
        language: selectedLanguage.code,
        text: selectedLanguage.text
      });
    }
  }, [availableLanguages]);

  // Handle adding a communication language
  const handleAddCommunication = React.useCallback(() => {
    if (communication.language && communication.text) {
      // Check if language already exists
      const exists = formValues.communication?.some(c => c.language === communication.language);
      if (!exists) {
        setFormValues(prev => ({
          ...prev,
          communication: [...(prev.communication || []), communication]
        }));
        setCommunication({ language: '', text: '' });
      }
    }
  }, [communication, setFormValues, formValues.communication]);

  // Handle removing a communication language
  const handleRemoveCommunication = React.useCallback((index: number) => {
    setFormValues(prev => ({
      ...prev,
      communication: prev.communication?.filter((_, i) => i !== index)
    }));
  }, [setFormValues]);

  return (
    <FormCard
      title={t('language.title', { ns: 'common' })}
      icon={<TranslateIcon color="primary" />}
    >
      <Grid container spacing={2}>
        <Grid columns={{ xs: 12, md: 8 }}>
          <FormControl fullWidth disabled={isSubmitting}>
            <InputLabel id="language-label">
              {t('language.selector.title', { ns: 'common' })}
            </InputLabel>
            <Select
              labelId="language-label"
              value={communication.language}
              onChange={e => handleLanguageChange(e.target.value)}
              label={t('language.selector.title', { ns: 'common' })}
            >
              <MenuItem value="">
                <em>Choose a language</em>
              </MenuItem>
              {availableLanguages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid columns={{ xs: 12, md: 4 }}>
          <Button
            variant="outlined"
            onClick={handleAddCommunication}
            fullWidth
            sx={{ height: '100%' }}
            startIcon={<AddIcon />}
            disabled={!communication.language || isSubmitting}
          >
            {t('language.add', { ns: 'common' })}
          </Button>
        </Grid>
      </Grid>

      {formValues.communication && formValues.communication.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {formValues.communication.map((comm, index) => (
              <Chip
                key={index}
                label={comm.text}
                icon={<LanguageIcon fontSize="small" />}
                onDelete={() => handleRemoveCommunication(index)}
                disabled={isSubmitting}
              />
            ))}
          </Stack>
        </Box>
      )}
    </FormCard>
  );
});

CommunicationSection.displayName = 'CommunicationSection';

export default CommunicationSection;
