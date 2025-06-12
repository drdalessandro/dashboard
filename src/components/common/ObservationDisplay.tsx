/**
 * ObservationDisplay Component
 * Specialized component for displaying FHIR Observation resources
 * Optimized for healthcare contexts in Mali and Sub-Saharan Africa
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Tooltip,
  Divider,
  LinearProgress,
  Stack
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Favorite as HeartIcon,
  LocalHospital as MedicalIcon,
  Speed as SpeedIcon,
  Thermostat as TemperatureIcon,
  Straighten as HeightIcon,
  MonitorWeight as WeightIcon,
  BloodtypeOutlined as BloodIcon,
  MonitorHeartOutlined as EcgIcon,
  Air as RespirationIcon,
  WbSunny as OxygenIcon
} from '@mui/icons-material';
import { Observation } from '@medplum/fhirtypes';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/fhir/formatters';

// Types for reference ranges and visual indicators
interface RangeInfo {
  low?: number;
  high?: number;
  unit?: string;
  text?: string;
}

interface ObservationDisplayProps {
  /**
   * The Observation resource to display
   */
  observation: Observation;

  /**
   * Whether to show the display in compact mode
   */
  compact?: boolean;

  /**
   * Whether to display reference ranges
   */
  showReferenceRanges?: boolean;

  /**
   * Whether to show a visual indicator for reference ranges
   */
  showVisualIndicator?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Additional style properties
   */
  style?: React.CSSProperties;

  /**
   * Click handler
   */
  onClick?: (observation: Observation) => void;
}

/**
 * Component to display FHIR Observation resources
 * Provides specialized visualization for common vitals and measurements
 */
export const ObservationDisplay: React.FC<ObservationDisplayProps> = ({
  observation,
  compact = false,
  showReferenceRanges = true,
  showVisualIndicator = true,
  className,
  style,
  onClick
}) => {
  const { t } = useTranslation(['common', 'patient']);

  // Get observation type based on code
  const getObservationType = (): string => {
    const coding = observation.code?.coding?.[0];
    if (coding) {
      return coding.display || coding.code || t('unknown', { ns: 'common' });
    }
    return observation.code?.text || t('unknown', { ns: 'common' });
  };

  // Get icon based on observation type
  const getObservationIcon = () => {
    const code = observation.code?.coding?.[0]?.code?.toLowerCase() || '';
    const system = observation.code?.coding?.[0]?.system || '';

    // LOINC codes for common observations
    if (code.includes('8867-4') || code.includes('pulse') || code.includes('heart rate')) {
      return <HeartIcon color="error" />;
    } else if (code.includes('8310-5') || code.includes('temperature') || code.includes('8331-1')) {
      return <TemperatureIcon color="error" />;
    } else if (code.includes('8302-2') || code.includes('height') || code.includes('8306-3')) {
      return <HeightIcon color="primary" />;
    } else if (code.includes('29463-7') || code.includes('weight') || code.includes('3141-9')) {
      return <WeightIcon color="primary" />;
    } else if (code.includes('blood pressure') || code.includes('55284-4') || code.includes('8480-6')) {
      return <SpeedIcon color="warning" />;
    } else if (code.includes('blood glucose') || code.includes('2339-0') || code.includes('2345-7')) {
      return <BloodIcon color="error" />;
    } else if (code.includes('ecg') || code.includes('electrocardiogram')) {
      return <EcgIcon color="error" />;
    } else if (code.includes('9279-1') || code.includes('respiratory rate')) {
      return <RespirationIcon color="info" />;
    } else if (code.includes('oxygen') || code.includes('59408-5') || code.includes('2708-6')) {
      return <OxygenIcon color="info" />;
    }

    // Default icon
    return <MedicalIcon color="primary" />;
  };

  // Extract value and unit
  const getValue = (): { value: string; unit: string } => {
    // Handle different value types
    if (observation.valueQuantity) {
      return {
        value: observation.valueQuantity.value?.toString() || '',
        unit: observation.valueQuantity.unit || observation.valueQuantity.code || ''
      };
    } else if (observation.valueString) {
      return { value: observation.valueString, unit: '' };
    } else if (observation.valueBoolean !== undefined) {
      return { value: observation.valueBoolean ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' }), unit: '' };
    } else if (observation.valueInteger !== undefined) {
      return { value: observation.valueInteger.toString(), unit: '' };
    } else if (observation.valueCodeableConcept) {
      return {
        value: observation.valueCodeableConcept.coding?.[0]?.display ||
          observation.valueCodeableConcept.text || '',
        unit: ''
      };
    } else if (observation.component && observation.component.length > 0) {
      // For multi-component observations like blood pressure
      const components = observation.component
        .map(comp => {
          if (comp.valueQuantity) {
            return `${comp.valueQuantity.value || ''} ${comp.valueQuantity.unit || ''}`;
          }
          return '';
        })
        .filter(Boolean)
        .join(' / ');

      return { value: components, unit: '' };
    }

    return { value: t('noValue', { ns: 'common' }), unit: '' };
  };

  // Get reference ranges
  const getReferenceRanges = (): RangeInfo | null => {
    if (observation.referenceRange && observation.referenceRange.length > 0) {
      const range = observation.referenceRange[0];

      // If there's a text description, use that
      if (range.text) {
        return { text: range.text };
      }

      // Otherwise extract numeric values
      return {
        low: range.low?.value,
        high: range.high?.value,
        unit: range.low?.unit || range.high?.unit || observation.valueQuantity?.unit || ''
      };
    }

    // For blood pressure, extract from components
    if (observation.component &&
      observation.code?.coding?.[0]?.code?.includes('blood pressure')) {
      const systolic = observation.component.find(c =>
        c.code?.coding?.[0]?.code?.includes('8480-6'));
      const diastolic = observation.component.find(c =>
        c.code?.coding?.[0]?.code?.includes('8462-4'));

      if (systolic?.referenceRange?.[0] && diastolic?.referenceRange?.[0]) {
        return {
          text: `${systolic.referenceRange[0].text || ''} / ${diastolic.referenceRange[0].text || ''}`
        };
      }
    }

    return null;
  };

  // Determine if value is outside reference range
  const isOutsideRange = (): boolean | undefined => {
    const { value } = getValue();
    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) return undefined;

    const range = getReferenceRanges();
    if (!range) return undefined;

    if (range.low !== undefined && numericValue < range.low) return true;
    if (range.high !== undefined && numericValue > range.high) return true;

    return false;
  };

  // Calculate position on the reference range bar
  const calculateRangePosition = (): number => {
    const { value } = getValue();
    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) return 50; // Default center position

    const range = getReferenceRanges();
    if (!range || range.low === undefined || range.high === undefined) return 50;

    // Calculate percentage position
    const rangeSize = range.high - range.low;
    if (rangeSize <= 0) return 50;

    const position = ((numericValue - range.low) / rangeSize) * 100;

    // Constrain between 0-100 for visual display
    return Math.max(0, Math.min(100, position));
  };

  // Get status display info
  const getStatusInfo = (): { color: string; text: string } => {
    switch (observation.status) {
      case 'final':
        return { color: 'success', text: t('status.final', { ns: 'common' }) };
      case 'preliminary':
        return { color: 'warning', text: t('status.preliminary', { ns: 'common' }) };
      case 'amended':
        return { color: 'info', text: t('status.amended', { ns: 'common' }) };
      case 'cancelled':
      case 'entered-in-error':
        return { color: 'error', text: t('status.cancelled', { ns: 'common' }) };
      default:
        return { color: 'default', text: observation.status || t('status.unknown', { ns: 'common' }) };
    }
  };

  // Format effective date
  const getEffectiveDate = (): string => {
    if (observation.effectiveDateTime) {
      return formatDate(observation.effectiveDateTime, { includeTime: true });
    } else if (observation.effectivePeriod?.start) {
      return formatDate(observation.effectivePeriod.start, { includeTime: true });
    }
    return t('common.unknown');
  };

  // Get custom visual indicator for specific observation types
  const renderCustomIndicator = () => {
    const { value, unit } = getValue();
    const numericValue = parseFloat(value);

    // For oxygen saturation
    if (observation.code?.coding?.[0]?.code?.includes('oxygen') ||
      observation.code?.coding?.[0]?.code?.includes('59408-5')) {
      // Oxygen range typically 94-100%
      const oxyValue = isNaN(numericValue) ? 95 : numericValue;
      const color = oxyValue >= 95 ? 'success.main' :
        oxyValue >= 90 ? 'warning.main' : 'error.main';

      return (
        <Box sx={{ width: '100%', mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={oxyValue}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'background.paper',
              '& .MuiLinearProgress-bar': {
                bgcolor: color
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption">0%</Typography>
            <Typography variant="caption">100%</Typography>
          </Box>
        </Box>
      );
    }

    // For heart rate
    if (observation.code?.coding?.[0]?.code?.includes('pulse') ||
      observation.code?.coding?.[0]?.code?.includes('heart rate')) {
      // Heart rate range typically 60-100 bpm
      const min = 40;
      const max = 120;
      const heartValue = isNaN(numericValue) ? 80 : numericValue;
      const position = Math.max(0, Math.min(100, ((heartValue - min) / (max - min)) * 100));
      const color = (heartValue >= 60 && heartValue <= 100) ? 'success.main' : 'warning.main';

      return (
        <Box sx={{ width: '100%', mt: 1 }}>
          <Box sx={{ position: 'relative', height: 10, bgcolor: 'background.paper', borderRadius: 5 }}>
            <Box sx={{
              position: 'absolute',
              left: `${position}%`,
              transform: 'translateX(-50%)',
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: color
            }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption">{min} {t('bpm', { ns: 'patient' })}</Typography>
            <Typography variant="caption">{max} {t('bpm', { ns: 'patient' })}</Typography>
          </Box>
        </Box>
      );
    }

    // Default range indicator
    const range = getReferenceRanges();
    if (range && range.low !== undefined && range.high !== undefined) {
      const position = calculateRangePosition();
      const outside = isOutsideRange();

      return (
        <Box sx={{ width: '100%', mt: 1 }}>
          <Box sx={{ position: 'relative', height: 10, bgcolor: 'background.paper', borderRadius: 5 }}>
            <Box sx={{
              position: 'absolute',
              left: `${position}%`,
              transform: 'translateX(-50%)',
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: outside ? 'error.main' : 'success.main'
            }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption">{range.low} {range.unit}</Typography>
            <Typography variant="caption">{range.high} {range.unit}</Typography>
          </Box>
        </Box>
      );
    }

    return null;
  };

  // Render compact version
  const renderCompact = () => {
    const { value, unit } = getValue();
    const statusInfo = getStatusInfo();
    const outside = isOutsideRange();

    return (
      <CardContent sx={{ p: 2, pb: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ mr: 1 }}>
            {getObservationIcon()}
          </Box>
          <Typography variant="subtitle1" noWrap>
            {getObservationType()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h5"
            component="div"
            color={outside ? 'error.main' : 'text.primary'}
          >
            {value} <Typography component="span" variant="body2">{unit}</Typography>
          </Typography>

          <Chip
            size="small"
            color={statusInfo.color as any}
            label={statusInfo.text}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          {getEffectiveDate()}
        </Typography>
      </CardContent>
    );
  };

  // Render detailed version
  const renderDetailed = () => {
    const { value, unit } = getValue();
    const statusInfo = getStatusInfo();
    const ranges = getReferenceRanges();
    const outside = isOutsideRange();

    return (
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ mr: 1.5 }}>
              {getObservationIcon()}
            </Box>
            <Typography variant="h6">
              {getObservationType()}
            </Typography>
          </Box>

          <Chip
            color={statusInfo.color as any}
            label={statusInfo.text}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          my: 2
        }}>
          <Typography
            variant="h4"
            component="div"
            color={outside ? 'error.main' : 'text.primary'}
            sx={{ fontWeight: 'bold' }}
          >
            {value}
          </Typography>
          {unit && (
            <Typography variant="h6" color="text.secondary" sx={{ ml: 1 }}>
              {unit}
            </Typography>
          )}
        </Box>

        {showVisualIndicator && renderCustomIndicator()}

        {showReferenceRanges && ranges && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'background.subtle', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('referenceRange', { ns: 'patient' })}:
            </Typography>

            <Typography variant="body2">
              {ranges.text || (
                ranges.low !== undefined && ranges.high !== undefined ?
                  `${ranges.low} - ${ranges.high} ${ranges.unit}` :
                  t('noReferenceRange', { ns: 'patient' })
              )}
            </Typography>
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid columns={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('date', { ns: 'patient' })}
            </Typography>
            <Typography variant="body2">
              {getEffectiveDate()}
            </Typography>
          </Grid>

          <Grid columns={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('performer', { ns: 'patient' })}
            </Typography>
            <Typography variant="body2">
              {observation.performer?.[0]?.display ||
                (observation.performer?.[0]?.reference &&
                  observation.performer[0].reference.split('/')[1]) ||
                t('common.unknown')}
            </Typography>
          </Grid>
        </Grid>

        {observation.note && observation.note.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('notes', { ns: 'patient' })}
            </Typography>

            <Stack spacing={1} sx={{ mt: 0.5 }}>
              {observation.note.map((note, index) => (
                <Box key={index} sx={{ p: 1, bgcolor: 'background.subtle', borderRadius: 1 }}>
                  <Typography variant="body2">
                    {note.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    );
  };

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          boxShadow: 6,
          transform: 'translateY(-2px)'
        } : {},
        ...style
      }}
      className={className}
      onClick={onClick ? () => onClick(observation) : undefined}
    >
      {compact ? renderCompact() : renderDetailed()}
    </Card>
  );
};

export default ObservationDisplay;
