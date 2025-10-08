
// unified-editor.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Konva from 'konva';
import { PlantillaDesignService } from '../core/services/plantilla-design.service';

// Interfaces unificadas
export interface PlantillaDiseno {
  id?: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  fechaCreacion: Date;
  configuracion: {
    backgroundColor: string;
    elementos: ElementoPlantilla[];
    tipoLinea: string;
    orientacionEventos: string;
    espaciado: number;
    mostrarLineaTiempo: boolean;
    animaciones: boolean;
  };
  estilosGlobales?: {
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
  };
  thumbnail?: string;
  esPublica?: boolean;
}

export interface ElementoPlantilla {
  id: string;
  tipo: 'Rect' | 'Circle' | 'Text' | 'Image' | 'Group' | 'Line' | 'Star' | 'contenedor' | 'titulo-linea' | 'descripcion-linea' | 'titulo-evento' | 'descripcion-evento' | 'año-evento' | 'imagen-evento' | 'link-evento';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  imageUrl?: string;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  contenido?: string;
  esContenedor?: boolean;
  elementosInternos?: ElementoPlantilla[];
  configuracionContenedor?: {
    maxElementos: number;
    forma: 'rectangulo' | 'circulo' | 'rombo' | 'estrella';
    alineacion: 'centro' | 'izquierda' | 'derecha';
  };
  datosEvento?: {
    eventoNumero: number;
    descripcion: string;
    colorEvento: string;
  };
  datosLinea?: {
    tituloLinea: string;
    descripcionLinea: string;
    color: string;
    fontSize: number;
    fontFamily: string;
  };
  estilos: {
    backgroundColor?: string;
    border?: string;
    borderRadius?: number;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    borderWidth?: number;
  };
  posicion: {
    x: number;
    y: number;
    ancho: number;
    alto: number;
    tipoPosicion: 'absoluta' | 'relativa';
  };
  shadow?: {
    color: string;
    blur: number;
    offset: { x: number; y: number };
    opacity: number;
  };
  children?: ElementoPlantilla[];
  relativeX?: number;
  relativeY?: number;
  grupoHorizontalId?: string;
  eventoAsignadoId?: string;
}

interface EventoGlobal {
  id: string;
  numero: number;
  contenedores: string[];
}

interface GrupoHorizontal {
  id: string;
  elementoIds: string[];
  posicionX: number;
  eventoId: string; // Agregar esta propiedad
}



@Component({
  selector: 'app-editorofiadmin',
  imports: [CommonModule, FormsModule],
  templateUrl: './editorofiadmin.component.html',
  styleUrl: './editorofiadmin.component.css'
})

export class EditorofiadminComponent implements OnInit, AfterViewInit {
  @ViewChild('container', { static: true }) container!: ElementRef;

  // Propiedades de Konva
  stage!: Konva.Stage;
  backgroundLayer!: Konva.Layer;
  mainLayer!: Konva.Layer;

  // Modo solo diseño para admin
  modo: 'diseño' = 'diseño';
  lineaTiempoPrincipal?: Konva.Line;


  eventosDisponibles: EventoGlobal[] = [];
eventoSeleccionado: EventoGlobal | null = null;
  
  // Propiedades del editor
  backgroundColor: string = '#f9f9f9';
  showModalConfiguracion: boolean = false;

  // Plantillas y elementos
  plantillaActual: PlantillaDiseno = this.crearPlantillaVacia();
  plantillasGuardadas: PlantillaDiseno[] = [];
  elementoSeleccionado: ElementoPlantilla | null = null;
  elementoAConfigurar: ElementoPlantilla | null = null;

  // Eventos y contenedores
  eventosGlobales: EventoGlobal[] = [];
  eventoActualId: string | null = null;
  contenedorTemporal: ElementoPlantilla | null = null;
  esNuevoContenedor: boolean = false;
  layer!: Konva.Layer;
  gruposHorizontales: GrupoHorizontal[] = [];
grupoSeleccionado: GrupoHorizontal | null = null;

  // Configuración
  plantillaNombre: string = '';
  plantillaDescripcion: string = '';
  plantillaCategoria: string = 'General';
  
  categorias: string[] = ['General', 'Histórica', 'Moderna', 'Minimalista', 'Decorativa'];
  backgroundColors: string[] = [
    '#f9f9f9', '#ffffff', '#f0f8ff', '#fffaf0', '#f5f5f5',
    '#e6f3ff', '#f0fff0', '#fff0f5', '#f8f8ff', '#fafad2'
  ];

  // Herramientas organizadas por grupos
  herramientas = {
    recursos: [
      { tipo: 'contenedor', icono: '🟦', nombre: 'Contenedor Rectángulo', forma: 'rectangulo' },
      { tipo: 'contenedor', icono: '⭕', nombre: 'Contenedor Círculo', forma: 'circulo' },
      { tipo: 'contenedor', icono: '🔷', nombre: 'Contenedor Rombo', forma: 'rombo' },
      { tipo: 'contenedor', icono: '⭐', nombre: 'Contenedor Estrella', forma: 'estrella' },
      { tipo: 'linea', icono: '📏', nombre: 'Línea Decorativa' }
    ],
    datosLinea: [
      { tipo: 'titulo-linea', icono: '📝', nombre: 'Título de Línea' },
      { tipo: 'descripcion-linea', icono: '📋', nombre: 'Descripción de Línea' }
    ],
    datosEvento: [
      { tipo: 'titulo-evento', icono: '🏷️', nombre: 'Título de Evento' },
      { tipo: 'descripcion-evento', icono: '📄', nombre: 'Descripción de Evento' },
      { tipo: 'año-evento', icono: '📅', nombre: 'Año de Evento' },
      { tipo: 'imagen-evento', icono: '🖼️', nombre: 'Imagen de Evento' },
      { tipo: 'link-evento', icono: '🔗', nombre: 'Enlace de Evento' }
    ]
  };

  formasDisponibles = [
    { id: 'rectangulo', nombre: 'Rectángulo', icono: '🟦' },
    { id: 'circulo', nombre: 'Círculo', icono: '⭕' },
    { id: 'rombo', nombre: 'Rombo', icono: '🔷' },
    { id: 'estrella', nombre: 'Estrella', icono: '⭐' }
  ];

  constructor(private plantillaDesignService: PlantillaDesignService) {}

  ngOnInit(): void {
    this.cargarPlantillasGuardadas();
    this.inicializarEventosGlobales();
  }

  ngAfterViewInit(): void {
    this.initKonva();


    setTimeout(() => {
    this.actualizarGruposHorizontales();
  }, 500);
  }

  // ========== INICIALIZACIÓN KONVA ==========
  initKonva(): void {
  const width = this.container.nativeElement.offsetWidth;
  const height = 600;

  this.stage = new Konva.Stage({
    container: 'konva-container',
    width: width,
    height: height
  });

  this.backgroundLayer = new Konva.Layer();
  this.stage.add(this.backgroundLayer);

  this.mainLayer = new Konva.Layer();
  this.stage.add(this.mainLayer);

  // Inicializar también la capa principal (layer) para compatibilidad
  this.layer = this.mainLayer;

  this.actualizarFondo(this.backgroundColor);
  
  // Dibujar la línea de tiempo inicial
  setTimeout(() => {
    this.dibujarLineaTiempoPrincipal();
  }, 100);
}
  
escalaActual: number = 1;

  zoomIn(): void {
    this.escalaActual = Math.min(this.escalaActual + 0.1, 2);
    this.aplicarZoom();
  }

  zoomOut(): void {
    this.escalaActual = Math.max(this.escalaActual - 0.1, 0.5);
    this.aplicarZoom();
  }


 

  resetZoom(): void {
    this.escalaActual = 1;
    this.aplicarZoom();
  }

  private aplicarZoom(): void {
    if (this.stage) {
      this.stage.scale({ x: this.escalaActual, y: this.escalaActual });
      this.mainLayer.batchDraw();
    }
  }


  eliminarElementoSeleccionado(): void {
    if (!this.elementoSeleccionado) return;

    if (confirm('¿Está seguro de que desea eliminar este elemento?')) {
      // Eliminar del array de elementos
      this.plantillaActual.configuracion.elementos = this.plantillaActual.configuracion.elementos.filter(
        elemento => elemento.id !== this.elementoSeleccionado!.id
      );

      // Eliminar del layer de Konva
      const node = this.mainLayer.findOne(`#${this.elementoSeleccionado.id}`);
      if (node) {
        node.remove();
      }

      // Limpiar selección
      this.elementoSeleccionado = null;
      this.mainLayer.draw();
    }
  }


  




  actualizarFondo(color: string): void {
    this.backgroundColor = color;
    this.backgroundLayer.destroyChildren();
    
    const background = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      fill: color,
      listening: false
    });

    this.backgroundLayer.add(background);
    this.backgroundLayer.draw();
  }


  actualizarGruposHorizontales(): void {
  this.gruposHorizontales = [];
  
  // Agrupar contenedores por evento
  this.eventosGlobales.forEach(evento => {
    if (evento.contenedores.length > 0) {
      const grupo: GrupoHorizontal = {
        id: `grupo-${evento.id}`,
        elementoIds: [...evento.contenedores],
        posicionX: this.calcularPosicionInicialGrupo(evento),
        eventoId: evento.id
      };
      this.gruposHorizontales.push(grupo);
    }
  });
  
  console.log('Grupos horizontales actualizados:', this.gruposHorizontales);
}


private calcularPosicionInicialGrupo(evento: EventoGlobal): number {
  const contenedores = this.plantillaActual.configuracion.elementos.filter(
    el => evento.contenedores.includes(el.id)
  );
  
  if (contenedores.length === 0) return 100;
  
  // Usar la posición X del primer contenedor como referencia
  return Math.min(...contenedores.map(c => c.x));
}


seleccionarGrupo(grupo: GrupoHorizontal): void {
  this.grupoSeleccionado = grupo;
  console.log('Grupo seleccionado:', grupo);
  
  // Resaltar visualmente los contenedores del grupo
  this.resaltarContenedoresGrupo(grupo);
}



private resaltarContenedoresGrupo(grupo: GrupoHorizontal): void {
  // Primero quitar resaltado de todos los contenedores
  this.plantillaActual.configuracion.elementos.forEach(elemento => {
    if (elemento.esContenedor) {
      elemento.estilos.border = elemento.datosEvento?.colorEvento || '#3498db';
      elemento.estilos.borderWidth = 2;
    }
  });
  
  // Resaltar contenedores del grupo seleccionado
  grupo.elementoIds.forEach(contenedorId => {
    const contenedor = this.plantillaActual.configuracion.elementos.find(
      el => el.id === contenedorId
    );
    if (contenedor) {
      contenedor.estilos.border = '#e74c3c'; // Color de resaltado
      contenedor.estilos.borderWidth = 4;
    }
  });
  
  this.redibujarTodosLosElementos();
}


moverGrupoHorizontal(deltaX: number): void {
  if (!this.grupoSeleccionado) return;
  
  const grupo = this.grupoSeleccionado;
  
  // Mover todos los contenedores del grupo
  grupo.elementoIds.forEach(contenedorId => {
    const contenedor = this.plantillaActual.configuracion.elementos.find(
      el => el.id === contenedorId
    );
    if (contenedor) {
      contenedor.x += deltaX;
      contenedor.posicion.x += deltaX;
    }
  });
  
  // Actualizar posición del grupo
  grupo.posicionX += deltaX;
  
  this.redibujarTodosLosElementos();
  console.log(`Grupo movido ${deltaX}px. Nueva posición: ${grupo.posicionX}`);
}


configurarDragGrupos(): void {
  this.stage.on('dragmove', (e) => {
    if (this.grupoSeleccionado && e.target) {
      const targetId = e.target.id();
      
      // Si se está arrastrando un contenedor del grupo seleccionado
      if (this.grupoSeleccionado.elementoIds.includes(targetId)) {
        const deltaX = e.target.x() - this.plantillaActual.configuracion.elementos
          .find(el => el.id === targetId)?.x!;
        
        // Mover todo el grupo
        this.moverGrupoHorizontal(deltaX);
      }
    }
  });
}



moverGrupoAPosicion(nuevaX: number): void {
  if (!this.grupoSeleccionado) return;
  
  const grupo = this.grupoSeleccionado;
  const deltaX = nuevaX - grupo.posicionX;
  
  this.moverGrupoHorizontal(deltaX);
}


agruparContenedoresManual(contenedorIds: string[]): void {
  if (contenedorIds.length === 0) return;
  
  // Encontrar el evento común (deberían ser del mismo evento)
  const eventosComunes = this.eventosGlobales.filter(evento =>
    contenedorIds.every(id => evento.contenedores.includes(id))
  );
  
  if (eventosComunes.length === 0) {
    alert('Los contenedores deben pertenecer al mismo evento para agruparlos');
    return;
  }
  
  const eventoId = eventosComunes[0].id;
  const grupoExistente = this.gruposHorizontales.find(g => g.eventoId === eventoId);
  
  if (grupoExistente) {
    // Actualizar grupo existente
    grupoExistente.elementoIds = [...new Set([...grupoExistente.elementoIds, ...contenedorIds])];
  } else {
    // Crear nuevo grupo
    const nuevoGrupo: GrupoHorizontal = {
      id: `grupo-manual-${this.generarIdElemento()}`,
      elementoIds: contenedorIds,
      posicionX: this.calcularPosicionInicialGrupo(eventosComunes[0]),
      eventoId: eventoId
    };
    this.gruposHorizontales.push(nuevoGrupo);
  }
  
  this.actualizarVistaElemento();
  console.log('Contenedores agrupados manualmente:', contenedorIds);
}


desagruparContenedores(grupoId: string): void {
  this.gruposHorizontales = this.gruposHorizontales.filter(g => g.id !== grupoId);
  
  if (this.grupoSeleccionado?.id === grupoId) {
    this.grupoSeleccionado = null;
  }
  
  this.actualizarVistaElemento();
  console.log('Grupo desagregado:', grupoId);
}


getGruposDisponibles(): GrupoHorizontal[] {
  return this.gruposHorizontales;
}

getEventoDeGrupo(grupo: GrupoHorizontal): EventoGlobal | null {
  return this.eventosGlobales.find(e => e.id === grupo.eventoId) || null;
}

getContenedoresDeGrupo(grupo: GrupoHorizontal): ElementoPlantilla[] {
  return this.plantillaActual.configuracion.elementos.filter(
    el => grupo.elementoIds.includes(el.id)
  );
}

estaEnGrupo(contenedorId: string): boolean {
  return this.gruposHorizontales.some(grupo => 
    grupo.elementoIds.includes(contenedorId)
  );
}




  // ========== GESTIÓN DE EVENTOS ==========
  private inicializarEventosGlobales(): void {
  if (this.eventosGlobales.length === 0) {
    const primerEvento = this.crearEventoGlobal(1);
    this.eventosGlobales.push(primerEvento);
    this.eventoActualId = primerEvento.id;
    this.eventoSeleccionado = primerEvento;
  }
  this.actualizarEventosDisponibles();
}


actualizarEventosDisponibles(): void {
  this.eventosDisponibles = [...this.eventosGlobales].sort((a, b) => a.numero - b.numero);
}

  private crearEventoGlobal(numero: number): EventoGlobal {
    return {
      id: 'evento-' + this.generarIdElemento(),
      numero: numero,
      contenedores: []
    };
  }

  obtenerSiguienteNumeroEvento(): number {
    if (this.eventosGlobales.length === 0) return 1;
    return Math.max(...this.eventosGlobales.map(e => e.numero)) + 1;
  }

  getEventosDisponibles(): EventoGlobal[] {
    return this.eventosGlobales.sort((a, b) => a.numero - b.numero);
  }

  getEventoActual(): EventoGlobal | null {
    if (!this.eventoActualId) return this.eventosGlobales[0] || null;
    return this.eventosGlobales.find(e => e.id === this.eventoActualId) || null;
  }



  

  // ========== CREACIÓN DE ELEMENTOS ==========
  agregarElemento(tipo: string, forma?: string): void {
    switch (tipo) {
      case 'contenedor':
        this.crearContenedorConForma(forma || 'rectangulo');
        break;
      case 'titulo-linea':
      case 'descripcion-linea':
        this.crearDatosLinea(tipo);
        break;
      case 'titulo-evento':
      case 'descripcion-evento':
      case 'año-evento':
      case 'imagen-evento':
      case 'link-evento':
        this.crearDatosEvento(tipo);
        break;
      case 'linea':
        this.crearLineaDecorativa();
        break;
      default:
        console.warn('Tipo de elemento no reconocido:', tipo);
    }
  }

  private crearContenedorConForma(forma: string): void {
  const posicionInicial = this.calcularPosicionEnLinea();
  
  // Determinar el evento al que asignar el contenedor
  let eventoAsignado: EventoGlobal;
  
  if (this.eventoSeleccionado) {
    // Usar el evento seleccionado manualmente
    eventoAsignado = this.eventoSeleccionado;
  } else {
    // Crear nuevo evento automáticamente
    const nuevoNumeroEvento = this.obtenerSiguienteNumeroEvento();
    eventoAsignado = this.crearEventoGlobal(nuevoNumeroEvento);
    this.eventosGlobales.push(eventoAsignado);
    this.eventoSeleccionado = eventoAsignado;
  }
  
  this.contenedorTemporal = {
    id: this.generarIdElemento(),
    tipo: 'contenedor',
    x: posicionInicial.x,
    y: posicionInicial.y,
    width: 200,
    height: 120,
    estilos: this.getEstilosPorDefecto('contenedor'),
    contenido: `Evento ${eventoAsignado.numero}`,
    esContenedor: true,
    posicion: {
      x: posicionInicial.x,
      y: posicionInicial.y,
      ancho: 200,
      alto: 120,
      tipoPosicion: 'absoluta'
    },
    elementosInternos: [],
    configuracionContenedor: {
      maxElementos: 5,
      forma: forma as any,
      alineacion: 'centro'
    },
    eventoAsignadoId: eventoAsignado.id,
    datosEvento: {
      eventoNumero: eventoAsignado.numero,
      descripcion: 'Descripción del evento...',
      colorEvento: '#3498db'
    }
  };
  
  // Agregar contenedor al evento
  eventoAsignado.contenedores.push(this.contenedorTemporal.id);
  
  this.esNuevoContenedor = true;
  this.eventoActualId = eventoAsignado.id;
  
  this.abrirModalConfiguracion(this.contenedorTemporal as any);
  this.actualizarEventosDisponibles();
}



seleccionarEvento(evento: EventoGlobal): void {
  this.eventoSeleccionado = evento;
  this.eventoActualId = evento.id;
  console.log('Evento seleccionado:', evento.numero);
}


crearNuevoEvento(): void {
  const nuevoNumero = this.obtenerSiguienteNumeroEvento();
  const nuevoEvento = this.crearEventoGlobal(nuevoNumero);
  this.eventosGlobales.push(nuevoEvento);
  this.seleccionarEvento(nuevoEvento);
  this.actualizarEventosDisponibles();
}




  private crearDatosLinea(tipo: string): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    
   const nuevoElemento: ElementoPlantilla = {
  id: this.generarIdElemento(),
  tipo: tipo as any,
  x: posicionInicial.x,
  y: posicionInicial.y,
  width: this.getAnchoPorDefecto(tipo),
  height: this.getAltoPorDefecto(tipo),
  estilos: this.getEstilosPorDefecto(tipo),
  contenido: this.getContenidoPorDefecto(tipo),
  esContenedor: false,
  datosLinea: {
    tituloLinea: tipo === 'titulo-linea' ? 'Título de la Línea' : '',
    descripcionLinea: tipo === 'descripcion-linea' ? 'Descripción de la línea temporal...' : '',
    color: '#2c3e50',
    fontSize: tipo === 'titulo-linea' ? 18 : 14,
    fontFamily: 'Arial, sans-serif'
  },
  posicion: {
    x: posicionInicial.x,
    y: posicionInicial.y,
    ancho: this.getAnchoPorDefecto(tipo),
    alto: this.getAltoPorDefecto(tipo),
    tipoPosicion: 'absoluta'
  }
};


    this.plantillaActual.configuracion.elementos.push(nuevoElemento);
    this.dibujarElemento(nuevoElemento);
    
    setTimeout(() => {
      this.abrirModalConfiguracion(nuevoElemento);
    }, 100);
  }

  private crearDatosEvento(tipo: string): void {
    const posicionInicial = this.calcularPosicionEnLinea();
   const nuevoElemento: ElementoPlantilla = {
  id: this.generarIdElemento(),
  tipo: tipo as any,
  x: posicionInicial.x,
  y: posicionInicial.y,
  width: this.getAnchoPorDefecto(tipo),
  height: this.getAltoPorDefecto(tipo),
  estilos: this.getEstilosPorDefecto(tipo),
  contenido: this.getContenidoPorDefecto(tipo),
  esContenedor: false,
  posicion: {
    x: posicionInicial.x,
    y: posicionInicial.y,
    ancho: this.getAnchoPorDefecto(tipo),
    alto: this.getAltoPorDefecto(tipo),
    tipoPosicion: 'absoluta'
  }
};


    this.plantillaActual.configuracion.elementos.push(nuevoElemento);
    this.dibujarElemento(nuevoElemento);
    
    // Si es un elemento libre (no dentro de contenedor), abrir modal para configurar
    setTimeout(() => {
      this.abrirModalConfiguracion(nuevoElemento);
    }, 100);
  }

  private crearLineaDecorativa(): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    
    const nuevoElemento: ElementoPlantilla = {
  id: this.generarIdElemento(),
  tipo: 'Line',
  x: posicionInicial.x,
  y: posicionInicial.y,
  width: 150,
  height: 5,
  stroke: '#34495e',
  strokeWidth: 3,
  estilos: {
    border: '#34495e',
    borderWidth: 3
  },
  esContenedor: false,
  posicion: {
    x: posicionInicial.x,
    y: posicionInicial.y,
    ancho: 150,
    alto: 5,
    tipoPosicion: 'absoluta'
  }
};

    this.plantillaActual.configuracion.elementos.push(nuevoElemento);
    this.dibujarElemento(nuevoElemento);
  }

  // ========== MODALES Y CONFIGURACIÓN ==========
  abrirModalConfiguracion(elemento: ElementoPlantilla): void {
    this.elementoAConfigurar = elemento;
    this.tabActiva = 'general';
    if (elemento.esContenedor && !elemento.datosEvento) {
      elemento.datosEvento = {
        eventoNumero: 1,
        descripcion: 'Descripción del evento...',
        colorEvento: elemento.estilos.border || '#3498db'
      };
    }
    
    if ((elemento.tipo === 'titulo-linea' || elemento.tipo === 'descripcion-linea') && !elemento.datosLinea) {
      elemento.datosLinea = {
        tituloLinea: elemento.tipo === 'titulo-linea' ? elemento.contenido || '' : '',
        descripcionLinea: elemento.tipo === 'descripcion-linea' ? elemento.contenido || '' : '',
        color: elemento.estilos.color || '#2c3e50',
        fontSize: elemento.estilos.fontSize || (elemento.tipo === 'titulo-linea' ? 18 : 14),
        fontFamily: elemento.estilos.fontFamily || 'Arial, sans-serif'
      };
    }
    
    this.showModalConfiguracion = true;
  }

  cerrarModalConfiguracion(): void {
    if (!this.esNuevoContenedor && this.elementoAConfigurar) {
      this.actualizarVistaElemento();
    }
    
    this.showModalConfiguracion = false;
    this.elementoAConfigurar = null;
    
    if (this.esNuevoContenedor) {
      this.contenedorTemporal = null;
      this.esNuevoContenedor = false;
    }
  }

  aplicarYCrearContenedor(): void {
    if (this.esNuevoContenedor && this.contenedorTemporal && this.eventoActualId) {
      // Asignar el contenedor al evento
      const evento = this.eventosGlobales.find(e => e.id === this.eventoActualId);
      if (evento) {
        evento.contenedores.push(this.contenedorTemporal.id);
      }
      
      this.plantillaActual.configuracion.elementos.push(this.contenedorTemporal);
      this.dibujarElemento(this.contenedorTemporal);
      
      this.contenedorTemporal = null;
      this.esNuevoContenedor = false;
    } else if (this.elementoAConfigurar) {
      this.actualizarVistaElemento();
    }
    
    this.cerrarModalConfiguracion();
  }

elementoTipoSeleccionado: string = '';
  agregarElementoSeleccionado(): void {
  if (!this.elementoTipoSeleccionado) return;
  
  this.agregarElementoAContenedor(this.elementoTipoSeleccionado);
  this.elementoTipoSeleccionado = ''; // Limpiar selección
}






  cancelarCreacionContenedor(): void {
    if (this.esNuevoContenedor) {
      // Eliminar el evento creado para este contenedor si no hay otros contenedores
      const evento = this.eventosGlobales.find(e => e.id === this.eventoActualId);
      if (evento && evento.contenedores.length === 0) {
        this.eventosGlobales = this.eventosGlobales.filter(e => e.id !== this.eventoActualId);
      }
      
      this.contenedorTemporal = null;
      this.esNuevoContenedor = false;
    }
    this.cerrarModalConfiguracion();
  }

  // ========== CAMBIAR EVENTO DE CONTENEDOR ==========
  cambiarContenedorAEvento(eventoId: string): void {
  if (!this.elementoAConfigurar || !this.elementoAConfigurar.esContenedor) return;
  
  const nuevoEvento = this.eventosGlobales.find(e => e.id === eventoId);
  if (!nuevoEvento) return;
  
  // Remover de evento anterior
  const eventoAnterior = this.eventosGlobales.find(e => 
    e.contenedores.includes(this.elementoAConfigurar!.id)
  );
  
  if (eventoAnterior) {
    eventoAnterior.contenedores = eventoAnterior.contenedores.filter(
      id => id !== this.elementoAConfigurar!.id
    );
  }
  
  // Agregar al nuevo evento
  if (!nuevoEvento.contenedores.includes(this.elementoAConfigurar.id)) {
    nuevoEvento.contenedores.push(this.elementoAConfigurar.id);
  }
  
  // Actualizar datos del contenedor
  this.elementoAConfigurar.eventoAsignadoId = nuevoEvento.id;
  if (this.elementoAConfigurar.datosEvento) {
    this.elementoAConfigurar.datosEvento.eventoNumero = nuevoEvento.numero;
  }
  
  this.eventoActualId = nuevoEvento.id;
  this.eventoSeleccionado = nuevoEvento;
  
  // Actualizar contenido visual
  if (this.elementoAConfigurar.contenido) {
    this.elementoAConfigurar.contenido = `Evento ${nuevoEvento.numero}`;
  }
  
  this.actualizarVistaElemento();
  this.actualizarEventosDisponibles();
  this.actualizarGruposHorizontales();
}




  // ========== ELEMENTOS INTERNOS DE CONTENEDORES ==========
  getElementosDisponiblesParaContenedor(): any[] {
    return [
      { tipo: 'titulo-evento', nombre: 'Título del Evento', icono: '🏷️' },
      { tipo: 'descripcion-evento', nombre: 'Descripción del Evento', icono: '📄' },
      { tipo: 'año-evento', nombre: 'Año del Evento', icono: '📅' },
      { tipo: 'imagen-evento', nombre: 'Imagen del Evento', icono: '🖼️' },
      { tipo: 'link-evento', nombre: 'Enlace del Evento', icono: '🔗' }
    ];
  }

  getElementosDisponiblesParaEventoActual(): any[] {
  if (!this.eventoActualId || !this.elementoAConfigurar) {
    console.log('No hay evento actual o elemento a configurar');
    return [];
  }
  
  const evento = this.eventosGlobales.find(e => e.id === this.eventoActualId);
  if (!evento) {
    console.log('Evento no encontrado:', this.eventoActualId);
    return [];
  }
  
  // Obtener elementos ya usados en este evento
  const elementosUsados = new Set<string>();
  
  evento.contenedores.forEach(contenedorId => {
    const contenedor = this.plantillaActual.configuracion.elementos.find(
      el => el.id === contenedorId
    );
    if (contenedor && contenedor.elementosInternos) {
      contenedor.elementosInternos.forEach(elem => {
        elementosUsados.add(elem.tipo);
      });
    }
  });
  
  const elementosDisponibles = this.getElementosDisponiblesParaContenedor()
    .filter(elem => !elementosUsados.has(elem.tipo));
  
  console.log('Elementos usados:', Array.from(elementosUsados));
  console.log('Elementos disponibles filtrados:', elementosDisponibles);
  
  return elementosDisponibles;
}


getContenedoresDelEventoActual(): ElementoPlantilla[] {
  if (!this.eventoActualId) return [];
  
  const evento = this.eventosGlobales.find(e => e.id === this.eventoActualId);
  if (!evento) return [];
  
  return this.plantillaActual.configuracion.elementos.filter(
    elemento => elemento.esContenedor && evento.contenedores.includes(elemento.id)
  );
}

eliminarEvento(evento: EventoGlobal): void {
  if (evento.contenedores.length > 0) {
    alert('No se puede eliminar un evento que tiene contenedores asignados');
    return;
  }
  
  this.eventosGlobales = this.eventosGlobales.filter(e => e.id !== evento.id);
  this.actualizarEventosDisponibles();
  
  // Seleccionar el primer evento disponible
  if (this.eventosDisponibles.length > 0) {
    this.seleccionarEvento(this.eventosDisponibles[0]);
  } else {
    this.eventoSeleccionado = null;
    this.eventoActualId = null;
  }
}


tabActiva: string = 'general';

// Método para cambiar pestañas
cambiarTab(tab: string): void {
  this.tabActiva = tab;
}

// Método para verificar si una pestaña está activa
esTabActiva(tab: string): boolean {
  return this.tabActiva === tab;
}

  agregarElementoAContenedor(elementoTipo: string): void {
  if (!this.elementoAConfigurar || !elementoTipo || !this.elementoAConfigurar.esContenedor) {
    console.warn('No se puede agregar elemento: condiciones no cumplidas');
    return;
    this.actualizarGruposHorizontales();
  }

  // Inicializar elementosInternos si no existen
  if (!this.elementoAConfigurar.elementosInternos) {
    this.elementoAConfigurar.elementosInternos = [];
  }

  // Verificar límite de elementos
  const maxElementos = this.elementoAConfigurar.configuracionContenedor?.maxElementos || 5;
  if (this.elementoAConfigurar.elementosInternos.length >= maxElementos) {
    alert(`No se pueden agregar más de ${maxElementos} elementos a este contenedor`);
    return;
  }

  // Crear nuevo elemento
  const nuevoElemento: ElementoPlantilla = {
    id: this.generarIdElemento(),
    tipo: elementoTipo as any,
    contenido: this.getContenidoPorDefecto(elementoTipo),
    estilos: this.getEstilosPorDefecto(elementoTipo),
    esContenedor: false,
    x: 0, // Posición relativa dentro del contenedor
    y: 0,
    posicion: {
      x: 0,
      y: 0,
      ancho: this.getAnchoPorDefecto(elementoTipo),
      alto: this.getAltoPorDefecto(elementoTipo),
      tipoPosicion: 'relativa'
    }
  };

  // Agregar al contenedor
  this.elementoAConfigurar.elementosInternos.push(nuevoElemento);
  
  console.log('Elemento agregado:', nuevoElemento);
  console.log('Elementos internos actuales:', this.elementoAConfigurar.elementosInternos);
  
  this.actualizarVistaElemento();
}

  removerElementoDeContenedor(index: number): void {
    if (!this.elementoAConfigurar || !this.elementoAConfigurar.elementosInternos) return;
    
    this.elementoAConfigurar.elementosInternos.splice(index, 1);
    this.actualizarVistaElemento();
  }

  getElementosEventoActual(): ElementoPlantilla[] {
    if (!this.elementoAConfigurar || !this.elementoAConfigurar.esContenedor) return [];
    return this.elementoAConfigurar.elementosInternos || [];
  }

  // ========== DIBUJAR ELEMENTOS ==========
  dibujarElemento(elemento: ElementoPlantilla): void {
    let shape: Konva.Shape | Konva.Group;

    if (elemento.esContenedor) {
      shape = this.crearContenedor(elemento);
    } else {
      switch (elemento.tipo) {
        case 'Text':
        case 'titulo-linea':
        case 'descripcion-linea':
        case 'titulo-evento':
        case 'descripcion-evento':
        case 'año-evento':
        case 'link-evento':
          shape = new Konva.Text({
            x: elemento.x,
            y: elemento.y,
            text: elemento.contenido || 'Texto de ejemplo',
            fontSize: elemento.estilos.fontSize || 14,
            fontFamily: elemento.estilos.fontFamily || 'Arial',
            fill: elemento.estilos.color || '#000000',
            width: elemento.width,
            draggable: true
          });
          break;

        case 'Line':
          shape = new Konva.Line({
            points: [elemento.x, elemento.y, (elemento.x || 0) + (elemento.width || 150), elemento.y],
            stroke: elemento.stroke || '#34495e',
            strokeWidth: elemento.strokeWidth || 3,
            lineCap: 'round',
            lineJoin: 'round',
            draggable: true
          });
          break;

        case 'imagen-evento':
          shape = new Konva.Rect({
            x: elemento.x,
            y: elemento.y,
            width: elemento.width || 100,
            height: elemento.height || 100,
            fill: '#e9ecef',
            stroke: '#6c757d',
            strokeWidth: 1,
            cornerRadius: elemento.estilos.borderRadius || 0,
            draggable: true
          });
          break;

        default:
          return;
      }
    }

    if (!shape) return;
    shape.id(elemento.id);

    // Configurar interacciones
    shape.on('click', (e) => {
      e.cancelBubble = true;
      this.seleccionarElemento(elemento, shape);
    });

    shape.on('dblclick', (e) => {
      e.cancelBubble = true;
      this.abrirModalConfiguracion(elemento);
    });

    shape.on('dragend', () => {
      elemento.x = shape.x();
      elemento.y = shape.y();
    });

    this.mainLayer.add(shape);
    this.mainLayer.draw();
  }

  private crearContenedor(elemento: ElementoPlantilla): Konva.Group {
  const group = new Konva.Group({
    x: elemento.x,
    y: elemento.y,
    draggable: true,
  });

  let contenedorShape: Konva.Shape;
  const colorEvento = elemento.datosEvento?.colorEvento || elemento.estilos.border || '#3498db';
  const colorFondo = elemento.estilos.backgroundColor || '#ffffff';

  switch (elemento.configuracionContenedor?.forma) {
    case 'circulo':
      contenedorShape = new Konva.Circle({
        radius: (elemento.width || 120) / 2,
        fill: colorFondo,
        stroke: colorEvento,
        strokeWidth: elemento.estilos.borderWidth || 2,
      });
      break;

    case 'rombo':
      contenedorShape = new Konva.Line({
        points: [
          (elemento.width || 120) / 2, 0,
          (elemento.width || 120), (elemento.height || 100) / 2,
          (elemento.width || 120) / 2, (elemento.height || 100),
          0, (elemento.height || 100) / 2,
        ],
        closed: true,
        fill: colorFondo,
        stroke: colorEvento,
        strokeWidth: elemento.estilos.borderWidth || 2,
      });
      break;

    case 'estrella':
      contenedorShape = new Konva.Star({
        numPoints: 5,
        innerRadius: (elemento.width || 120) / 4,
        outerRadius: (elemento.width || 120) / 2,
        fill: colorFondo,
        stroke: colorEvento,
        strokeWidth: elemento.estilos.borderWidth || 2,
      });
      break;

    case 'rectangulo':
    default:
      contenedorShape = new Konva.Rect({
        width: elemento.width || 120,
        height: elemento.height || 100,
        cornerRadius: elemento.estilos.borderRadius || 8,
        fill: colorFondo,
        stroke: colorEvento,
        strokeWidth: elemento.estilos.borderWidth || 2,
      });
      break;
  }

  contenedorShape.id(elemento.id);
  group.add(contenedorShape);

   if (elemento.elementosInternos && elemento.elementosInternos.length > 0) {
    this.dibujarElementosInternos(elemento, group);
  }

  // Click → seleccionar
  group.on('click', (e) => {
    e.cancelBubble = true;
    this.seleccionarElemento(elemento, group);
  });

  // Doble click → abrir modal configuración
  group.on('dblclick', (e) => {
    e.cancelBubble = true;
    this.abrirModalConfiguracion(elemento);
  });

  // Drag end → actualizar coordenadas
  group.on('dragend', () => {
    elemento.x = group.x();
    elemento.y = group.y();
  });

  return group;
}


 /*dibujarLineaTiempoPrincipal(): void {
    if (!this.plantillaActual.configuracion.mostrarLineaTiempo) {
      if (this.lineaTiempoPrincipal) {
        this.lineaTiempoPrincipal.remove();
        this.lineaTiempoPrincipal = undefined;
      }
      return;
    }

    const config = this.plantillaActual.configuracion;
    const anchoArea = this.stage.width() - 100;
    const altoArea = this.stage.height() - 100;
    const centroX = anchoArea / 2 + 50;
    const centroY = altoArea / 2 + 50;

    let puntos: number[] = [];

    switch (config.tipoLinea) {
      case 'recta':
        puntos = [50, centroY, this.stage.width() - 50, centroY];
        break;
      case 'curva':
        puntos = this.generarCurvaCompleta(50, centroY - 50, this.stage.width() - 50, centroY - 50);
        break;
      case 'vertical':
        puntos = [centroX, 50, centroX, this.stage.height() - 50];
        break;
      case 'horizontal':
        puntos = [50, centroY, this.stage.width() - 50, centroY];
        break;
      case 'escalonada':
        puntos = this.generarEscalonCompleto(50, centroY, this.stage.width() - 50, centroY);
        break;
      default:
        puntos = [50, centroY, this.stage.width() - 50, centroY];
    }

    if (this.lineaTiempoPrincipal) {
      this.lineaTiempoPrincipal.remove();
    }

    this.lineaTiempoPrincipal = new Konva.Line({
      points: puntos,
      //stroke: this.plantillaActual.estilosGlobales.colores.primario,
      strokeWidth: 3,
      lineCap: 'round',
      lineJoin: 'round',
      dash: config.tipoLinea === 'curva' ? [] : [5, 5]
    });

    this.layer.add(this.lineaTiempoPrincipal);
  }*/

  actualizarConfiguracion(): void {
  console.log('Actualizando configuración de línea:', this.plantillaActual.configuracion.tipoLinea);
  
  // Redibujar la línea de tiempo principal
  this.dibujarLineaTiempoPrincipal();
  
  // Reorganizar los contenedores según el nuevo tipo de línea
  this.reorganizarContenedoresEnLinea();
}


private reorganizarContenedoresEnLinea(): void {
  const contenedores = this.plantillaActual.configuracion.elementos.filter(e => e.esContenedor);
  
  if (contenedores.length === 0) return;
  
  contenedores.forEach((contenedor, index) => {
    const nuevaPosicion = this.calcularPosicionEnLineaPorTipo(index, contenedores.length);
    contenedor.x = nuevaPosicion.x;
    contenedor.y = nuevaPosicion.y;
    
    // Actualizar también la posición en el objeto posicion
    contenedor.posicion.x = nuevaPosicion.x;
    contenedor.posicion.y = nuevaPosicion.y;
  });
  
  // Redibujar todos los elementos
  this.redibujarTodosLosElementos();
}

private redibujarTodosLosElementos(): void {
  // Limpiar el layer principal
  this.mainLayer.destroyChildren();
  
  // Redibujar la línea de tiempo primero (para que quede detrás)
  this.dibujarLineaTiempoPrincipal();
  
  // Redibujar todos los elementos
  this.plantillaActual.configuracion.elementos.forEach(elemento => {
    this.dibujarElemento(elemento);
  });
  
  this.mainLayer.batchDraw();
}


private calcularPosicionEnLineaPorTipo(index: number, totalContenedores: number): { x: number; y: number } {
  const config = this.plantillaActual.configuracion;
  const anchoArea = this.stage.width() - 200;
  const altoArea = this.stage.height() - 200;
  const margen = 100;
  
  switch (config.tipoLinea) {
    case 'recta':
    case 'horizontal':
      const espaciadoHorizontal = anchoArea / (totalContenedores + 1);
      return {
        x: margen + (espaciadoHorizontal * (index + 1)),
        y: this.stage.height() / 2 - 60
      };
      
    case 'vertical':
      const espaciadoVertical = altoArea / (totalContenedores + 1);
      return {
        x: this.stage.width() / 2 - 100,
        y: margen + (espaciadoVertical * (index + 1))
      };
      
    case 'curva':
      const segmento = anchoArea / (totalContenedores + 1);
      const x = margen + (segmento * (index + 1));
      const amplitud = 100;
      const y = (this.stage.height() / 2) + Math.sin((index / totalContenedores) * Math.PI) * amplitud - 60;
      return { x, y };
      
    case 'escalonada':
      const pasoHorizontal = anchoArea / (totalContenedores + 1);
      const pasoVertical = 80;
      return {
        x: margen + (pasoHorizontal * (index + 1)),
        y: (this.stage.height() / 2) + (index % 2 === 0 ? -pasoVertical : pasoVertical) - 60
      };
      
    default:
      return { x: 100 + (index * 200), y: this.stage.height() / 2 - 60 };
  }
}


dibujarLineaTiempoPrincipal(): void {
  // Limpiar línea anterior si existe
  if (this.lineaTiempoPrincipal) {
    this.lineaTiempoPrincipal.remove();
    this.lineaTiempoPrincipal = undefined;
  }

  if (!this.plantillaActual.configuracion.mostrarLineaTiempo) {
    return;
  }

  const config = this.plantillaActual.configuracion;
  const anchoArea = this.stage.width() - 200;
  const altoArea = this.stage.height() - 200;
  const margen = 100;

  let puntos: number[] = [];

  switch (config.tipoLinea) {
    case 'recta':
    case 'horizontal':
      puntos = [margen, this.stage.height() / 2, this.stage.width() - margen, this.stage.height() / 2];
      break;
      
    case 'vertical':
      puntos = [this.stage.width() / 2, margen, this.stage.width() / 2, this.stage.height() - margen];
      break;
      
    case 'curva':
      puntos = this.generarPuntosCurva(margen, this.stage.height() / 2, this.stage.width() - margen, this.stage.height() / 2);
      break;
      
    case 'escalonada':
      puntos = this.generarPuntosEscalon(margen, this.stage.height() / 2, this.stage.width() - margen, this.stage.height() / 2);
      break;
      
    default:
      puntos = [margen, this.stage.height() / 2, this.stage.width() - margen, this.stage.height() / 2];
  }

  this.lineaTiempoPrincipal = new Konva.Line({
    points: puntos,
    stroke: this.plantillaActual.estilosGlobales?.colores?.primario || '#3498db',
    strokeWidth: 3,
    lineCap: 'round',
    lineJoin: 'round',
    dash: [10, 5],
    listening: false // No interactuar con la línea
  });

  this.mainLayer.add(this.lineaTiempoPrincipal);
  this.mainLayer.batchDraw();
}


private generarPuntosCurva(x1: number, y1: number, x2: number, y2: number): number[] {
  const puntos: number[] = [];
  const segmentos = 50;
  const amplitud = 150;
  
  for (let i = 0; i <= segmentos; i++) {
    const t = i / segmentos;
    const x = x1 + (x2 - x1) * t;
    // Función seno para crear curva suave
    const y = y1 + Math.sin(t * Math.PI) * amplitud - amplitud / 2;
    puntos.push(x, y);
  }
  
  return puntos;
}

private generarPuntosEscalon(x1: number, y1: number, x2: number, y2: number): number[] {
  const puntos: number[] = [];
  const escalones = 8;
  const anchoEscalon = (x2 - x1) / escalones;
  const alturaEscalon = 60;
  
  puntos.push(x1, y1);
  
  for (let i = 1; i < escalones; i++) {
    const xActual = x1 + i * anchoEscalon;
    const direccion = i % 2 === 0 ? 1 : -1;
    
    // Horizontal
    puntos.push(xActual, y1 + (direccion * alturaEscalon));
    // Vertical (siguiente punto)
    if (i < escalones - 1) {
      puntos.push(xActual, y1 + (direccion * alturaEscalon));
    }
  }
  
  puntos.push(x2, y1);
  return puntos;
}

  private generarCurvaCompleta(x1: number, y1: number, x2: number, y2: number): number[] {
    const puntos: number[] = [];
    const segmentos = 20;
    const controlY = y1 - 100;
    
    for (let i = 0; i <= segmentos; i++) {
      const t = i / segmentos;
      const x = x1 + (x2 - x1) * t;
      const y = Math.pow(1 - t, 2) * y1 + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * y2;
      puntos.push(x, y);
    }
    
    return puntos;
  }

  private generarEscalonCompleto(x1: number, y1: number, x2: number, y2: number): number[] {
    const anchoTotal = x2 - x1;
    const escalones = 5;
    const anchoEscalon = anchoTotal / escalones;
    const alturaEscalon = 30;
    
    const puntos: number[] = [x1, y1];
    
    for (let i = 1; i < escalones; i++) {
      const xActual = x1 + i * anchoEscalon;
      const direccion = i % 2 === 0 ? 1 : -1;
      
      puntos.push(xActual, y1);
      puntos.push(xActual, y1 + direccion * alturaEscalon);
    }
    
    puntos.push(x2, y1);
    return puntos;
  }










private dibujarElementosInternos(contenedor: ElementoPlantilla, group: Konva.Group): void {
  if (!contenedor.elementosInternos || contenedor.elementosInternos.length === 0) return;

  const anchoContenedor = contenedor.width || 120;
  const altoContenedor = contenedor.height || 100;
  
  contenedor.elementosInternos.forEach((elementoInterno, index) => {
    // Calcular posición dentro del contenedor
    const posicion = this.calcularPosicionElementoInterno(
      elementoInterno, 
      index, 
      contenedor.elementosInternos!.length,
      anchoContenedor,
      altoContenedor
    );

    let shapeInterno: Konva.Shape;

    switch (elementoInterno.tipo) {
      case 'titulo-evento':
        shapeInterno = new Konva.Text({
          x: posicion.x,
          y: posicion.y,
          text: elementoInterno.contenido || 'Título',
          fontSize: elementoInterno.estilos?.fontSize || 12,
          fontFamily: elementoInterno.estilos?.fontFamily || 'Arial',
          fill: elementoInterno.estilos?.color || '#2c3e50',
          width: anchoContenedor - 20, // Margen interno
          align: 'center'
        });
        break;

      case 'descripcion-evento':
        shapeInterno = new Konva.Text({
          x: posicion.x,
          y: posicion.y,
          text: elementoInterno.contenido || 'Descripción',
          fontSize: elementoInterno.estilos?.fontSize || 10,
          fontFamily: elementoInterno.estilos?.fontFamily || 'Arial',
          fill: elementoInterno.estilos?.color || '#7f8c8d',
          width: anchoContenedor - 20,
          align: 'center'
        });
        break;

      case 'año-evento':
        shapeInterno = new Konva.Text({
          x: posicion.x,
          y: posicion.y,
          text: elementoInterno.contenido || '2024',
          fontSize: elementoInterno.estilos?.fontSize || 11,
          fontFamily: elementoInterno.estilos?.fontFamily || 'Arial',
          fill: elementoInterno.estilos?.color || '#e74c3c',
          width: anchoContenedor - 20,
          align: 'center',
          fontStyle: 'bold'
        });
        break;

      case 'imagen-evento':
        shapeInterno = new Konva.Rect({
          x: posicion.x,
          y: posicion.y,
          width: 30,
          height: 30,
          fill: '#e9ecef',
          stroke: '#6c757d',
          strokeWidth: 1,
          cornerRadius: 4
        });
        
        // Agregar icono de imagen
        const iconoImagen = new Konva.Text({
          x: posicion.x + 8,
          y: posicion.y + 8,
          text: '🖼️',
          fontSize: 14
        });
        group.add(iconoImagen);
        break;

      case 'link-evento':
        shapeInterno = new Konva.Text({
          x: posicion.x,
          y: posicion.y,
          text: '🔗 ' + (elementoInterno.contenido || 'Enlace'),
          fontSize: elementoInterno.estilos?.fontSize || 10,
          fontFamily: elementoInterno.estilos?.fontFamily || 'Arial',
          fill: elementoInterno.estilos?.color || '#3498db',
          width: anchoContenedor - 20,
          align: 'center'
        });
        break;

      default:
        return; // No dibujar tipos desconocidos
    }

    if (shapeInterno) {
      shapeInterno.id(elementoInterno.id);
      group.add(shapeInterno);
    }
  });
}


private calcularPosicionElementoInterno(
  elemento: ElementoPlantilla, 
  index: number, 
  totalElementos: number,
  anchoContenedor: number,
  altoContenedor: number
): { x: number; y: number } {
  const margen = 10;
  const espacioDisponible = altoContenedor - (margen * 2);
  const alturaElemento = espacioDisponible / totalElementos;
  
  const x = margen;
  const y = margen + (alturaElemento * index);
  
  return { x, y };
}


cambiarFormaContenedor(formaId: string) {
  // Verificar que la forma sea válida antes de asignar
  const formasValidas = ['rectangulo', 'circulo', 'rombo', 'estrella'] as const;
  type FormaValida = typeof formasValidas[number];
  
  if (!formasValidas.includes(formaId as FormaValida)) {
    console.error('Forma no válida:', formaId);
    return;
  }

  if (!this.elementoAConfigurar) {
    console.error('No hay elemento a configurar');
    return;
  }

  // Inicializar configuracionContenedor si no existe
  if (!this.elementoAConfigurar.configuracionContenedor) {
    this.elementoAConfigurar.configuracionContenedor = {
      maxElementos: 5,
      forma: formaId as FormaValida,
      alineacion: 'centro'
    };
  } else {
    this.elementoAConfigurar.configuracionContenedor.forma = formaId as FormaValida;
  }

  console.log('Forma del contenedor cambiada a:', formaId);
  this.actualizarVistaElemento();
}

  // ========== SELECCIÓN DE ELEMENTOS ==========
  seleccionarElemento(elemento: ElementoPlantilla, shape: Konva.Shape | Konva.Group): void {
    this.elementoSeleccionado = elemento;
    console.log('Elemento seleccionado:', elemento);
  }

  actualizarVistaElemento(): void {
  if (this.elementoAConfigurar) {
    this.limpiarYRedibujarElemento(this.elementoAConfigurar);
    
    // Si es un contenedor, también actualizar todos los contenedores del mismo evento
    if (this.elementoAConfigurar.esContenedor && this.elementoAConfigurar.eventoAsignadoId) {
      this.actualizarTodosContenedoresDelEvento(this.elementoAConfigurar.eventoAsignadoId);
    }
  }
}


private actualizarTodosContenedoresDelEvento(eventoId: string): void {
  const evento = this.eventosGlobales.find(e => e.id === eventoId);
  if (!evento) return;

  evento.contenedores.forEach(contenedorId => {
    const contenedor = this.plantillaActual.configuracion.elementos.find(
      el => el.id === contenedorId && el.id !== this.elementoAConfigurar?.id
    );
    if (contenedor) {
      this.limpiarYRedibujarElemento(contenedor);
    }
  });
}

  private limpiarYRedibujarElemento(elemento: ElementoPlantilla): void {
    const shapes = this.mainLayer.children?.filter(child => 
      child.id() === elemento.id
    );
    
    shapes?.forEach(shape => shape.remove());
    
    this.dibujarElemento(elemento);
  }

  // ========== UTILIDADES ==========
  private generarIdElemento(): string {
    return 'elem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  private calcularPosicionEnLinea(): { x: number; y: number } {
    const centroY = this.stage.height() / 2;
    
    const contenedores = this.plantillaActual.configuracion.elementos.filter(e => e.esContenedor === true);
    
    if (contenedores.length === 0) {
      return { x: 100, y: centroY - 60 };
    }
    
    const maxX = Math.max(...contenedores.map(c => c.x || 0));
    const nuevaX = maxX + 200; // Espaciado entre contenedores
    
    return { x: nuevaX, y: centroY - 60 };
  }

  private getContenidoPorDefecto(tipo: string): string {
    const contenidos: { [key: string]: string } = {
      'titulo-linea': 'Título de la Línea',
      'descripcion-linea': 'Descripción de la línea temporal...',
      'titulo-evento': 'Título del Evento',
      'descripcion-evento': 'Descripción del evento...',
      'año-evento': '2024',
      'imagen-evento': 'Imagen del evento',
      'link-evento': 'Enlace del evento'
    };
    return contenidos[tipo] || 'Contenido';
  }

  private getEstilosPorDefecto(tipo: string): any {
    const estilosBase: { [key: string]: any } = {
      contenedor: { 
        backgroundColor: '#ffffff', 
        border: '#3498db',
        borderRadius: 8 
      },
      'titulo-linea': { 
        color: '#2c3e50', 
        fontSize: 18, 
        fontFamily: 'Arial',
        fontWeight: 'bold'
      },
      'descripcion-linea': { 
        color: '#7f8c8d', 
        fontSize: 14, 
        fontFamily: 'Arial' 
      },
      'titulo-evento': { 
        color: '#2c3e50', 
        fontSize: 16, 
        fontFamily: 'Arial',
        fontWeight: 'bold'
      },
      'descripcion-evento': { 
        color: '#7f8c8d', 
        fontSize: 12, 
        fontFamily: 'Arial' 
      },
      'año-evento': { 
        color: '#e74c3c', 
        fontSize: 14, 
        fontFamily: 'Arial', 
        fontWeight: 'bold' 
      }
    };
    return estilosBase[tipo] || {};
  }

  private getAnchoPorDefecto(tipo: string): number {
    const anchos: { [key: string]: number } = {
      'titulo-linea': 200,
      'descripcion-linea': 250,
      'titulo-evento': 180,
      'descripcion-evento': 220,
      'año-evento': 100,
      'imagen-evento': 150,
      'link-evento': 160
    };
    return anchos[tipo] || 100;
  }

  private getAltoPorDefecto(tipo: string): number {
    const altos: { [key: string]: number } = {
      'titulo-linea': 40,
      'descripcion-linea': 60,
      'titulo-evento': 30,
      'descripcion-evento': 50,
      'año-evento': 30,
      'imagen-evento': 100,
      'link-evento': 30
    };
    return altos[tipo] || 50;
  }

  getIconoElemento(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'titulo-linea': '📝',
      'descripcion-linea': '📋',
      'titulo-evento': '🏷️',
      'descripcion-evento': '📄',
      'año-evento': '📅',
      'imagen-evento': '🖼️',
      'link-evento': '🔗',
      'contenedor': '🟦',
      'linea': '📏'
    };
    return iconos[tipo] || '🔹';
  }

  // ========== GESTIÓN DE PLANTILLAS ==========
  guardarPlantilla(): void {
    if (!this.plantillaNombre.trim()) {
      alert('Por favor ingrese un nombre para la plantilla');
      return;
    }
    

    this.plantillaActual.nombre = this.plantillaNombre;
    this.plantillaActual.descripcion = this.plantillaDescripcion;
    this.plantillaActual.categoria = this.plantillaCategoria;
    this.plantillaActual.fechaCreacion = new Date();
    this.plantillaActual.thumbnail = this.stage.toDataURL({ pixelRatio: 0.5 });
    
    this.plantillaDesignService.guardarPlantilla(this.plantillaActual as any);
    this.cargarPlantillasGuardadas();
    
    alert('Plantilla guardada correctamente');
    this.limpiarEditor();
  }

  cargarPlantillasGuardadas(): void {
    this.plantillasGuardadas = this.plantillaDesignService.obtenerPlantillas() as any;
  }

  eliminarPlantilla(plantilla: PlantillaDiseno): void {
    if (confirm(`¿Eliminar la plantilla "${plantilla.nombre}"?`) && plantilla.id) {
      this.plantillaDesignService.eliminarPlantilla(plantilla.id);
      this.cargarPlantillasGuardadas();
    }
  }

  exportarPlantillaJSON(plantilla: PlantillaDiseno): void {
    const dataStr = JSON.stringify(plantilla, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantilla-${plantilla.nombre.replace(/\s+/g, '-')}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  previsualizarPlantilla(plantilla: PlantillaDiseno): void {
    this.limpiarEditor();
    this.plantillaActual = JSON.parse(JSON.stringify(plantilla));
    this.actualizarFondo(plantilla.configuracion.backgroundColor);
    
    plantilla.configuracion.elementos.forEach(elemento => {
      this.dibujarElemento(elemento);
    });
    
    this.mainLayer.draw();
  }

  limpiarEditor(): void {
    this.mainLayer.destroyChildren();
    this.plantillaNombre = '';
    this.plantillaDescripcion = '';
    this.plantillaActual = this.crearPlantillaVacia();
    this.eventosGlobales = [this.crearEventoGlobal(1)];
    this.eventoActualId = this.eventosGlobales[0].id;
    this.mainLayer.draw();
    this.gruposHorizontales = [];
  this.grupoSeleccionado = null;
  }

  private crearPlantillaVacia(): PlantillaDiseno {
    return {
      nombre: 'Nueva Plantilla',
      descripcion: 'Descripción de la plantilla',
      categoria: 'personalizado',
      fechaCreacion: new Date(),
      configuracion: {
        backgroundColor: '#f9f9f9',
        elementos: [],
        tipoLinea: 'recta',
        orientacionEventos: 'unilateral',
        espaciado: 150,
        mostrarLineaTiempo: true,
        animaciones: true
      },
      estilosGlobales: {
        colores: {
          primario: '#3498db',
          secundario: '#2980b9',
          fondo: '#f8f9fa',
          texto: '#2c3e50',
          acento: '#e74c3c'
        },
        tipografia: {
          familia: 'Arial, sans-serif',
          tamañoBase: 14
        },
        espaciado: {
          entreEventos: 150,
          margen: 50
        }
      },
      esPublica: false
    };
  }
}