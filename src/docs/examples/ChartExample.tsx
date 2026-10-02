import { AreaChart, BarChart, LineChart, DonutChart } from '../../ui/charts';
import { chartSampleData, donutSampleData } from '../chart-samples';
import '../../ui/charts.css';

export default function ChartExample({
  slug,
  state,
}: {
  slug: string;
  state?: Record<string, string | number | boolean>;
}) {
  const settings = {
    legend: true,
    tooltip: true,
    grid: true,
    xAxis: true,
    yAxis: true,
    stacked: false,
    curve: 'monotone',
    loading: false,
    empty: false,
    dataTable: 'sr-only',
    ...state,
  };
  const dataTable =
    settings.dataTable === 'false'
      ? false
      : settings.dataTable === 'visible'
        ? 'visible'
        : 'sr-only';
  const height = 280;
  const chart =
    slug === 'donut-chart' ? (
      <DonutChart
        label={state ? 'Status comparison' : 'Projects by status'}
        height={height}
        legend={!!settings.legend}
        tooltip={!!settings.tooltip}
        data={donutSampleData}
        innerRadius={`${state?.innerRadius ?? 64}%`}
        outerRadius="88%"
        loading={!!settings.loading}
        empty={!!settings.empty}
        dataTable={dataTable}
      />
    ) : (
      (() => {
        const Chart =
          slug === 'area-chart' ? AreaChart : slug === 'bar-chart' ? BarChart : LineChart;
        return (
          <Chart
            data={chartSampleData}
            index="month"
            label={state ? 'Revenue comparison' : 'Monthly revenue and costs'}
            height={height}
            series={[
              { dataKey: 'revenue', label: 'Revenue' },
              {
                dataKey: 'costs',
                label: 'Costs',
                strokeDasharray: slug === 'line-chart' ? '4 4' : undefined,
              },
            ]}
            legend={!!settings.legend}
            tooltip={!!settings.tooltip}
            grid={!!settings.grid}
            xAxis={!!settings.xAxis}
            yAxis={!!settings.yAxis}
            stacked={!!settings.stacked}
            curve={
              settings.curve === 'linear'
                ? 'linear'
                : settings.curve === 'step'
                  ? 'step'
                  : 'monotone'
            }
            dataTable={dataTable}
            loading={!!settings.loading}
            empty={!!settings.empty}
          />
        );
      })()
    );
  return (
    <div className="chart-doc-example">
      {!state && (
        <div className="chart-doc-heading">
          <div>
            <h3>{slug === 'donut-chart' ? 'Projects by status' : 'Revenue & costs'}</h3>
            <p>
              {slug === 'donut-chart' ? '50 projects across your workspace' : 'May - October 2026'}
            </p>
          </div>
          <div className="chart-doc-metric">
            <strong>{slug === 'donut-chart' ? '50' : '$2,900'}</strong>
            <span>{slug === 'donut-chart' ? 'total projects' : 'total revenue'}</span>
          </div>
        </div>
      )}
      {chart}
    </div>
  );
}
