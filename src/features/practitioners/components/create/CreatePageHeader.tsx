/**
 * CreatePageHeader.tsx
 * 
 * Reusable header component for create pages using design system
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PageHeader, ActionButton } from '@/components/designSystem';

interface CreatePageHeaderProps {
  title: string;
  onBack: () => void;
}

export const CreatePageHeader: React.FC<CreatePageHeaderProps> = React.memo(({ 
  title, 
  onBack 
}) => {
  const { t } = useTranslation('common');

  return (
    <PageHeader
      title={title}
      breadcrumbs={[
        { label: t('practitioner.list.title'), href: '/practitioners' },
        { label: title }
      ]}
      actions={
        <ActionButton
          variant="secondary"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          {t('common.back')}
        </ActionButton>
      }
    />
  );
});

CreatePageHeader.displayName = 'CreatePageHeader';
