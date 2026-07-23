import { View } from 'react-native';
import Svg, { Polyline, Line, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { colors } from '@/theme';

/** Lightweight live sparkline drawn with react-native-svg (no chart lib). */
export function LineChart({
  data, width, height = 140, color = colors.brand, fill = true,
}: { data: number[]; width: number; height?: number; color?: string; fill?: boolean }) {
  const pad = 6;
  const w = Math.max(width, 40);
  const h = height;
  if (data.length < 2) {
    return <View style={{ width: w, height: h }} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaPts = `${pad},${h - pad} ${pts.join(' ')} ${(pad + (data.length - 1) * stepX).toFixed(1)},${h - pad}`;

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke={colors.border} strokeWidth={1} />
      {fill && <Polygon points={areaPts} fill="url(#lc)" />}
      <Polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
