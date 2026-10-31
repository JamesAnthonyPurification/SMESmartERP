// ============================================================================
// FILE: src/frontend/components/RevenueChart.jsx
// PURPOSE: Interactive Monthly Revenue Line Chart using Chart.js
// ============================================================================

'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function RevenueChart({ monthlyRevenue = [] }) {
  const labels = monthlyRevenue.map((m) => m.month_label);
  const revenueValues = monthlyRevenue.map((m) => Number(m.revenue || 0));
  const profitValues = monthlyRevenue.map((m) => Number(m.profit || 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Monthly Revenue (৳)',
        data: revenueValues,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.14)',
        pointBackgroundColor: revenueValues.map((_, i) => (i === 2 ? '#ef233c' : '#16a34a')),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: revenueValues.map((_, i) => (i === 2 ? 6 : 4)),
        tension: 0.35,
        fill: true
      },
      {
        label: 'Net Profit (৳)',
        data: profitValues,
        borderColor: '#ef233c',
        backgroundColor: 'rgba(239, 35, 60, 0.05)',
        borderDash: [5, 5],
        pointBackgroundColor: '#ef233c',
        pointRadius: 3,
        tension: 0.35,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => `৳${val}`,
          font: { size: 11 },
          color: '#64748b'
        },
        grid: {
          color: '#f1f5f9'
        }
      },
      x: {
        ticks: {
          font: { size: 11 },
          color: '#64748b'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="w-full h-[225px]">
      <Line data={chartData} options={options} />
    </div>
  );
}

