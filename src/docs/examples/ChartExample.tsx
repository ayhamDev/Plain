import { AreaChart, BarChart, LineChart, DonutChart } from '../../ui/charts';
import '../../ui/charts.css';
const data = [
  { month: 'May', revenue: 320, costs: 180 },
  { month: 'Jun', revenue: 510, costs: 270 },
  { month: 'Jul', revenue: 390, costs: 220 },
  { month: 'Aug', revenue: 420, costs: 240 },
  { month: 'Sep', revenue: 580, costs: 300 },
  { month: 'Oct', revenue: 680, costs: 360 },
];
export default function ChartExample({ slug }: { slug: string }) {
  if (slug === 'donut-chart')
    return (
      <DonutChart
        label="Projects by status"
        height={280}
        legend
        data={[
          { name: 'Active', value: 18 },
          { name: 'Review', value: 8 },
          { name: 'Complete', value: 24 },
        ]}
        style={{ width: '100%' }}
      />
    );
  const Chart = slug === 'area-chart' ? AreaChart : slug === 'bar-chart' ? BarChart : LineChart;
  return (
    <Chart
      data={data}
      index="month"
      label="Monthly revenue and costs"
      height={280}
      series={[
        { dataKey: 'revenue', label: 'Revenue' },
        { dataKey: 'costs', label: 'Costs' },
      ]}
      legend
      style={{ width: '100%' }}
    />
  );
}
