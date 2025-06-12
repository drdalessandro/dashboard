import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from 'recharts';

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
  height?: number;
  primaryColor?: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  height = 150, 
  primaryColor = '#8884d8' 
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke={primaryColor} 
          strokeWidth={2} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
