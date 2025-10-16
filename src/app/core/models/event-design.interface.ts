export interface EventDesign {
  id: string;
  name: string;
  description: string;
  category: 'con-imagen' | 'sin-imagen';
  elements: EventElement[];
  styles: EventStyles;
  isDefault?: boolean;
}

// Hacer el size más flexible con tipos discriminados
export type ElementSize = 
  | { type: 'circle'; radius: number }
  | { type: 'rectangle'; width: number; height: number; cornerRadius?: number }
  | { type: 'square'; size: number; cornerRadius?: number };

export interface EventElement {
  type: 'connector' | 'image-container' | 'image' | 'title-box' | 'title-text' | 'year-text' | 'description-text';
  position: { x: number; y: number };
  size?: ElementSize; // Cambiar a este tipo más específico
  styles: ElementStyles;
  content?: {
    field: 'title' | 'year' | 'description' | 'image';
    maxLength?: number;
  };
}

export interface EventStyles {
  backgroundColor: string;
  spacing: number;
  connectorStyle: 'solid' | 'dashed' | 'dotted';
  shadowIntensity: number;
}

export interface ElementStyles {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'bold' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  shadow?: {
    color: string;
    blur: number;
    offset: { x: number; y: number };
    opacity: number;
  };
}