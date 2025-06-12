"use client";

import React, { ReactNode, ReactElement, useState, SyntheticEvent } from 'react';
import { Box, Tabs, Tab, useTheme } from '@mui/material';

interface TabPanelProps {
  children: ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface TabData {
  label: string;
  content: ReactNode;
  icon?: ReactElement;
}

interface CustomTabsProps {
  tabs: TabData[];
  initialTab?: number;
  variant?: 'standard' | 'fullWidth' | 'scrollable';
  orientation?: 'horizontal' | 'vertical';
  centered?: boolean;
  onChange?: (index: number) => void;
}

export default function CustomTabs({
  tabs,
  initialTab = 0,
  variant = 'standard',
  orientation = 'horizontal',
  centered = false,
  onChange
}: CustomTabsProps) {
  const theme = useTheme();
  const [value, setValue] = useState(initialTab);

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant={variant}
          orientation={orientation}
          centered={centered}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              minWidth: 0,
              px: 3,
              py: 2,
              fontWeight: 500,
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition={tab.icon ? 'start' : undefined}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.25rem',
                  mr: tab.icon ? 1 : 0,
                }
              }}
            />
          ))}
        </Tabs>
      </Box>
      {tabs.map((tab, index) => (
        <TabPanel key={index} value={value} index={index}>
          {tab.content}
        </TabPanel>
      ))}
    </Box>
  );
}
