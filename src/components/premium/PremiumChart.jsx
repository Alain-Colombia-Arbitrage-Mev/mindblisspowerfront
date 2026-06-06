import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function PremiumChart({
  data,
  type = 'line',
  dataKey,
  dataKey2 = null,
  label,
  color = 'var(--vp-accent)',
  color2 = 'var(--vp-amber)',
  height = 280,
  showLegend = true,
  animated = true,
}) {
  const animationProps = animated ? {
    isAnimationActive: true,
    animationDuration: 1000,
    animationEasing: 'ease-in-out',
  } : {
    isAnimationActive: false,
  };

  const ChartComponent = {
    line: LineChart,
    area: AreaChart,
    bar: BarChart,
    composed: ComposedChart,
  }[type] || LineChart;

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    return (
      <ChartComponent {...commonProps}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--vp-border)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          stroke="var(--vp-border-strong)"
          style={{ fontSize: 11 }}
          tick={{ fill: 'var(--vp-muted)' }}
        />
        <YAxis
          stroke="var(--vp-border-strong)"
          style={{ fontSize: 11 }}
          tick={{ fill: 'var(--vp-muted)' }}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--vp-surface)',
            border: '1px solid var(--vp-border)',
            borderRadius: 8,
            color: 'var(--vp-text)',
            boxShadow: 'var(--vp-shadow)',
          }}
          labelStyle={{ color: 'var(--vp-text)' }}
          itemStyle={{ color: 'var(--vp-text-soft)' }}
          formatter={(value) => value.toLocaleString()}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: 'var(--vp-muted)' }} />}

        {type === 'line' && (
          <>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              {...animationProps}
            />
            {dataKey2 && (
              <Line
                type="monotone"
                dataKey={dataKey2}
                stroke={color2}
                strokeWidth={2}
                dot={false}
                {...animationProps}
              />
            )}
          </>
        )}

        {type === 'area' && (
          <>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={color}
              fillOpacity={0.12}
              strokeWidth={2}
              dot={false}
              {...animationProps}
            />
            {dataKey2 && (
              <Area
                type="monotone"
                dataKey={dataKey2}
                stroke={color2}
                fill={color2}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={false}
                {...animationProps}
              />
            )}
          </>
        )}

        {type === 'bar' && (
          <>
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[4, 4, 0, 0]}
              {...animationProps}
            />
            {dataKey2 && (
              <Bar
                dataKey={dataKey2}
                fill={color2}
                radius={[4, 4, 0, 0]}
                {...animationProps}
              />
            )}
          </>
        )}
      </ChartComponent>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-lg"
      style={{
        background: 'var(--vp-surface)',
        border: '1px solid var(--vp-border)',
        boxShadow: 'var(--vp-shadow)',
      }}
    >
      {label && (
        <h3 style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {label}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  );
}
