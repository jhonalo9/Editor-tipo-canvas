import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Konva from 'konva';
import { PlantillaDesignService } from '../core/services/plantilla-design.service';

// Interfaces para el diseño de plantillas
export interface PlantillaDesign {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  esPublica: boolean;
  
  configuracion: ConfiguracionPlantilla;
  elementos: ElementoPlantilla[];
  estilosGlobales: EstilosGlobales;
}

export interface ConfiguracionPlantilla {
  tipoLinea: 'recta' | 'curva' | 'vertical' | 'escalonada' | 'personalizada';
  orientacionEventos: 'unilateral' | 'bilateral' | 'alternate';
  espaciado: number;
  mostrarLineaTiempo: boolean;
  animaciones: boolean;
}

export interface ElementoPlantilla {
  id: string;
  tipo: 'contenedor' | 'titulo' | 'año' | 'descripcion' | 'imagen' | 'persona' | 'linea' | 'decoracion';
  posicion: PosicionElemento;
  estilos: EstilosElemento;
  contenido?: string;
  esContenedor?: boolean;
  elementosInternos?: ElementoPlantilla[];
  configuracionContenedor?: ConfiguracionContenedor;
}

export interface PosicionElemento {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  tipoPosicion: 'absoluta' | 'relativa';
}

export interface EstilosElemento {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  border?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  opacity?: number;
}

export interface ConfiguracionContenedor {
  maxElementos: number;
  forma: 'rectangulo' | 'circulo' | 'rombo' | 'estrella' | 'triangulo';
  alineacion: 'izquierda' | 'centro' | 'derecha';
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
@Component({
  selector: 'app-editor-ofiofi',
  imports: [CommonModule, FormsModule],
  templateUrl: './editor-ofiofi.component.html',
  styleUrl: './editor-ofiofi.component.scss'
})
export class EditorOFIofiComponent {

@ViewChild('container') container!: ElementRef;
  
  // Propiedades de Konva
  stage!: Konva.Stage;
  layer!: Konva.Layer;
  lineaTiempoPrincipal?: Konva.Line;
  
  // Plantilla actual
  plantillaActual: PlantillaDesign = this.crearPlantillaVacia();
  
  // Elementos y selección
  elementoSeleccionado: ElementoPlantilla | null = null;
  elementoAConfigurar: ElementoPlantilla | null = null;
  
  // Modos y estados
  modo: 'diseño' | 'preview' = 'diseño';
  showModalConfiguracion: boolean = false;
  
  // Herramientas disponibles
  herramientas = [
    { tipo: 'contenedor', icono: '🟦', nombre: 'Contenedor' },
    { tipo: 'imagen', icono: '🖼️', nombre: 'Imagen' },
    { tipo: 'titulo', icono: '📝', nombre: 'Título' },
    { tipo: 'año', icono: '📅', nombre: 'Año' },
    { tipo: 'descripcion', icono: '📋', nombre: 'Descripción' },
    { tipo: 'persona', icono: '👤', nombre: 'Persona' },
    { tipo: 'linea', icono: '📏', nombre: 'Línea' },
    { tipo: 'circulo', icono: '⭕', nombre: 'Círculo' }
  ];

  // Opciones de configuración
  formasContenedor = [
    { valor: 'rectangulo', nombre: 'Rectángulo', icono: '🟦' },
    { valor: 'circulo', nombre: 'Círculo', icono: '⭕' },
    { valor: 'rombo', nombre: 'Rombo', icono: '🔷' },
    { valor: 'estrella', nombre: 'Estrella', icono: '⭐' },
    { valor: 'triangulo', nombre: 'Triángulo', icono: '🔺' }
  ];

  tiposLinea = [
    { valor: 'recta', nombre: 'Línea Recta' },
    { valor: 'curva', nombre: 'Línea Curva' },
    { valor: 'vertical', nombre: 'Línea Vertical' },
    { valor: 'escalonada', nombre: 'Línea Escalonada' }
  ];

  constructor(private plantillaDesignService: PlantillaDesignService) {}

  ngAfterViewInit(): void {
    this.inicializarEditor();
  }

  // ========== INICIALIZACIÓN ==========
  inicializarEditor(): void {
    const width = this.container.nativeElement.offsetWidth;
    const height = 600;

    this.stage = new Konva.Stage({
      container: this.container.nativeElement,
      width: width,
      height: height
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.dibujarAreaTrabajo();
    this.dibujarLineaTiempoPrincipal();
  }

  dibujarAreaTrabajo(): void {
    const area = new Konva.Rect({
      x: 50,
      y: 50,
      width: this.stage.width() - 100,
      height: this.stage.height() - 100,
      fill: '#f8f9fa',
      stroke: '#dee2e6',
      strokeWidth: 1,
      dash: [5, 5]
    });

    this.layer.add(area);
    this.layer.draw();
  }

  // ========== LÍNEA DE TIEMPO ==========
  dibujarLineaTiempoPrincipal(): void {
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
      stroke: this.plantillaActual.estilosGlobales.colores.primario,
      strokeWidth: 3,
      lineCap: 'round',
      lineJoin: 'round',
      dash: config.tipoLinea === 'curva' ? [] : [5, 5]
    });

    this.layer.add(this.lineaTiempoPrincipal);
    this.layer.draw();
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

  // ========== GESTIÓN DE ELEMENTOS ==========
  agregarElemento(tipo: string): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    
    const nuevoElemento: ElementoPlantilla = {
      id: this.generarIdElemento(),
      tipo: tipo as any,
      posicion: {
        ...posicionInicial,
        ancho: this.getAnchoPorDefecto(tipo),
        alto: this.getAltoPorDefecto(tipo),
        tipoPosicion: 'absoluta'
      },
      estilos: this.getEstilosPorDefecto(tipo),
      contenido: this.getContenidoPorDefecto(tipo),
      esContenedor: tipo === 'contenedor'
    };

    if (tipo === 'contenedor') {
      nuevoElemento.configuracionContenedor = {
        maxElementos: 4,
        forma: 'rectangulo',
        alineacion: 'centro'
      };
      nuevoElemento.elementosInternos = [];
    }

    this.plantillaActual.elementos.push(nuevoElemento);
    this.dibujarElemento(nuevoElemento);
    
    // Abrir configuración si es un contenedor
    if (tipo === 'contenedor') {
      this.abrirModalConfiguracion(nuevoElemento);
    }
  }

  private calcularPosicionEnLinea(): { x: number; y: number } {
    const centroY = this.stage.height() / 2;
    const espaciado = this.plantillaActual.configuracion.espaciado;
    
    // Calcular posición basada en elementos existentes
    const ultimoElemento = this.plantillaActual.elementos[this.plantillaActual.elementos.length - 1];
    const x = ultimoElemento ? ultimoElemento.posicion.x + espaciado : 100;
    
    return { x, y: centroY - 60 };
  }

  private getAnchoPorDefecto(tipo: string): number {
    const anchos: { [key: string]: number } = {
      contenedor: 200,
      imagen: 120,
      titulo: 150,
      año: 80,
      descripcion: 180,
      persona: 120,
      linea: 120,
      circulo: 80
    };
    return anchos[tipo] || 100;
  }

  private getAltoPorDefecto(tipo: string): number {
    const altos: { [key: string]: number } = {
      contenedor: 120,
      imagen: 120,
      titulo: 40,
      año: 30,
      descripcion: 60,
      persona: 40,
      linea: 5,
      circulo: 80
    };
    return altos[tipo] || 50;
  }

  private getEstilosPorDefecto(tipo: string): EstilosElemento {
    const estilosBase: { [key: string]: EstilosElemento } = {
      contenedor: { 
        backgroundColor: '#ffffff', 
        border: '#3498db',
        borderRadius: 8 
      },
      imagen: { 
        borderRadius: 4 
      },
      titulo: { 
        color: '#2c3e50', 
        fontSize: 16, 
        fontFamily: 'Arial',
        fontWeight: 'bold'
      },
      año: { 
        color: '#e74c3c', 
        fontSize: 14, 
        fontFamily: 'Arial', 
        fontWeight: 'bold' 
      },
      descripcion: { 
        color: '#7f8c8d', 
        fontSize: 12, 
        fontFamily: 'Arial' 
      },
      persona: { 
        color: '#3498db', 
        fontSize: 13, 
        fontFamily: 'Arial' 
      },
      circulo: { 
        backgroundColor: '#007bff' 
      },
      linea: { 
        color: '#3498db', 
        borderWidth: 3 
      }
    };
    return estilosBase[tipo] || {};
  }

  private getContenidoPorDefecto(tipo: string): string {
    const contenidos: { [key: string]: string } = {
      titulo: 'Título del evento',
      año: '2024',
      descripcion: 'Descripción del evento...',
      persona: 'Nombre de la persona',
      imagen: 'Imagen del evento'
    };
    return contenidos[tipo] || 'Contenido';
  }

  // ========== DIBUJADO DE ELEMENTOS ==========
  dibujarElemento(elemento: ElementoPlantilla): void {
    let shape: Konva.Shape | Konva.Group;

    if (elemento.esContenedor && elemento.elementosInternos) {
      shape = this.crearContenedor(elemento);
    } else {
      switch (elemento.tipo) {
        case 'titulo':
        case 'año':
        case 'descripcion':
        case 'persona':
          shape = new Konva.Text({
            x: elemento.posicion.x,
            y: elemento.posicion.y,
            text: elemento.contenido || 'Texto de ejemplo',
            fontSize: elemento.estilos.fontSize || 14,
            fontFamily: elemento.estilos.fontFamily || 'Arial',
            fill: elemento.estilos.color || '#000000',
            width: elemento.posicion.ancho,
            draggable: true
          });
          break;

        case 'imagen':
          shape = new Konva.Rect({
            x: elemento.posicion.x,
            y: elemento.posicion.y,
            width: elemento.posicion.ancho,
            height: elemento.posicion.alto,
            fill: '#e9ecef',
            stroke: '#6c757d',
            strokeWidth: 1,
            cornerRadius: elemento.estilos.borderRadius || 0,
            draggable: true
          });
          break;

        case 'linea':
          shape = new Konva.Line({
            x: elemento.posicion.x,
            y: elemento.posicion.y,
            points: this.generarPuntosLinea(elemento),
            stroke: elemento.estilos.color || '#000000',
            strokeWidth: elemento.estilos.borderWidth || 2,
            lineCap: 'round',
            lineJoin: 'round',
            draggable: true
          });
          break;

        case 'decoracion':
          shape = new Konva.Circle({
            x: elemento.posicion.x,
            y: elemento.posicion.y,
            radius: elemento.posicion.ancho / 2,
            fill: elemento.estilos.backgroundColor || '#007bff',
            stroke: elemento.estilos.border || '#0056b3',
            strokeWidth: elemento.estilos.borderWidth || 2,
            draggable: true
          });
          break;

        default:
          return;
      }
    }

    if (!shape) return;

    // Configurar eventos de interacción
    shape.on('dragmove', () => {
      elemento.posicion.x = shape.x();
      elemento.posicion.y = shape.y();
    });

    shape.on('dblclick', (e) => {
      e.cancelBubble = true;
      this.abrirModalConfiguracion(elemento);
    });

    shape.on('click', (e) => {
      e.cancelBubble = true;
      this.seleccionarElemento(elemento, shape);
    });

    this.layer.add(shape);
    this.layer.draw();
  }

  private crearContenedor(elemento: ElementoPlantilla): Konva.Group {
    const group = new Konva.Group({
      x: elemento.posicion.x,
      y: elemento.posicion.y,
      draggable: true
    });

    let contenedorShape: Konva.Shape;

    switch (elemento.configuracionContenedor?.forma) {
      case 'circulo':
        contenedorShape = new Konva.Circle({
          x: elemento.posicion.ancho / 2,
          y: elemento.posicion.alto / 2,
          radius: Math.min(elemento.posicion.ancho, elemento.posicion.alto) / 2,
          fill: elemento.estilos.backgroundColor || '#ffffff',
          stroke: elemento.estilos.border || '#3498db',
          strokeWidth: 2
        });
        break;
        
      case 'rombo':
        contenedorShape = new Konva.Line({
          points: [
            elemento.posicion.ancho / 2, 0,
            elemento.posicion.ancho, elemento.posicion.alto / 2,
            elemento.posicion.ancho / 2, elemento.posicion.alto,
            0, elemento.posicion.alto / 2
          ],
          fill: elemento.estilos.backgroundColor || '#ffffff',
          stroke: elemento.estilos.border || '#3498db',
          strokeWidth: 2,
          closed: true
        });
        break;
        
      case 'estrella':
        contenedorShape = new Konva.Star({
          x: elemento.posicion.ancho / 2,
          y: elemento.posicion.alto / 2,
          numPoints: 5,
          innerRadius: Math.min(elemento.posicion.ancho, elemento.posicion.alto) / 4,
          outerRadius: Math.min(elemento.posicion.ancho, elemento.posicion.alto) / 2,
          fill: elemento.estilos.backgroundColor || '#ffffff',
          stroke: elemento.estilos.border || '#3498db',
          strokeWidth: 2
        });
        break;
        
      case 'triangulo':
        contenedorShape = new Konva.Line({
          points: [
            elemento.posicion.ancho / 2, 0,
            elemento.posicion.ancho, elemento.posicion.alto,
            0, elemento.posicion.alto
          ],
          fill: elemento.estilos.backgroundColor || '#ffffff',
          stroke: elemento.estilos.border || '#3498db',
          strokeWidth: 2,
          closed: true
        });
        break;
        
      case 'rectangulo':
      default:
        contenedorShape = new Konva.Rect({
          width: elemento.posicion.ancho,
          height: elemento.posicion.alto,
          fill: elemento.estilos.backgroundColor || '#ffffff',
          stroke: elemento.estilos.border || '#3498db',
          strokeWidth: 2,
          cornerRadius: elemento.estilos.borderRadius || 8
        });
        break;
    }

    group.add(contenedorShape);

    // Agregar elementos internos si existen
    if (elemento.elementosInternos && elemento.elementosInternos.length > 0) {
      elemento.elementosInternos.forEach((elementoInterno, index) => {
        const texto = new Konva.Text({
          x: 10,
          y: 10 + (index * 20),
          text: `${this.getIconoElemento(elementoInterno.tipo)} ${elementoInterno.contenido}`,
          fontSize: elementoInterno.estilos.fontSize || 11,
          fontFamily: elementoInterno.estilos.fontFamily || 'Arial',
          fill: elementoInterno.estilos.color || '#000000',
          width: elemento.posicion.ancho - 20,
          ellipsis: true
        });
        group.add(texto);
      });
    }

    return group;
  }

  private generarPuntosLinea(elemento: ElementoPlantilla): number[] {
    return [0, 0, elemento.posicion.ancho, 0];
  }

  private getIconoElemento(tipo: string): string {
    const iconos: { [key: string]: string } = {
      titulo: '📝',
      año: '📅',
      descripcion: '📋',
      imagen: '🖼️',
      persona: '👤'
    };
    return iconos[tipo] || '🔹';
  }

  // ========== CONFIGURACIÓN ==========
  abrirModalConfiguracion(elemento: ElementoPlantilla): void {
    this.elementoAConfigurar = elemento;
    this.showModalConfiguracion = true;
  }

  cerrarModalConfiguracion(): void {
    this.showModalConfiguracion = false;
    this.elementoAConfigurar = null;
    this.actualizarVistaElemento();
  }

  actualizarVistaElemento(): void {
    if (this.elementoAConfigurar) {
      this.limpiarYRedibujarElemento(this.elementoAConfigurar);
    }
  }

  private limpiarYRedibujarElemento(elemento: ElementoPlantilla): void {
    // Encontrar y eliminar el elemento actual del layer
    const shapes = this.layer.children?.filter(child => 
      child.getAttr('elementId') === elemento.id
    );
    
    shapes?.forEach(shape => shape.destroy());
    
    // Volver a dibujar el elemento
    this.dibujarElemento(elemento);
  }

  // ========== GESTIÓN DE PLANTILLAS ==========
  guardarPlantilla(): void {
    this.plantillaDesignService.guardarPlantilla(this.plantillaActual as any);
    alert('Plantilla guardada correctamente');
  }

  cargarPlantilla(plantilla: PlantillaDesign): void {
    this.plantillaActual = { ...plantilla };
    this.limpiarEditor();
    this.plantillaActual.elementos.forEach(elemento => {
      this.dibujarElemento(elemento);
    });
  }

  limpiarEditor(): void {
    this.layer.destroyChildren();
    this.lineaTiempoPrincipal = undefined;
    this.dibujarAreaTrabajo();
    this.dibujarLineaTiempoPrincipal();
  }

  // ========== UTILIDADES ==========
  private generarIdElemento(): string {
    return 'elem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  seleccionarElemento(elemento: ElementoPlantilla, shape: Konva.Shape | Konva.Group): void {
    this.elementoSeleccionado = elemento;
    console.log('Elemento seleccionado:', elemento);
  }

  private crearPlantillaVacia(): PlantillaDesign {
    return {
      id: this.generarIdElemento(),
      nombre: 'Nueva Plantilla',
      descripcion: 'Descripción de la plantilla',
      categoria: 'personalizado',
      esPublica: false,
      configuracion: {
        tipoLinea: 'recta',
        orientacionEventos: 'unilateral',
        espaciado: 150,
        mostrarLineaTiempo: true,
        animaciones: true
      },
      elementos: [],
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
      }
    };
  }

  // ========== CONFIGURACIÓN GLOBAL ==========
  actualizarConfiguracion(): void {
    this.limpiarEditor();
    this.dibujarAreaTrabajo();
    this.plantillaActual.elementos.forEach(elemento => {
      this.dibujarElemento(elemento);
    });
  }
  




  actualizarFormaContenedor(forma: 'rectangulo' | 'circulo' | 'rombo' | 'estrella' | 'triangulo'): void {
    if (this.elementoAConfigurar && this.elementoAConfigurar.configuracionContenedor) {
      this.elementoAConfigurar.configuracionContenedor.forma = forma;
      this.actualizarVistaElemento();
    }
  }

  actualizarColorFondo(color: string): void {
    if (this.elementoAConfigurar) {
      this.elementoAConfigurar.estilos.backgroundColor = color;
      this.actualizarVistaElemento();
    }
  }

  actualizarColorBorde(color: string): void {
    if (this.elementoAConfigurar) {
      this.elementoAConfigurar.estilos.border = color;
      this.actualizarVistaElemento();
    }
  }
}
