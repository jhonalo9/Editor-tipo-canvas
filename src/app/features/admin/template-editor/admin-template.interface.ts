export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  plantillas?: any[]; // Opcional, si viene del backend
}








export interface AdminTemplate {
  id?: number;
  nombre: string;
  descripcion: string;
  categoria: Categoria; 
  esPublica: boolean;
  
  // Configuración visual
  configuracionVisual: {
    // Dimensiones recomendadas del canvas
    canvasWidth: number;
    canvasHeight: number;
    
    // Color de fondo
    backgroundColor: string;
    
    // Configuración de la línea de tiempo
    lineaDeTiempo: LineaDeTiempoConfig;
    
    // Zonas definidas para eventos (posiciones fijas)
    zonasEventos: ZonaEvento[];
    
    // Elementos decorativos (opcional)
    elementosDecorativos?: ElementoDecorativo[];
    portadaUrl?: string;
  };
  
  // Metadatos
  metadatos: {
    fechaCreacion: Date;
    fechaModificacion: Date;
    creadoPor: number; // userId del admin
    version: string;
    vecesUsada: number;
    thumbnail?: string; // Preview de la plantilla
    portadaUrl?:string;
    portada?:string;
  };
}


export type FormaImagen = 'rectangulo' | 'circulo' | 'estrella' | 'rombo'| 'linea' | 'linea-punteada' | 'flecha';

export interface ElementoEvento {
  id: string;
  tipo: 'imagen' | 'titulo' | 'fecha' | 'descripcion' | 'contenedor' | 'forma' | 'link' | 'personaje'; // ← AGREGAR NUEVOS TIPOS
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  configuracion: {
    // Para imagen
    forma?: FormaImagen;
    borderRadius?: number;
    objectFit?: 'cover' | 'contain' | 'fill';
    
    // Para texto (título, fecha, descripción, personaje)
    texto?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    
    // Para link
    url?: string; // ← NUEVO: URL del enlace
    textoLink?: string; // ← NUEVO: Texto que se muestra para el enlace
    abrirEnNuevaVentana?: boolean; // ← NUEVO: Si abre en nueva pestaña
    
    // Para formas
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number;
    
    // Común
    opacity?: number;
    rotation?: number;


    puntos?: number[]; // Para líneas: [x1, y1, x2, y2]
    dash?: number[]; // Para líneas punteadas: [5, 5]
    puntaFlecha?: boolean; // Para flechas
    tamañoPunta?: number; // Tamaño de la punta de flecha
    lineCap?: 'butt' | 'round' | 'square';
    lineJoin?: 'miter' | 'round' | 'bevel';
  };
  restricciones: {
    movable: boolean;
    resizable: boolean;
    rotatable: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
}

/**
 * Configuración de la línea de tiempo dibujada por el admin
 */
export interface LineaDeTiempoConfig {
  tipo: 'horizontal' | 'vertical' | 'curve' | 'wave' | 'zigzag' | 'spiral' | 'custom' |'s-curve';
  


  // Para líneas custom (dibujadas libremente)
  elementosKonva?: SerializedKonvaElement[];
  
  // Estilo general
  estilo: {
    stroke: string;
    strokeWidth: number;
    lineCap: 'butt' | 'round' | 'square';
    dashArray?: number[];
    shadow?: {
      color: string;
      blur: number;
      offset: { x: number; y: number };
      opacity: number;
    };
  };
  
  // Marcadores de año (opcional)
  marcadores?: {
    mostrar: boolean;
    intervalo: number; // cada cuántos años
    estilo: MarcadorEstilo;
  };


  positionX: number;
  positionY: number;
  intensity: number;
  anchoTotal:number;
  intensitycurva:number;
  turns: number;
  length: number;
}




export interface ZonaEvento {
  id: string;
  nombre: string;
  
  posicion: {
    x: number;
    y: number;
    anchoMaximo?: number;
    altoMaximo?: number;
  };
  
  // Elementos dentro de la zona (cada uno es independiente)
  elementos: ElementoEvento[];
  
  // Contenedor principal (opcional)
  contenedor?: {
    visible: boolean;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number;
  };
  
  orden: number;
}

/**
 * Layout de cada elemento dentro de una zona de evento
 */
export interface ElementoLayout {
  visible: boolean;
  posicionRelativa: { x: number; y: number };
  dimensiones: { width: number; height: number };
  estilos: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderRadius?: number;
    objectFit?: 'cover' | 'contain' | 'fill';
    border?: {
      color: string;
      width: number;
    };
  };
}

export interface LayoutZonaEvento {
  imagen: ElementoLayout;
  titulo: ElementoLayout;
  fecha: ElementoLayout;
  descripcion: ElementoLayout;
}

/**
 * Elementos decorativos (formas, textos, imágenes)
 */
export interface ElementoDecorativo {
  id: string;
  tipo: 'rect' | 'circle' | 'text' | 'image' | 'line' | 'star' | 'custom';
  bloqueado: boolean; // No editable por usuarios
  
  // Elemento Konva serializado
  konvaElement: SerializedKonvaElement;
}

/**
 * Elemento Konva serializado (compatible con tu método actual)
 */
export interface SerializedKonvaElement {
  tipo: string;
  x: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  
  // Propiedades específicas por tipo
  [key: string]: any;
}

export interface MarcadorEstilo {
  size: number;
  color: string;
  shape: 'line' | 'circle' | 'triangle' | 'square';
  label?: {
    show: boolean;
    fontSize: number;
    fontFamily: string;
    color: string;
  };
}

export interface ShadowConfig {
  color: string;
  blur: number;
  offset: { x: number; y: number };
  opacity: number;
}

/**
 * DTO para crear/actualizar plantillas
 */
export interface AdminTemplateRequest {
  nombre: string;
  descripcion: string;
  data: string;
  esPublica: boolean;
  categoria: {
    idCategoria: number;
  };
  
}

/**
 * Respuesta del servidor con plantilla
 */
export interface AdminTemplateResponse {
  id: number;
  nombre: string;
  descripcion: string;
  data: string;
  esPublica: boolean;
  categoria: Categoria;
  creadoPor: any;
  fechaCreacion: string;
  estado: string;
  //configuracionVisual: string;
  //thumbnail?: string;
  /*metadatos: {
    fechaCreacion: string;
    fechaModificacion: string;
    creadoPor: number;
    version: string;
    vecesUsada: number;
  };*/
}