import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PremiumTable({ columns, data, onRowClick, selectable = false }) {
  const [selected, setSelected] = useState(new Set());

  const toggleRow = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);
  };

  return (
    <div className="rounded-xl overflow-hidden glass" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <table className="w-full text-sm">
        <thead style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left w-10">
                <input type="checkbox" style={{ accentColor: '#3b82f6' }} />
              </th>
            )}
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left"
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="table-row-hover"
              style={{
                borderLeft: selected.has(row.id) ? '3px solid #3b82f6' : '3px solid transparent',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              onClick={() => onRowClick?.(row)}>
              {selectable && (
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    style={{ accentColor: '#3b82f6' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              )}
              {columns.map((col, j) => (
                <td
                  key={j}
                  className="px-4 py-3"
                  style={{
                    color: col.color ? col.color(row[col.key]) : 'rgba(255,255,255,0.75)',
                    fontWeight: col.bold ? 700 : 400,
                    fontSize: col.size || 12,
                  }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}