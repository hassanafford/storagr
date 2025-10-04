import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { PieChart as PieChartIcon } from 'lucide-react';

const EnhancedPieChart = ({ 
  title, 
  data, 
  colors, 
  onRefresh,
  loading = false,
  error = null
}) => {
  const [chartData, setChartData] = useState({
    series: [],
    options: {}
  });

  useEffect(() => {
    if (data && data.length > 0) {
      // Prepare chart data
      const series = data.map(item => item.value);
      const labels = data.map(item => item.label);
      
      // Modern color palette with vibrant colors
      const defaultColors = [
        '#3B82F6', // blue-500
        '#10B981', // emerald-500
        '#8B5CF6', // violet-500
        '#F59E0B', // amber-500
        '#EF4444', // red-500
        '#EC4899', // pink-500
        '#06B6D4', // cyan-500
        '#8B5CF6', // purple-500
        '#F97316', // orange-500
        '#6366F1'  // indigo-500
      ];
      
      const options = {
        chart: {
          type: 'pie',
          height: 350,
          width: '100%',
          toolbar: {
            show: true,
            tools: {
              download: true,
              selection: false,
              zoom: false,
              zoomin: false,
              zoomout: false,
              pan: false,
              reset: false
            }
          },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        labels: labels,
        colors: colors || defaultColors,
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
            // Add safeguard to prevent "Cannot read properties of undefined" error
            if (!opts || !opts.w || !opts.w.globals || !opts.w.globals.seriesTotals) {
              return `${val}`;
            }
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
          },
          itemMargin: {
            horizontal: 5,
            vertical: 2
          }
        },
        tooltip: {
          y: {
            formatter: function (val, opts) {
              // Add safeguard to prevent "Cannot read properties of undefined" error
              if (!opts || !opts.w || !opts.w.globals || !opts.w.globals.seriesTotals) {
                return `${val.toLocaleString()} عنصر`;
              }
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

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center text-red-500">
            <p>حدث خطأ أثناء تحميل البيانات</p>
            <button 
              onClick={onRefresh}
              className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
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
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="text-gray-500 hover:text-gray-700"
            title="تحديث البيانات"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
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

export default EnhancedPieChart;