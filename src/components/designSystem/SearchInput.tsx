import React, { useCallback, useMemo } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material/styles';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

// Move styled component outside to prevent recreation on every render
const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== 'searchSize',
})<{ searchSize: SearchInputProps['size'] }>(
  ({ theme, searchSize }) => {
    const sizeMap = {
      small: {
        height: '32px',
        fontSize: '0.75rem',
        padding: '6px 12px',
      },
      medium: {
        height: '40px',
        fontSize: '0.875rem',
        padding: '8px 16px',
      },
      large: {
        height: '48px',
        fontSize: '1rem',
        padding: '12px 16px',
      },
    };

    const currentSize = sizeMap[searchSize || 'medium'];

    return {
      '& .MuiOutlinedInput-root': {
        backgroundColor: 'var(--color-background, #ffffff)',
        borderRadius: '0.5rem',
        fontSize: currentSize.fontSize,
        fontFamily: '"Inter", "Noto Sans", sans-serif',
        transition: 'all 0.15s ease-in-out',
        height: currentSize.height,
        border: '1px solid var(--color-border, #e7eef3)',
        '& fieldset': {
          border: 'none', // Remove default MUI border since we're using custom
        },

        '&:hover': {
          borderColor: 'var(--color-copy-light, #4e7a97)',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },

        '&.Mui-focused': {
          borderColor: 'var(--color-primary, #1993e5)',
          boxShadow: '0 0 0 3px rgba(25, 147, 229, 0.1)',
          outline: 'none',
        },

        '&.Mui-disabled': {
          backgroundColor: 'var(--color-foreground, #f9fafb)',
          borderColor: 'var(--color-disabled, #d1d5db)',
          color: 'var(--color-copy-lighter, #8a9faa)',
        },

        '& .MuiInputAdornment-root': {
          color: 'var(--color-copy-light, #4e7a97)',
          marginLeft: 0,
          marginRight: theme.spacing(1),
        },
        '& .MuiInputBase-input': {
          padding: currentSize.padding,
          paddingLeft: 0,
          color: 'var(--color-copy, #0e161b)',
          fontWeight: 400,

          '&::placeholder': {
            color: 'var(--color-copy-lighter, #8a9faa)',
            opacity: 1,
            fontSize: currentSize.fontSize,
          },
        },
      },
    };
  }
);
export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  onClear,
  fullWidth = false,
  size = 'medium',
  disabled = false,
  className,
}) => {
  // Memoize event handlers to prevent recreation on every render
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange?.(newValue);
  }, [onChange]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onSearch) {
      event.preventDefault();
      onSearch(value);
    }
  }, [onSearch, value]);

  const handleClear = useCallback(() => {
    onChange?.('');
    onClear?.();
  }, [onChange, onClear]);

  // Memoize showClearButton to prevent unnecessary recalculations
  const showClearButton = useMemo(() => value.length > 0 && !disabled, [value, disabled]);

  // Memoize search icon to prevent recreation
  const searchIcon = useMemo(() => (
    <InputAdornment position="start">
      <SearchIcon
        fontSize={size === 'small' ? 'small' : 'medium'}
        sx={{
          color: 'var(--color-copy-light, #4e7a97)',
        }}
      />
    </InputAdornment>
  ), [size]);
  // Memoize clear button to prevent recreation
  const clearButton = useMemo(() => (
    showClearButton ? (
      <InputAdornment position="end">
        <IconButton
          size={size === 'small' ? 'small' : 'medium'}
          onClick={handleClear}
          edge="end"
          sx={{
            color: 'var(--color-copy-lighter, #8a9faa)',
            '&:hover': {
              backgroundColor: 'var(--color-foreground, #f9fafb)',
              color: 'var(--color-copy-light, #4e7a97)',
            },
          }}
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      </InputAdornment>
    ) : null
  ), [showClearButton, size, handleClear]);

  // Memoize InputProps object to prevent recreation
  const inputProps = useMemo(() => ({
    startAdornment: searchIcon,
    endAdornment: clearButton,
  }), [searchIcon, clearButton]);

  return (
    <StyledTextField
      fullWidth={fullWidth}
      searchSize={size}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      disabled={disabled}
      className={className}
      InputProps={inputProps}
      type="search"
    />
  );
};

export default SearchInput;