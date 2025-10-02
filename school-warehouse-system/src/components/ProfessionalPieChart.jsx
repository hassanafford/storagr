import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { PieChart } from 'lucide-react';

const ProfessionalPieChart = ({ title, data, colors }) => {
  const [chartData, setChartData] = useState({
    series: [],
    options: {}
  });

  useEffect(() => {
    if (data && data.length > 0) {
      // Prepare chart data
      const series = data.map(item => item.value);
      const labels = data.map(item => item.label);
      
      const options = {
        chart: {
          type: 'pie',
          height: 350,
          width: '100%',
          toolbar: {
            show: false
          }
        },
        labels: labels,
        colors: colors || ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
        fill: {
          opacity: 1
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '12px',
            fontWeight: 500,
          },
          formatter: function (val, opts) {
            const total = opts.w.globals.seriesTotals.reduce((a, b) => a + b, 0);
            const percentage = ((val / total) * 100).toFixed(1);
            return `${opts.w.config.labels[opts.seriesIndex]}\n${percentage}%`;
          }
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
          fontSize: '12px',
          fontWeight: 500,
          markers: {
            width: 10,
            height: 10,
            radius: 12
          }
        },
        tooltip: {
          y: {
            formatter: function (val, opts) {
              const total = opts.w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              const percentage = ((val / total) * 100).toFixed(1);
              return `${val.toLocaleString()} عنصر (${percentage}%)`;
            }
          },
          x: {
            formatter: function (val) {
              return val;
            }
          },
          marker: {
            show: true,
          }
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: '100%'
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
      };
      
      setChartData({ series, options });
    }
  }, [data, colors]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">لا توجد بيانات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow w-full" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="h-80 w-full">
        <Chart 
          options={chartData.options} 
          series={chartData.series} 
          type="pie" 
          height="100%" 
          width="100%"
        />
      </div>
    </div>
  );
};

export default ProfessionalPieChart;