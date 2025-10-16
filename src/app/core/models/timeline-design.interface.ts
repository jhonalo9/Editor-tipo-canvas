// interfaces/timeline-design.interface.ts
export interface TimelineDesign {
  id: string;
  name: string;
  description: string;
  lineStyle: LineStyle;
  markers: MarkerStyle[];
  background?: BackgroundStyle;
  layout: TimelineLayout; // Nueva propiedad para la forma
}



export interface TimelineLayout {
  type: 'horizontal' | 'vertical' | 'curve' | 'wave' | 'zigzag' | 'spiral' | 's-curve' | 'custom'; // ← AGREGADO
  orientation: 'top' | 'bottom' | 'center' | 'left' | 'right';
  curvature?: number;
  amplitude?: number;
  frequency?: number;
  segments?: number;
  // ✅ NUEVAS PROPIEDADES para s-curve
  positionX?: number;
  positionY?: number;
  intensity?: number;
  intensitycurva?: number;
  anchoTotal?: number;
  turns?: number;
}

export interface LineStyle {
  stroke: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted' | 'double';
  dashArray?: number[];
  lineCap: 'butt' | 'round' | 'square';
  shadow?: ShadowStyle;
}

export interface MarkerStyle {
  type: 'year' | 'decade' | 'century' | 'custom';
  position: 'above' | 'below' | 'both';
  interval: number;
  style: MarkerAppearance;
}

export interface MarkerAppearance {
  size: number;
  color: string;
  shape: 'line' | 'circle' | 'triangle' | 'square';
  label: {
    show: boolean;
    fontSize: number;
    fontFamily: string;
    color: string;
    position: 'inside' | 'outside';
  };
}

export interface BackgroundStyle {
  type: 'none' | 'gradient' | 'pattern';
  color?: string;
  gradient?: {
    startColor: string;
    endColor: string;
    direction: 'horizontal' | 'vertical';
  };
  opacity: number;
}

export interface ShadowStyle {
  color: string;
  blur: number;
  offset: { x: number; y: number };
  opacity: number;
}