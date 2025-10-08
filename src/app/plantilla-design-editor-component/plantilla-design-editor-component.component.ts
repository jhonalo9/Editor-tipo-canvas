// plantilla-design-editor.component.ts
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Konva from 'konva';
import { ElementoPlantilla, EventoGlobal, GrupoHorizontal, PlantillaDesign } from '../core/models/plantilla-design.interface';
import { PlantillaDesignService } from '../core/services/plantillas-design.service';


 interface EventoContenedor {
    id: string;
    nombre: string;
    elementos: ElementoPlantilla[];
    activo: boolean;
  }

@Component({
  selector: 'app-plantilla-design-editor',
  templateUrl: './plantilla-design-editor-component.component.html',
  styleUrl: './plantilla-design-editor-component.component.css',
  imports: [CommonModule, FormsModule]
})
export class PlantillaDesignEditorComponent implements AfterViewInit {
  @ViewChild('container') container!: ElementRef;
  
  stage!: Konva.Stage;
  layer!: Konva.Layer;
  lineaTiempoPrincipal?: Konva.Line;

  eventoActual: number = 0;
  eventosEnContenedor: any[] = [];
  contenedoresPendientes: Map<string, ElementoPlantilla> = new Map();

  private contenedorTemporal: ElementoPlantilla | null = null;
 esNuevoContenedor: boolean = false;
 eventosGlobales: EventoGlobal[] = [];
eventoActualId: string | null = null;
  
  plantillaActual: PlantillaDesign = this.crearPlantillaVacia();
  elementoSeleccionado: ElementoPlantilla | null = null;
  elementoAConfigurar: ElementoPlantilla | null = null;
  elementoSeleccionadoModal: any = null;
  gruposHorizontales: Map<string, GrupoHorizontal> = new Map();
  grupoActualDrag: string | null = null;



  // Agrega estas propiedades a la clase
private isSelecting: boolean = false;
private selectionStart: { x: number; y: number } = { x: 0, y: 0 };
private selectionRect: Konva.Rect | null = null;
 elementosSeleccionados: Set<string> = new Set();
private selectionGroup: Konva.Group | null = null;
private isCtrlPressed: boolean = false;



  modo: 'diseño' | 'preview' = 'diseño';
  
  showModalConfiguracion: boolean = false;
  elementosDisponibles: any[] = [];
  
  /*herramientas = [
    { tipo: 'contenedor', icono: '🟦', nombre: 'Contenedor' },
    { tipo: 'imagen', icono: '🖼️', nombre: 'Imagen' },
    { tipo: 'titulo', icono: '📝', nombre: 'Título' },
    { tipo: 'año', icono: '📅', nombre: 'Año' },
    { tipo: 'descripcion', icono: '📋', nombre: 'Descripción' },
    { tipo: 'persona', icono: '👤', nombre: 'Persona' },
    { tipo: 'linea', icono: '📏', nombre: 'Línea' },
    { tipo: 'circulo', icono: '⭕', nombre: 'Círculo' }
  ];*/


  herramientas = {
  recursos: [
    { tipo: 'contenedor', icono: '🟦', nombre: 'Contenedor Rectángulo', forma: 'rectangulo' },
    { tipo: 'contenedor', icono: '⭕', nombre: 'Contenedor Círculo', forma: 'circulo' },
    { tipo: 'contenedor', icono: '🔷', nombre: 'Contenedor Rombo', forma: 'rombo' },
    { tipo: 'contenedor', icono: '⭐', nombre: 'Contenedor Estrella', forma: 'estrella' },
    { tipo: 'linea', icono: '📏', nombre: 'Línea Decorativa' },
  
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

  constructor(private plantillaDesignService: PlantillaDesignService) {}

  ngAfterViewInit(): void {
    this.inicializarEditor();
    this.inicializarEventosGlobales();
    this.inicializarSeleccionMultiple();
    this.inicializarAtajosTeclado();

    // Enfocar el stage para que reciba eventos de teclado
  this.stage.container().tabIndex = 1;
  this.stage.container().focus();
  }

   private inicializarEventosGlobales(): void {
    if (!this.plantillaActual.eventosGlobales || this.plantillaActual.eventosGlobales.length === 0) {
      this.plantillaActual.eventosGlobales = [this.crearEventoGlobal(1)];
    }
    this.eventosGlobales = this.plantillaActual.eventosGlobales;
    
    // ✅ ASIGNAR evento por defecto a contenedores sin evento
    this.plantillaActual.elementos
      .filter(e => e.esContenedor && !e.eventoAsignadoId)
      .forEach(contenedor => {
        contenedor.eventoAsignadoId = this.eventosGlobales[0].id;
        this.asignarContenedorAEvento(contenedor.id, this.eventosGlobales[0].id);
      });

    console.log('🎯 Eventos globales inicializados:', this.eventosGlobales);
  }

  private crearEventoGlobal(numero: number): EventoGlobal {
    return {
      id: 'evento-global-' + this.generarIdElemento(),
      numero: numero,
      //nombre: `${numero}`,
      contenedores: []
    };
  }
   obtenerSiguienteNumeroEvento(): number {
    if (this.eventosGlobales.length === 0) return 1;
    return Math.max(...this.eventosGlobales.map(e => e.numero)) + 1;
  }
  private obtenerEventoParaContenedor(numeroEvento?: number): EventoGlobal {
    if (numeroEvento) {
      let evento = this.eventosGlobales.find(e => e.numero === numeroEvento);
      if (evento) return evento;
      
      evento = this.crearEventoGlobal(numeroEvento);
      this.eventosGlobales.push(evento);
      this.eventosGlobales.sort((a, b) => a.numero - b.numero);
      return evento;
    }
    
    const nuevoNumero = this.obtenerSiguienteNumeroEvento();
    const nuevoEvento = this.crearEventoGlobal(nuevoNumero);
    this.eventosGlobales.push(nuevoEvento);
    return nuevoEvento;
  }

  private asignarContenedorAEvento(contenedorId: string, eventoId: string): void {
    const evento = this.eventosGlobales.find(e => e.id === eventoId);
    if (!evento) {
      console.error('❌ Evento no encontrado:', eventoId);
      return;
    }

    //console.log(`🔧 Asignando contenedor ${contenedorId} a evento ${evento.nombre}`);

    // Remover de evento anterior si existe
    this.eventosGlobales.forEach(e => {
      const index = e.contenedores.indexOf(contenedorId);
      if (index > -1) {
        e.contenedores.splice(index, 1);
        //console.log(`➖ Removido de evento ${e.nombre}`);
      }
    });

    // Agregar al nuevo evento
    if (!evento.contenedores.includes(contenedorId)) {
      evento.contenedores.push(contenedorId);
     // console.log(`➕ Agregado a evento ${evento.nombre}`);
    }

    // ✅ ACTUALIZAR referencia en el contenedor (USANDO SOLO eventoAsignadoId)
    const contenedor = this.plantillaActual.elementos.find(el => el.id === contenedorId);
    if (contenedor) {
      contenedor.eventoAsignadoId = eventoId;
      // ✅ ELIMINAR propiedad antigua para evitar conflictos
      if (contenedor.eventoPadreId) {
        delete contenedor.eventoPadreId;
      }
    }

    // Reagrupar contenedores del mismo evento
    this.reagruparContenedoresPorEvento(eventoId);
    
    console.log('✅ Asignación completada. Estado actual:');
    this.eventosGlobales.forEach(e => {
      //console.log(`   ${e.nombre}: ${e.contenedores.length} contenedores`);
    });
  }
  private crearContenedorTemporal(): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    const eventoSiguiente = this.obtenerEventoParaContenedor();
    
    this.contenedorTemporal = {
      id: this.generarIdElemento(),
      tipo: 'contenedor',
      posicion: {
        x: posicionInicial.x,
        y: posicionInicial.y,
        ancho: 200,
        alto: 120,
        tipoPosicion: 'absoluta'
      },
      estilos: this.getEstilosPorDefecto('contenedor'),
      //contenido: `Contenedor ${eventoSiguiente.nombre}`,
      esContenedor: true,
      elementosInternos: [],
      configuracionContenedor: {
        maxElementos: 4,
        forma: 'rectangulo',
        alineacion: 'centro'
      },
      eventoAsignadoId: eventoSiguiente.id
    };
    
    this.esNuevoContenedor = true;
    this.eventoActualId = eventoSiguiente.id;
    
    // Abrir modal
    this.abrirModalConfiguracion(this.contenedorTemporal);
  }



  //PRA COPIAR Y PEGAR:

  private inicializarAtajosTeclado(): void {
  // Escuchar eventos de teclado en el documento
  document.addEventListener('keydown', this.manejarKeyDown.bind(this));
  document.addEventListener('keyup', this.manejarKeyUp.bind(this));
  
  // También en el stage para cuando esté enfocado
  this.stage.on('keydown', (e) => {
    this.manejarKeyDown(e.evt);
  });
  
  this.stage.on('keyup', (e) => {
    this.manejarKeyUp(e.evt);
  });
}
private manejarKeyDown(event: KeyboardEvent): void {
  // Verificar si es Ctrl (o Cmd en Mac)
  if (event.ctrlKey || event.metaKey) {
    this.isCtrlPressed = true;
    
    // Ctrl+C - Copiar
    if (event.key === 'c' || event.key === 'C') {
      event.preventDefault();
      this.copiarElementosSeleccionados();
    }
    
    // Ctrl+V - Pegar
    if (event.key === 'v' || event.key === 'V') {
      event.preventDefault();
      this.pegarElementosCopiados();
    }
    
    // Ctrl+A - Seleccionar todos
    if (event.key === 'a' || event.key === 'A') {
      event.preventDefault();
      this.seleccionarTodosLosContenedores();
    }
  }
  
  // Tecla Escape - Limpiar selección
  if (event.key === 'Escape') {
    this.limpiarSeleccion();
  }
  
  // Tecla Delete - Eliminar elementos seleccionados
  if (event.key === 'Delete' && this.elementosSeleccionados.size > 0) {
    event.preventDefault();
    this.eliminarElementosSeleccionados();
  }
}

// Manejar tecla liberada
private manejarKeyUp(event: KeyboardEvent): void {
  if (event.key === 'Control' || event.key === 'Meta') {
    this.isCtrlPressed = false;
  }
}



  private inicializarSeleccionMultiple(): void {
  this.stage.on('mousedown touchstart', (e) => {
    // Iniciar selección con Ctrl o Shift
    if (e.target === this.stage && (e.evt.ctrlKey || e.evt.shiftKey)) {
      this.isSelecting = true;
      const pos = this.stage.getPointerPosition();
      if (pos) {
        this.selectionStart = { x: pos.x, y: pos.y };
        this.crearRectanguloSeleccion();
      }
    }
  });

  // Resto del código permanece igual...
  this.stage.on('mousemove touchmove', (e) => {
    if (this.isSelecting && this.selectionRect) {
      const pos = this.stage.getPointerPosition();
      if (pos) {
        const width = pos.x - this.selectionStart.x;
        const height = pos.y - this.selectionStart.y;
        
        this.selectionRect.setAttrs({
          width: Math.abs(width),
          height: Math.abs(height),
          x: width < 0 ? pos.x : this.selectionStart.x,
          y: height < 0 ? pos.y : this.selectionStart.y,
        });
        
        this.actualizarElementosSeleccionados();
      }
    }
  });

  this.stage.on('mouseup touchend', () => {
    if (this.isSelecting) {
      this.finalizarSeleccion();
    }
  });
}


// Crear rectángulo de selección
private crearRectanguloSeleccion(): void {
  if (this.selectionRect) {
    this.selectionRect.remove();
  }

  this.selectionRect = new Konva.Rect({
    x: this.selectionStart.x,
    y: this.selectionStart.y,
    width: 0,
    height: 0,
    fill: 'rgba(0, 161, 255, 0.3)',
    stroke: '#00a1ff',
    strokeWidth: 1,
    dash: [5, 5],
    name: 'selection-rect'
  });

  this.layer.add(this.selectionRect);
  this.layer.batchDraw();
}

// Actualizar elementos seleccionados durante el arrastre
private actualizarElementosSeleccionados(): void {
  if (!this.selectionRect) return;

  const selectionBox = this.selectionRect.getClientRect();
  this.elementosSeleccionados.clear();

  // Buscar todos los contenedores que intersecten con la selección
  this.layer.find('.contenedor').forEach((node) => {
    if (node instanceof Konva.Group) {
      const nodeRect = node.getClientRect();
      
      if (this.hayInterseccion(selectionBox, nodeRect)) {
        const elementId = node.id();
        this.elementosSeleccionados.add(elementId);
        this.resaltarElemento(node, true);
      } else {
        this.resaltarElemento(node, false);
      }
    }
  });

  this.layer.batchDraw();
}

// Verificar intersección entre dos rectángulos
private hayInterseccion(rect1: any, rect2: any): boolean {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
}

// Resaltar elemento seleccionado
private resaltarElemento(node: Konva.Group, seleccionado: boolean): void {
  const rect = node.findOne('Rect, Circle, Line') as Konva.Shape;
  
  if (rect) {
    if (seleccionado) {
      rect.stroke('red');
      rect.strokeWidth(3);
    } else {
      // Restaurar color original
      const elemento = this.plantillaActual.elementos.find(e => e.id === node.id());
      if (elemento) {
        rect.stroke(elemento.estilos.border || '#3498db');
        rect.strokeWidth(2);
      }
    }
  }
}

// Finalizar selección
private finalizarSeleccion(): void {
  this.isSelecting = false;
  
  if (this.selectionRect) {
    this.selectionRect.remove();
    this.selectionRect = null;
  }
  
  console.log('Elementos seleccionados:', Array.from(this.elementosSeleccionados));
  this.layer.batchDraw();
}

// Método para copiar elementos seleccionados
copiarElementosSeleccionados(): void {
  if (this.elementosSeleccionados.size === 0) {
    console.warn('No hay elementos seleccionados para copiar');
    return;
  }

  const elementosACopiar = this.plantillaActual.elementos.filter(
    elemento => this.elementosSeleccionados.has(elemento.id)
  );

  // Crear estructura de datos para el portapapeles
  const datosPortapapeles = {
    elementos: elementosACopiar.map(elemento => ({
      ...JSON.parse(JSON.stringify(elemento)),
      // No cambiar el ID aquí, lo haremos al pegar
    })),
    timestamp: Date.now(),
    tipo: 'timeline-elements'
  };

  // Guardar en localStorage
  localStorage.setItem('elementosCopiados', JSON.stringify(datosPortapapeles));
  
  // También copiar al portapapeles del sistema si está disponible
  this.copiarAlPortapapelesSistema(datosPortapapeles);
  
  console.log(`📋 Copiados ${elementosACopiar.length} elementos`);
  
  // Mostrar notificación temporal
  this.mostrarNotificacion(`Copiados ${elementosACopiar.length} elementos`);
}


private copiarAlPortapapelesSistema(datos: any): void {
  try {
    // Intentar usar la Clipboard API moderna
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(JSON.stringify(datos))
        .then(() => console.log('✅ Copiado al portapapeles del sistema'))
        .catch(err => console.warn('No se pudo copiar al portapapeles del sistema:', err));
    }
  } catch (error) {
    console.warn('Clipboard API no disponible:', error);
  }
}

pegarElementosCopiados(): void {
  // Primero intentar desde localStorage
  const elementosCopiadosStr = localStorage.getItem('elementosCopiados');
  
  if (!elementosCopiadosStr) {
    this.mostrarNotificacion('No hay elementos en el portapapeles', 'warning');
    return;
  }

  try {
    const datosPortapapeles = JSON.parse(elementosCopiadosStr);
    
    // Verificar que los datos sean válidos
    if (!datosPortapapeles.elementos || !Array.isArray(datosPortapapeles.elementos)) {
      this.mostrarNotificacion('Datos del portapapeles no válidos', 'error');
      return;
    }

    const elementosCopiados: ElementoPlantilla[] = datosPortapapeles.elementos;
    
    if (elementosCopiados.length === 0) {
      this.mostrarNotificacion('No hay elementos para pegar', 'warning');
      return;
    }

    // Calcular el desplazamiento para el pegado
    const desplazamiento = 30;
    const nuevosElementos: ElementoPlantilla[] = [];

    elementosCopiados.forEach(elemento => {
      const nuevoElemento: ElementoPlantilla = {
        ...JSON.parse(JSON.stringify(elemento)),
        id: this.generarIdElemento(),
        posicion: {
          ...elemento.posicion,
          x: elemento.posicion.x + desplazamiento,
          y: elemento.posicion.y + desplazamiento
        }
      };
      
      nuevosElementos.push(nuevoElemento);
      this.plantillaActual.elementos.push(nuevoElemento);
      this.dibujarElemento(nuevoElemento);
    });

    // Seleccionar los elementos pegados
    this.limpiarSeleccion();
    nuevosElementos.forEach(elemento => {
      this.elementosSeleccionados.add(elemento.id);
      const node = this.layer.findOne(`#${elemento.id}`);
      if (node) {
        this.resaltarElemento(node as Konva.Group, true);
      }
    });

    this.layer.batchDraw();
    
    console.log(`📄 Pegados ${nuevosElementos.length} elementos`);
    this.mostrarNotificacion(`Pegados ${nuevosElementos.length} elementos`);
    
  } catch (error) {
    console.error('Error al pegar elementos:', error);
    this.mostrarNotificacion('Error al pegar elementos', 'error');
  }
}


private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success'): void {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion notificacion-${tipo}`;
  notificacion.textContent = mensaje;
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : '#fff3cd'};
    color: ${tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : '#856404'};
    border: 1px solid ${tipo === 'success' ? '#c3e6cb' : tipo === 'error' ? '#f5c6cb' : '#ffeaa7'};
    border-radius: 4px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  `;

  document.body.appendChild(notificacion);

  // Remover después de 3 segundos
  setTimeout(() => {
    if (document.body.contains(notificacion)) {
      document.body.removeChild(notificacion);
    }
  }, 3000);
}

// Método para verificar si hay elementos en el portapapeles
hayElementosParaPegar(): boolean {
  return localStorage.getItem('elementosCopiados') !== null;
}

// Método para obtener el número de elementos en el portapapeles
getNumeroElementosPortapapeles(): number {
  try {
    const datos = localStorage.getItem('elementosCopiados');
    if (datos) {
      const parsed = JSON.parse(datos);
      return parsed.elementos?.length || 0;
    }
  } catch (error) {
    console.error('Error al leer portapapeles:', error);
  }
  return 0;
}

// Método para pegar elementos copiados
/*pegarElementosCopiados(): void {
  const elementosCopiadosStr = localStorage.getItem('elementosCopiados');
  
  if (!elementosCopiadosStr) {
    alert('No hay elementos en el portapapeles');
    return;
  }

  try {
    const elementosCopiados: ElementoPlantilla[] = JSON.parse(elementosCopiadosStr);
    
    elementosCopiados.forEach(elemento => {
      // Asignar nuevo ID y ajustar posición
      elemento.id = this.generarIdElemento();
      elemento.posicion.x += 50;
      elemento.posicion.y += 50;
      
      this.plantillaActual.elementos.push(elemento);
      this.dibujarElemento(elemento);
    });

    console.log(`📋 Pegados ${elementosCopiados.length} elementos`);
    alert(`Pegados ${elementosCopiados.length} elementos`);
    
  } catch (error) {
    console.error('Error al pegar elementos:', error);
    alert('Error al pegar elementos');
  }
}*/

// Método para eliminar elementos seleccionados
eliminarElementosSeleccionados(): void {
  if (this.elementosSeleccionados.size === 0) {
    alert('No hay elementos seleccionados para eliminar');
    return;
  }

  if (!confirm(`¿Está seguro de que desea eliminar ${this.elementosSeleccionados.size} elementos?`)) {
    return;
  }

  // Eliminar del array de elementos
  this.plantillaActual.elementos = this.plantillaActual.elementos.filter(
    elemento => !this.elementosSeleccionados.has(elemento.id)
  );

  // Eliminar del layer
  this.elementosSeleccionados.forEach(id => {
    const node = this.layer.findOne(`#${id}`);
    if (node) {
      node.remove();
    }
  });

  console.log(`🗑️ Eliminados ${this.elementosSeleccionados.size} elementos`);
  this.elementosSeleccionados.clear();
  this.layer.batchDraw();
}

// Método para seleccionar todos los contenedores
seleccionarTodosLosContenedores(): void {
  this.elementosSeleccionados.clear();
  
  this.plantillaActual.elementos
    .filter(elemento => elemento.esContenedor)
    .forEach(elemento => {
      this.elementosSeleccionados.add(elemento.id);
      
      const node = this.layer.findOne(`#${elemento.id}`);
      if (node) {
        this.resaltarElemento(node as Konva.Group, true);
      }
    });
  
  this.layer.batchDraw();
  console.log(`Seleccionados ${this.elementosSeleccionados.size} contenedores`);
}

// Método para limpiar selección
limpiarSeleccion(): void {
  this.elementosSeleccionados.forEach(id => {
    const node = this.layer.findOne(`#${id}`);
    if (node) {
      this.resaltarElemento(node as Konva.Group, false);
    }
  });
  
  this.elementosSeleccionados.clear();
  this.layer.batchDraw();
}

//Aqui termina el copiar y pegar :))





   aplicarYCrearContenedor(): void {
    if (this.esNuevoContenedor && this.contenedorTemporal && this.eventoActualId) {
      this.plantillaActual.elementos.push(this.contenedorTemporal);
      this.asignarContenedorAEvento(this.contenedorTemporal.id, this.eventoActualId);
      this.dibujarElemento(this.contenedorTemporal);
      
      //console.log('✅ Contenedor creado en evento:', this.obtenerEventoPorId(this.eventoActualId)?.nombre);
      
      this.contenedorTemporal = null;
      this.esNuevoContenedor = false;
    } else if (this.elementoAConfigurar) {
      this.actualizarVistaElemento();
    }
    
    this.cerrarModalConfiguracion();
  }




  formasDisponibles = [
  { id: 'rectangulo', nombre: 'Rectángulo', icono: '🟦' },
  { id: 'circulo', nombre: 'Círculo', icono: '⭕' },
  { id: 'rombo', nombre: 'Rombo', icono: '🔷' },
  { id: 'estrella', nombre: 'Estrella', icono: '⭐' },
  { id: 'triangulo', nombre: 'Triángulo', icono: '🔺' }
];



getTipoElementoTexto(): string {
  if (!this.elementoAConfigurar) return 'Elemento';
  
  if (this.elementoAConfigurar.esContenedor) {
    return 'Contenedor';
  } else if (this.elementoAConfigurar.tipo.includes('linea')) {
    return 'Datos de Línea';
  } else {
    return 'Elemento';
  }
}


/*cambiarFormaContenedor(forma: "rectangulo" | "circulo" | "rombo" | "estrella"): void {
  if (this.elementoAConfigurar && this.elementoAConfigurar.configuracionContenedor) {
    this.elementoAConfigurar.configuracionContenedor.forma = forma;
    this.actualizarVistaElemento();
  }
}*/


cambiarFormaContenedor(forma: string) {
  if (["rectangulo", "circulo", "rombo", "estrella"].includes(forma)) {
    this.elementoAConfigurar!.configuracionContenedor!.forma = forma as
      | "rectangulo"
      | "circulo"
      | "rombo"
      | "estrella";
    this.actualizarVistaElemento();
  }
}




  cambiarContenedorAEvento(numeroEvento: number): void {
    if (!this.elementoAConfigurar) return;
    
    const evento = this.obtenerEventoParaContenedor(numeroEvento);
    this.asignarContenedorAEvento(this.elementoAConfigurar.id, evento.id);
    this.eventoActualId = evento.id;
    
    this.actualizarElementosDisponibles();
    //console.log(`✅ Contenedor cambiado a ${evento.nombre}`);
  }

  getEventosDisponibles(): EventoGlobal[] {
    return this.eventosGlobales.sort((a, b) => a.numero - b.numero);
  }

  getEventoActual(): EventoGlobal | null {
    if (!this.eventoActualId) return this.eventosGlobales[0] || null;
    return this.eventosGlobales.find(e => e.id === this.eventoActualId) || null;
  }

   private obtenerEventoPorId(eventoId: string): EventoGlobal | null {
    return this.eventosGlobales.find(e => e.id === eventoId) || null;
  }

  private obtenerElementosUsadosEnEvento(eventoId: string): Set<string> {
    const elementosUsados = new Set<string>();
    const evento = this.obtenerEventoPorId(eventoId);
    
    if (!evento) return elementosUsados;
    
    evento.contenedores.forEach(contenedorId => {
      const contenedor = this.plantillaActual.elementos.find(el => el.id === contenedorId);
      if (contenedor && contenedor.elementosInternos) {
        contenedor.elementosInternos.forEach(elem => {
          elementosUsados.add(elem.tipo);
        });
      }
    });
    
    return elementosUsados;
  }


    private actualizarElementosDisponibles(): void {
    if (!this.eventoActualId || !this.elementoAConfigurar) return;
    
    const elementosUsados = this.obtenerElementosUsadosEnEvento(this.eventoActualId);
    
    if (this.elementoAConfigurar.elementosInternos) {
      this.elementoAConfigurar.elementosInternos.forEach(elem => {
        elementosUsados.delete(elem.tipo);
      });
    }
    
    this.elementosDisponiblesParaAgregar = this.getElementosDisponiblesParaContenedor()
      .filter(elem => !elementosUsados.has(elem.tipo));
  }

   private getElementosDisponiblesParaContenedor(): any[] {
    return [
      { tipo: 'titulo-evento', nombre: 'Título del Evento', icono: '🏷️' },
      { tipo: 'descripcion-evento', nombre: 'Descripción del Evento', icono: '📄' },
      { tipo: 'año-evento', nombre: 'Año del Evento', icono: '📅' },
      { tipo: 'imagen-evento', nombre: 'Imagen del Evento', icono: '🖼️' },
      { tipo: 'link-evento', nombre: 'Enlace del Evento', icono: '🔗' }
    ];
  }

  

  elementosDisponiblesParaAgregar: any[] = [];

  // Obtener elementos disponibles para agregar
  getElementosDisponiblesParaEventoActual(): any[] {
    return this.elementosDisponiblesParaAgregar;
  }


  



  agregarElementoAContenedor(elementoTipo: string): void {
    if (!this.elementoAConfigurar || !elementoTipo) return;

    if (!this.elementoAConfigurar.elementosInternos) {
      this.elementoAConfigurar.elementosInternos = [];
    }

    const nuevoElemento: ElementoPlantilla = {
      id: this.generarIdElemento(),
      tipo: elementoTipo as any,
      contenido: this.getContenidoPorDefecto(elementoTipo),
      estilos: this.getEstilosPorDefecto(elementoTipo),
      posicion: {
        x: 10,
        y: 10 + (this.elementoAConfigurar.elementosInternos.length * 30),
        ancho: 180,
        alto: 25,
        tipoPosicion: 'relativa'
      }
    };

    this.elementoAConfigurar.elementosInternos.push(nuevoElemento);
    this.elementoSeleccionadoModal = null;
    
    this.actualizarElementosDisponibles();
    this.actualizarVistaElemento();
  }


   private reagruparContenedoresPorEvento(eventoId: string): void {
    const evento = this.obtenerEventoPorId(eventoId);
    if (!evento || evento.contenedores.length === 0) return;

    const contenedores = evento.contenedores
      .map(id => this.plantillaActual.elementos.find(el => el.id === id))
      .filter((c): c is ElementoPlantilla => c !== undefined && c.esContenedor==true);

    if (contenedores.length === 0) return;

    //console.log(`🔧 Reagrupando ${contenedores.length} contenedores del evento ${evento.nombre}`);

    const grupoId = `grupo-${eventoId}`;
    
    contenedores.forEach(contenedor => {
      contenedor.grupoHorizontalId = grupoId;
    });

    const posicionPromedio = contenedores.reduce((sum, c) => sum + c.posicion.x, 0) / contenedores.length;

    this.gruposHorizontales.set(grupoId, {
      id: grupoId,
      elementoIds: contenedores.map(c => c.id),
      posicionX: posicionPromedio
    });

    this.sincronizarGrupoHorizontal(grupoId, posicionPromedio);
  }


   /*abrirModalConfiguracion(elemento: ElementoPlantilla): void {
    this.elementoAConfigurar = elemento;
    
    if (elemento.eventoAsignadoId) {
      this.eventoActualId = elemento.eventoAsignadoId;
    } else {
      // Asignar evento por defecto si no tiene
      this.eventoActualId = this.eventosGlobales[0].id;
      elemento.eventoAsignadoId = this.eventoActualId;
      this.asignarContenedorAEvento(elemento.id, this.eventoActualId);
    }
    
    this.actualizarElementosDisponibles();
    this.showModalConfiguracion = true;
  }*/


    abrirModalConfiguracion(elemento: ElementoPlantilla): void {
  this.elementoAConfigurar = elemento;
  
  // Inicializar datosEvento si no existen (para contenedores)
  if (elemento.esContenedor && !elemento.datosEvento) {
    elemento.datosEvento = {
      eventoNumero: 1,
      //titulo: elemento.contenido || 'Nuevo Evento',
      descripcion: 'Descripción del evento...',
      colorEvento: elemento.estilos.backgroundColor || '#3498db'
    };
  }
  
  // Inicializar datosLinea si no existen (para elementos de línea)
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
 getElementosEventoActual(): ElementoPlantilla[] {
    if (!this.elementoAConfigurar) return [];
    return this.elementoAConfigurar.elementosInternos || [];
  }


   removerElementoDeContenedor(index: number): void {
    if (!this.elementoAConfigurar || !this.elementoAConfigurar.elementosInternos) return;
    
    this.elementoAConfigurar.elementosInternos.splice(index, 1);
    this.actualizarElementosDisponibles();
    this.actualizarVistaElemento();
  }

  private crearPlantillaVacia(): PlantillaDesign {
    return {
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
      eventosGlobales: [], // Nueva propiedad
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



  ///ata aqui lo Bueno


  inicializarEditor(): void {
  const containerWidth = this.container.nativeElement.offsetWidth;
  const height = 600;
  
  // Calcular ancho inicial amplio
  const anchoInicial = Math.max(containerWidth, 2000); // Mínimo 2000px

  this.stage = new Konva.Stage({
    container: this.container.nativeElement,
    width: anchoInicial,
    height: height
  });

  this.layer = new Konva.Layer();
  this.stage.add(this.layer);

  this.dibujarAreaTrabajo();
}


private escalaActual = 1;

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
  this.stage.scale({ x: this.escalaActual, y: this.escalaActual });
  this.layer.batchDraw();
}


private expandirCanvasSiNecesario(): void {
  const anchoNecesario = this.calcularAnchoTotal();
  
  if (anchoNecesario > this.stage.width()) {
    this.stage.width(anchoNecesario + 200); // Agregar margen extra
    this.limpiarEditor();
    this.plantillaActual.elementos.forEach(elemento => {
      this.dibujarElemento(elemento);
    });
  }
}

/*aplicarYCrearContenedor(): void {
  if (this.esNuevoContenedor && this.contenedorTemporal && this.eventoActualId) {
    this.plantillaActual.elementos.push(this.contenedorTemporal);
    this.asignarContenedorAEvento(this.contenedorTemporal.id, this.eventoActualId);
    this.dibujarElemento(this.contenedorTemporal);
    
    // Expandir canvas si es necesario
    this.expandirCanvasSiNecesario();
    
    this.contenedorTemporal = null;
    this.esNuevoContenedor = false;
  }
  
  this.cerrarModalConfiguracion();
}*/


private habilitarScrollHorizontal(): void {
  const container = this.container.nativeElement;
  
  // Scroll con la rueda del mouse
  this.stage.on('wheel', (e) => {
    e.evt.preventDefault();
    
    const dx = e.evt.deltaY;
    const minX = -this.calcularAnchoTotal() + this.stage.width();
    const maxX = 0;
    
    const newX = Math.max(minX, Math.min(maxX, this.layer.x() - dx));
    
    this.layer.x(newX);
    this.layer.batchDraw();
  });
}


private calcularAnchoTotal(): number {
  if (this.plantillaActual.elementos.length === 0) {
    return this.stage.width();
  }
  
  const posicionesX = this.plantillaActual.elementos
    .filter(e => e.esContenedor === true)
    .map(e => e.posicion.x + e.posicion.ancho);
  
  const maxX = Math.max(...posicionesX, this.stage.width());
  return maxX + 100; // Margen adicional
}




  // ✅ MÉTODO IMPLEMENTADO: Navegar al evento anterior
 eventoAnterior(): void {
    if (this.eventoActual > 0) {
      this.eventoActual--;
      this.actualizarEventoActivo();
      this.actualizarVistaEvento();
    }
  }

  // ✅ MÉTODO IMPLEMENTADO: Navegar al siguiente evento
  siguienteEvento(): void {
    if (this.eventoActual < this.eventosEnContenedor.length - 1) {
      this.eventoActual++;
      this.actualizarEventoActivo();
      this.actualizarVistaEvento();
    }
  }

  


  

  // ✅ MÉTODO IMPLEMENTADO: Actualizar vista del evento
  actualizarVistaEvento(): void {
    if (!this.tieneEventos()) return;
    
    const evento = this.eventosEnContenedor[this.eventoActual];
    console.log('Evento actual:', evento.nombre, 'Elementos:', evento.elementos);
    
    // Redibujar el contenedor con los elementos del evento actual
    this.limpiarYRedibujarElemento(this.elementoAConfigurar!);
  }

  agregarNuevoEvento(): void {
    if (!this.elementoAConfigurar) return;

    if (!this.elementoAConfigurar.eventos) {
      this.elementoAConfigurar.eventos = [];
    }

    const numeroEvento = this.elementoAConfigurar.eventos.length + 1;
    const nuevoEvento = this.crearEventoVacio(`${numeroEvento}`);
    
    this.elementoAConfigurar.eventos.push(nuevoEvento);
    this.eventoActual = this.elementoAConfigurar.eventos.length - 1;
    this.actualizarEventoActivo();
    this.actualizarVistaEvento();
  }

  /*cambiarAEvento(index: number): void {
    if (index >= 0 && index < this.eventosEnContenedor.length) {
      this.eventoActual = index;
      this.actualizarEventoActivo();
      this.actualizarVistaEvento();
    }
  }*/



  

  // ✅ MÉTODO IMPLEMENTADO: Generar ID único para elementos
  private generarIdElemento(): string {
    return 'elem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }




 private inicializarEventosContenedor(): void {
    if (!this.elementoAConfigurar) return;
    
    // ✅ CORRECIÓN: Asegurar que el contenedor tenga eventos
    if (!this.elementoAConfigurar.eventos || this.elementoAConfigurar.eventos.length === 0) {
        this.elementoAConfigurar.eventos = [this.crearEventoVacio('Evento 1')];
        console.log('✅ Eventos creados para contenedor sin eventos');
    }
    
    // ✅ CORRECIÓN: Asignar IDs únicos y mantener consistencia
    this.elementoAConfigurar.eventos.forEach((evento, index) => {
        if (!evento.id) {
            evento.id = 'evento-' + this.generarIdElemento();
        }
        // Mantener el nombre original si existe, sino asignar uno por defecto
        if (!evento.nombre) {
            evento.nombre = `Evento ${index + 1}`;
        }
    });
    
    this.eventosEnContenedor = this.elementoAConfigurar.eventos;
    
    // ✅ CORRECIÓN: Encontrar evento activo de manera más robusta
    this.eventoActual = this.eventosEnContenedor.findIndex(evento => evento.activo);
    if (this.eventoActual === -1) {
        this.eventoActual = 0;
        this.actualizarEventoActivo(); // Activar el primer evento
    }
    
    console.log('📊 Eventos inicializados para contenedor:', {
        contenedorId: this.elementoAConfigurar.id,
        eventos: this.eventosEnContenedor.map(e => ({ nombre: e.nombre, id: e.id, activo: e.activo })),
        eventoActual: this.eventoActual
    });
}



 private crearEventoVacio(nombre: string): EventoContenedor {
    const eventoId = 'evento-' + this.generarIdElemento();
    return {
        id: eventoId,
        nombre: nombre,
        elementos: [],
        activo: false
    };
}

  // ✅ MÉTODO: Actualizar evento activo
  private actualizarEventoActivo(): void {
    this.eventosEnContenedor.forEach((evento, index) => {
      evento.activo = (index === this.eventoActual);
    });
  }


  private obtenerEventoActualContenedor(elemento: ElementoPlantilla): string {
    // Si el elemento ya tiene eventoPadreId, usarlo
    if (elemento.eventoPadreId) {
        return elemento.eventoPadreId;
    }
    
    // Si estamos en un modal activo, usar el evento actual del modal
    if (this.showModalConfiguracion && this.elementoAConfigurar && this.eventosEnContenedor[this.eventoActual]) {
        return this.eventosEnContenedor[this.eventoActual].id;
    }
    
    // Valor por defecto
    return 'evento-default';
}

 private estanEnMismoEvento(contenedor1: ElementoPlantilla, contenedor2: ElementoPlantilla): boolean {
    // ✅ COMPARACIÓN DIRECTA Y ESTRICTA
    return contenedor1.eventoPadreId !== undefined && 
           contenedor2.eventoPadreId !== undefined && 
           contenedor1.eventoPadreId === contenedor2.eventoPadreId;
}


private todosEnMismoEvento(grupoId: string): boolean {
    const grupo = this.gruposHorizontales.get(grupoId);
    if (!grupo || grupo.elementoIds.length === 0) {
        return false;
    }

    // Obtener todos los elementos del grupo
    const elementosGrupo = grupo.elementoIds
        .map(id => this.plantillaActual.elementos.find(e => e.id === id))
        .filter((e): e is ElementoPlantilla => e !== undefined);

    if (elementosGrupo.length === 0) {
        return false;
    }

    // Tomar el evento del primer elemento como referencia
    const eventoReferencia = elementosGrupo[0].eventoPadreId;
    
    // Verificar que TODOS tengan el mismo evento
    const todosMismoEvento = elementosGrupo.every(elemento => 
        elemento.eventoPadreId === eventoReferencia
    );

    console.log('🔍 Verificando grupo completo:', {
        grupoId,
        elementos: elementosGrupo.length,
        eventoReferencia,
        todosMismoEvento,
        eventos: elementosGrupo.map(e => ({ id: e.id, evento: e.eventoPadreId }))
    });

    return todosMismoEvento;
}

private obtenerEventoReferenciaGrupo(grupoId: string): string | null {
    const grupo = this.gruposHorizontales.get(grupoId);
    if (!grupo || grupo.elementoIds.length === 0) return null;

    const primerElemento = this.plantillaActual.elementos.find(e => e.id === grupo.elementoIds[0]);
    return primerElemento?.eventoPadreId || null;
}



debugContenedores(): void {
    console.log('=== DEBUG CONTENEDORES ===');
    this.plantillaActual.elementos.filter(e => e.esContenedor).forEach(contenedor => {
        console.log(`Contenedor ${contenedor.id}:`, {
            eventoPadreId: contenedor.eventoPadreId,
            grupoHorizontalId: contenedor.grupoHorizontalId,
            posicion: contenedor.posicion
        });
    });
    
    console.log('=== GRUPOS HORIZONTALES ===');
    this.gruposHorizontales.forEach((grupo, grupoId) => {
        console.log(`Grupo ${grupoId}:`, grupo.elementoIds);
    });
    console.log('==========================');
}



  // ✅ MÉTODO IMPLEMENTADO: Obtener contenido por defecto
  private getContenidoPorDefecto(tipo: string): string {
    const contenidos: { [key: string]: string } = {
      titulo: 'Título del evento',
      año: '2024',
      descripcion: 'Descripción del evento...',
      persona: 'Nombre de la persona',
      imagen: 'Imagen del evento',
      linea: 'Línea decorativa',
      circulo: 'Círculo decorativo'
    };
    return contenidos[tipo] || 'Contenido';
  }

  // ✅ MÉTODO IMPLEMENTADO: Obtener estilos por defecto
  private getEstilosPorDefecto(tipo: string): any {
    const estilosBase: { [key: string]: any } = {
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
      },
      decoracion: { 
        backgroundColor: '#007bff' 
      }
    };
    return estilosBase[tipo] || {};
  }

  // ✅ MÉTODO IMPLEMENTADO: Limpiar y redibujar elemento
  private limpiarYRedibujarElemento(elemento: ElementoPlantilla): void {
    // Encontrar y eliminar el elemento actual del layer
    const shapes = this.layer.children?.filter(child => 
      child.getAttr('elementId') === elemento.id
    );
    
    shapes?.forEach(shape => shape.remove());
    
    // Volver a dibujar el elemento
    this.dibujarElemento(elemento);
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
    this.dibujarLineaTiempoPrincipal();
    this.layer.draw();
  }

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
      stroke: this.plantillaActual.estilosGlobales.colores.primario,
      strokeWidth: 3,
      lineCap: 'round',
      lineJoin: 'round',
      dash: config.tipoLinea === 'curva' ? [] : [5, 5]
    });

    this.layer.add(this.lineaTiempoPrincipal);
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

  actualizarConfiguracion(): void {
    this.limpiarEditor();
    this.dibujarAreaTrabajo();
    this.plantillaActual.elementos.forEach(elemento => {
      this.dibujarElemento(elemento);
    });
  }

  actualizarFormaContenedor(forma: 'rectangulo' | 'circulo' | 'rombo' | 'estrella'): void {
    if (this.elementoAConfigurar) {
      if (!this.elementoAConfigurar.configuracionContenedor) {
        this.elementoAConfigurar.configuracionContenedor = {
          maxElementos: 2,
          forma: 'rectangulo',
          alineacion: 'centro'
        };
      }
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

  actualizarVistaElemento(): void {
    if (this.elementoAConfigurar) {
      this.limpiarYRedibujarElemento(this.elementoAConfigurar);
    }
  }


  private obtenerOGrupoHorizontal(elemento: ElementoPlantilla): string {
    if (!elemento.grupoHorizontalId) {
      // Crear nuevo grupo
      const grupoId = this.generarIdElemento();
      elemento.grupoHorizontalId = grupoId;
      
      this.gruposHorizontales.set(grupoId, {
        id: grupoId,
        elementoIds: [elemento.id],
        posicionX: elemento.posicion.x
      });
    }
    
    return elemento.grupoHorizontalId;
  }

  private agregarAGrupoHorizontal(elemento: ElementoPlantilla, grupoId: string): void {
    if (elemento.grupoHorizontalId === grupoId) {
        console.log('ℹ️ Elemento ya está en el grupo:', grupoId);
        return;
    }
    
    // Remover de grupo anterior si existe
    if (elemento.grupoHorizontalId) {
        this.desagruparContenedor(elemento);
    }
    
    elemento.grupoHorizontalId = grupoId;
    const grupo = this.gruposHorizontales.get(grupoId);
    
    if (grupo && !grupo.elementoIds.includes(elemento.id)) {
        grupo.elementoIds.push(elemento.id);
        
        // ✅ IMPORTANTE: Sincronizar posición X con el grupo
        elemento.posicion.x = grupo.posicionX;
        
        console.log('✅ Elemento agregado al grupo:', {
            elemento: elemento.id,
            grupo: grupoId,
            totalEnGrupo: grupo.elementoIds.length,
            posicionX: grupo.posicionX
        });
    }
}



forzarAgrupamientoContenedores(): void {
    console.log('🔄 FORZANDO AGRUPAMIENTO DE CONTENEDORES...');
    
    // Agrupar contenedores por evento
    const contenedoresPorEvento = new Map<string, ElementoPlantilla[]>();
    
    // Organizar contenedores por evento
    this.plantillaActual.elementos
        .filter(e => e.esContenedor && e.eventoPadreId)
        .forEach(contenedor => {
            const eventoId = contenedor.eventoPadreId!;
            if (!contenedoresPorEvento.has(eventoId)) {
                contenedoresPorEvento.set(eventoId, []);
            }
            contenedoresPorEvento.get(eventoId)!.push(contenedor);
        });
    
    // Crear grupos por evento
    contenedoresPorEvento.forEach((contenedores, eventoId) => {
        if (contenedores.length > 1) {
            console.log(`🔧 Agrupando ${contenedores.length} contenedores del evento: ${eventoId}`);
            
            // Crear nuevo grupo
            const grupoId = this.generarIdElemento();
            
            contenedores.forEach(contenedor => {
                contenedor.grupoHorizontalId = grupoId;
                console.log(`➕ Agregando contenedor ${contenedor.id} al grupo ${grupoId}`);
            });
            
            this.gruposHorizontales.set(grupoId, {
                id: grupoId,
                elementoIds: contenedores.map(c => c.id),
                posicionX: contenedores[0].posicion.x
            });
            
            // Sincronizar posición
            this.sincronizarGrupoHorizontal(grupoId, contenedores[0].posicion.x);
        }
    });
    
    console.log('✅ AGRUPAMIENTO FORZADO COMPLETADO');
    this.verificarEstadoGrupos();
}



// ✅ VERIFICACIÓN MEJORADA DEL ESTADO
// ✅ VERIFICAR ESTADO DE GRUPOS (MEJORADA)
verificarEstadoGrupos(): void {
    console.log('=== 📊 ESTADO DE GRUPOS POR EVENTO ===');
    
    // Organizar grupos por evento
    const gruposPorEvento = new Map<string, { grupos: string[], contenedores: number }>();
    
    this.gruposHorizontales.forEach((grupo, grupoId) => {
        const primerElementoId = grupo.elementoIds[0];
        const primerElemento = this.plantillaActual.elementos.find(e => e.id === primerElementoId);
        
        if (primerElemento && primerElemento.eventoPadreId) {
            const eventoId = primerElemento.eventoPadreId;
            const eventoNombre = primerElemento.eventos?.[0]?.nombre || 'Sin nombre';
            
            if (!gruposPorEvento.has(eventoId)) {
                gruposPorEvento.set(eventoId, { grupos: [], contenedores: 0 });
            }
            
            gruposPorEvento.get(eventoId)!.grupos.push(grupoId);
            gruposPorEvento.get(eventoId)!.contenedores += grupo.elementoIds.length;
        }
    });
    
    console.log(`📊 Resumen: ${this.gruposHorizontales.size} grupos en ${gruposPorEvento.size} eventos`);
    
    gruposPorEvento.forEach((info, eventoId) => {
        const primerElemento = this.plantillaActual.elementos.find(e => 
            e.eventoPadreId === eventoId
        );
        const eventoNombre = primerElemento?.eventos?.[0]?.nombre || 'Sin nombre';
        
        const estado = info.grupos.length === 1 ? '✅ CORRECTO' : '❌ ERROR';
        
        console.log(`🎯 ${eventoNombre}:`);
        console.log(`   📦 Contenedores: ${info.contenedores}`);
        console.log(`   👥 Grupos: ${info.grupos.length} ${estado}`);
        
        if (info.grupos.length > 1) {
            console.error(`   ❌ ERROR: ${info.grupos.length} grupos para el mismo evento!`);
            console.error(`   📍 Grupos: ${info.grupos.join(', ')}`);
        }
    });
    
    console.log('====================================');
}



unificarEventosConMismoNombre(): void {
    console.log('🔧 UNIFICANDO EVENTOS CON EL MISMO NOMBRE...');
    
    // 1. IDENTIFICAR eventos por nombre
    const eventosPorNombre = new Map<string, { eventoId: string, contenedores: ElementoPlantilla[] }>();
    
    this.plantillaActual.elementos
        .filter(e => e.esContenedor && e.eventoPadreId && e.eventos && e.eventos.length > 0)
        .forEach(contenedor => {
            const eventoNombre = contenedor.eventos![0].nombre;
            const eventoId = contenedor.eventoPadreId!;
            
            if (!eventosPorNombre.has(eventoNombre)) {
                eventosPorNombre.set(eventoNombre, { eventoId: eventoId, contenedores: [] });
            }
            eventosPorNombre.get(eventoNombre)!.contenedores.push(contenedor);
        });
    
    // 2. UNIFICAR eventos con el mismo nombre
    eventosPorNombre.forEach((info, eventoNombre) => {
        if (info.contenedores.length > 1) {
            console.log(`🔄 Unificando ${info.contenedores.length} contenedores de "${eventoNombre}"`);
            
            // Usar el primer eventoId como estándar
            const eventoIdEstandar = info.contenedores[0].eventoPadreId!;
            
            // Asignar el mismo eventoId a todos los contenedores con este nombre
            info.contenedores.forEach(contenedor => {
                if (contenedor.eventoPadreId !== eventoIdEstandar) {
                    console.log(`   ➕ Unificando contenedor ${contenedor.id} bajo evento ${eventoIdEstandar}`);
                    contenedor.eventoPadreId = eventoIdEstandar;
                }
            });
        }
    });
    
    // 3. REAGRUPAR después de unificar eventos
    this.forzarAgrupamientoCorrecto();
    
    console.log('✅ UNIFICACIÓN DE EVENTOS COMPLETADA');
}

renumerarEventosSecuencialmente(): void {
    console.log('🔢 RENUMERANDO EVENTOS SECUENCIALMENTE...');
    
    // 1. OBTENER todos los eventos únicos por ID
    const eventosUnicos = new Map<string, ElementoPlantilla[]>();
    
    this.plantillaActual.elementos
        .filter(e => e.esContenedor && e.eventoPadreId)
        .forEach(contenedor => {
            this.asegurarEventoExiste(contenedor);
            const eventoId = contenedor.eventoPadreId!;
            
            if (!eventosUnicos.has(eventoId)) {
                eventosUnicos.set(eventoId, []);
            }
            eventosUnicos.get(eventoId)!.push(contenedor);
        });
    
    console.log(`📊 Encontrados ${eventosUnicos.size} eventos únicos`);
    
    // 2. RENUMERAR secuencialmente
    let numero = 1;
    eventosUnicos.forEach((contenedores, eventoId) => {
        const nuevoNombre = `${numero}`;
        
        // Actualizar nombre en todos los contenedores de este evento
        contenedores.forEach(contenedor => {
            if (contenedor.eventos && contenedor.eventos.length > 0) {
                contenedor.eventos[0].nombre = nuevoNombre;
            }
            // También actualizar el contenido del contenedor para reflejar el cambio
            contenedor.contenido = `Contenedor ${nuevoNombre}`;
        });
        
        console.log(`   ${numero}. Evento ID ${eventoId} → "${nuevoNombre}" (${contenedores.length} contenedores)`);
        numero++;
    });
    
    // 3. REAGRUPAR después de renumerar
    this.forzarAgrupamientoCorrecto();
    
    console.log('✅ RENUMERACIÓN SECUENCIAL COMPLETADA');
}


forzarUnificacionCompleta(): void {
    console.log('🚀 INICIANDO UNIFICACIÓN COMPLETA...');
    
    // 1. Primero asegurar que todos los contenedores tienen eventos
    this.plantillaActual.elementos
        .filter(e => e.esContenedor)
        .forEach(contenedor => {
            this.asegurarEventoExiste(contenedor);
        });
    
    // 2. Renumerar eventos secuencialmente (esto elimina duplicados de nombre)
    this.renumerarEventosSecuencialmente();
    
    // 3. Unificar cualquier evento duplicado que pueda quedar
    this.unificarEventosDuplicados();
    
    // 4. Forzar agrupamiento correcto
    this.forzarAgrupamientoCorrecto();
    
    console.log('✅ UNIFICACIÓN COMPLETA TERMINADA');
    this.verificarEstadoCompletoEventos();
}


// ✅ DETECTAR Y UNIFICAR EVENTOS DUPLICADOS
unificarEventosDuplicados(): void {
    console.log('🔧 DETECTANDO Y UNIFICANDO EVENTOS DUPLICADOS...');
    
    // 1. IDENTIFICAR todos los eventos únicos por NOMBRE
    const eventosPorNombre = new Map<string, { eventoId: string, contenedores: ElementoPlantilla[] }>();
    
    this.plantillaActual.elementos
        .filter(e => e.esContenedor && e.eventoPadreId)
        .forEach(contenedor => {
            // Asegurar que el contenedor tenga eventos
            this.asegurarEventoExiste(contenedor);
            
            const eventoNombre = contenedor.eventos![0].nombre;
            const eventoId = contenedor.eventoPadreId ?? '';
            
            if (!eventosPorNombre.has(eventoNombre)) {
                eventosPorNombre.set(eventoNombre, { eventoId: eventoId, contenedores: [] });
            }
            eventosPorNombre.get(eventoNombre)!.contenedores.push(contenedor);
        });
    
    console.log(`📊 Eventos encontrados por nombre: ${eventosPorNombre.size}`);
    
    // 2. IDENTIFICAR eventos duplicados (mismo nombre, diferente ID)
    const eventosDuplicados: { nombre: string, eventoIds: string[] }[] = [];
    
    eventosPorNombre.forEach((info, nombreEvento) => {
        // Obtener todos los eventoIds únicos para este nombre
        const eventoIdsUnicos = [...new Set(info.contenedores.map(c => c.eventoPadreId))];
        
        if (eventoIdsUnicos.length > 1) {
            eventosDuplicados.push({
                nombre: nombreEvento,
                eventoIds: eventoIdsUnicos as string[]
            });
            console.log(`⚠️ Evento duplicado: "${nombreEvento}" tiene ${eventoIdsUnicos.length} IDs diferentes`);
        }
    });
    
    if (eventosDuplicados.length === 0) {
        console.log('✅ No se encontraron eventos duplicados');
        return;
    }
    
    // 3. UNIFICAR eventos duplicados
    eventosDuplicados.forEach(duplicado => {
        console.log(`🔄 Unificando evento "${duplicado.nombre}" con ${duplicado.eventoIds.length} IDs diferentes`);
        this.unificarEventosDuplicadosEspecificos(duplicado.nombre, duplicado.eventoIds);
    });
    
    // 4. REAGRUPAR después de unificar
    this.forzarAgrupamientoCorrecto();
    
    console.log('✅ UNIFICACIÓN DE EVENTOS DUPLICADOS COMPLETADA');
}

// ✅ UNIFICAR EVENTOS DUPLICADOS ESPECÍFICOS
private unificarEventosDuplicadosEspecificos(nombreEvento: string, eventoIds: string[]): void {
    if (eventoIds.length <= 1) return;
    
    // Usar el primer eventoId como estándar
    const eventoIdEstandar = eventoIds[0];
    
    console.log(`   🎯 Usando evento ID estándar: ${eventoIdEstandar}`);
    
    // Encontrar el contenedor que tiene el evento estándar para obtener su configuración
    const contenedorEstándar = this.plantillaActual.elementos.find(
        e => e.esContenedor && e.eventoPadreId === eventoIdEstandar
    );
    
    if (!contenedorEstándar) return;
    
    // 1. ASIGNAR el mismo eventoId a TODOS los contenedores con este nombre
    eventoIds.forEach(eventoId => {
        if (eventoId !== eventoIdEstandar) {
            this.plantillaActual.elementos
                .filter(e => e.esContenedor && e.eventoPadreId === eventoId)
                .forEach(contenedor => {
                    console.log(`   ➕ Unificando contenedor ${contenedor.id} bajo evento ${eventoIdEstandar}`);
                    
                    // Asignar el eventoId estándar
                    contenedor.eventoPadreId = eventoIdEstandar;
                    
                    // También copiar la configuración de eventos si existe
                    if (contenedorEstándar.eventos && contenedorEstándar.eventos.length > 0) {
                        contenedor.eventos = JSON.parse(JSON.stringify(contenedorEstándar.eventos));
                    }
                });
        }
    });
    
    console.log(`   ✅ Evento "${nombreEvento}" unificado bajo ID: ${eventoIdEstandar}`);
}


verificarYCorregirNombresDeEventos(): void {
    console.log('🔍 VERIFICANDO NOMBRES DE EVENTOS...');
    
    const eventosUnicos = new Map<string, { nombre: string, contenedores: ElementoPlantilla[] }>();
    let problemasEncontrados = false;
    
    // 1. IDENTIFICAR eventos únicos por ID
    this.plantillaActual.elementos
        .filter(e => e.esContenedor && e.eventoPadreId)
        .forEach(contenedor => {
            const eventoId = contenedor.eventoPadreId!;
            const eventoNombre = contenedor.eventos?.[0]?.nombre || 'Sin nombre';
            
            if (!eventosUnicos.has(eventoId)) {
                eventosUnicos.set(eventoId, { nombre: eventoNombre, contenedores: [] });
            }
            eventosUnicos.get(eventoId)!.contenedores.push(contenedor);
        });
    
    // 2. VERIFICAR consistencia de nombres por eventoId
    eventosUnicos.forEach((info, eventoId) => {
        const nombresUnicos = new Set(info.contenedores.map(c => c.eventos?.[0]?.nombre));
        
        if (nombresUnicos.size > 1) {
            problemasEncontrados = true;
            console.error(`❌ Evento ${eventoId} tiene nombres inconsistentes:`, Array.from(nombresUnicos));
            
            // Usar el nombre más común
            const nombreMasComun = this.obtenerNombreMasComun(info.contenedores);
            console.log(`   🔧 Corrigiendo a: "${nombreMasComun}"`);
            
            // Corregir nombres inconsistentes
            info.contenedores.forEach(contenedor => {
                if (contenedor.eventos && contenedor.eventos.length > 0) {
                    contenedor.eventos[0].nombre = nombreMasComun;
                }
            });
        }
    });
    
    // 3. VERIFICAR eventos con mismo nombre pero diferente ID
    const eventosPorNombre = new Map<string, string[]>();
    
 eventosUnicos.forEach((info, eventoId) => {
        if (!eventosPorNombre.has(info.nombre)) {
            eventosPorNombre.set(info.nombre, []);
        }
        eventosPorNombre.get(info.nombre)!.push(eventoId);
    });
    
    eventosPorNombre.forEach((eventoIds, nombreEvento) => {
        if (eventoIds.length > 1) {
            problemasEncontrados = true;
            console.warn(`⚠️ Múltiples eventos con nombre "${nombreEvento}": ${eventoIds.length} eventos`);
            
            if (confirm(`Se encontraron ${eventoIds.length} eventos diferentes con el nombre "${nombreEvento}". ¿Desea unificarlos?`)) {
                this.unificarEventosEspecificos(eventoIds, nombreEvento);
            }
        }
    });
    
    if (!problemasEncontrados) {
        console.log('✅ Todos los eventos tienen nombres consistentes');
    }
    
    this.verificarEstadoGrupos();
}

// ✅ OBTENER NOMBRE MÁS COMÚN
private obtenerNombreMasComun(contenedores: ElementoPlantilla[]): string {
    const contadores: { [nombre: string]: number } = {};
    
    contenedores.forEach(contenedor => {
        const nombre = contenedor.eventos?.[0]?.nombre;
        if (nombre) {
            contadores[nombre] = (contadores[nombre] || 0) + 1;
        }
    });
    
    return Object.keys(contadores).reduce((a, b) => 
        contadores[a] > contadores[b] ? a : b
    );
}

// ✅ UNIFICAR EVENTOS ESPECÍFICOS
private unificarEventosEspecificos(eventoIds: string[], nombreEvento: string): void {
    if (eventoIds.length <= 1) return;
    
    // Usar el primer eventoId como estándar
    const eventoIdEstandar = eventoIds[0];
    
    console.log(`🔄 Unificando ${eventoIds.length} eventos bajo ${eventoIdEstandar}`);
    
    // Asignar el mismo eventoId a todos los contenedores de estos eventos
    eventoIds.forEach(eventoId => {
        if (eventoId !== eventoIdEstandar) {
            this.plantillaActual.elementos
                .filter(e => e.esContenedor && e.eventoPadreId === eventoId)
                .forEach(contenedor => {
                    contenedor.eventoPadreId = eventoIdEstandar;
                    console.log(`   ➕ Contenedor ${contenedor.id} unificado bajo evento ${eventoIdEstandar}`);
                });
        }
    });
    
    // Reagrupar después de unificar
    this.forzarAgrupamientoCorrecto();
}

  private sincronizarGrupoHorizontal(grupoId: string, nuevaX: number): void {
    const grupo = this.gruposHorizontales.get(grupoId);
    if (!grupo) {
        console.error('❌ Grupo no encontrado:', grupoId);
        return;
    }

    // ✅ VERIFICAR QUE TODOS ESTÉN EN EL MISMO EVENTO
    if (!this.todosEnMismoEvento(grupoId)) {
        console.error('❌ Grupo contiene contenedores de diferentes eventos. Desagrupando...');
        this.desagruparGrupoInvalido(grupoId);
        return;
    }

    console.log('🔧 Sincronizando grupo válido:', grupoId, 'con', grupo.elementoIds.length, 'elementos');

    // ✅ FILTRAR elementos válidos del grupo
    const elementosGrupo = grupo.elementoIds
        .map(id => this.plantillaActual.elementos.find(e => e.id === id))
        .filter((e): e is ElementoPlantilla => e !== undefined && e.grupoHorizontalId === grupoId);

    // ✅ ACTUALIZAR la lista del grupo (por si hay elementos removidos)
    grupo.elementoIds = elementosGrupo.map(e => e.id);

    if (elementosGrupo.length === 0) {
        console.warn('🗑️ Grupo vacío, eliminando:', grupoId);
        this.gruposHorizontales.delete(grupoId);
        return;
    }

    // ✅ CALCULAR límites de movimiento
    const anchoMaximo = Math.max(...elementosGrupo.map(e => e.posicion.ancho));
    const areaTrabajo = {
        izquierda: 50,
        derecha: this.stage.width() - 50 - anchoMaximo
    };
    
    const xLimitada = Math.max(areaTrabajo.izquierda, Math.min(nuevaX, areaTrabajo.derecha));
    const diferenciaX = xLimitada - grupo.posicionX;
    
    console.log('📏 Moviendo grupo válido:', {
        nuevaX,
        xLimitada,
        diferenciaX,
        elementos: elementosGrupo.length
    });

    // ✅ ACTUALIZAR posición del grupo
    grupo.posicionX = xLimitada;

    // ✅ MOVER todos los elementos del grupo
    elementosGrupo.forEach(elemento => {
        elemento.posicion.x += diferenciaX;
        
        // ✅ ACTUALIZAR posición visual en el canvas
        const shape = this.layer.findOne(`#${elemento.id}`);
        if (shape) {
            shape.x(elemento.posicion.x);
            console.log('✅ Moviendo elemento:', elemento.id, 'a X:', elemento.posicion.x);
        }
    });

    this.layer.batchDraw();
}


renombrarEventosConsistentemente(): void {
    console.log('📝 RENOMBRANDO EVENTOS CONSISTENTEMENTE...');
    
    // Agrupar contenedores por eventoPadreId
    const contenedoresPorEvento = new Map<string, ElementoPlantilla[]>();
    
    this.plantillaActual.elementos
        .filter(e => e.esContenedor && e.eventoPadreId)
        .forEach(contenedor => {
            const eventoId = contenedor.eventoPadreId!;
            if (!contenedoresPorEvento.has(eventoId)) {
                contenedoresPorEvento.set(eventoId, []);
            }
            contenedoresPorEvento.get(eventoId)!.push(contenedor);
        });
    
    // Renombrar eventos secuencialmente
    let numeroEvento = 1;
    
    contenedoresPorEvento.forEach((contenedores, eventoId) => {
        const nuevoNombre = `${numeroEvento}`;
        
        contenedores.forEach(contenedor => {
            if (contenedor.eventos && contenedor.eventos.length > 0) {
                contenedor.eventos[0].nombre = nuevoNombre;
            }
        });
        
        console.log(`   🔧 Evento ${eventoId} renombrado a: ${nuevoNombre}`);
        numeroEvento++;
    });
    
    console.log('✅ RENOMBRADO DE EVENTOS COMPLETADO');
    this.verificarEstadoGrupos();
}

verificarEstadoCompletoEventos(): void {
    console.log('=== 🎯 ESTADO COMPLETO DE EVENTOS ===');
    
    const eventosPorId = new Map<string, { nombre: string, contenedores: number }>();
    const eventosPorNombre = new Map<string, string[]>();
    
    this.plantillaActual.elementos
        .filter(e => e.esContenedor && e.eventoPadreId)
        .forEach(contenedor => {
            this.asegurarEventoExiste(contenedor);
            
            const eventoId = contenedor.eventoPadreId!;
            const eventoNombre = contenedor.eventos![0].nombre;
            
            // Contar por ID
            if (!eventosPorId.has(eventoId)) {
                eventosPorId.set(eventoId, { nombre: eventoNombre, contenedores: 0 });
            }
            eventosPorId.get(eventoId)!.contenedores++;
            
            // Contar por nombre
            if (!eventosPorNombre.has(eventoNombre)) {
                eventosPorNombre.set(eventoNombre, []);
            }
            if (!eventosPorNombre.get(eventoNombre)!.includes(eventoId)) {
                eventosPorNombre.get(eventoNombre)!.push(eventoId);
            }
        });
    
    console.log('📊 POR ID DE EVENTO:');
    eventosPorId.forEach((info, eventoId) => {
        console.log(`   🆔 ${eventoId}: "${info.nombre}" → ${info.contenedores} contenedores`);
    });
    
    console.log('📊 POR NOMBRE DE EVENTO:');
    let problemas = 0;
    eventosPorNombre.forEach((eventoIds, nombreEvento) => {
        const estado = eventoIds.length === 1 ? '✅' : '❌';
        console.log(`   📝 "${nombreEvento}": ${eventoIds.length} eventos ${estado}`);
        
        if (eventoIds.length > 1) {
            problemas++;
            console.error(`      ❌ DUPLICADO: IDs ${eventoIds.join(', ')}`);
        }
    });
    
    if (problemas === 0) {
        console.log('✅✅✅ ESTADO PERFECTO: No hay eventos duplicados');
    } else {
        console.error(`❌❌❌ SE ENCONTRARON ${problemas} EVENTOS DUPLICADOS`);
    }
    
    console.log('==================================');
}

// ✅ ASEGURAR QUE UN CONTENEDOR TENGA EVENTO VÁLIDO
private asegurarEventoExiste(contenedor: ElementoPlantilla): void {
    // Verificar si el contenedor necesita eventos
    if (!contenedor.eventos || contenedor.eventos.length === 0) {
        console.log(`⚠️ Contenedor ${contenedor.id} no tiene eventos, creando uno...`);
        
        // Determinar el número de evento
        let numeroEvento: number;
        let nombreEvento: string;
        
        if (contenedor.eventoPadreId) {
            // Si ya tiene eventoPadreId, extraer el número si es posible
            const match = contenedor.eventoPadreId.match(/evento-(\d+)/);
            numeroEvento = match ? parseInt(match[1]) : this.obtenerNumeroEventoSiguiente();
        } else {
            numeroEvento = this.obtenerNumeroEventoSiguiente();
        }
        
        nombreEvento = `${numeroEvento}`;
        
        // Crear el evento
        contenedor.eventos = [this.crearEventoVacio(nombreEvento)];
        
        // Si no tiene eventoPadreId, asignarlo
        if (!contenedor.eventoPadreId) {
            contenedor.eventoPadreId = contenedor.eventos[0].id;
        }
        
        console.log(`✅ Evento creado: "${nombreEvento}" para contenedor ${contenedor.id}`);
    }
    
    // Verificar que el primer evento tenga nombre
    if (contenedor.eventos[0] && !contenedor.eventos[0].nombre) {
        const numeroEvento = this.obtenerNumeroEventoSiguiente();
        contenedor.eventos[0].nombre = `${numeroEvento}`;
        console.log(`✅ Nombre asignado a evento: "${contenedor.eventos[0].nombre}"`);
    }
    
    // Verificar que tenga eventoPadreId
    if (!contenedor.eventoPadreId && contenedor.eventos.length > 0) {
        contenedor.eventoPadreId = contenedor.eventos[0].id;
        console.log(`✅ eventoPadreId asignado: ${contenedor.eventoPadreId}`);
    }
}



// ✅ NUEVA FUNCIÓN: Desagrupar cuando hay contenedores de diferentes eventos
private desagruparGrupoInvalido(grupoId: string): void {
    const grupo = this.gruposHorizontales.get(grupoId);
    if (!grupo) return;

    console.warn('🚨 Desagrupando grupo inválido (diferentes eventos):', grupoId);

    // Obtener el evento de referencia (el más común)
    const eventoReferencia = this.obtenerEventoReferenciaGrupo(grupoId);
    
    // Desagrupar todos los elementos
    grupo.elementoIds.forEach(elementoId => {
        const elemento = this.plantillaActual.elementos.find(e => e.id === elementoId);
        if (elemento) {
            // Solo mantener en grupo si está en el evento de referencia
            if (elemento.eventoPadreId !== eventoReferencia) {
                elemento.grupoHorizontalId = undefined;
                console.log('❌ Removiendo elemento de grupo por evento diferente:', elemento.id);
            }
        }
    });

    // Si quedan elementos en el mismo evento, mantener el grupo con solo esos
    const elementosMismoEvento = grupo.elementoIds
        .map(id => this.plantillaActual.elementos.find(e => e.id === id))
        .filter((e): e is ElementoPlantilla => e !== undefined && e.eventoPadreId === eventoReferencia);

    if (elementosMismoEvento.length > 1) {
        // Mantener el grupo solo con los elementos del mismo evento
        grupo.elementoIds = elementosMismoEvento.map(e => e.id);
        console.log('🔄 Grupo reconstruido con elementos del mismo evento:', elementosMismoEvento.length);
    } else {
        // Desagrupar completamente si quedan menos de 2 elementos
        elementosMismoEvento.forEach(e => e.grupoHorizontalId = undefined);
        this.gruposHorizontales.delete(grupoId);
        console.log('🗑️ Grupo eliminado por tener muy pocos elementos del mismo evento');
    }
}

  private limpiarGruposEntreEventos(): void {
    this.gruposHorizontales.forEach((grupo, grupoId) => {
      const elementos = grupo.elementoIds
        .map(id => this.plantillaActual.elementos.find(e => e.id === id))
        .filter((e): e is ElementoPlantilla => e !== undefined);
      
      if (elementos.length === 0) {
        this.gruposHorizontales.delete(grupoId);
        return;
      }

      // ✅ VERIFICAR si todos están en el mismo evento
      const primerEvento = this.obtenerEventoActualContenedor(elementos[0]);
      const todosMismoEvento = elementos.every(elemento => 
        this.obtenerEventoActualContenedor(elemento) === primerEvento
      );

      if (!todosMismoEvento) {
        // ✅ DESAGRUPAR elementos de diferentes eventos
        console.warn('Desagrupando elementos de diferentes eventos del grupo:', grupoId);
        elementos.forEach(elemento => {
          elemento.grupoHorizontalId = undefined;
        });
        this.gruposHorizontales.delete(grupoId);
      }
    });
  }


  cambiarAEvento(index: number): void {
    if (index >= 0 && index < this.eventosEnContenedor.length) {
        this.eventoActual = index;
        this.actualizarEventoActivo();
        
        // ✅ ACTUALIZAR evento padre del contenedor
        if (this.elementoAConfigurar && this.eventosEnContenedor[this.eventoActual]) {
            const nuevoEventoId = this.eventosEnContenedor[this.eventoActual].id;
            this.elementoAConfigurar.eventoPadreId = nuevoEventoId;
            
            console.log('🔄 Contenedor re-asignado al evento:', {
                contenedor: this.elementoAConfigurar.id,
                nuevoEvento: nuevoEventoId
            });
            
            // ✅ REAGRUPAR todos los contenedores por evento
            this.agruparContenedoresPorEvento();
        }
        
        this.actualizarVistaEvento();
    }
}



// ✅ VERIFICAR AGRUPAMIENTO POR EVENTO ESPECÍFICO
verificarAgrupamientoPorEvento(): void {
    console.log('=== 🔍 VERIFICANDO AGRUPAMIENTO POR EVENTO ===');
    
    const contenedores = this.plantillaActual.elementos.filter(e => e.esContenedor);
    const eventosUnicos = new Map<string, { nombre: string, contenedores: ElementoPlantilla[] }>();
    
    // Organizar contenedores por evento
    contenedores.forEach(contenedor => {
        if (contenedor.eventoPadreId) {
            const eventoNombre = contenedor.eventos?.[0]?.nombre || 'Sin nombre';
            if (!eventosUnicos.has(contenedor.eventoPadreId)) {
                eventosUnicos.set(contenedor.eventoPadreId, { 
                    nombre: eventoNombre, 
                    contenedores: [] 
                });
            }
            eventosUnicos.get(contenedor.eventoPadreId)!.contenedores.push(contenedor);
        }
    });
    
    console.log(`📊 ${contenedores.length} contenedores en ${eventosUnicos.size} eventos diferentes`);
    
    eventosUnicos.forEach((info, eventoId) => {
        const gruposEnEsteEvento = new Set<string>();
        
        info.contenedores.forEach(contenedor => {
            if (contenedor.grupoHorizontalId) {
                gruposEnEsteEvento.add(contenedor.grupoHorizontalId);
            }
        });
        
        const estado = gruposEnEsteEvento.size <= 1 ? '✅ CORRECTO' : '❌ ERROR';
        
        console.log(`🎯 ${info.nombre} (${eventoId}):`);
        console.log(`   📦 Contenedores: ${info.contenedores.length}`);
        console.log(`   👥 Grupos: ${gruposEnEsteEvento.size} ${estado}`);
        console.log(`   📍 IDs de grupos: ${Array.from(gruposEnEsteEvento).join(', ')}`);
        
        if (gruposEnEsteEvento.size > 1) {
            console.error('   ❌ ERROR: Contenedores del mismo evento en diferentes grupos!');
        }
    });
    
    console.log('============================================');
}


// ✅ CREAR CONTENEDOR EN EVENTO ESPECÍFICO
crearContenedorEnEvento(numeroEvento: number): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    const eventoPadreId = `evento-${numeroEvento}-${this.generarIdElemento()}`;
    const nombreEvento = `${numeroEvento}`;
    
    const nuevoContenedor: ElementoPlantilla = {
        id: this.generarIdElemento(),
        tipo: 'contenedor',
        posicion: {
            x: posicionInicial.x,
            y: posicionInicial.y,
            ancho: 200,
            alto: 120,
            tipoPosicion: 'absoluta'
        },
        estilos: this.getEstilosPorDefecto('contenedor'),
        contenido: `Contenedor ${nombreEvento}`,
        esContenedor: true,
        elementosInternos: [],
        configuracionContenedor: {
            maxElementos: 2,
            forma: 'rectangulo',
            alineacion: 'centro'
        },
        eventoPadreId: eventoPadreId,
        eventos: [this.crearEventoVacio(nombreEvento)]
    };
    
    this.plantillaActual.elementos.push(nuevoContenedor);
    this.agruparContenedoresPorEventoEspecifico();
    this.dibujarElemento(nuevoContenedor);
    
    console.log(`✅ Contenedor creado en ${nombreEvento}`);
}






private desagruparTodosContenedores(): void {
    this.plantillaActual.elementos.forEach(elemento => {
        if (elemento.esContenedor) {
            this.desagruparContenedor(elemento);
        }
    });
    this.gruposHorizontales.clear();
    console.log('Todos los contenedores desagrupados');
}


  // ✅ MÉTODOS NUEVOS PARA MANEJAR LOS EVENTOS DE FORMA SEGURA

// Método seguro para obtener el nombre del evento actual
getNombreEventoActual(): string {
  if (!this.tieneEventos()) return 'Sin eventos';
  return this.eventosEnContenedor[this.eventoActual]?.nombre || 'Evento sin nombre';
}

// Método seguro para obtener elementos del evento actual
/*getElementosEventoActual(): any[] {
  if (!this.tieneEventos()) return [];
  return this.eventosEnContenedor[this.eventoActual]?.elementos || [];
}*/

// Método seguro para manejar el cambio de nombre
onNombreEventoChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input && input.value) {
    this.renombrarEventoActual(input.value);
  }
}

// Método seguro para cambiar de evento
/*cambiarAEvento(index: number): void {
  if (index >= 0 && index < this.eventosEnContenedor.length) {
    this.eventoActual = index;
    this.actualizarEventoActivo();
    this.actualizarVistaEvento();
  }
}*/

  getIconoElemento(tipo: string): string {
    const iconos: { [key: string]: string } = {
      titulo: '📝',
      año: '📅',
      descripcion: '📋',
      imagen: '🖼️',
      persona: '👤',
      linea: '📏',
      circulo: '⭕'
    };
    return iconos[tipo] || '🔹';
  }

  dibujarElemento(elemento: ElementoPlantilla): void {
    let shape: Konva.Shape | Konva.Group;

    //if (elemento.esContenedor && elemento.elementosInternos) {
    if (elemento.esContenedor) {
      shape = this.crearContenedor(elemento);
       shape.addName('contenedor');
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
    shape.id(elemento.id);

    shape.on('dragmove', (e) => {
        const nuevaX = e.target.x();
        const nuevaY = e.target.y();
        const centroY = this.stage.height() / 2;
        
        // Limitar movimiento vertical (±100px desde la línea central)
        if (Math.abs(nuevaY - centroY) > 300) {
            e.target.y(centroY + (nuevaY > centroY ? 300 : -300));
        }
        
        // Limitar movimiento horizontal (dentro del área de trabajo)
        const areaTrabajo = {
            izquierda: 50,
            derecha: this.stage.width() - 50 - elemento.posicion.ancho
        };
        
        if (nuevaX < areaTrabajo.izquierda) {
            e.target.x(areaTrabajo.izquierda);
        } else if (nuevaX > areaTrabajo.derecha) {
            e.target.x(areaTrabajo.derecha);
        }
    });

    shape.on('dragmove', (e) => {
        const nuevaX = e.target.x();
        const nuevaY = e.target.y();
        const centroY = this.stage.height() / 2;
        
        // ✅ MOVIMIENTO VERTICAL INDIVIDUAL
        if (Math.abs(nuevaY - centroY) > 300) {
            e.target.y(centroY + (nuevaY > centroY ? 300 : -300));
        } else {
            elemento.posicion.y = nuevaY;
        }
        
        // ✅ MOVIMIENTO HORIZONTAL EN GRUPO
       if (this.grupoActualDrag) {
    // Limitar movimiento horizontal para el grupo
    const areaTrabajo = {
        izquierda: 50,
        derecha: this.stage.width() - 50 - elemento.posicion.ancho
    };
    const xLimitada = Math.max(areaTrabajo.izquierda, Math.min(nuevaX, areaTrabajo.derecha));
    
    // Sincronizar todo el grupo
    this.sincronizarGrupoHorizontal(this.grupoActualDrag, xLimitada);
    e.target.x(xLimitada); // Ajustar posición del elemento actual
} else {
    // Movimiento individual (para elementos sin grupo)
    const areaTrabajo = {
        izquierda: 50,
        derecha: this.stage.width() - 50 - elemento.posicion.ancho
    };
    const xLimitada = Math.max(areaTrabajo.izquierda, Math.min(nuevaX, areaTrabajo.derecha));
    e.target.x(xLimitada);
    elemento.posicion.x = xLimitada;
}
    });

    shape.on('dragend', () => {
        // Actualizar posición final
        elemento.posicion.x = shape.x();
        elemento.posicion.y = shape.y();
        this.grupoActualDrag = null;
        
        console.log('Elemento movido - Grupo:', elemento.grupoHorizontalId, 'Posición:', elemento.posicion);
    });

    shape.on('dragstart', () => {
        this.grupoActualDrag = elemento.grupoHorizontalId || null;
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


  asignarEventoComunATodosLosContenedores(): void {
    console.log('🔧 ASIGNANDO EVENTO COMÚN A TODOS LOS CONTENEDORES...');
    
    // Buscar el primer evento existente o crear uno nuevo
    let eventoComunId: string;
    
    const primerContenedor = this.plantillaActual.elementos.find(e => e.esContenedor);
    if (primerContenedor && primerContenedor.eventoPadreId) {
        eventoComunId = primerContenedor.eventoPadreId;
        console.log('✅ Usando evento existente:', eventoComunId);
    } else {
        eventoComunId = 'evento-comun-' + this.generarIdElemento();
        console.log('✅ Creando nuevo evento común:', eventoComunId);
    }
    
    // Asignar el MISMO evento a TODOS los contenedores
    this.plantillaActual.elementos
        .filter(e => e.esContenedor)
        .forEach((contenedor, index) => {
            contenedor.eventoPadreId = eventoComunId;
            
            // También actualizar el nombre del evento en los eventos internos
            if (contenedor.eventos && contenedor.eventos.length > 0) {
                contenedor.eventos[0].nombre = `Evento ${index + 1}`;
                contenedor.eventos[0].id = eventoComunId;
            }
            
            console.log(`   ➕ Contenedor ${contenedor.id} asignado a evento común`);
        });
    
    // Reagrupar todos los contenedores ahora que comparten el mismo evento
    this.agruparContenedoresPorEvento();
    
    console.log('✅ EVENTO COMÚN ASIGNADO A TODOS LOS CONTENEDORES');
}




// ✅ AGRUPAR CONTENEDORES POR SU EVENTO ESPECÍFICO
 agruparContenedoresPorEventoEspecifico(): void {
    console.log('🔧 AGRUPANDO CONTENEDORES POR EVENTO ESPECÍFICO...');
    
    // 1. PRIMERO forzar un agrupamiento correcto
    this.forzarAgrupamientoCorrecto();
    
    // 2. LUEGO verificar si hay múltiples grupos por evento
    this.unificarGruposDelMismoEvento();
    
    console.log('✅ AGRUPAMIENTO POR EVENTO ESPECÍFICO COMPLETADO');
}



// ✅ CREAR GRUPO PARA UN EVENTO ESPECÍFICO
private crearGrupoParaEventoEspecifico(eventoId: string, contenedores: ElementoPlantilla[]): void {
    const grupoId = `grupo-${eventoId}`;
    const eventoNombre = contenedores[0]?.eventos?.[0]?.nombre || 'Evento';
    
    console.log(`🆕 Creando grupo para ${eventoNombre}: ${contenedores.length} contenedores`);
    
    // Asignar el MISMO grupo a TODOS los contenedores de este evento específico
    contenedores.forEach(contenedor => {
        // Remover de grupos anteriores si es necesario
        if (contenedor.grupoHorizontalId && contenedor.grupoHorizontalId !== grupoId) {
            this.desagruparContenedor(contenedor);
        }
        
        contenedor.grupoHorizontalId = grupoId;
        console.log(`   ➕ ${contenedor.id} asignado al grupo de ${eventoNombre}`);
    });
    
    // Calcular posición promedio del grupo
    const posicionPromedio = contenedores.reduce((sum, cont) => sum + cont.posicion.x, 0) / contenedores.length;
    
    // Crear o actualizar el grupo
    this.gruposHorizontales.set(grupoId, {
        id: grupoId,
        elementoIds: contenedores.map(c => c.id),
        posicionX: posicionPromedio
    });
    
    // Sincronizar posiciones
    this.sincronizarGrupoHorizontal(grupoId, posicionPromedio);
}

// ✅ LIMPIAR CONTENEDORES SIN EVENTO (función faltante)
private limpiarContenedoresSinEvento(): void {
    const contenedoresSinEvento = this.plantillaActual.elementos.filter(e => 
        e.esContenedor && !e.eventoPadreId
    );
    
    if (contenedoresSinEvento.length > 0) {
        console.warn('⚠️ Contenedores sin evento encontrados:', contenedoresSinEvento.length);
        
        // Asignar un evento por defecto a contenedores sin evento
        contenedoresSinEvento.forEach(contenedor => {
            const numeroEvento = this.obtenerNumeroEventoSiguiente();
            const eventoPadreId = `evento-${numeroEvento}-${this.generarIdElemento()}`;
            const nombreEvento = `${numeroEvento}`;
            
            contenedor.eventoPadreId = eventoPadreId;
            contenedor.eventos = [this.crearEventoVacio(nombreEvento)];
            
            console.log(`   🔧 Contenedor ${contenedor.id} asignado a ${nombreEvento}`);
        });
    }
}


// ✅ UNIFICAR GRUPOS DEL MISMO EVENTO
unificarGruposDelMismoEvento(): void {
    console.log('🔧 UNIFICANDO GRUPOS DEL MISMO EVENTO...');
    
    // 1. IDENTIFICAR grupos que comparten el mismo evento
    const gruposPorEvento = new Map<string, string[]>();
    
    this.gruposHorizontales.forEach((grupo, grupoId) => {
        const primerElementoId = grupo.elementoIds[0];
        const primerElemento = this.plantillaActual.elementos.find(e => e.id === primerElementoId);
        
        if (primerElemento && primerElemento.eventoPadreId) {
            const eventoId = primerElemento.eventoPadreId;
            if (!gruposPorEvento.has(eventoId)) {
                gruposPorEvento.set(eventoId, []);
            }
            gruposPorEvento.get(eventoId)!.push(grupoId);
        }
    });
    
    // 2. UNIFICAR grupos que comparten el mismo evento
    gruposPorEvento.forEach((grupoIds, eventoId) => {
        if (grupoIds.length > 1) {
            console.log(`🔄 Unificando ${grupoIds.length} grupos del evento ${eventoId}`);
            this.unificarGruposEspecificos(grupoIds, eventoId);
        }
    });
    
    console.log('✅ UNIFICACIÓN DE GRUPOS COMPLETADA');
    this.verificarEstadoGrupos();
}

// ✅ UNIFICAR GRUPOS ESPECÍFICOS
private unificarGruposEspecificos(grupoIds: string[], eventoId: string): void {
    if (grupoIds.length === 0) return;
    
    // Usar el primer grupo como grupo principal
    const grupoPrincipalId = grupoIds[0];
    const grupoPrincipal = this.gruposHorizontales.get(grupoPrincipalId);
    
    if (!grupoPrincipal) return;
    
    console.log(`   Grupo principal: ${grupoPrincipalId}`);
    
    // 1. RECOLECTAR todos los elementos de todos los grupos
    const todosLosElementos: string[] = [...grupoPrincipal.elementoIds];
    
    // 2. AGREGAR elementos de los otros grupos
    for (let i = 1; i < grupoIds.length; i++) {
        const grupoId = grupoIds[i];
        const grupo = this.gruposHorizontales.get(grupoId);
        
        if (grupo) {
            console.log(`   Fusionando grupo: ${grupoId} con ${grupo.elementoIds.length} elementos`);
            todosLosElementos.push(...grupo.elementoIds);
            
            // 3. ACTUALIZAR referencia de grupo en cada elemento
            grupo.elementoIds.forEach(elementoId => {
                const elemento = this.plantillaActual.elementos.find(e => e.id === elementoId);
                if (elemento) {
                    elemento.grupoHorizontalId = grupoPrincipalId;
                }
            });
            
            // 4. ELIMINAR el grupo fusionado
            this.gruposHorizontales.delete(grupoId);
        }
    }
    
    // 5. ACTUALIZAR el grupo principal con todos los elementos
    grupoPrincipal.elementoIds = [...new Set(todosLosElementos)]; // Eliminar duplicados
    
    console.log(`   ✅ Grupo unificado: ${grupoPrincipalId} con ${grupoPrincipal.elementoIds.length} elementos`);
    
    // 6. SINCRONIZAR posición del grupo unificado
    this.sincronizarGrupoHorizontal(grupoPrincipalId, grupoPrincipal.posicionX);
}

// ✅ FORZAR AGRUPAMIENTO CORRECTO (función principal)
forzarAgrupamientoCorrecto(): void {
    console.log('🚀 FORZANDO AGRUPAMIENTO CORRECTO...');
    
    // 1. LIMPIAR todos los grupos existentes
    this.gruposHorizontales.clear();
    
    // 2. LIMPIAR referencias de grupos en contenedores
    this.plantillaActual.elementos
        .filter(e => e.esContenedor)
        .forEach(contenedor => {
            contenedor.grupoHorizontalId = undefined;
        });
    
    // 3. REORGANIZAR contenedores por evento
    const contenedoresPorEvento = new Map<string, ElementoPlantilla[]>();
    
    this.plantillaActual.elementos
        .filter(e => e.esContenedor && e.eventoPadreId)
        .forEach(contenedor => {
            const eventoId = contenedor.eventoPadreId!;
            if (!contenedoresPorEvento.has(eventoId)) {
                contenedoresPorEvento.set(eventoId, []);
            }
            contenedoresPorEvento.get(eventoId)!.push(contenedor);
        });
    
    // 4. CREAR UN SOLO GRUPO POR EVENTO
    contenedoresPorEvento.forEach((contenedores, eventoId) => {
        if (contenedores.length > 0) {
            this.crearUnicoGrupoPorEvento(eventoId, contenedores);
        }
    });
    
    console.log('✅ AGRUPAMIENTO CORREGido COMPLETADO');
    this.verificarEstadoGrupos();
}

// ✅ CREAR UN ÚNICO GRUPO POR EVENTO
private crearUnicoGrupoPorEvento(eventoId: string, contenedores: ElementoPlantilla[]): void {
    const grupoId = `grupo-unico-${eventoId}`;
    const eventoNombre = contenedores[0]?.eventos?.[0]?.nombre || 'Evento';
    
    console.log(`🆕 Creando grupo único para ${eventoNombre}: ${contenedores.length} contenedores`);
    
    // ASIGNAR EL MISMO GRUPO A TODOS LOS CONTENEDORES DEL EVENTO
    contenedores.forEach(contenedor => {
        contenedor.grupoHorizontalId = grupoId;
    });
    
    // Calcular posición promedio
    const posicionPromedio = contenedores.reduce((sum, cont) => sum + cont.posicion.x, 0) / contenedores.length;
    
    // Crear el grupo único
    this.gruposHorizontales.set(grupoId, {
        id: grupoId,
        elementoIds: contenedores.map(c => c.id),
        posicionX: posicionPromedio
    });
    
    // Sincronizar posiciones
    contenedores.forEach(contenedor => {
        contenedor.posicion.x = posicionPromedio;
    });
    
    console.log(`   ✅ Grupo único creado: ${grupoId}`);
}


// ✅ CREAR CONTENEDOR MANTENIENDO SU EVENTO ESPECÍFICO
private crearContenedorConEventoEspecifico(): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    
    // ✅ DETERMINAR EL EVENTO CORRECTO
    let eventoPadreId: string;
    let numeroEvento: number;
    let nombreEvento: string;
    
    if (this.showModalConfiguracion && this.elementoAConfigurar) {
        // Si estamos en un modal, usar el evento del contenedor que se está configurando
        eventoPadreId = this.elementoAConfigurar.eventoPadreId!;
        numeroEvento = this.obtenerNumeroEventoDeId(eventoPadreId);
        nombreEvento = `${numeroEvento}`;
        console.log('📍 Nuevo contenedor en evento existente:', nombreEvento);
    } else {
        // Si no hay modal, crear nuevo evento
        numeroEvento = this.obtenerNumeroEventoSiguiente();
        eventoPadreId = `evento-${numeroEvento}-${this.generarIdElemento()}`;
        nombreEvento = `${numeroEvento}`;
        console.log('📍 Nuevo contenedor en nuevo evento:', nombreEvento);
    }
    
    const nuevoContenedor: ElementoPlantilla = {
        id: this.generarIdElemento(),
        tipo: 'contenedor',
        posicion: {
            x: posicionInicial.x,
            y: posicionInicial.y,
            ancho: 200,
            alto: 120,
            tipoPosicion: 'absoluta'
        },
        estilos: this.getEstilosPorDefecto('contenedor'),
        contenido: `Contenedor ${nombreEvento}`,
        esContenedor: true,
        elementosInternos: [],
        configuracionContenedor: {
            maxElementos: 2,
            forma: 'rectangulo',
            alineacion: 'centro'
        },
        eventoPadreId: eventoPadreId,
        eventos: [this.crearEventoVacio(nombreEvento)]
    };
    
    // ✅ AGREGAR a la plantilla
    this.plantillaActual.elementos.push(nuevoContenedor);
    
    // ✅ AGRUPAR con otros contenedores del MISMO evento
    this.agruparContenedoresPorEventoEspecifico();
    
    // ✅ DIBUJAR en el canvas
    this.dibujarElemento(nuevoContenedor);
    
    console.log(`✅ Contenedor creado y agrupado con ${nombreEvento}`);
}

// ✅ OBTENER NÚMERO DE EVENTO DEL ID
private obtenerNumeroEventoDeId(eventoId: string): number {
    const match = eventoId.match(/evento-(\d+)/);
    return match ? parseInt(match[1]) : 1;
}




//###########################################################

private crearContenedorConEventoComun(): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    
    // ✅ BUSCAR EVENTO COMÚN EXISTENTE o CREAR UNO NUEVO
    let eventoPadreId: string;
    let eventos: EventoContenedor[];
    
    // Buscar si ya existe algún contenedor con evento
    const contenedoresExistentes = this.plantillaActual.elementos.filter(e => e.esContenedor);
    
    if (contenedoresExistentes.length > 0) {
        // Usar el evento del primer contenedor existente
        eventoPadreId = contenedoresExistentes[0].eventoPadreId!;
        eventos = contenedoresExistentes[0].eventos || [this.crearEventoVacio('Evento Común')];
        console.log('📍 Nuevo contenedor usando evento existente:', eventoPadreId);
    } else {
        // Crear nuevo evento común
        eventoPadreId = 'evento-comun-' + this.generarIdElemento();
        eventos = [this.crearEventoVacio('Evento Común')];
        console.log('📍 Nuevo contenedor creando evento común:', eventoPadreId);
    }
    
    const nuevoContenedor: ElementoPlantilla = {
        id: this.generarIdElemento(),
        tipo: 'contenedor',
        posicion: {
            x: posicionInicial.x,
            y: posicionInicial.y,
            ancho: 200,
            alto: 120,
            tipoPosicion: 'absoluta'
        },
        estilos: this.getEstilosPorDefecto('contenedor'),
        contenido: `Contenedor ${contenedoresExistentes.length + 1}`,
        esContenedor: true,
        elementosInternos: [],
        configuracionContenedor: {
            maxElementos: 2,
            forma: 'rectangulo',
            alineacion: 'centro'
        },
        eventoPadreId: eventoPadreId,
        eventos: eventos
    };
    
    // ✅ AGREGAR a la plantilla
    this.plantillaActual.elementos.push(nuevoContenedor);
    
    // ✅ AGRUPAR INMEDIATAMENTE por evento (ahora todos comparten el mismo evento)
    this.agruparContenedoresPorEvento();
    
    // ✅ DIBUJAR en el canvas
    this.dibujarElemento(nuevoContenedor);
    
    console.log('✅ Contenedor creado y agrupado con evento común');
}




  agruparContenedoresPorEvento(): void {
    console.log('🔧 INICIANDO AGRUPAMIENTO POR EVENTO...');
    
    // 1. LIMPIAR grupos existentes
    this.gruposHorizontales.clear();
    
    // 2. ORGANIZAR contenedores por evento
    const contenedoresPorEvento = new Map<string, ElementoPlantilla[]>();
    
    this.plantillaActual.elementos
        .filter(e => e.esContenedor && e.eventoPadreId)
        .forEach(contenedor => {
            const eventoId = contenedor.eventoPadreId!;
            if (!contenedoresPorEvento.has(eventoId)) {
                contenedoresPorEvento.set(eventoId, []);
            }
            contenedoresPorEvento.get(eventoId)!.push(contenedor);
        });
    
    console.log('📊 Contenedores organizados por evento:');
    contenedoresPorEvento.forEach((contenedores, eventoId) => {
        console.log(`   Evento ${eventoId}: ${contenedores.length} contenedores`);
    });
    
    // 3. CREAR UN GRUPO POR CADA EVENTO
    contenedoresPorEvento.forEach((contenedores, eventoId) => {
        if (contenedores.length > 0) {
            this.crearGrupoParaEvento(eventoId, contenedores);
        }
    });
    
    console.log('✅ AGRUPAMIENTO POR EVENTO COMPLETADO');
    this.verificarEstadoGrupos();
}


private crearGrupoParaEvento(eventoId: string, contenedores: ElementoPlantilla[]): void {
    const grupoId = `grupo-${eventoId}`;
    
    console.log(`🆕 Creando grupo ${grupoId} para evento ${eventoId} con ${contenedores.length} contenedores`);
    
    // Asignar el MISMO grupo a TODOS los contenedores del evento
    contenedores.forEach(contenedor => {
        contenedor.grupoHorizontalId = grupoId;
        console.log(`   ➕ ${contenedor.id} asignado al grupo ${grupoId}`);
    });
    
    // Calcular posición promedio del grupo
    const posicionPromedio = contenedores.reduce((sum, cont) => sum + cont.posicion.x, 0) / contenedores.length;
    
    // Crear el grupo
    this.gruposHorizontales.set(grupoId, {
        id: grupoId,
        elementoIds: contenedores.map(c => c.id),
        posicionX: posicionPromedio
    });
    
    // Sincronizar posiciones
    this.sincronizarGrupoHorizontal(grupoId, posicionPromedio);
}


private crearContenedorConAgrupamientoPorEvento(): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    
    // ✅ DETERMINAR A QUÉ EVENTO PERTENECE EL NUEVO CONTENEDOR
    let eventoPadreId: string;
    
    if (this.showModalConfiguracion && this.elementoAConfigurar) {
        // Si estamos configurando un contenedor, usar SU evento
        eventoPadreId = this.elementoAConfigurar.eventoPadreId!;
        console.log('📍 Nuevo contenedor asignado al evento existente:', eventoPadreId);
    } else {
        // Si no hay modal abierto, crear nuevo evento
        eventoPadreId = 'evento-' + this.generarIdElemento();
        console.log('📍 Nuevo contenedor asignado a NUEVO evento:', eventoPadreId);
    }
    
    const nuevoContenedor: ElementoPlantilla = {
        id: this.generarIdElemento(),
        tipo: 'contenedor',
        posicion: {
            x: posicionInicial.x,
            y: posicionInicial.y,
            ancho: 200,
            alto: 120,
            tipoPosicion: 'absoluta'
        },
        estilos: this.getEstilosPorDefecto('contenedor'),
        contenido: 'Nuevo Contenedor',
        esContenedor: true,
        elementosInternos: [],
        configuracionContenedor: {
            maxElementos: 2,
            forma: 'rectangulo',
            alineacion: 'centro'
        },
        eventoPadreId: eventoPadreId,
        eventos: [this.crearEventoVacio('Evento 1')]
    };
    
    // ✅ AGREGAR a la plantilla
    this.plantillaActual.elementos.push(nuevoContenedor);
    
    // ✅ AGRUPAR INMEDIATAMENTE por evento
    this.agruparContenedoresPorEvento();
    
    // ✅ DIBUJAR en el canvas
    this.dibujarElemento(nuevoContenedor);
    
    // ✅ ABRIR modal de configuración
    this.abrirModalConfiguracion(nuevoContenedor);
}

  


   agruparContenedoresHorizontalmente(contenedor1: ElementoPlantilla, contenedor2: ElementoPlantilla): void {
    if (!contenedor1.esContenedor || !contenedor2.esContenedor) return;
    
    // ✅ VERIFICAR que estén en el mismo evento
    if (!this.estanEnMismoEvento(contenedor1, contenedor2)) {
      console.warn('No se pueden agrupar contenedores de diferentes eventos');
      return;
    }
    
    const grupoId = this.obtenerOGrupoHorizontal(contenedor1);
    this.agregarAGrupoHorizontal(contenedor2, grupoId);
    
    this.sincronizarGrupoHorizontal(grupoId, contenedor1.posicion.x);
    console.log('Contenedores agrupados horizontalmente. Grupo ID:', grupoId);
  }


  private autoAgruparSiEsNecesario(nuevoContenedor: ElementoPlantilla): void {
    if (!nuevoContenedor.eventoPadreId) {
        console.warn('⚠️ Contenedor sin eventoPadreId, no se puede auto-agrupar');
        return;
    }
    
    console.log('🔍 BUSCANDO AGRUPAMIENTO para contenedor:', nuevoContenedor.id, 'evento:', nuevoContenedor.eventoPadreId);

    // ✅ 1. PRIMERO buscar si ya existe un grupo para este evento específico
    let grupoExistenteId: string | null = null;
    
    this.gruposHorizontales.forEach((grupo, grupoId) => {
        // Verificar si este grupo pertenece al mismo evento
        const primerElementoId = grupo.elementoIds[0];
        const primerElemento = this.plantillaActual.elementos.find(e => e.id === primerElementoId);
        
        if (primerElemento && primerElemento.eventoPadreId === nuevoContenedor.eventoPadreId) {
            grupoExistenteId = grupoId;
            console.log('✅ Grupo existente encontrado para el evento:', grupoId);
        }
    });

    if (grupoExistenteId) {
        // ✅ 2. AGREGAR al grupo existente
        this.agregarAGrupoHorizontal(nuevoContenedor, grupoExistenteId);
        console.log('✅ Contenedor agregado a grupo existente:', grupoExistenteId);
        
        // ✅ SINCRONIZAR posición con el grupo
        const grupo = this.gruposHorizontales.get(grupoExistenteId);
        if (grupo) {
            nuevoContenedor.posicion.x = grupo.posicionX;
            this.sincronizarGrupoHorizontal(grupoExistenteId, grupo.posicionX);
        }
        
    } else {
        // ✅ 3. BUSCAR contenedores sueltos del MISMO evento para crear nuevo grupo
        const contenedoresMismoEvento = this.plantillaActual.elementos.filter(e => 
            e.esContenedor && 
            e.id !== nuevoContenedor.id &&
            e.eventoPadreId === nuevoContenedor.eventoPadreId
        );
        
        console.log('📊 Contenedores del mismo evento encontrados:', contenedoresMismoEvento.length);

        if (contenedoresMismoEvento.length > 0) {
            // ✅ CREAR NUEVO GRUPO con TODOS los contenedores del mismo evento
            const grupoId = this.generarIdElemento();
            
            console.log('🆕 Creando nuevo grupo para evento:', nuevoContenedor.eventoPadreId);
            
            // Agregar el nuevo contenedor al grupo
            nuevoContenedor.grupoHorizontalId = grupoId;
            
            // Agregar todos los contenedores existentes del mismo evento al grupo
            contenedoresMismoEvento.forEach(contenedor => {
                contenedor.grupoHorizontalId = grupoId;
                console.log('➕ Agregando contenedor existente al grupo:', contenedor.id);
            });
            
            // Crear el grupo con TODOS los contenedores
            const todosContenedores = [nuevoContenedor, ...contenedoresMismoEvento];
            
            this.gruposHorizontales.set(grupoId, {
                id: grupoId,
                elementoIds: todosContenedores.map(c => c.id),
                posicionX: nuevoContenedor.posicion.x
            });
            
            console.log('✅ NUEVO GRUPO CREADO con', todosContenedores.length, 'contenedores:', {
                grupoId,
                contenedores: todosContenedores.map(c => c.id),
                evento: nuevoContenedor.eventoPadreId
            });
            
            // ✅ SINCRONIZAR posición del grupo completo
            this.sincronizarGrupoHorizontal(grupoId, nuevoContenedor.posicion.x);
            
        } else {
            // ✅ 4. Si no hay otros contenedores, crear grupo individual (TEMPORAL)
            const grupoId = this.generarIdElemento();
            nuevoContenedor.grupoHorizontalId = grupoId;
            
            this.gruposHorizontales.set(grupoId, {
                id: grupoId,
                elementoIds: [nuevoContenedor.id],
                posicionX: nuevoContenedor.posicion.x
            });
            
            console.log('ℹ️ Grupo individual temporal creado. Esperando más contenedores del evento:', nuevoContenedor.eventoPadreId);
        }
    }
}

// ✅ FUNCIÓN PARA VALIDAR TODOS LOS GRUPOS (usar para depuración)
validarTodosLosGrupos(): void {
    console.log('=== 🔍 VALIDACIÓN GLOBAL DE GRUPOS ===');
    
    let gruposInvalidos = 0;
    
    this.gruposHorizontales.forEach((grupo, grupoId) => {
        const esValido = this.todosEnMismoEvento(grupoId);
        
        if (!esValido) {
            gruposInvalidos++;
            console.error(`❌ Grupo inválido: ${grupoId}`);
            // Opcional: auto-reparar
            this.desagruparGrupoInvalido(grupoId);
        } else {
            console.log(`✅ Grupo válido: ${grupoId}`);
        }
    });
    
    console.log(`📊 Resumen: ${this.gruposHorizontales.size} grupos, ${gruposInvalidos} inválidos`);
    console.log('====================================');
}

private tienenMismoNombreEvento(contendor1: ElementoPlantilla, contenedor2: ElementoPlantilla): boolean {
    const nombreEvento1 = this.obtenerNombreEventoContenedor(contendor1);
    const nombreEvento2 = this.obtenerNombreEventoContenedor(contenedor2);
    return nombreEvento1 === nombreEvento2;
}

// ✅ NUEVO MÉTODO: Obtener el nombre del evento de un contenedor
private obtenerNombreEventoContenedor(contenedor: ElementoPlantilla): string {
    if (contenedor.eventos && contenedor.eventos.length > 0) {
        return contenedor.eventos[0].nombre || 'Evento Sin Nombre';
    }
    return 'Evento Sin Nombre';
}


private estanEnMismoContextoModal(contenedor1: ElementoPlantilla, contenedor2: ElementoPlantilla): boolean {
  return !!(
    contenedor1.eventos &&
    contenedor2.eventos &&
    contenedor1.eventos.length > 0 &&
    contenedor2.eventos.length > 0 &&
    contenedor1.eventos[0]?.id === contenedor2.eventos[0]?.id
  );
}


private crearContenedorIndependiente(): ElementoPlantilla {
    const posicionInicial = this.calcularPosicionEnLinea();
    
    // ✅ OBTENER el número de evento siguiente
    const numeroEventoSiguiente = this.obtenerNumeroEventoSiguiente();
    const eventoId = 'evento-' + this.generarIdElemento();
    
    const nuevoContenedor: ElementoPlantilla = {
        id: this.generarIdElemento(),
        tipo: 'contenedor',
        posicion: {
            x: posicionInicial.x,
            y: posicionInicial.y,
            ancho: 200,
            alto: 120,
            tipoPosicion: 'absoluta'
        },
        estilos: this.getEstilosPorDefecto('contenedor'),
        contenido: 'Nuevo Contenedor',
        esContenedor: true,
        elementosInternos: [],
        configuracionContenedor: {
            maxElementos: 2,
            forma: 'rectangulo',
            alineacion: 'centro'
        },
        eventoPadreId: eventoId,
        eventos: [this.crearEventoVacio(`${numeroEventoSiguiente}`)] // ✅ EVENTO SIGUIENTE
    };
    
    console.log(`✅ Contenedor asignado a Evento ${numeroEventoSiguiente}:`, eventoId);
    return nuevoContenedor;
}

private obtenerNumeroEventoSiguiente(): number {
    // Contar todos los eventos únicos en todos los contenedores
    const eventosUnicos = new Set<string>();
    
    this.plantillaActual.elementos.forEach(elemento => {
        if (elemento.eventos) {
            elemento.eventos.forEach(evento => {
                if (evento.nombre) {
                    // Extraer número del nombre "Evento X"
                    const match = evento.nombre.match(/(\d+)/);
                    if (match) {
                        eventosUnicos.add(match[1]);
                    }
                }
            });
        }
    });
    
    return eventosUnicos.size + 1;
}

alternarAgrupamiento(): void {
    if (!this.elementoAConfigurar) return;
    
    if (this.estaEnGrupo()) {
        this.desagruparContenedor(this.elementoAConfigurar);
    } else {
        // Buscar otro contenedor del MISMO evento para agrupar
        const otroContenedor = this.plantillaActual.elementos.find(
            e => e.esContenedor && 
                 e.id !== this.elementoAConfigurar!.id &&
                 this.estanEnMismoEvento(e, this.elementoAConfigurar!)
        );
        
        if (otroContenedor) {
            this.agruparContenedoresHorizontalmente(this.elementoAConfigurar!, otroContenedor);
        } else {
            alert('No hay otros contenedores en el mismo evento para agrupar');
        }
    }
}

estaEnGrupo(): boolean {
    return !!(this.elementoAConfigurar?.grupoHorizontalId);
}


 desagruparContenedor(contenedor: ElementoPlantilla): void {
    if (!contenedor.grupoHorizontalId) return;
    
    const grupoId = contenedor.grupoHorizontalId;
    const grupo = this.gruposHorizontales.get(grupoId);
    
    if (grupo) {
        // Remover elemento del grupo
        grupo.elementoIds = grupo.elementoIds.filter(id => id !== contenedor.id);
        
        // Eliminar grupo si queda vacío
        if (grupo.elementoIds.length === 0) {
            this.gruposHorizontales.delete(grupoId);
        }
    }
    
    contenedor.grupoHorizontalId = undefined;
    console.log('Contenedor desagrupado:', contenedor.id, 'del evento:', contenedor.eventoPadreId);
}


 

  obtenerElementosMismoGrupo(elemento: ElementoPlantilla): ElementoPlantilla[] {
    if (!elemento.grupoHorizontalId) return [elemento];
    
    const grupo = this.gruposHorizontales.get(elemento.grupoHorizontalId);
    if (!grupo) return [elemento];
    
    return grupo.elementoIds
      .map(id => this.plantillaActual.elementos.find(e => e.id === id))
      .filter((e): e is ElementoPlantilla => e !== undefined);
  }

  seleccionarElemento(elemento: ElementoPlantilla, shape: Konva.Shape | Konva.Group): void {
    this.elementoSeleccionado = elemento;
    console.log('Elemento seleccionado:', elemento);
  }

  private crearContenedor(elemento: ElementoPlantilla): Konva.Group {
  const group = new Konva.Group({
    x: elemento.posicion.x,
    y: elemento.posicion.y,
    draggable: true
  });

  let contenedorShape: Konva.Shape;
  let areaSegura = this.calcularAreaSegura(elemento);
  
  // Obtener color del evento si existe
  const colorEvento = elemento.datosEvento?.colorEvento || elemento.estilos.border || '#3498db';
  const colorFondo = elemento.estilos.backgroundColor || '#ffffff';
  
  switch (elemento.configuracionContenedor?.forma) {
    case 'circulo':
      contenedorShape = new Konva.Circle({
        x: elemento.posicion.ancho / 2,
        y: elemento.posicion.alto / 2,
        radius: Math.min(elemento.posicion.ancho, elemento.posicion.alto) / 2,
        fill: colorFondo,
        stroke: colorEvento,
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
        fill: colorFondo,
        stroke: colorEvento,
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
        fill: colorFondo,
        stroke: colorEvento,
        strokeWidth: 2
      });
      break;
      
    /*case 'triangulo':
      contenedorShape = new Konva.Line({
        points: [
          elemento.posicion.ancho / 2, 0,
          elemento.posicion.ancho, elemento.posicion.alto,
          0, elemento.posicion.alto
        ],
        fill: colorFondo,
        stroke: colorEvento,
        strokeWidth: 2,
        closed: true
      });
      break;*/
      
    case 'rectangulo':
    default:
      contenedorShape = new Konva.Rect({
        width: elemento.posicion.ancho,
        height: elemento.posicion.alto,
        fill: colorFondo,
        stroke: colorEvento,
        strokeWidth: 2,
        cornerRadius: elemento.estilos.borderRadius || 8
      });
      break;
  }

  group.add(contenedorShape);

  // Agregar información del evento si existe
  if (elemento.datosEvento) {
    this.agregarTextoContenedor(group, elemento, areaSegura);
  }

  return group;
}

private agregarTextoContenedor(group: Konva.Group, elemento: ElementoPlantilla, areaSegura: any): void {
  const datosEvento = elemento.datosEvento!;
  
  // Título del evento
  const titulo = new Konva.Text({
    x: areaSegura.x,
    y: areaSegura.y + 10,
    //text: datosEvento.titulo,
    fontSize: 14,
    fontFamily: 'Arial',
    fill: '#2c3e50',
    width: areaSegura.ancho,
    align: 'center',
    fontWeight: 'bold'
  });
  
  // Descripción del evento
  const descripcion = new Konva.Text({
    x: areaSegura.x,
    y: areaSegura.y + 35,
    text: datosEvento.descripcion,
    fontSize: 11,
    fontFamily: 'Arial',
    fill: '#666666',
    width: areaSegura.ancho,
    align: 'center',
    wrap: 'word'
  });
  
  // Número de evento
  const numeroEvento = new Konva.Text({
    x: areaSegura.x,
    y: areaSegura.y + areaSegura.alto - 20,
   
    text: `Evento ${this.getEventoActual()?.numero}`,
    fontSize: 10,
    fontFamily: 'Arial',
    fill: datosEvento.colorEvento,
    width: areaSegura.ancho,
    align: 'center',
    fontStyle: 'italic'
  });
  
  group.add(titulo);
  group.add(descripcion);
  group.add(numeroEvento);
}

   /*private crearContenedor(elemento: ElementoPlantilla): Konva.Group {
  const group = new Konva.Group({
    x: elemento.posicion.x,
    y: elemento.posicion.y,
    draggable: true
  });

  let contenedorShape: Konva.Shape;
  let areaSegura = this.calcularAreaSegura(elemento);
  
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

  // Agregar elementos del evento actual centrados
  if (elemento.eventos && elemento.eventos.length > 0) {
    const eventoActual = elemento.eventos[this.eventoActual] || elemento.eventos[0];
    
    if (eventoActual.elementos.length > 0) {
      const alturaTotal = eventoActual.elementos.length * 20 + (eventoActual.elementos.length - 1) * 5;
      let yInicial = areaSegura.y + (areaSegura.alto - alturaTotal) / 2;
      
      eventoActual.elementos.forEach((elementoInterno, index) => {
        const texto = new Konva.Text({
          x: areaSegura.x,
          y: yInicial + (index * 25),
          text: `${this.getIconoElemento(elementoInterno.tipo)} ${elementoInterno.contenido}`,
          fontSize: elementoInterno.estilos.fontSize || 11,
          fontFamily: elementoInterno.estilos.fontFamily || 'Arial',
          fill: elementoInterno.estilos.color || '#000000',
          width: areaSegura.ancho,
          align: 'center',
          ellipsis: true,
          wrap: 'none'
        });
        group.add(texto);
      });
    }

    // Nombre del evento en la parte inferior del área segura
    const nombreEvento = new Konva.Text({
      x: areaSegura.x,
      y: areaSegura.y + areaSegura.alto - 15,
      text: eventoActual.nombre,
      fontSize: 9,
      fontFamily: 'Arial',
      fill: '#666666',
      width: areaSegura.ancho,
      align: 'center',
      fontStyle: 'italic'
    });
    group.add(nombreEvento);
  }

  return group;
}*/

// Nuevo método para calcular el área segura según la forma
private calcularAreaSegura(elemento: ElementoPlantilla): { x: number, y: number, ancho: number, alto: number } {
  const forma = elemento.configuracionContenedor?.forma || 'rectangulo';
  const ancho = elemento.posicion.ancho;
  const alto = elemento.posicion.alto;
  
  switch (forma) {
    case 'circulo':
      // Para círculo, usar un cuadrado inscrito (aprox 70% del diámetro)
      const radio = Math.min(ancho, alto) / 2;
      const ladoCuadrado = radio * Math.sqrt(2) * 0.7;
      return {
        x: (ancho - ladoCuadrado) / 2,
        y: (alto - ladoCuadrado) / 2,
        ancho: ladoCuadrado,
        alto: ladoCuadrado
      };
      
    case 'rombo':
      // Para rombo, usar el área central (50% del ancho y alto)
      return {
        x: ancho * 0.25,
        y: alto * 0.25,
        ancho: ancho * 0.5,
        alto: alto * 0.5
      };
      
    case 'estrella':
      // Para estrella, usar el círculo interno (40% del radio)
      const radioEstrella = Math.min(ancho, alto) / 2;
      const areaEstrella = radioEstrella * 0.5;
      return {
        x: (ancho - areaEstrella * 2) / 2,
        y: (alto - areaEstrella * 2) / 2,
        ancho: areaEstrella * 2,
        alto: areaEstrella * 2
      };
      
    case 'rectangulo':
    default:
      // Para rectángulo, dejar márgenes de 10px
      return {
        x: 10,
        y: 10,
        ancho: ancho - 20,
        alto: alto - 20
      };
  }
}



 renombrarEventoActual(nuevoNombre: string): void {
  if (!this.tieneEventos() || !nuevoNombre.trim()) return;
  
  const evento = this.eventosEnContenedor[this.eventoActual];
  if (evento) {
    evento.nombre = nuevoNombre.trim();
    this.actualizarVistaEvento();
  }
}

  eliminarEventoActual(): void {
    if (!this.tieneEventos() || this.eventosEnContenedor.length <= 1) return;
    
    this.eventosEnContenedor.splice(this.eventoActual, 1);
    
    if (this.eventoActual >= this.eventosEnContenedor.length) {
      this.eventoActual = this.eventosEnContenedor.length - 1;
    }
    
    this.actualizarEventoActivo();
    this.actualizarVistaEvento();
  }

 /*abrirModalConfiguracion(elemento: ElementoPlantilla): void {
    this.elementoAConfigurar = elemento;
    
    // Si NO es un nuevo contenedor, inicializar eventos
    if (!this.esNuevoContenedor) {
        if (!elemento.eventos || elemento.eventos.length === 0) {
            const numeroEvento = this.obtenerNumeroEventoSiguiente();
            elemento.eventos = [this.crearEventoVacio(`Evento ${numeroEvento}`)];
            console.log('✅ Eventos inicializados para contenedor existente');
        }
        
        this.inicializarEventosContenedor();
        
        if (this.eventosEnContenedor.length > 0) {
            const eventoActual = this.eventosEnContenedor[this.eventoActual];
            if (!elemento.eventoPadreId || elemento.eventoPadreId !== eventoActual.id) {
                elemento.eventoPadreId = eventoActual.id;
                console.log('🔄 Contenedor asignado al evento:', eventoActual.nombre);
            }
        }
    } else {
        // Para nuevos contenedores, inicializar directamente
        this.inicializarEventosContenedor();
    }
    
    this.showModalConfiguracion = true;
    this.actualizarVistaEvento();
}*/

  cerrarModalConfiguracion(): void {
    // Si es un contenedor existente, aplicar cambios
    if (!this.esNuevoContenedor && this.elementoAConfigurar) {
        this.actualizarVistaElemento();
    }
    
    this.showModalConfiguracion = false;
    this.elementoAConfigurar = null;
    this.elementoSeleccionadoModal = null;
    
    // Limpiar estado de nuevo contenedor si se cierra sin aplicar
    if (this.esNuevoContenedor) {
        this.contenedorTemporal = null;
        this.esNuevoContenedor = false;
    }
}

 

/*agregarElemento(tipo: string, forma?: string): void {
  if (tipo === 'contenedor') {
    // Crear contenedor con forma específica
    this.crearContenedorConForma(forma || 'rectangulo');
  } else {
    // Código para otros elementos
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
      esContenedor: false
    };
    this.plantillaActual.elementos.push(nuevoElemento);
    this.dibujarElemento(nuevoElemento);
  }
}*/


agregarElemento(tipo: string, forma?: string): void {
  if (tipo === 'contenedor') {
    this.crearContenedorConForma(forma || 'rectangulo');
  } else if (tipo.includes('linea')) {
    this.crearDatosLinea(tipo);
  } else if (tipo.includes('evento')) {
    this.crearDatosEvento(tipo);
  } else {
    // Elementos básicos
    this.crearElementoBasico(tipo);
  }
}





private crearDatosEvento(tipo: string): void {
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
    esContenedor: false
  };

  this.plantillaActual.elementos.push(nuevoElemento);
  this.dibujarElemento(nuevoElemento);
}


private crearDatosLinea(tipo: string): void {
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
    esContenedor: false,
    datosLinea: {
      tituloLinea: tipo === 'titulo-linea' ? 'Título de la Línea' : '',
      descripcionLinea: tipo === 'descripcion-linea' ? 'Descripción de la línea temporal...' : '',
      color: '#2c3e50',
      fontSize: tipo === 'titulo-linea' ? 18 : 14,
      fontFamily: 'Arial, sans-serif'
    }
  };
  // Aplicar estilos desde datosLinea
  nuevoElemento.estilos.color = nuevoElemento.datosLinea!.color;
  nuevoElemento.estilos.fontSize = nuevoElemento.datosLinea!.fontSize;
  nuevoElemento.estilos.fontFamily = nuevoElemento.datosLinea!.fontFamily;

  this.plantillaActual.elementos.push(nuevoElemento);
  this.dibujarElemento(nuevoElemento);
  
  // Abrir modal de configuración
  setTimeout(() => {
    this.abrirModalConfiguracion(nuevoElemento);
  }, 100);
}

private crearElementoBasico(tipo: string): void {
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
    esContenedor: false
  };
  
  this.plantillaActual.elementos.push(nuevoElemento);
  this.dibujarElemento(nuevoElemento);
}

private crearContenedorConForma(forma: string): void {
  const posicionInicial = this.calcularPosicionEnLinea();
  const eventoSiguiente = this.obtenerEventoParaContenedor();
  
  this.contenedorTemporal = {
    id: this.generarIdElemento(),
    tipo: 'contenedor',
    posicion: {
      x: posicionInicial.x,
      y: posicionInicial.y,
      ancho: 200,
      alto: 120,
      tipoPosicion: 'absoluta'
    },
    estilos: this.getEstilosPorDefecto('contenedor'),
    //contenido: `${eventoSiguiente.nombre}`,
    esContenedor: true,
    elementosInternos: [],
    configuracionContenedor: {
      maxElementos: 4,
      forma: forma as any,
      alineacion: 'centro'
    },
    eventoAsignadoId: eventoSiguiente.id,
    datosEvento: {
      eventoNumero: 1,
      //titulo: `${eventoSiguiente.nombre}`,
      descripcion: '',
      colorEvento: '#3498db'
    }
  };
  
  this.esNuevoContenedor = true;
  this.eventoActualId = eventoSiguiente.id;
  
  this.abrirModalConfiguracion(this.contenedorTemporal);
}


/*private crearContenedorConForma(forma: string): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    const eventoSiguiente = this.obtenerEventoParaContenedor();
    
    this.contenedorTemporal = {
      id: this.generarIdElemento(),
      tipo: 'contenedor',
      posicion: {
        x: posicionInicial.x,
        y: posicionInicial.y,
        ancho: 200,
        alto: 120,
        tipoPosicion: 'absoluta'
      },
      estilos: this.getEstilosPorDefecto('contenedor'),
      contenido: `Contenedor ${eventoSiguiente.nombre}`,
      esContenedor: true,
      elementosInternos: [],
      configuracionContenedor: {
        maxElementos: 4,
        forma: forma as any,
        alineacion: 'centro'
      },
      eventoAsignadoId: eventoSiguiente.id // ✅ SOLO esta propiedad
    };
    
    this.esNuevoContenedor = true;
    this.eventoActualId = eventoSiguiente.id;
    
    this.abrirModalConfiguracion(this.contenedorTemporal);
  }*/

private getAnchoPorDefecto(tipo: string): number {
  const anchos: { [key: string]: number } = {
    'titulo-linea': 200,
    'descripcion-linea': 250,
    'titulo-evento': 180,
    'descripcion-evento': 220,
    'año-evento': 100,
    'imagen-evento': 150,
    'link-evento': 160,
    'linea': 120,
    'circulo': 80
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
    'link-evento': 30,
    'linea': 5,
    'circulo': 80
  };
  return altos[tipo] || 50;
}

/*private crearContenedorTemporal(): void {
    const posicionInicial = this.calcularPosicionEnLinea();
    const numeroEventoSiguiente = this.obtenerNumeroEventoSiguiente();
    const eventoId = 'evento-' + this.generarIdElemento();
    
    this.contenedorTemporal = {
        id: this.generarIdElemento(),
        tipo: 'contenedor',
        posicion: {
            x: posicionInicial.x,
            y: posicionInicial.y,
            ancho: 200,
            alto: 120,
            tipoPosicion: 'absoluta'
        },
        estilos: this.getEstilosPorDefecto('contenedor'),
        contenido: 'Nuevo Contenedor',
        esContenedor: true,
        elementosInternos: [],
        configuracionContenedor: {
            maxElementos: 2,
            forma: 'rectangulo',
            alineacion: 'centro'
        },
        eventoPadreId: eventoId,
        eventos: [this.crearEventoVacio(`Evento ${numeroEventoSiguiente}`)]
    };
    
    this.esNuevoContenedor = true;
    
    // Abrir modal de configuración con el contenedor temporal
    this.abrirModalConfiguracion(this.contenedorTemporal);
}*/

/*aplicarYCrearContenedor(): void {
    if (this.esNuevoContenedor && this.contenedorTemporal) {
        // Ahora sí agregarlo a la plantilla y al canvas
        this.plantillaActual.elementos.push(this.contenedorTemporal);
        
        // Agrupar por evento
        this.agruparContenedoresPorEventoEspecifico();
        
        // Dibujar en el canvas
        this.dibujarElemento(this.contenedorTemporal);
        
        console.log('✅ Contenedor creado y agregado al canvas');
        
        // Limpiar estado temporal
        this.contenedorTemporal = null;
        this.esNuevoContenedor = false;
    } else {
        // Si es un contenedor existente, solo actualizar la vista
        this.actualizarVistaElemento();
    }
    
    // Cerrar modal
    this.cerrarModalConfiguracion();
}*/

// Cancelar creación del contenedor
cancelarCreacionContenedor(): void {
    if (this.esNuevoContenedor) {
        // Descartar el contenedor temporal
        this.contenedorTemporal = null;
        this.esNuevoContenedor = false;
        console.log('❌ Creación de contenedor cancelada');
    }
    
    // Cerrar modal
    this.cerrarModalConfiguracion();
}


/*verificarYCorregirEventos(): void {
    console.log('🔍 VERIFICANDO EVENTOS DE CONTENEDORES...');
    
    const contenedores = this.plantillaActual.elementos.filter(e => e.esContenedor);
    const eventosUnicos = new Set<string>();
    
    contenedores.forEach(contenedor => {
        if (contenedor.eventoPadreId) {
            eventosUnicos.add(contenedor.eventoPadreId);
        }
    });
    
    console.log(`📊 ${contenedores.length} contenedores, ${eventosUnicos.size} eventos diferentes`);
    
    if (eventosUnicos.size > 1) {
        console.warn('❌ MULTIPLES EVENTOS DETECTADOS! Los contenedores deben estar en el mismo evento.');
        console.log('Eventos encontrados:', Array.from(eventosUnicos));
        
        // Preguntar al usuario si quiere corregir
        if (confirm('Se detectaron múltiples eventos. ¿Desea asignar un evento común a todos los contenedores?')) {
            this.asignarEventoComunATodosLosContenedores();
        }
    } else if (eventosUnicos.size === 1) {
        console.log('✅ Todos los contenedores están en el mismo evento:', Array.from(eventosUnicos)[0]);
    } else {
        console.log('ℹ️ No hay contenedores con eventos asignados');
    }
}*/



/*verificarEstadoCompleto(): void {
    console.log('=== 📊 ESTADO COMPLETO DEL SISTEMA ===');
    
    const contenedores = this.plantillaActual.elementos.filter(e => e.esContenedor);
    
    console.log(`📦 Total de contenedores: ${contenedores.length}`);
    
    // Verificar eventos
    const eventosUnicos = new Set(contenedores.map(c => c.eventoPadreId).filter(Boolean));
    console.log(`🎯 Eventos diferentes: ${eventosUnicos.size}`);
    
    eventosUnicos.forEach(eventoId => {
        const contenedoresEnEvento = contenedores.filter(c => c.eventoPadreId === eventoId);
        console.log(`   Evento ${eventoId}: ${contenedoresEnEvento.length} contenedores`);
    });
    
    // Verificar grupos
    console.log(`👥 Grupos horizontales: ${this.gruposHorizontales.size}`);
    
    this.gruposHorizontales.forEach((grupo, grupoId) => {
        const elementosGrupo = grupo.elementoIds
            .map(id => this.plantillaActual.elementos.find(e => e.id === id))
            .filter((e): e is ElementoPlantilla => e !== undefined);
        
        const eventoReferencia = elementosGrupo[0]?.eventoPadreId;
        const mismoEvento = elementosGrupo.every(e => e.eventoPadreId === eventoReferencia);
        
        console.log(`   Grupo ${grupoId}: ${elementosGrupo.length} contenedores, ${mismoEvento ? '✅ Mismo evento' : '❌ Diferentes eventos'}`);
    });
    
    console.log('======================================');
}*/


/*private asignarEventoPadreAContenedor(contenedor: ElementoPlantilla): void {
    // CASO 1: Si estamos en un modal activo (configurando un contenedor existente)
    if (this.showModalConfiguracion && this.elementoAConfigurar && this.eventosEnContenedor.length > 0) {
        const eventoActual = this.eventosEnContenedor[this.eventoActual];
        contenedor.eventoPadreId = eventoActual.id;
        console.log('✅ Contenedor asignado al evento activo del modal:', eventoActual.nombre, 'ID:', eventoActual.id);
        return;
    }
    
    // CASO 2: Si estamos creando un NUEVO contenedor desde el panel de herramientas
    // ✅ CORRECCIÓN: NO reutilizar eventos existentes, crear uno NUEVO
    contenedor.eventoPadreId = 'evento-' + this.generarIdElemento();
    console.log('✅ Nuevo contenedor asignado a NUEVO evento:', contenedor.eventoPadreId);
    
    // ✅ CREAR eventos iniciales para el nuevo contenedor
    if (!contenedor.eventos) {
        contenedor.eventos = [this.crearEventoVacio('Evento 1')];
        console.log('✅ Eventos iniciales creados para el nuevo contenedor');
    }
}

  private elementoYaExisteEnEvento(tipo: string, evento: EventoContenedor): boolean {
    return evento.elementos.some(elemento => elemento.tipo === tipo);
}*/


  /*getElementosDisponiblesParaEventoActual(): any[] {
    if (!this.tieneEventos()) return [];

    const eventoActual = this.eventosEnContenedor[this.eventoActual];
    const todosElementos = this.getElementosDisponiblesParaContenedor();
    
    // Filtrar elementos que ya existen en el evento actual
    return todosElementos.filter(elemento => 
        !this.elementoYaExisteEnEvento(elemento.tipo, eventoActual)
    );
}*/


  /*removerElementoDeContenedor(index: number): void {
    if (!this.tieneEventos()) return;
    
    const eventoActual = this.eventosEnContenedor[this.eventoActual];
    eventoActual.elementos.splice(index, 1);
    this.actualizarVistaEvento();
  }*/

  getInfoEventoActual(): string {
    if (!this.tieneEventos()) return '0/0';
    return `${this.eventoActual + 1}/${this.eventosEnContenedor.length}`;
  }

 tieneEventos(): boolean {
  return !!(this.eventosEnContenedor && 
            this.eventosEnContenedor.length > 0 &&
            this.eventosEnContenedor[this.eventoActual]);
}

  private generarPuntosLinea(elemento: ElementoPlantilla): number[] {
    const config = this.plantillaActual.configuracion;
    
    switch (config.tipoLinea) {
      case 'recta':
        return [0, 0, elemento.posicion.ancho, 0];
      case 'curva':
        return this.generarLineaCurva(elemento);
      case 'vertical':
        return [0, 0, 0, elemento.posicion.alto];
      case 'horizontal':
        return [0, 0, elemento.posicion.ancho, 0];
      case 'escalonada':
        return this.generarLineaEscalonada(elemento);
      default:
        return [0, 0, elemento.posicion.ancho, 0];
    }
  }

  private generarLineaCurva(elemento: ElementoPlantilla): number[] {
    const puntos: number[] = [];
    const segmentos = 10;
    const controlX = elemento.posicion.ancho / 2;
    
    for (let i = 0; i <= segmentos; i++) {
      const t = i / segmentos;
      const x = elemento.posicion.ancho * t;
      const y = 20 * Math.sin(t * Math.PI);
      puntos.push(x, y);
    }
    
    return puntos;
  }

  private generarLineaEscalonada(elemento: ElementoPlantilla): number[] {
    return [
      0, 0,
      elemento.posicion.ancho * 0.3, 0,
      elemento.posicion.ancho * 0.3, 20,
      elemento.posicion.ancho * 0.7, 20,
      elemento.posicion.ancho * 0.7, 0,
      elemento.posicion.ancho, 0
    ];
  }

  guardarPlantilla(): void {
    this.plantillaDesignService.guardarPlantilla(this.plantillaActual);
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
  }



  private calcularPosicionEnLinea(): { x: number; y: number } {
  const centroY = this.stage.height() / 2;
  const espaciado = this.plantillaActual.configuracion.espaciado;
  
  // Obtener todos los contenedores existentes
  const contenedores = this.plantillaActual.elementos.filter(e => e.esContenedor === true);
  
  if (contenedores.length === 0) {
    return { x: 100, y: centroY - 60 };
  }
  
  // Encontrar la posición X más a la derecha
  const maxX = Math.max(...contenedores.map(c => c.posicion.x));
  
  // Colocar el nuevo contenedor a la derecha del último
  const nuevaX = maxX + espaciado;
  
  return { x: nuevaX, y: centroY - 60 };
}

  /*private crearPlantillaVacia(): PlantillaDesign {
    return {
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
  }*/
}