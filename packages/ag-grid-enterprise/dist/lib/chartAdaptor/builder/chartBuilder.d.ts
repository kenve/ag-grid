// ag-grid-enterprise v21.0.1
import { AxisOptions, BarSeriesOptions, CartesianChartOptions, DropShadowOptions, LineSeriesOptions, PieSeriesOptions, DoughnutChartOptions, ChartOptions, BarChartOptions, LegendOptions, PolarChartOptions, LineChartOptions, PieChartOptions, SeriesOptions, CaptionOptions } from "ag-grid-community";
import { CartesianChart } from "../../charts/chart/cartesianChart";
import { PolarChart } from "../../charts/chart/polarChart";
import { LineSeries } from "../../charts/chart/series/lineSeries";
import { BarSeries } from "../../charts/chart/series/barSeries";
import { PieSeries } from "../../charts/chart/series/pieSeries";
import { Chart } from "../../charts/chart/chart";
import { Series } from "../../charts/chart/series/series";
import { DropShadow } from "../../charts/scene/dropShadow";
import { CategoryAxis } from "../../charts/chart/axis/categoryAxis";
import { NumberAxis } from "../../charts/chart/axis/numberAxis";
import { Legend } from "../../charts/chart/legend";
import { Caption } from "../../charts/chart/caption";
declare type CartesianSeriesType = 'line' | 'bar';
declare type PolarSeriesType = 'pie';
declare type SeriesType = CartesianSeriesType | PolarSeriesType;
export declare class ChartBuilder {
    static createCartesianChart(options: CartesianChartOptions): CartesianChart;
    static createBarChart(options: BarChartOptions): CartesianChart;
    static createLineChart(options: LineChartOptions): CartesianChart;
    static createPolarChart(options: PolarChartOptions): PolarChart;
    static createDoughnutChart(options: DoughnutChartOptions): PolarChart;
    static createPieChart(options: PieChartOptions): PolarChart;
    static createLineSeries(options: LineSeriesOptions): LineSeries;
    static createSeries(options: any, type?: string): PieSeries | LineSeries | BarSeries | null;
    static initChart<C extends Chart>(chart: C, options: ChartOptions, seriesType?: SeriesType): C;
    static initCartesianChart(chart: CartesianChart, options: CartesianChartOptions, seriesType?: CartesianSeriesType): CartesianChart;
    static initPolarChart(chart: PolarChart, options: PolarChartOptions, seriesType?: PolarSeriesType): PolarChart;
    static initSeries<S extends Series<any>>(series: S, options: SeriesOptions): S;
    static initLineSeries(series: LineSeries, options: LineSeriesOptions): LineSeries;
    static initBarSeries(series: BarSeries, options: BarSeriesOptions): BarSeries;
    static initPieSeries(series: PieSeries, options: PieSeriesOptions): PieSeries;
    static initLegend(legend: Legend, options: LegendOptions): void;
    static createTitle(options: CaptionOptions): Caption;
    static createSubtitle(options: CaptionOptions): Caption;
    static createPieTitle(options: CaptionOptions): Caption;
    static createCaption(options: CaptionOptions): Caption;
    static createDropShadow(options?: DropShadowOptions): DropShadow;
    static createAxis(options: AxisOptions): CategoryAxis | NumberAxis;
}
export {};
