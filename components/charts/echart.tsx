import SvgChart, { SVGRenderer as NativeSVGRenderer } from "@wuba/react-native-echarts/svgChart";
import * as echarts from "echarts/core";
import type { EChartsOption } from "echarts";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer as WebSVGRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";

echarts.use([
  Platform.OS === "web" ? WebSVGRenderer : NativeSVGRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
]);

type EChartProps = {
  option: EChartsOption;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
};

export function EChart({ option, width, height, style }: EChartProps) {
  const nativeChartRef = useRef<any>(null);
  const webChartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    const target = Platform.OS === "web" ? webChartRef.current : nativeChartRef.current;
    if (!target || width <= 0 || height <= 0) return;

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(target, undefined, {
        renderer: "svg",
        width,
        height,
      });
    } else {
      instanceRef.current.resize({ width, height });
    }

    instanceRef.current.setOption(option, true);
  }, [height, option, width]);

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  return (
    <View style={[{ width, height, overflow: "hidden" }, style]}>
      {Platform.OS === "web" ? (
        <div ref={webChartRef} style={{ width: `${width}px`, height: `${height}px` }} />
      ) : (
        <SvgChart ref={nativeChartRef} style={{ width, height }} />
      )}
    </View>
  );
}
