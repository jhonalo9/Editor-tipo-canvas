

export interface PlantillaDesign {
  id?: string;
  nombre: string;
  descripcion: string;
  categoria: 'historica' | 'proyecto' | 'biografia' | 'empresarial' | 'personalizado';
  configuracion: ConfiguracionPlantilla;
  elementos: ElementoPlantilla[];
  eventosGlobales: EventoGlobal[];
  estilosGlobales: EstilosGlobales;
  creadoPor?: string;
  fechaCreacion?: Date;
  esPublica: boolean;
}

export interface ConfiguracionPlantilla {
  tipoLinea: 'recta' | 'curva' | 'vertical' | 'horizontal' | 'escalonada';
  orientacionEventos: 'alternada' | 'unilateral' | 'central';
  espaciado: number;
  mostrarLineaTiempo: boolean;
  animaciones: boolean;
}


export interface EventoGlobal {
  id: string;
  numero: number;
  //nombre: string;
  contenedores: string[]; // IDs de contenedores asignados a este evento
}

/*export interface ElementoPlantilla {
  id: string;
  tipo: 'contenedor' | 'imagen' | 'titulo' | 'año' | 'descripcion' | 'persona' | 'decoracion' | 'linea' | 'circulo';
  posicion: PosicionElemento;
  estilos: EstilosElemento;
  contenido?: string;
  reglas?: ReglasElemento;
  padreId?: string;
  imagenUrl?: string;
  esContenedor?: boolean;
  elementosInternos?: ElementoPlantilla[];
  configuracionContenedor?: ConfiguracionContenedor;
  eventos?: EventoContenedor[];
  
  // ✅ NUEVA PROPIEDAD: Para agrupamiento horizontal
  grupoHorizontalId?: string;
  eventoPadreId?: string;
}*/

export interface ElementoPlantilla {
  id: string;
  tipo: 'contenedor' | 'titulo' | 'año' | 'descripcion' | 'imagen' | 'persona' | 'linea' | 'decoracion' | 'circulo' |'titulo-linea'|'descripcion-linea';
  posicion: PosicionElemento;
  estilos: EstilosElemento;
  contenido?: string;
  esContenedor?: boolean;
  
  elementosInternos?: ElementoPlantilla[]; // Elementos dentro del contenedor
  configuracionContenedor?: ConfiguracionContenedor;
  grupoHorizontalId?: string;
  eventoAsignadoId?: string; // ID del evento global al que pertenece
  datosEvento?: DatosEvento; // ✅ NUEVA PROPIEDAD
  datosLinea?: DatosLinea;


  //los antiguos
  padreId?: string;
  eventoPadreId?: string;
  eventos?: EventoContenedor[];
}

export interface DatosEvento {
  eventoNumero: number; // 1 o 2
  //titulo: string;
  descripcion: string;
  fecha?: string;
  colorEvento: string;
}

export interface DatosLinea {
  tituloLinea: string;
  descripcionLinea: string;
  color: string;
  fontSize: number;
  fontFamily: string;
}

export interface GrupoHorizontal {
  id: string;
  elementoIds: string[];
  posicionX: number;
}

export interface PosicionElemento {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  tipoPosicion: 'absoluta' | 'relativa' | 'porcentual';
  zIndex?: number;
}

// plantilla-design.interface.ts
export interface EstilosElemento {
  backgroundColor?: string;
  color?: string;
  border?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  shadow?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  opacity?: number;
  forma?: 'rectangulo' | 'circulo' | 'rombo' | 'estrella' | 'personalizado';
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-line' | 'pre-wrap';
  overflow?: 'visible' | 'hidden' | 'clip' | 'scroll';
  textOverflow?: 'clip' | 'ellipsis';
}


export interface EstilosGlobales {
  colores: {
    primario: string;
    secundario: string;
    fondo: string;
    texto: string;
    acento: string;
  };
  tipografia: {
    familia: string;
    tamañoBase: number;
  };
  espaciado: {
    entreEventos: number;
    margen: number;
  };
}


export interface ReglasElemento {
  condicional?: {
    campo: 'año' | 'tipoEvento' | 'importancia';
    operador: '>' | '<' | '==' | '!=';
    valor: any;
    estilos: EstilosElemento;
  };
  animacion?: {
    tipo: 'entrada' | 'salida' | 'hover';
    duracion: number;
    efecto: 'desvanecer' | 'deslizar' | 'escalar';
  };
}














//===================================


// plantilla-design.interface.ts - Agregar estas interfaces


export interface EventoContenedor {
  id: string;
  nombre: string;
  elementos: ElementoPlantilla[];
  activo: boolean;
}

export interface ConfiguracionContenedor {
  maxElementos: number;
  forma: 'rectangulo' | 'circulo' | 'rombo' | 'estrella';
  alineacion: 'centro' | 'izquierda' | 'derecha';
  maxEventos?: number;
}

export interface ConfiguracionContenedor {
  maxElementos: number;
  forma: 'rectangulo' | 'circulo' | 'rombo' | 'estrella';
  alineacion: 'centro' | 'izquierda' | 'derecha';
}

// Actualizar ElementoPlantilla para incluir contenedores





