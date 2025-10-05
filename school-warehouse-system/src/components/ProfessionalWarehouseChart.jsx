import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { BarChart } from 'lucide-react';
import { getAllWarehousesService } from '../services/warehouseService';
import { getItemsByWarehouseService } from '../services/itemService';

const ProfessionalWarehouseChart = () => {
  const [warehouseData, setWarehouseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    series: [],
    options: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const warehouses = await getAllWarehousesService();
        const warehouseStats = [];

        for (const warehouse of warehouses) {
          const items = await getItemsByWarehouseService(warehouse.id);
          const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

          warehouseStats.push({
            name: warehouse.name,
            items: totalItems,
            color: getColorForWarehouse(warehouse.id)
          });
        }

        // Filter out warehouses with zero items to avoid chart errors
        const nonEmptyWarehouses = warehouseStats.filter(item => item.items > 0);

        setWarehouseData(nonEmptyWarehouses);

        // Prepare chart data
        const series = [{
          name: 'عدد العناصر',
          data: nonEmptyWarehouses.map(item => item.items)
        }];

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
              easing: 'easeinout'
            }
          },
          plotOptions: {
            bar: {
              horizontal: true,
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
            categories: nonEmptyWarehouses.map(item => item.name),
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
                cssClass: 'apexcharts-xaxis-title',
              }
            }
          },
          yaxis: {
            labels: {
              style: {
                fontSize: '12px',
                fontWeight: 500,
              }
            }
          },
          fill: {
            opacity: 1,
            colors: nonEmptyWarehouses.map(item => item.color)
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
          }
        };

        setChartData({ series, options });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching warehouse data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getColorForWarehouse = (id) => {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    // Ensure id is a valid index
    if (!id) return colors[0];
    const index = Math.abs(id.toString().charCodeAt(0)) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">نظرة عامة على مخزون المستودعات</h3>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Show message when no data is available
  if (warehouseData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">نظرة عامة على مخزون المستودعات</h3>
        </div>
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">لا توجد بيانات لعرضها</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow w-full" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <BarChart className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">نظرة عامة على مخزون المستودعات</h3>
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

export default ProfessionalWarehouseChart;