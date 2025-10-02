import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { BarChart as BarChartIcon } from 'lucide-react';

const EnhancedBarChart = ({ 
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
      const series = [{
        name: 'عدد العناصر',
        data: data.map(item => item.value)
      }];
      
      const categories = data.map(item => item.label);
      
      // Modern color palette
      const defaultColors = [
        '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', 
        '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6'
      ];
      
      const options = {
        chart: {
          type: 'bar',
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
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 6,
            borderRadiusApplication: 'end',
            borderRadiusWhenStacked: 'last',
            dataLabels: {
              position: 'top',
            },
            columnWidth: '70%'
          }
        },
        dataLabels: {
          enabled: true,
          offsetX: -10,
          style: {
            fontSize: '12px',
            fontWeight: 600,
            colors: ['#fff']
          },
          formatter: function (val) {
            return val.toLocaleString();
          }
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: categories,
          labels: {
            style: {
              fontSize: '12px',
              fontWeight: 500,
            },
            formatter: function (val) {
              // Truncate long labels
              return val.length > 15 ? val.substring(0, 15) + '...' : val;
            }
          },
          title: {
            text: 'التصنيفات',
            style: {
              fontSize: '14px',
              fontWeight: 600,
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '12px',
              fontWeight: 500,
            },
            formatter: function (val) {
              return val.toLocaleString();
            }
          },
          title: {
            text: 'عدد العناصر',
            style: {
              fontSize: '14px',
              fontWeight: 600,
            }
          }
        },
        fill: {
          opacity: 1,
          colors: colors || defaultColors
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val.toLocaleString() + " عنصر"
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
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '14px',
          fontWeight: 500
        },
        grid: {
          borderColor: '#f1f1f1',
          strokeDashArray: 3
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: '100%'
            },
            plotOptions: {
              bar: {
                horizontal: true
              }
            },
            xaxis: {
              categories: categories
            },
            yaxis: {
              labels: {
                formatter: function (val) {
                  return val.toLocaleString();
                }
              }
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
          <BarChartIcon className="h-5 w-5 text-blue-600" />
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
          <BarChartIcon className="h-5 w-5 text-blue-600" />
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
          <BarChartIcon className="h-5 w-5 text-blue-600" />
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
          <BarChartIcon className="h-5 w-5 text-blue-600" />
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
      <div className="h-80 w-full overflow-x-auto">
        <Chart 
          options={chartData.options} 
          series={chartData.series} 
          type="bar" 
          height="100%" 
          width="100%"
        />
      </div>
    </div>
  );
};

export default EnhancedBarChart;