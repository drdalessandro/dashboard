// src/features/dashboard/components/ui/PatientVisitChart.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  SelectChangeEvent,
  Divider,
  SxProps,
  Theme,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Sample chart data
const generateChartData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return months.map(month => {
    const visits = Math.floor(Math.random() * 100) + 50;
    const target = Math.floor(Math.random() * 50) + 100;
    
    return {
      name: month,
      visits,
      target,
    };
  });
};

interface PatientVisitChartProps {
  data?: Array<{
    name: string;
    visits: number;
    target: number;
  }>;
  sx?: SxProps<Theme>; // Add sx prop for custom styling
}

const PatientVisitChart: React.FC<PatientVisitChartProps> = ({ data, sx }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<string>('monthly');
  
  // Use provided data or generate sample data
  const chartData = data || generateChartData();
  
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
        ...sx, // Apply any custom styles passed through sx prop
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="text.primary">
          Patient Visit
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            Sort by
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              displayEmpty
              variant="outlined"
              sx={{ 
                height: 36,
                fontSize: 14,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
              }}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: theme.palette.divider }} 
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              ticks={[0, 50, 100, 150, 200]}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="visits"
              stroke={theme.palette.primary.main}
              fillOpacity={1}
              fill="url(#colorVisits)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default PatientVisitChart;