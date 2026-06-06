import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function BonusCharts({ historicalData, projectionData, selectedScenario, scenarioLabel }) {
  const COLORS = ['#3b82f6', '#10b981', '#ec4899', '#fb923c', '#8b5cf6'];

  // Breakdown pie data
  const breakdownData = [
    { name: 'Base Personal', value: 35 },
    { name: 'Binario', value: 25 },
    { name: 'Red', value: 20 },
    { name: 'Directos', value: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* HISTORICAL EVOLUTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg"
        style={{
          background: '#121821',
          border: '1px solid #1F2A37',
        }}
      >
        <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 16px 0' }}>
          📈 Evolución Histórica (12 meses)
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" style={{ fontSize: 10 }} />
            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(4,10,22,0.95)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 8,
                color: 'white',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* PROJECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-lg"
        style={{
          background: '#121821',
          border: '1px solid #1F2A37',
        }}
      >
        <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 16px 0' }}>
          🚀 Proyección {scenarioLabel} (12 meses)
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" style={{ fontSize: 10 }} />
            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(4,10,22,0.95)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 8,
                color: 'white',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="monthly" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cumulative" stroke="#fb923c" strokeWidth={1} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* BREAKDOWN CHART */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-lg"
        style={{
          background: '#121821',
          border: '1px solid #1F2A37',
        }}
      >
        <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 16px 0' }}>
          💰 Desglose de Ingresos
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={breakdownData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {breakdownData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(4,10,22,0.95)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 8,
                color: 'white',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* COMPARISON CHART */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-lg"
        style={{
          background: '#121821',
          border: '1px solid #1F2A37',
        }}
      >
        <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 16px 0' }}>
          ⚖️ Comparativa de Ingresos Mensuales
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" style={{ fontSize: 10 }} />
            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(4,10,22,0.95)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 8,
                color: 'white',
              }}
            />
            <Legend />
            {['base', 'binary', 'network', 'direct'].map((key, idx) => (
              <Bar key={key} dataKey={key} fill={COLORS[idx]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}