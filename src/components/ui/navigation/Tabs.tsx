"use client";

/**
 * Tabs Component
 * A reusable tabs component based on the Medical Dashboard UI Kit design
 */
import React, { ReactNode, useState } from 'react';
import { Box, Tabs as MuiTabs, Tab, SxProps, Theme } from '@mui/material';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

interface TabItem {
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  orientation?: 'horizontal' | 'vertical';
  defaultTab?: number;
  onChange?: (index: number) => void;
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  sx?: SxProps<Theme>;
  tabsSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  orientation = 'horizontal',
  defaultTab = 0,
  onChange,
  variant = 'standard',
  sx = {},
  tabsSx = {},
  contentSx = {},
}) => {
  const [value, setValue] = useState(defaultTab);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <MuiTabs
          value={value}
          onChange={handleChange}
          variant={variant}
          orientation={orientation}
          sx={{
            '.MuiTab-root': {
              minHeight: '48px',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'neutral.600',
              '&.Mui-selected': {
                color: 'primary.600',
                fontWeight: 600,
              },
            },
            '.MuiTabs-indicator': {
              backgroundColor: 'primary.600',
              height: '3px',
            },
            ...tabsSx,
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              id={`tab-${index}`}
              aria-controls={`tabpanel-${index}`}
              icon={tab.icon}
              iconPosition="start"
              disabled={tab.disabled}
            />
          ))}
        </MuiTabs>
      </Box>
      <Box sx={contentSx}>
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={value} index={index}>
            {tab.content}
          </TabPanel>
        ))}
      </Box>
    </Box>
  );
};

export default Tabs;
