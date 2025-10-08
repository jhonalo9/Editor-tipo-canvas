import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Konva from 'konva';
import { TemplateLayout, TemplateService, TimelineTemplate } from '../../core/services/template.service';
import { PlantillaDesignService } from '../../core/services/plantilla-design.service';
import { ProyectoData, ProyectoRequest, ProyectoService } from '../../core/services/proyecto.service';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ArchivoService } from '../../core/services/archivo.service';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router'; 

// Agregar esta interfaz si no existe
export interface TemplateStyles {
  // Colores principales
  backgroundColor: string;
  timelineColor: string;
  eventColor: string;
  textColor: string;
  accentColor: string;
  
  // Tipografía
  fontFamily: string;
  titleFontSize: number;
  yearFontSize: number;
  
  // Estilo de imágenes
  imageStyle: 'circle' | 'square' | 'rounded';
  imageSize: number;
  imageBorder: boolean;
  
  // Efectos
  shadows: boolean;
  animations: boolean;
  connectorStyle: 'solid' | 'dashed' | 'dotted';
}

interface TimelineEvent {
  year: number;
  title: string;
  person: string;
  description: string;
  image?: string ;
}



export interface ProyectoExport {
  metadata: {
    nombre: string;
    descripcion: string;
    fechaExportacion: string;
    version: string;
    totalEventos: number;
  };
  configuracion: {
    backgroundColor: string;
    minYear: number;
    maxYear: number;
    stageWidth: number;
    stageHeight: number;
  };
  eventos: TimelineEvent[];
  elementosKonva: any[];
  estilos: any;
}

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  imports: [CommonModule, FormsModule,RouterModule]
})
export class EditorComponent implements OnInit {
  @ViewChild('container', { static: true }) container!: ElementRef;


  showDesignTemplatesModal = false;
  plantillasDisponibles: any[] = [];
  
  // Propiedades de Konva
  stage!: Konva.Stage;
  backgroundLayer!: Konva.Layer;
  mainLayer!: Konva.Layer;


  // Nueva propiedad para la portada del proyecto
  proyectoPortada: string = '';
  portadaArchivo: File | null = null;
  showPortadaModal: boolean = false;
  
  // Propiedades del editor
  backgroundColor: string = '#ffffffff';
  showEventModal: boolean = false;
  showEditModal: boolean = false;
  showTemplateSelector: boolean = false;
  autoUpdateYears: boolean = true;

showSaveProjectModal: boolean = false;
  proyectoGuardado: boolean = false;
  proyectoNombre: string = 'Mi Proyecto';
  proyectoDescripcion: string = '';


   misProyectos: any[] = [];
  cargandoProyectos: boolean = false;
  proyectoActualId?: number;



  isEditingTitle: boolean = false;
  isEditingDescription: boolean = false;
  proyectoTitleElement: Konva.Text | null = null;
  proyectoDescriptionElement: Konva.Text | null = null;



  
  // Eventos
  selectedEvent: TimelineEvent | null = null;
  editedEvent: TimelineEvent = {
    year: 0,
    title: '',
    person: '',
    description: '',
    image: ''
  };
  
  timelineEvents: TimelineEvent[] = [];
  
  newEvent: TimelineEvent = {
    year: 0,
    title: '',
    person: '',
    description: '',
    image: ''
  };

  // Plantillas
  availableTemplates: TimelineTemplate[] = [];



  

  containerSize: number = 90;
 isPresentacionMode: boolean = false;


  onContainerSizeChange(): void {
    if (this.isPresentacionMode) return;
    
    setTimeout(() => {
      if (this.stage) {
        this.stage.batchDraw();
      }
    }, 50);
  }


  ngOnDestroy(): void {
    if (this.isPresentacionMode) {
      document.removeEventListener('keydown', this.handleEscapeKey);
      document.body.classList.remove('presentacion-mode');
      document.body.style.overflow = '';
    }
  }
resetContainerSize(): void {
  this.containerSize = 90;
  this.onContainerSizeChange();
}

togglePresentacion(): void {
    this.isPresentacionMode = !this.isPresentacionMode;
    
    if (this.isPresentacionMode) {
      this.enterPresentacionMode();
    } else {
      this.exitPresentacionMode();
    }
  }

  // Entrar en modo presentación
  private enterPresentacionMode(): void {
    // Agregar clase al body para el modo presentación
    document.body.classList.add('presentacion-mode');
    
    // Ocultar barras de desplazamiento
    document.body.style.overflow = 'hidden';
    
    // Ajustar el stage al tamaño completo de la pantalla
    setTimeout(() => {
      if (this.stage) {
        this.stage.width(window.innerWidth);
        this.stage.height(window.innerHeight);
        this.stage.batchDraw();
        
        // Re-renderizar eventos para ajustar a la nueva escala
        this.renderTimelineEvents();
      }
    }, 100);

    // Escuchar tecla Escape para salir
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  // Salir del modo presentación
  private exitPresentacionMode(): void {
    // Remover clase del body
    document.body.classList.remove('presentacion-mode');
    
    // Restaurar scroll
    document.body.style.overflow = '';
    
    // Restaurar tamaño original del stage
    setTimeout(() => {
      this.onResize();
    }, 100);

    // Remover event listener
    document.removeEventListener('keydown', this.handleEscapeKey);
  }

  // Manejar tecla Escape
  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isPresentacionMode) {
      this.togglePresentacion();
    }
  }



  // Configuración
  minYear: number = 1800;
  maxYear: number = 2000;

  backgroundColors: string[] = [
    '#ffffff','#f9f9f9', '#f0f8ff', '#fffaf0', '#f5f5f5',
    '#e6f3ff', '#f0fff0', '#fff0f5', '#f8f8ff', '#fafad2'
  ];

  constructor(private templateService: TemplateService,private route: ActivatedRoute,private plantillaDesignService: PlantillaDesignService,private router: Router   ,private proyectoService: ProyectoService,private authService: AuthService,private archivoService: ArchivoService, ) {}


  ngOnInit(): void {
    this.initKonva();
    this.calculateYearRange();
    this.renderTimelineEvents();
    this.loadTemplates(); // Cargar plantillas al inicializar
    this.cargarPlantillasDiseno();
    this.crearElementosProyecto()

    this.route.queryParams.subscribe(params => {
    const proyectoId = params['proyecto'];
    
    if (proyectoId) {
      const id = Number(proyectoId);
      console.log('🔄 Proyecto ID desde URL:', id);
      
      if (id && id > 0) {
        this.cargarProyecto(id);
      } else {
        console.error('❌ ID de proyecto inválido en URL:', proyectoId);
        alert('ID de proyecto inválido');
      }
    } else {
      console.log('ℹ️ No hay proyecto en URL - modo nuevo proyecto');
      // Aquí puedes inicializar un proyecto nuevo si es necesario
    }
  });
    
  }



  


  crearElementosProyecto(): void {
    this.crearTituloProyecto();
    this.crearDescripcionProyecto();
  }


  crearTituloProyecto(): void {
    // Eliminar título anterior si existe
    if (this.proyectoTitleElement) {
      this.proyectoTitleElement.destroy();
    }

    const proyectoTemporal = this.proyectoService.getProyectoTemporal();
    const titulo = proyectoTemporal?.titulo || 'Mi Proyecto';

    this.proyectoTitleElement = new Konva.Text({
      x: 50,
      y: 30,
      text: titulo,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#2c3e50',
      fontStyle: 'bold',
      draggable: true,
      width: this.stage.width() - 100,
      align: 'center'
    });

    // Configurar eventos de doble clic
    this.configurarEventosEdicion(this.proyectoTitleElement, 'titulo');

    this.mainLayer.add(this.proyectoTitleElement);
    this.mainLayer.batchDraw();
  }


   crearDescripcionProyecto(): void {
    // Eliminar descripción anterior si existe
    if (this.proyectoDescriptionElement) {
      this.proyectoDescriptionElement.destroy();
    }

    const proyectoTemporal = this.proyectoService.getProyectoTemporal();
    const descripcion = proyectoTemporal?.descripcion || 'Descripción del proyecto';

    this.proyectoDescriptionElement = new Konva.Text({
      x: 50,
      y: 70,
      text: descripcion,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#5d6d7e',
      draggable: true,
      width: this.stage.width() - 100,
      align: 'center'
    });

    // Configurar eventos de doble clic
    this.configurarEventosEdicion(this.proyectoDescriptionElement, 'descripcion');

    this.mainLayer.add(this.proyectoDescriptionElement);
    this.mainLayer.batchDraw();
  }

  configurarEventosEdicion(textNode: Konva.Text, tipo: 'titulo' | 'descripcion'): void {
    // Evento de doble clic para editar
    textNode.on('dblclick', (e) => {
      e.cancelBubble = true;
      this.iniciarEdicionTexto(textNode, tipo);
    });

    // Evento de arrastre
    textNode.on('dragend', () => {
      this.mainLayer.batchDraw();
    });

    // Transformer para redimensionar (opcional)
    const tr = new Konva.Transformer({
      nodes: [textNode],
      enabledAnchors: ['middle-left', 'middle-right'],
      keepRatio: false,
      rotateEnabled: false,
      borderStroke: '#3498db',
      anchorFill: '#3498db',
      anchorStroke: '#fff',
      anchorSize: 6
    });

    tr.visible(false);
    this.mainLayer.add(tr);

    // Mostrar transformer al hacer clic
    textNode.on('click', (e) => {
      e.cancelBubble = true;
      
      // Ocultar otros transformers
      this.mainLayer.find('Transformer').forEach((transformerNode: Konva.Node) => {
        const transformer = transformerNode as Konva.Transformer;
        if (transformer !== tr) {
          transformer.visible(false);
        }
      });

      tr.visible(true);
      this.mainLayer.draw();
    });

    textNode.setAttr('myTransformer', tr);
  }

   iniciarEdicionTexto(textNode: Konva.Text, tipo: 'titulo' | 'descripcion'): void {
    const stageBox = this.stage.container().getBoundingClientRect();
    const textPosition = textNode.absolutePosition();
    
    // Crear textarea para edición
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    // Estilos del textarea
    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = (stageBox.top + textPosition.y) + 'px';
    textarea.style.left = (stageBox.left + textPosition.x) + 'px';
    textarea.style.width = (textNode.width() * textNode.scaleX()) + 'px';
    textarea.style.height = (textNode.height() * textNode.scaleY()) + 'px';
    textarea.style.fontSize = (textNode.fontSize() * textNode.scaleX()) + 'px';
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.color = textNode.fill() as string;
    textarea.style.background = 'rgba(255, 255, 255, 0.9)';
    textarea.style.border = '2px solid #3450dbff';
    textarea.style.padding = '5px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.textAlign = textNode.align() as any;
    textarea.style.zIndex = '1000';
    textarea.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

    // Para título, limitar a una línea
    if (tipo === 'titulo') {
      textarea.style.whiteSpace = 'nowrap';
      textarea.style.overflow = 'hidden';
    }

    textarea.focus();
    textarea.select();

    // Manejar eventos del textarea
    const guardarCambios = () => {
      const nuevoTexto = textarea.value.trim();
      
      if (nuevoTexto) {
        textNode.text(nuevoTexto);
        
        // Actualizar también en las propiedades del componente
        if (tipo === 'titulo') {
          this.proyectoNombre = nuevoTexto;
        } else {
          this.proyectoDescripcion = nuevoTexto;
        }
      }

      document.body.removeChild(textarea);
      this.mainLayer.batchDraw();
    };

    textarea.addEventListener('keydown', (e) => {
      // Guardar con Enter (para título) o Ctrl+Enter (para descripción)
      if (e.key === 'Enter') {
        if (tipo === 'titulo' || e.ctrlKey) {
          e.preventDefault();
          guardarCambios();
        }
      }
      
      // Cancelar con Escape
      if (e.key === 'Escape') {
        document.body.removeChild(textarea);
        this.mainLayer.batchDraw();
      }
    });

    // Guardar al hacer clic fuera
    textarea.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.body.contains(textarea)) {
          guardarCambios();
        }
      }, 100);
    });
  }

   cambiarEstiloTexto(tipo: 'titulo' | 'descripcion', propiedad: string, valor: any): void {
    const elemento = tipo === 'titulo' ? this.proyectoTitleElement : this.proyectoDescriptionElement;
    
    if (elemento) {
      switch (propiedad) {
        case 'color':
          elemento.fill(valor);
          break;
        case 'tamaño':
          elemento.fontSize(parseInt(valor));
          break;
        case 'fuente':
          elemento.fontFamily(valor);
          break;
        case 'negrita':
          elemento.fontStyle(valor ? 'bold' : 'normal');
          break;
        case 'cursiva':
          elemento.fontStyle(valor ? 'italic' : 'normal');
          break;
      }
      this.mainLayer.batchDraw();
    }
  }



   cargarPlantillasDiseno(): void {
    this.plantillasDisponibles = this.plantillaDesignService.obtenerPlantillas();
  }
   aplicarPlantillaDiseno(plantilla: any): void {
  // Usar setTimeout para asegurar que la operación sea asíncrona
  setTimeout(() => {
    try {
      this.cargarConfiguracionDiseno(plantilla.configuracion);
      this.showDesignTemplatesModal = false;
      
      // Forzar un redraw seguro
      setTimeout(() => {
        this.renderTimelineEventsSeguro();
      }, 100);
      
    } catch (error) {
      console.error('Error al aplicar plantilla:', error);
      alert('Error al aplicar la plantilla. Inténtalo de nuevo.');
    }
  }, 0);
}

private renderTimelineEventsSeguro(): void {
  try {
    this.renderTimelineEvents();
  } catch (error) {
    console.error('Error al renderizar eventos:', error);
    // Recrear el layer completo como fallback
    this.recrearCompletamente();
  }
}


async cargarMisProyectos(): Promise<void> {
    try {
      this.cargandoProyectos = true;
      
      const proyectos = await lastValueFrom(
        this.proyectoService.getProyectosByUsuario()
      );
      
      this.misProyectos = proyectos || [];
      console.log('📂 Proyectos cargados:', this.misProyectos.length);
      
    } catch (error) {
      console.error('❌ Error cargando proyectos:', error);
      alert('Error al cargar los proyectos');
    } finally {
      this.cargandoProyectos = false;
    }
  }


  





 abrirModalGuardarProyecto(): void {
    // Si hay datos temporales del proyecto, cargarlos
    const proyectoTemporal = this.proyectoService.getProyectoTemporal();
    if (proyectoTemporal) {
      this.proyectoNombre = proyectoTemporal.titulo;
      this.proyectoDescripcion = proyectoTemporal.descripcion;
    }
    
    this.showSaveProjectModal = true;
  }


  cerrarModalGuardarProyecto(): void {
    this.showSaveProjectModal = false;
    this.proyectoGuardado = false;
  }

  abrirModalPortada(): void {
    this.showPortadaModal = true;
  }

  cerrarModalPortada(): void {
    this.showPortadaModal = false;
    //this.portadaArchivo = null;
  }


  cancelarPortada(): void {
  this.showPortadaModal = false;
  this.portadaArchivo = null;
  this.proyectoPortada = '';
}

  onPortadaSelected(event: any): void {
  const file = event.target.files[0];
  console.log('📁 Archivo seleccionado:', file);
  
  if (!file) {
    console.log('⚠️ No se seleccionó archivo');
    return;
  }

  // Validar que sea una imagen
  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecciona un archivo de imagen');
    return;
  }

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('La imagen es demasiado grande. Máximo 5MB.');
    return;
  }

  // ✅ PRIMERO: Guardar el archivo
  this.portadaArchivo = file;
  console.log('✅ portadaArchivo establecido:', this.portadaArchivo);

  // ✅ SEGUNDO: Crear preview (asíncrono)
  const reader = new FileReader();
  reader.onload = (e: any) => {
    this.proyectoPortada = e.target.result;
    console.log('🖼️ Preview de portada creado');
  };
  reader.onerror = (error) => {
    console.error('❌ Error leyendo archivo para preview:', error);
  };
  reader.readAsDataURL(file);
}



  eliminarPortada(): void {
  if (this.proyectoPortada && this.proyectoActualId) {
    // Si hay una portada en el servidor, eliminarla
    this.eliminarPortadaDelServidor().then(() => {
      this.limpiarPortadaLocal();
    }).catch(error => {
      console.error('❌ Error eliminando portada del servidor, limpiando localmente:', error);
      this.limpiarPortadaLocal();
    });
  } else {
    // Solo limpiar localmente
    this.limpiarPortadaLocal();
  }
}



private async eliminarPortadaDelServidor(): Promise<void> {
  try {
    const usuario = await this.obtenerUsuarioActual();
    if (!usuario || !usuario.id || !this.proyectoActualId) {
      return;
    }

    // Obtener la URL actual de la portada del proyecto
    const proyectoActual = await lastValueFrom(
      this.proyectoService.getProyectoById(this.proyectoActualId)
    );
    const proyectoDataActual = this.proyectoService.parsearData(proyectoActual.data);
    const portadaUrl = proyectoDataActual.metadata?.portadaUrl;

    if (portadaUrl) {
      await this.eliminarPortadaAnterior(portadaUrl, usuario.id);
    }
  } catch (error) {
    console.error('❌ Error eliminando portada del servidor:', error);
    throw error;
  }
}

/**
 * ✅ Limpiar portada localmente
 */
private limpiarPortadaLocal(): void {
  this.proyectoPortada = '';
  this.portadaArchivo = null;
  console.log('🗑️ Portada eliminada localmente');
}

   private async subirPortadaProyecto(usuarioId: number, proyectoId: number): Promise<string> {
  console.log('🔍 Verificando portadaArchivo:', this.portadaArchivo);
  
  if (!this.portadaArchivo) {
    console.log('⚠️ No hay portadaArchivo para subir');
    return '';
  }

  try {
    console.log('📤 Iniciando subida de portada...', {
      usuarioId,
      proyectoId,
      archivo: {
        nombre: this.portadaArchivo.name,
        tipo: this.portadaArchivo.type,
        tamaño: this.portadaArchivo.size
      }
    });

    const tipoUsuario = 'users';
    
    const respuesta = await lastValueFrom(
      this.archivoService.subirPortadaProyectoUser(this.portadaArchivo, usuarioId, proyectoId)
    );

    console.log('✅ Portada subida exitosamente:', respuesta);
    return this.archivoService.obtenerUrlDesdeRespuesta(respuesta);
    
  } catch (error) {
    console.error('❌ Error subiendo portada:', error);
    
    // Debug detallado del error
    if (error instanceof HttpErrorResponse) {
      console.error('📋 Error HTTP en subida de portada:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error
      });
    }
    
    throw new Error('Error al subir la portada');
  }
}



  private async generarPortadaDesdeProyecto(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🖼️ Generando portada automática desde proyecto...');
      
      this.ocultarElementosTemporales();
      this.stage.batchDraw();
      
      setTimeout(() => {
        try {
          const dataURL = this.stage.toDataURL({
            pixelRatio: 1,
            quality: 0.8,
            mimeType: 'image/jpeg'
          });
          
          console.log('✅ Portada automática generada correctamente');
          
          // Convertir data URL a File
          this.portadaArchivo = this.dataURLtoFile(dataURL, `portada-automatica-${Date.now()}.jpg`);
          this.proyectoPortada = dataURL;
          
          this.mostrarElementosTemporales();
          resolve();
          
        } catch (error) {
          console.error('❌ Error generando portada automática:', error);
          this.mostrarElementosTemporales();
          reject(error);
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error en generarPortadaDesdeProyecto:', error);
      this.mostrarElementosTemporales();
      reject(error);
    }
  });
}


private ocultarElementosTemporales(): void {
  try {
    console.log('👁️ Ocultando elementos temporales...');
    
    // Ocultar todos los transformers (controles de edición)
    this.stage.find('Transformer').forEach((node: Konva.Node) => {
      if (node instanceof Konva.Transformer) {
        node.visible(false);
      }
    });
    
    console.log('✅ Elementos temporales ocultados');
  } catch (error) {
    console.error('❌ Error ocultando elementos temporales:', error);
  }
}

/**
 * ✅ Mostrar elementos temporales después de generar la portada
 */
private mostrarElementosTemporales(): void {
  try {
    console.log('👁️ Mostrando elementos temporales...');
    
    // Mostrar todos los transformers
    this.stage.find('Transformer').forEach((node: Konva.Node) => {
      if (node instanceof Konva.Transformer) {
        node.visible(true);
      }
    });
    
    console.log('✅ Elementos temporales mostrados');
  } catch (error) {
    console.error('❌ Error mostrando elementos temporales:', error);
  }
}


private async eliminarPortadaAnterior(portadaUrl: string, usuarioId: number): Promise<void> {
  try {
    if (!portadaUrl || !this.proyectoActualId) {
      console.log('⚠️ No hay portada anterior para eliminar');
      return;
    }

    console.log('🗑️ Eliminando portada anterior:', portadaUrl);
    
    // Extraer el nombre del archivo de la URL
    const urlParts = portadaUrl.split('/');
    const nombreArchivo = urlParts[urlParts.length - 1];
    
    if (!nombreArchivo) {
      console.warn('⚠️ No se pudo extraer nombre de archivo de la URL');
      return;
    }

    // Llamar al servicio para eliminar el archivo
    await lastValueFrom(
      this.archivoService.eliminarArchivo('users', usuarioId, this.proyectoActualId, 'portadas', nombreArchivo)
    );
    
    console.log('✅ Portada anterior eliminada:', nombreArchivo);
    
  } catch (error) {
    console.error('❌ Error eliminando portada anterior:', error);
    // No lanzar error para no interrumpir el proceso principal
    throw error; // Opcional: depende de si quieres que falle todo o solo continue
  }
}
private esUrlServidor(url: string): boolean {
  if (!url) return false;
  
  // URLs que indican que ya están en el servidor
  const patronesServidor = [
    '/api/archivos/',
    '/assets/',
    '/uploads/',
    'storage/',
    'blob:'
  ];
  
  // Si es data URL, no es del servidor
  if (url.startsWith('data:')) {
    return false;
  }
  
  // Si es URL HTTP/HTTPS o contiene patrones del servidor
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         patronesServidor.some(patron => url.includes(patron));
}




private async procesarImagenesEventos(usuarioId: number, esProyectoNuevo: boolean): Promise<TimelineEvent[]> {
  return await Promise.all(
    this.timelineEvents.map(async (event, index) => {
      
      // ✅ CASO 1: Ya es URL del servidor → MANTENER (NO PROCESAR)
      if (event.image && this.esUrlServidor(event.image)) {
        console.log(`🔗 Manteniendo URL existente del servidor para evento ${event.year}:`, event.image);
        return event; // ← Retornar sin modificar
      }
      
      // ✅ CASO 2: Es data URL (imagen NUEVA) → SUBIR SOLO SI HAY proyectoActualId
      if (event.image && event.image.startsWith('data:image')) {
        // Solo subir si ya tenemos un proyecto guardado (no es nuevo o ya fue creado)
        if (this.proyectoActualId) {
          try {
            console.log(`📤 Subiendo NUEVA imagen para evento ${event.year}...`);
            const file = this.dataURLtoFile(event.image, `evento-${event.year}-${Date.now()}.png`);
            
            const respuesta = await lastValueFrom(
              this.archivoService.subirAssetProyectoUser(
                file, 
                usuarioId, 
                this.proyectoActualId
              )
            );
            
            const imageUrl = this.archivoService.obtenerUrlDesdeRespuesta(respuesta);
            console.log(`✅ Nueva imagen subida para evento ${event.year}:`, imageUrl);
            
            return {
              ...event,
              image: imageUrl
            };
          } catch (error) {
            console.error(`❌ Error subiendo nueva imagen para evento ${event.year}:`, error);
            return { ...event, image: '' };
          }
        }
        
        // Para proyectos nuevos sin ID aún, mantener data URL temporal
        console.log(`💾 Manteniendo data URL temporal para evento ${event.year} (proyecto nuevo)`);
        return event;
      }
      
      // ✅ CASO 3: No hay imagen o imagen vacía → MANTENER
      console.log(`⚪ Sin imagen para evento ${event.year}`);
      return { ...event, image: event.image || '' };
    })
  );
}



  async guardarProyecto(): Promise<void> {
  try {
    if (!this.proyectoNombre.trim()) {
      alert('Por favor, ingresa un nombre para el proyecto');
      return;
    }
    
    const usuario = await this.obtenerUsuarioActual();
    if (!usuario || !usuario.id) {
      alert('Error: Usuario no autenticado');
      return;
    }

    // ✅ OBTENER PORTADA ANTERIOR SI ES ACTUALIZACIÓN
    let portadaAnteriorUrl = '';
    if (this.proyectoActualId) {
      try {
        const proyectoActual = await lastValueFrom(
          this.proyectoService.getProyectoById(this.proyectoActualId)
        );
        const proyectoDataActual = this.proyectoService.parsearData(proyectoActual.data);
        portadaAnteriorUrl = proyectoDataActual.metadata?.portadaUrl || '';
        console.log('📋 Portada anterior encontrada:', portadaAnteriorUrl);
      } catch (error) {
        console.warn('⚠️ No se pudo obtener portada anterior:', error);
      }
    }

    // ✅ GENERAR NUEVA PORTADA AUTOMÁTICAMENTE
    await this.generarPortadaDesdeProyecto();

    // ✅ PROCESAR SOLO IMÁGENES NUEVAS (detectar data URLs)
    console.log('🔍 Estado actual - proyectoActualId:', this.proyectoActualId);
    const esProyectoNuevo = !this.proyectoActualId;

    // Para proyectos existentes, subir imágenes nuevas ANTES de crear la estructura
    let eventosProcesadosInicial: TimelineEvent[];
    
    if (!esProyectoNuevo) {
      // PROYECTO EXISTENTE: Subir nuevas imágenes ahora
      console.log('📤 Procesando imágenes para proyecto EXISTENTE...');
      eventosProcesadosInicial = await this.procesarImagenesEventos(usuario.id, esProyectoNuevo);
    } else {
      // PROYECTO NUEVO: Mantener data URLs temporalmente
      console.log('💾 Manteniendo data URLs para proyecto NUEVO (se subirán después)...');
      eventosProcesadosInicial = [...this.timelineEvents];
    }

    // 1. CREAR ESTRUCTURA DE DATOS
    const proyectoDataInicial: ProyectoData = {
      metadata: {
        nombre: this.proyectoNombre,
        descripcion: this.proyectoDescripcion || `Proyecto creado desde el editor`,
        fechaExportacion: new Date().toISOString(),
        version: '1.0',
        totalEventos: eventosProcesadosInicial.length,
        portadaUrl: ''
      },
      configuracion: {
        backgroundColor: this.backgroundColor,
        minYear: this.minYear,
        maxYear: this.maxYear,
        stageWidth: this.stage.width(),
        stageHeight: this.stage.height()
      },
      eventos: eventosProcesadosInicial,
      elementosKonva: this.serializarElementosKonva(),
      estilos: this.getCurrentStyles()
    };

    const dataSerializada = this.proyectoService.serializarData(proyectoDataInicial);
    
    const proyectoRequestInicial: ProyectoRequest = {
      titulo: this.proyectoNombre,
      descripcion: this.proyectoDescripcion,
      data: dataSerializada,
      plantillaBaseId: 1
    };

    let proyectoGuardado;

    if (esProyectoNuevo) {
      // Crear proyecto vacío primero
      console.log('🆕 Creando proyecto vacío...');
      proyectoGuardado = await lastValueFrom(
        this.proyectoService.createProyecto(proyectoRequestInicial)
      );
      this.proyectoActualId = proyectoGuardado.id;
      console.log('✅ Proyecto vacío creado. ID:', this.proyectoActualId);
    } else {
      // Actualizar proyecto existente
      console.log('📝 Actualizando proyecto existente...');
      proyectoGuardado = await lastValueFrom(
        this.proyectoService.updateProyecto(this.proyectoActualId!, proyectoRequestInicial)
      );
    }

    // 2. PROCESAR IMÁGENES SOLO para proyectos nuevos (después de crear el proyecto)
    let eventosProcesadosFinal: TimelineEvent[];
    
    if (esProyectoNuevo) {
      console.log('🔄 Subiendo imágenes con ID del proyecto nuevo...');
      eventosProcesadosFinal = await this.procesarImagenesEventos(usuario.id, false);
    } else {
      // Para proyectos existentes, las imágenes ya fueron procesadas
      console.log('✅ Imágenes ya procesadas para proyecto existente');
      eventosProcesadosFinal = eventosProcesadosInicial;
    }

    // Actualizar textos si existen
    if (this.proyectoTitleElement) {
      this.proyectoNombre = this.proyectoTitleElement.text();
    }
    if (this.proyectoDescriptionElement) {
      this.proyectoDescripcion = this.proyectoDescriptionElement.text();
    }

    // 3. SUBIR PORTADA si existe
    let portadaUrlFinal = '';
    if (this.portadaArchivo && this.proyectoActualId) {
      try {
        console.log('📤 Subiendo nueva portada...');
        
        // ✅ PRIMERO: Eliminar portada anterior si existe
        if (portadaAnteriorUrl) {
          await this.eliminarPortadaAnterior(portadaAnteriorUrl, usuario.id);
        }
        
        // ✅ SEGUNDO: Subir nueva portada
        portadaUrlFinal = await this.subirPortadaProyecto(usuario.id, this.proyectoActualId);
        console.log('✅ Nueva portada subida:', portadaUrlFinal);
        
      } catch (error) {
        console.error('❌ Error manejando portada:', error);
      }
    } else if (portadaAnteriorUrl && !this.portadaArchivo) {
      // ✅ CASO: Si había portada pero ahora no se quiere portada, eliminarla
      try {
        await this.eliminarPortadaAnterior(portadaAnteriorUrl, usuario.id);
        console.log('🗑️ Portada anterior eliminada (sin nueva portada)');
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar portada anterior:', error);
      }
    }

    // 4. ACTUALIZAR el proyecto con las URLs finales
    const proyectoDataFinal: ProyectoData = {
      ...proyectoDataInicial,
      metadata: {
        ...proyectoDataInicial.metadata,
        portadaUrl: portadaUrlFinal,
        totalEventos: eventosProcesadosFinal.length
      },
      eventos: eventosProcesadosFinal
    };

    const proyectoRequestFinal: ProyectoRequest = {
      titulo: this.proyectoNombre,
      descripcion: this.proyectoDescripcion,
      data: this.proyectoService.serializarData(proyectoDataFinal),
      plantillaBaseId: 1
    };

    // Actualizar proyecto con datos finales
    const proyectoActualizado = await lastValueFrom(
      this.proyectoService.updateProyecto(this.proyectoActualId!, proyectoRequestFinal)
    );

    console.log('🎉 Proyecto guardado completamente. ID:', this.proyectoActualId);

    this.proyectoGuardado = true;
    this.proyectoService.clearProyectoTemporal();
    
    setTimeout(() => {
      this.cerrarModalGuardarProyecto();
      this.cargarMisProyectos();
    }, 2000);

  } catch (error) {
    console.error('❌ Error guardando proyecto:', error);
    
    if (error instanceof HttpErrorResponse) {
      console.error('📋 Detalles del error HTTP:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error,
        message: error.message
      });
    }
    
    alert('Error al guardar el proyecto. Por favor, intenta nuevamente.');
  }
}




private async obtenerUsuarioActual(): Promise<any> {
  try {
    // Si tu AuthService tiene un método para obtener el usuario actual
    if (this.authService.getCurrentUser) {
      return this.authService.getCurrentUser();
    }
    
    // Si no, intenta obtener el ID del usuario del token
    const token = this.authService.getToken();
    if (token) {
      // Decodificar el token JWT para obtener el userId
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.userId || payload.sub };
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    return null;
  }
}

  private dataURLtoFile(dataurl: string, filename: string): File {
  try {
    // Validar que sea un data URL válido
    if (!dataurl || !dataurl.startsWith('data:')) {
      throw new Error('Invalid data URL');
    }

    const arr = dataurl.split(',');
    if (arr.length < 2) {
      throw new Error('Invalid data URL format');
    }

    // Extraer MIME type de forma segura
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png'; // Fallback a image/png
    
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
    
  } catch (error) {
    console.error('❌ Error convirtiendo data URL a File:', error);
    // Crear un archivo vacío como fallback
    return new File([], filename, { type: 'image/png' });
  }
}



  async actualizarProyecto(id: number): Promise<void> {
  try {
    const proyectoData: ProyectoData = {
      metadata: {
        nombre: this.proyectoNombre,
        descripcion: this.proyectoDescripcion,
        fechaExportacion: new Date().toISOString(),
        version: '1.0',
        totalEventos: this.timelineEvents.length
      },
      configuracion: {
        backgroundColor: this.backgroundColor,
        minYear: this.minYear,
        maxYear: this.maxYear,
        stageWidth: this.stage.width(),
        stageHeight: this.stage.height()
      },
      eventos: this.timelineEvents.map(event => ({
        year: event.year,
        title: event.title,
        person: event.person,
        description: event.description,
        image: event.image || '' // ← Asegurar que siempre sea string
      })),
      elementosKonva: this.serializarElementosKonva(),
      estilos: this.getCurrentStyles()
    };

    const proyectoRequest: ProyectoRequest = {
      titulo: this.proyectoNombre,
      descripcion: this.proyectoDescripcion,
      data: this.proyectoService.serializarData(proyectoData),
      plantillaBaseId: 1
    };

    // Usar lastValueFrom en lugar de toPromise()
    const proyectoActualizado = await lastValueFrom(
      this.proyectoService.updateProyecto(id, proyectoRequest)
    );
    
    console.log('✅ Proyecto actualizado:', proyectoActualizado);
    this.proyectoGuardado = true;

  } catch (error) {
    console.error('❌ Error actualizando proyecto:', error);
    alert('Error al actualizar el proyecto');
  }
}


  async cargarProyecto(id: number): Promise<void> {
    try {
      console.log('📥 Iniciando carga del proyecto ID:', id);
      
      const proyecto = await lastValueFrom(
        this.proyectoService.getProyectoById(id)
      );
      
      if (!proyecto) {
        throw new Error('No se pudo cargar el proyecto');
      }
      
      // Parsear los datos del proyecto
      const proyectoData: ProyectoData = this.proyectoService.parsearData(proyecto.data);
      
      // Cargar el proyecto en el editor
      this.cargarProyectoDesdeData(proyectoData, proyecto.titulo, proyecto.descripcion);
      
      // Guardar referencia al proyecto actual
      this.proyectoActualId = id;
      this.proyectoNombre = proyecto.titulo;
      this.proyectoDescripcion = proyecto.descripcion;
      
      console.log('✅ Proyecto cargado exitosamente:', {
        id: id,
        titulo: proyecto.titulo,
        eventos: proyectoData.eventos?.length || 0,
        elementos: proyectoData.elementosKonva?.length || 0
      });
      
      this.mostrarMensaje(`Proyecto "${proyecto.titulo}" cargado correctamente`);
      
    } catch (error) {
      console.error('❌ Error cargando proyecto:', error);
      alert('Error al cargar el proyecto: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      
      // Opcional: redirigir a mis-proyectos si falla la carga
      // this.router.navigate(['/mis-proyectos']);
    }
  }




  contarEventosProyecto(proyecto: any): number {
    try {
      const data = this.proyectoService.parsearData(proyecto.data);
      return data.eventos?.length || 0;
    } catch {
      return 0;
    }
  }


  async actualizarProyectoActual(): Promise<void> {
  if (!this.proyectoActualId) {
    alert('No hay proyecto actual para actualizar');
    return;
  }

  try {
    const usuario = await this.obtenerUsuarioActual();
    if (!usuario || !usuario.id) {
      alert('Error: Usuario no autenticado');
      return;
    }

    // 1. Obtener datos actuales del proyecto para eliminar portada anterior si es necesario
    const proyectoActual = await lastValueFrom(
      this.proyectoService.getProyectoById(this.proyectoActualId)
    );
    const proyectoDataActual = this.proyectoService.parsearData(proyectoActual.data);

    // 2. Procesar eventos
    const eventosProcesados = await Promise.all(
      this.timelineEvents.map(async (event) => {
        if (event.image && event.image.startsWith('data:image')) {
          try {
            const file = this.dataURLtoFile(event.image, `evento-${event.year}.png`);
            const respuesta = await lastValueFrom(
              this.archivoService.subirAssetProyectoUser(file, usuario.id, this.proyectoActualId!)
            );
            return {
              ...event,
              image: this.archivoService.obtenerUrlDesdeRespuesta(respuesta)
            };
          } catch (error) {
            console.error('Error subiendo imagen del evento:', error);
            return { ...event, image: '' };
          }
        }
        return event;
      })
    );

    // 3. Manejar portada
    let portadaUrl = proyectoDataActual.metadata?.portadaUrl || '';

    if (this.portadaArchivo) {
      // ✅ CORREGIDO: Eliminar portada anterior si existe
      if (portadaUrl) {
        await this.eliminarPortadaAnterior(portadaUrl, usuario.id);
      }

      // Subir nueva portada
      portadaUrl = await this.subirPortadaProyecto(usuario.id, this.proyectoActualId);
    }

    // 4. Preparar datos actualizados
    const proyectoData: ProyectoData = {
      metadata: {
        nombre: this.proyectoNombre,
        descripcion: this.proyectoDescripcion,
        fechaExportacion: new Date().toISOString(),
        version: '1.0',
        totalEventos: eventosProcesados.length,
        portadaUrl: portadaUrl
      },
      configuracion: {
        backgroundColor: this.backgroundColor,
        minYear: this.minYear,
        maxYear: this.maxYear,
        stageWidth: this.stage.width(),
        stageHeight: this.stage.height()
      },
      eventos: eventosProcesados,
      elementosKonva: this.serializarElementosKonva(),
      estilos: this.getCurrentStyles()
    };

    const proyectoRequest: ProyectoRequest = {
      titulo: this.proyectoNombre,
      descripcion: this.proyectoDescripcion,
      data: this.proyectoService.serializarData(proyectoData),
      plantillaBaseId: 1
    };

    const proyectoActualizado = await lastValueFrom(
      this.proyectoService.updateProyecto(this.proyectoActualId, proyectoRequest)
    );
    
    console.log('✅ Proyecto actualizado:', proyectoActualizado);
    this.mostrarMensaje('Proyecto actualizado correctamente');
    
    // Limpiar portada temporal
    this.portadaArchivo = null;
    
    // Refrescar la lista
    this.cargarMisProyectos();
    
  } catch (error) {
    console.error('❌ Error actualizando proyecto:', error);
    alert('Error al actualizar el proyecto');
  }
}

  async duplicarProyecto(id: number): Promise<void> {
    try {
      const proyectoDuplicado = await lastValueFrom(
        this.proyectoService.duplicarProyecto(id)
      );
      
      console.log('✅ Proyecto duplicado:', proyectoDuplicado);
      this.mostrarMensaje('Proyecto duplicado correctamente');
      
      // Refrescar la lista
      this.cargarMisProyectos();
      
    } catch (error) {
      console.error('❌ Error duplicando proyecto:', error);
      alert('Error al duplicar el proyecto');
    }
  }


  async eliminarProyecto(id: number, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await lastValueFrom(
        this.proyectoService.deleteProyecto(id)
      );
      
      console.log('✅ Proyecto eliminado:', id);
      this.mostrarMensaje('Proyecto eliminado correctamente');
      
      // Si era el proyecto actual, limpiar referencia
      if (this.proyectoActualId === id) {
        this.proyectoActualId = undefined;
      }
      
      // Refrescar la lista
      this.cargarMisProyectos();
      
    } catch (error) {
      console.error('❌ Error eliminando proyecto:', error);
      alert('Error al eliminar el proyecto');
    }
  }

  private async cargarProyectoDesdeData(proyectoData: ProyectoData, titulo: string, descripcion: string): Promise<void> {
  try {
    // 1. Establecer propiedades básicas
    this.proyectoNombre = titulo;
    this.proyectoDescripcion = descripcion;

    // 2. Cargar portada si existe
    if (proyectoData.metadata?.portadaUrl) {
      this.proyectoPortada = proyectoData.metadata.portadaUrl;
    } else {
      this.proyectoPortada = '';
    }
    this.portadaArchivo = null;

    this.crearElementosProyecto();

    // 3. Limpiar editor actual
    this.timelineEvents = [];
    this.limpiarEditorCompletamente();

    // 4. Cargar configuración
    this.backgroundColor = proyectoData.configuracion.backgroundColor;
    this.minYear = proyectoData.configuracion.minYear;
    this.maxYear = proyectoData.configuracion.maxYear;
    this.updateBackgroundColor(this.backgroundColor);

    // 5. ✅ PRECARGAR IMÁGENES ANTES DE CARGAR EVENTOS
    console.log('🖼️ Precargando imágenes del proyecto...');
    const eventosConImagenesCargadas = await this.preloadImagesForEvents(proyectoData.eventos);
    
    // 6. Cargar eventos con imágenes precargadas
    this.timelineEvents = eventosConImagenesCargadas;
    
    // 7. Cargar elementos Konva
    if (proyectoData.elementosKonva && proyectoData.elementosKonva.length > 0) {
      for (const elemento of proyectoData.elementosKonva) {
        await this.crearElementoDesdeSerializacion(elemento);
      }
    }

    // 8. Renderizar
    this.renderTimelineEvents();
    
    console.log('📝 Proyecto cargado en editor:', proyectoData.metadata.nombre);
    
  } catch (error) {
    console.error('❌ Error cargando proyecto desde JSON:', error);
    this.mostrarMensaje('Error al cargar el proyecto', 'error');
  }
}


private async preloadImagesForEvents(eventos: TimelineEvent[]): Promise<TimelineEvent[]> {
  const eventosConImagenes = await Promise.all(
    eventos.map(async (evento) => {
      if (evento.image && this.esUrlExterna(evento.image)) {
        try {
          console.log(`🖼️ Precargando imagen para evento ${evento.year}:`, evento.image);
          const imageDataUrl = await this.convertUrlToDataURL(evento.image);
          return {
            ...evento,
            image: imageDataUrl // ✅ Usar data URL local para Konva
          };
        } catch (error) {
          console.error(`❌ Error precargando imagen para evento ${evento.year}:`, error);
          return { ...evento, image: '' }; // En caso de error, sin imagen
        }
      }
      return evento; // Mantener data URLs existentes
    })
  );
  
  console.log('✅ Todas las imágenes precargadas para eventos');
  return eventosConImagenes;
}

/**
 * ✅ NUEVO MÉTODO: Convertir URL externa a Data URL
 */
private async convertUrlToDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // ✅ Importante para CORS
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Convertir a data URL
        const dataURL = canvas.toDataURL('image/png');
        console.log(`✅ URL convertida a data URL: ${url.substring(0, 50)}...`);
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      console.error(`❌ Error cargando imagen: ${url}`);
      reject(new Error(`No se pudo cargar la imagen: ${url}`));
    };
    
    // ✅ Agregar timestamp para evitar cache
    const separator = url.includes('?') ? '&' : '?';
    img.src = url + separator + 't=' + Date.now();
  });
}


private recrearCompletamente(): void {
  // Guardar eventos actuales
  const eventosActuales = [...this.timelineEvents];
  
  // Recrear Konva completamente
  this.reiniciarKonva();
  
  // Restaurar eventos
  this.timelineEvents = eventosActuales;
  this.renderTimelineEvents();
}

private reiniciarKonva(): void {
  // Destruir completamente y recrear
  this.stage.destroy();
  this.initKonva();
}

  private cargarConfiguracionDiseno(configuracion: any): void {
  // Aplicar color de fondo de manera segura
  this.backgroundColor = configuracion.backgroundColor;
  this.actualizarFondoSeguro(this.backgroundColor);

  // Limpiar elementos de diseño de manera segura
  this.limpiarElementosDisenoSeguro();

  // Cargar elementos decorativos
  this.cargarElementosDecorativos(configuracion.elementos);
}

private limpiarElementosDisenoSeguro(): void {
  const elementosMantener = this.mainLayer.children?.filter(child => 
    this.esEventoDeLineaTiempo(child)
  ) || [];
  
  const elementosEliminar = this.mainLayer.children?.filter(child => 
    !this.esEventoDeLineaTiempo(child)
  ) || [];
  
  // Eliminar solo los elementos de diseño, no los de la línea de tiempo
  elementosEliminar.forEach(elemento => {
    this.eliminarElementoSeguro(elemento);
  });
  
  this.mainLayer.batchDraw();
}
private eliminarElementoSeguro(elemento: Konva.Node): void {
  try {
    // Remover transformer primero
    const transformer = elemento.getAttr('myTransformer');
    if (transformer && transformer instanceof Konva.Transformer) {
      transformer.remove();
    }
    
    // Remover el elemento
    elemento.remove();
    
  } catch (error) {
    console.warn('Error al eliminar elemento:', error);
    // Si falla, intentar destruir como último recurso
    try {
      elemento.destroy();
    } catch (destroyError) {
      console.error('Error incluso al destruir elemento:', destroyError);
    }
  }
}



private actualizarFondoSeguro(color: string): void {
  // Encontrar el rectángulo de fondo existente
  const fondoExistente = this.backgroundLayer.findOne('#background');
  
  if (fondoExistente && fondoExistente instanceof Konva.Rect) {
    // Actualizar el color del fondo existente
    fondoExistente.fill(color);
  } else {
    // Crear nuevo fondo si no existe
    this.crearNuevoFondo(color);
  }
  
  this.backgroundLayer.batchDraw();
}
private crearNuevoFondo(color: string): void {
  const background = new Konva.Rect({
    id: 'background',
    x: 0,
    y: 0,
    width: this.stage.width(),
    height: this.stage.height(),
    fill: color,
    listening: false
  });

  this.backgroundLayer.add(background);
  this.backgroundLayer.moveToBottom();
}

  private limpiarElementosDiseno(): void {
  const elementosAEliminar: Konva.Node[] = [];
  
  // Primero recolectar los elementos a eliminar
  this.mainLayer.children?.forEach((child: Konva.Node) => {
    if (!(child instanceof Konva.Line) && !this.esEventoDeLineaTiempo(child)) {
      elementosAEliminar.push(child);
    }
  });
  
  // Luego eliminarlos de manera segura
  elementosAEliminar.forEach(child => {
    child.remove(); // ← USAR remove() EN LUGAR DE destroy()
  });
  
  this.mainLayer.batchDraw();
}

  private esEventoDeLineaTiempo(node: Konva.Node): boolean {
    // Verificar si el nodo es parte de un evento de línea de tiempo
    return node.getAttr('esEvento') === true;
  }

  private cargarElementosDecorativos(elementos: any[]): void {
    elementos.forEach(elemento => {
      this.crearElementoDesdeSerializacion(elemento);
    });
    this.mainLayer.batchDraw();
  }

  private async crearElementoDesdeSerializacion(elemento: any): Promise<void> {
  switch (elemento.tipo) {
    case 'Rect':
      this.crearRectDesdeSerializacion(elemento);
      break;
    case 'Circle':
      this.crearCircleDesdeSerializacion(elemento);
      break;
    case 'Text':
      this.crearTextDesdeSerializacion(elemento);
      break;
    case 'Image':
      await this.crearImageDesdeSerializacionConCarga(elemento); // ✅ Ahora es async
      break;
    case 'Group':
      await this.crearGroupDesdeSerializacionConImagenes(elemento); // ✅ Ahora es async
      break;
  }
}


private async crearImageDesdeSerializacionConCarga(elemento: any): Promise<void> {
  return new Promise((resolve) => {
    // ✅ Preferir imageUrl, usar imageData como fallback
    const imageUrl = elemento.imageUrl || elemento.imageData;
    
    if (!imageUrl) {
      console.warn('No hay URL de imagen para cargar');
      this.crearPlaceholderEnPosicion(elemento);
      resolve();
      return;
    }

    const imageObj = new Image();
    
    // ✅ Configurar CORS solo para URLs externas
    if (this.esUrlExterna(imageUrl)) {
      imageObj.crossOrigin = 'Anonymous';
    }
    
    imageObj.onload = () => {
      const image = new Konva.Image({
        x: elemento.x,
        y: elemento.y,
        image: imageObj,
        width: elemento.width,
        height: elemento.height,
        draggable: true,
        scaleX: elemento.scaleX || 1,
        scaleY: elemento.scaleY || 1,
        rotation: elemento.rotation || 0,
        cornerRadius: elemento.cornerRadius || 0
      });

      // Aplicar sombra si existe
      if (elemento.shadow) {
        image.shadowColor(elemento.shadow.color || 'black');
        image.shadowBlur(elemento.shadow.blur || 5);
        image.shadowOffset(elemento.shadow.offset || { x: 3, y: 3 });
        image.shadowOpacity(elemento.shadow.opacity || 0.6);
      }

      // ✅ Guardar referencia a la URL original Y la imagen cargada
      image.setAttr('imageSrc', imageUrl);
      image.setAttr('loadedImage', imageObj); // Guardar referencia directa

      this.mainLayer.add(image);
      this.configurarInteracciones(image);
      this.mainLayer.draw();
      resolve();
    };

    imageObj.onerror = () => {
      console.error('Error al cargar la imagen:', imageUrl);
      this.crearPlaceholderEnPosicion(elemento);
      resolve();
    };

    imageObj.src = imageUrl;
  });
}

/**
 * ✅ NUEVO MÉTODO: Crear grupo con imágenes cargadas
 */
private async crearGroupDesdeSerializacionConImagenes(elemento: any): Promise<void> {
  const group = new Konva.Group({
    x: elemento.x,
    y: elemento.y,
    draggable: true,
    scaleX: elemento.scaleX || 1,
    scaleY: elemento.scaleY || 1,
    rotation: elemento.rotation || 0
  });

  // Recrear todos los hijos del grupo
  if (elemento.children && Array.isArray(elemento.children)) {
    for (const childElemento of elemento.children) {
      if (childElemento.tipo === 'Image') {
        await this.agregarImagenAGrupo(group, childElemento);
      } else {
        const childNode = this.crearNodoParaGrupo(childElemento);
        if (childNode) {
          childNode.x(childElemento.relativeX || 0);
          childNode.y(childElemento.relativeY || 0);
          group.add(childNode);
        }
      }
    }
  }

  // Aplicar clipping si existe
  if (elemento.clip) {
    this.aplicarClippingGrupo(group, elemento.clip);
  }

  this.mainLayer.add(group);
  this.configurarInteracciones(group);
}

/**
 * ✅ NUEVO MÉTODO: Agregar imagen a grupo de manera asíncrona
 */
private async agregarImagenAGrupo(group: Konva.Group, elemento: any): Promise<void> {
  return new Promise((resolve) => {
    const imageUrl = elemento.imageUrl || elemento.imageData;
    
    if (!imageUrl) {
      resolve();
      return;
    }

    const imageObj = new Image();
    
    if (this.esUrlExterna(imageUrl)) {
      imageObj.crossOrigin = 'Anonymous';
    }
    
    imageObj.onload = () => {
      const konvaImage = new Konva.Image({
        x: elemento.relativeX || 0,
        y: elemento.relativeY || 0,
        image: imageObj,
        width: elemento.width,
        height: elemento.height,
        cornerRadius: elemento.cornerRadius || 0
      });

      // Guardar referencia
      konvaImage.setAttr('imageSrc', imageUrl);
      konvaImage.setAttr('loadedImage', imageObj);

      group.add(konvaImage);
      resolve();
    };

    imageObj.onerror = () => {
      console.error('Error cargando imagen en grupo:', imageUrl);
      resolve();
    };

    imageObj.src = imageUrl;
  });
}


private esUrlExterna(url: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}


  private crearRectDesdeSerializacion(elemento: any): void {
    const rect = new Konva.Rect({
      x: elemento.x,
      y: elemento.y,
      width: elemento.width,
      height: elemento.height,
      fill: elemento.fill,
      stroke: elemento.stroke,
      strokeWidth: elemento.strokeWidth,
      cornerRadius: elemento.cornerRadius,
      draggable: true
    });
    
    this.mainLayer.add(rect);
    this.configurarInteracciones(rect);
  }

  private crearCircleDesdeSerializacion(elemento: any): void {
  const circle = new Konva.Circle({
    x: elemento.x,
    y: elemento.y,
    radius: elemento.radius,
    fill: elemento.fill,
    stroke: elemento.stroke,
    strokeWidth: elemento.strokeWidth,
    draggable: true,
    scaleX: elemento.scaleX || 1,
    scaleY: elemento.scaleY || 1,
    rotation: elemento.rotation || 0
  });

  this.mainLayer.add(circle);
  this.configurarInteracciones(circle);

  // Si es un círculo con imagen (grupo), recrear la estructura completa
  if (elemento.esCirculoConImagen) {
    this.recrearCirculoConImagen(circle, elemento);
  }
}

private recrearCirculoConImagen(circleBase: Konva.Circle, elemento: any): void {
  const group = new Konva.Group({
    x: elemento.x,
    y: elemento.y,
    draggable: true,
    scaleX: elemento.scaleX || 1,
    scaleY: elemento.scaleY || 1,
    rotation: elemento.rotation || 0
  });

  // Cargar la imagen si existe
  if (elemento.imagenUrl) {
    const imageObj = new Image();
    imageObj.crossOrigin = 'Anonymous';
    imageObj.src = elemento.imagenUrl;

    imageObj.onload = () => {
      const radius = elemento.radius;
      const konvaImage = new Konva.Image({
        x: -radius,
        y: -radius,
        image: imageObj,
        width: radius * 2,
        height: radius * 2,
      });

      // Aplicar clipping circular
      group.clipFunc((ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
        ctx.closePath();
      });

      group.add(konvaImage);

      // Crear el borde
      const circleBorder = new Konva.Circle({
        x: 0,
        y: 0,
        radius: radius,
        stroke: elemento.stroke,
        strokeWidth: elemento.strokeWidth,
        fill: 'transparent',
      });

      group.add(circleBorder);
      this.mainLayer.add(group);
      
      // Eliminar el círculo base temporal
      circleBase.destroy();
      
      this.configurarInteracciones(group);
      this.mainLayer.draw();
    };

    imageObj.onerror = () => {
      console.error('Error al cargar la imagen del círculo:', elemento.imagenUrl);
      // Mantener el círculo simple si falla la imagen
      this.configurarInteracciones(circleBase);
    };
  }
}

   abrirSelectorPlantillasDiseno(): void {
    this.showDesignTemplatesModal = true;
    this.cargarPlantillasDiseno();
  }


  private crearTextDesdeSerializacion(elemento: any): void {
  const text = new Konva.Text({
    x: elemento.x,
    y: elemento.y,
    text: elemento.text,
    fontSize: elemento.fontSize,
    fontFamily: elemento.fontFamily,
    fill: elemento.fill,
    draggable: true,
    scaleX: elemento.scaleX || 1,
    scaleY: elemento.scaleY || 1,
    rotation: elemento.rotation || 0,
    width: elemento.width, // Para texto con width específico
    height: elemento.height, // Para texto con height específico
    align: elemento.align || 'left',
    verticalAlign: elemento.verticalAlign || 'top',
    padding: elemento.padding || 0,
    lineHeight: elemento.lineHeight || 1
  });

  // Aplicar sombra si existe
  if (elemento.shadow) {
    text.shadowColor(elemento.shadow.color || 'black');
    text.shadowBlur(elemento.shadow.blur || 5);
    text.shadowOffset(elemento.shadow.offset || { x: 3, y: 3 });
    text.shadowOpacity(elemento.shadow.opacity || 0.6);
  }

  this.mainLayer.add(text);
  this.configurarInteracciones(text);
}



private crearImageDesdeSerializacion(elemento: any): void {
  // ✅ MODIFICACIÓN: Preferir imageUrl, usar imageData como fallback
  const imageUrl = elemento.imageUrl || elemento.imageData;
  
  if (!imageUrl) {
    console.warn('No hay URL de imagen para cargar');
    return;
  }

  const imageObj = new Image();
  imageObj.crossOrigin = 'Anonymous'; // ✅ Importante para CORS
  
  // Si es data URL, no necesita CORS
  if (imageUrl.startsWith('data:')) {
    imageObj.crossOrigin = null;
  }
  
  imageObj.src = imageUrl;

  imageObj.onload = () => {
    const image = new Konva.Image({
      x: elemento.x,
      y: elemento.y,
      image: imageObj,
      width: elemento.width,
      height: elemento.height,
      draggable: true,
      scaleX: elemento.scaleX || 1,
      scaleY: elemento.scaleY || 1,
      rotation: elemento.rotation || 0,
      cornerRadius: elemento.cornerRadius || 0
    });

    // Aplicar sombra si existe
    if (elemento.shadow) {
      image.shadowColor(elemento.shadow.color || 'black');
      image.shadowBlur(elemento.shadow.blur || 5);
      image.shadowOffset(elemento.shadow.offset || { x: 3, y: 3 });
      image.shadowOpacity(elemento.shadow.opacity || 0.6);
    }

    // Guardar referencia a la URL original
    image.setAttr('imageSrc', imageUrl);

    this.mainLayer.add(image);
    this.configurarInteracciones(image);
    this.mainLayer.draw();
  };

  imageObj.onerror = () => {
    console.error('Error al cargar la imagen:', imageUrl);
    this.crearPlaceholderEnPosicion(elemento);
  };
}


private crearPlaceholderEnPosicion(elemento: any): void {
  const placeholder = new Konva.Rect({
    x: elemento.x,
    y: elemento.y,
    width: elemento.width,
    height: elemento.height,
    fill: '#f0f0f0',
    stroke: '#ccc',
    strokeWidth: 1,
    draggable: true
  });

  const errorText = new Konva.Text({
    x: elemento.x,
    y: elemento.y + elemento.height / 2 - 10,
    text: '❌ Imagen no disponible',
    fontSize: 12,
    fontFamily: 'Arial',
    fill: '#666',
    width: elemento.width,
    align: 'center'
  });

  this.mainLayer.add(placeholder);
  this.mainLayer.add(errorText);
  this.configurarInteracciones(placeholder);
  this.mainLayer.draw();
}


private crearGroupDesdeSerializacion(elemento: any): void {
  const group = new Konva.Group({
    x: elemento.x,
    y: elemento.y,
    draggable: true,
    scaleX: elemento.scaleX || 1,
    scaleY: elemento.scaleY || 1,
    rotation: elemento.rotation || 0
  });

  // Recrear todos los hijos del grupo
  if (elemento.children && Array.isArray(elemento.children)) {
    elemento.children.forEach((childElemento: any) => {
      const childNode = this.crearNodoParaGrupo(childElemento);
      if (childNode) {
        // Restaurar posición relativa
        childNode.x(childElemento.relativeX || 0);
        childNode.y(childElemento.relativeY || 0);
        group.add(childNode);
      }
    });
  }

  // Aplicar clipping si existe (aproximación mejorada)
  if (elemento.clip) {
    this.aplicarClippingGrupo(group, elemento.clip);
  }

  this.mainLayer.add(group);
  this.configurarInteracciones(group);
}
private aplicarClippingGrupo(group: Konva.Group, clip: any): void {
  if (clip.type === 'circle') {
    group.clipFunc((ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.arc(
        clip.x || 0,
        clip.y || 0,
        clip.radius || 50,
        0,
        Math.PI * 2,
        false
      );
      ctx.closePath();
    });
    
    // Guardar información del clipping como atributos para futura referencia
    group.setAttr('clipType', 'circle');
    group.setAttr('clipRadius', clip.radius);
    group.setAttr('clipX', clip.x || 0);
    group.setAttr('clipY', clip.y || 0);
    
  } else if (clip.type === 'rect') {
    group.clipFunc((ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.rect(
        clip.x || 0,
        clip.y || 0,
        clip.width || 100,
        clip.height || 100
      );
      ctx.closePath();
    });
    
    group.setAttr('clipType', 'rect');
    group.setAttr('clipWidth', clip.width);
    group.setAttr('clipHeight', clip.height);
    group.setAttr('clipX', clip.x || 0);
    group.setAttr('clipY', clip.y || 0);
  }
}

private crearNodoParaGrupo(elemento: any): Konva.Shape | Konva.Group | null {
  switch (elemento.tipo) {
    case 'Rect':
      return new Konva.Rect({
        x: elemento.x,
        y: elemento.y,
        width: elemento.width,
        height: elemento.height,
        fill: elemento.fill,
        stroke: elemento.stroke,
        strokeWidth: elemento.strokeWidth,
        cornerRadius: elemento.cornerRadius
      });

    case 'Circle':
      return new Konva.Circle({
        x: elemento.x,
        y: elemento.y,
        radius: elemento.radius,
        fill: elemento.fill,
        stroke: elemento.stroke,
        strokeWidth: elemento.strokeWidth
      });

    case 'Text':
      return new Konva.Text({
        x: elemento.x,
        y: elemento.y,
        text: elemento.text,
        fontSize: elemento.fontSize,
        fontFamily: elemento.fontFamily,
        fill: elemento.fill
      });

    case 'Image':
      // Para imágenes en grupos, necesitamos cargarlas de manera asíncrona
      this.cargarImagenParaGrupo(elemento);
      return null;

    case 'Line':
      return new Konva.Line({
        points: elemento.points,
        stroke: elemento.stroke,
        strokeWidth: elemento.strokeWidth,
        tension: elemento.tension
      });

    default:
      return null;
  }
}

private cargarImagenParaGrupo(elemento: any): void {
  const imageObj = new Image();
  imageObj.crossOrigin = 'Anonymous';
  imageObj.src = elemento.imageUrl;

  imageObj.onload = () => {
    const image = new Konva.Image({
      x: elemento.x,
      y: elemento.y,
      image: imageObj,
      width: elemento.width,
      height: elemento.height,
      cornerRadius: elemento.cornerRadius || 0
    });

    // Buscar el grupo padre con cast explícito
    const group = this.mainLayer.findOne((node: Konva.Node) => {
      return node.getClassName() === 'Group' && 
             Math.abs(node.x() - elemento.parentX) < 1 && 
             Math.abs(node.y() - elemento.parentY) < 1;
    }) as Konva.Group; // ← CAST EXPLÍCITO AQUÍ

    if (group) {
      group.add(image);
      this.mainLayer.draw();
    }
  };
}

private configurarInteracciones(node: Konva.Node): void {
  const tr = new Konva.Transformer({
    nodes: [node],
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    keepRatio: node.getClassName() === 'Circle' || node.getClassName() === 'Image',
    rotateEnabled: true,
    borderStroke: '#2d8cf0',
    anchorFill: '#2d8cf0',
    anchorStroke: '#fff',
    anchorSize: 8
  });

  this.mainLayer.add(tr);
  tr.visible(false);

  // Evento de clic para seleccionar
  node.on('click', (e) => {
    e.cancelBubble = true;
    
    // Ocultar todos los transformers primero con cast explícito
    this.mainLayer.find('Transformer').forEach((transformerNode: Konva.Node) => {
      const transformer = transformerNode as Konva.Transformer; // ← CAST EXPLÍCITO
      transformer.visible(false);
    });

    // Mostrar transformer del elemento seleccionado
    tr.visible(true);
    this.mainLayer.draw();
  });

  // Evento de doble clic para acciones específicas
  node.on('dblclick', (e) => {
    e.cancelBubble = true;
    
    if (node.getClassName() === 'Text') {
      this.editarTextoDirectamente(node as Konva.Text);
    } else if (node.getClassName() === 'Group') {
      this.manejarDobleClicGrupo(node as Konva.Group);
    }
  });

  node.setAttr('myTransformer', tr);
}

private editarTextoDirectamente(textNode: Konva.Text): void {
  // Crear un input temporal para edición directa
  const textPosition = textNode.absolutePosition();
  const stageBox = this.stage.container().getBoundingClientRect();
  
  const area = document.createElement('textarea');
  document.body.appendChild(area);
  
  area.value = textNode.text();
  area.style.position = 'absolute';
  area.style.top = (stageBox.top + textPosition.y) + 'px';
  area.style.left = (stageBox.left + textPosition.x) + 'px';
  area.style.width = (textNode.width() * textNode.scaleX()) + 'px';
  area.style.height = (textNode.height() * textNode.scaleY()) + 'px';
  area.style.fontSize = (textNode.fontSize() * textNode.scaleX()) + 'px';
  area.style.border = 'none';
  area.style.padding = '0px';
  area.style.margin = '0px';
  area.style.overflow = 'hidden';
  area.style.background = 'none';
  area.style.outline = 'none';
  area.style.resize = 'none';
  area.style.fontFamily = textNode.fontFamily();
  area.style.transformOrigin = 'left top';
  area.style.textAlign = textNode.align() as any;
  area.style.color = textNode.fill() as string;
  
  area.focus();
  
  area.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      textNode.text(area.value);
      document.body.removeChild(area);
      this.mainLayer.draw();
    }
    
    if (e.key === 'Escape') {
      document.body.removeChild(area);
      this.mainLayer.draw();
    }
  });
}

private manejarDobleClicGrupo(group: Konva.Group): void {
  // Aquí puedes implementar acciones específicas para grupos
  console.log('Doble clic en grupo:', group);
}









  // ========== MÉTODOS DE PLANTILLAS ==========
  loadTemplates(): void {
    this.availableTemplates = this.templateService.getTemplates();
  }

  applyTemplate(template: TimelineTemplate): void {
    this.templateService.applyTemplate(template, this);
    this.showTemplateSelector = false;
  }

saveAsTemplate(): void {
    const template: TimelineTemplate = {
      name: `Diseño Personalizado - ${new Date().toLocaleDateString()}`,
      description: 'Plantilla de diseño creada desde el editor',
      category: 'Personalizado',
      createdBy: 'user',
      createdAt: new Date(),
      isPublic: false,
      styles: this.getCurrentStyles(),
      layout: this.getCurrentLayout()
    };

    this.templateService.saveTemplate(template);
    alert('Plantilla de diseño guardada correctamente');
  }

   private getCurrentStyles(): any {
    return {
      backgroundColor: this.backgroundColor,
      timelineColor: '#070707ff',
      eventColor: '#3498db',
      textColor: '#2c3e50',
      accentColor: '#e74c3c',
      fontFamily: 'Arial',
      titleFontSize: 14,
      yearFontSize: 12,
      imageStyle: 'circle',
      imageSize: 90,
      imageBorder: true,
      shadows: true,
      animations: true,
      connectorStyle: 'dashed'
    };
  }

  private getCurrentLayout(): TemplateLayout {
    return {
      timelinePosition: 'center',
      eventOrientation: 'alternate',
      eventSpacing: 120,
      markerStyle: 'dot',
      compactMode: false
    };
  }

  // ========== MÉTODOS KONVA ==========
   initKonva(): void {
    const width = this.container.nativeElement.offsetWidth;
    const height = this.container.nativeElement.offsetHeight;

    this.stage = new Konva.Stage({
      container: 'konva-container',
      width: width,
      height: height
    });

    this.backgroundLayer = new Konva.Layer();
    this.stage.add(this.backgroundLayer);

    this.mainLayer = new Konva.Layer();
    this.stage.add(this.mainLayer);

    this.updateBackgroundColor(this.backgroundColor);
    this.drawTimelineBase();
  }

  updateBackgroundColor(color: string): void {
  this.backgroundColor = color;
  
  // Método seguro para limpiar el fondo
  this.limpiarFondoSeguro();
  
  const background = new Konva.Rect({
    id: 'background',
    x: 0,
    y: 0,
    width: this.stage.width(),
    height: this.stage.height(),
    fill: color,
    listening: false
  });

  this.backgroundLayer.add(background);
  this.backgroundLayer.moveToBottom();
  this.backgroundLayer.batchDraw();
}

private limpiarFondoSeguro(): void {
  // Encontrar el fondo actual y removerlo sin destruir
  const fondoActual = this.backgroundLayer.findOne('#background');
  if (fondoActual) {
    fondoActual.remove(); // ← USAR remove() EN LUGAR DE destroy()
  }
  
  // Alternativa: limpiar todo el layer de manera segura
  this.backgroundLayer.children?.forEach((child: Konva.Node) => {
    child.remove(); // Remover sin destruir
  });
  this.backgroundLayer.clear(); // Limpiar el buffer de dibujo
}

//LINEA RECTA BASE DEL LA LINEA DE TIEMPO

//################################################

  drawTimelineBase(): void {
    const timeline = new Konva.Line({
      points: [50, this.stage.height() / 2, this.stage.width() - 50, this.stage.height() / 2],
      stroke: '#070707ff',
      strokeWidth: 5,
      lineCap: 'round'
    });
    this.mainLayer.add(timeline);
  }
//################################################

  renderTimelineEvents(): void {
  // Eliminar SOLO los grupos de eventos de línea de tiempo, nada más
  this.limpiarSoloGruposEventos();
  
  // Dibujar línea base si es necesario
  if (!this.existeLineaTiempo()) {
    this.drawTimelineBase();
  }
  
  // Recrear eventos
  this.timelineEvents.forEach(event => {
    this.createTimelineEvent(event);
  });
  
  this.mainLayer.batchDraw();
}


private limpiarSoloGruposEventos(): void {
  const elementosAEliminar: Konva.Node[] = [];
  
  this.mainLayer.children?.forEach((child: Konva.Node) => {
    // Solo eliminar grupos que sean eventos (no título, no descripción, no transformers)
    if (child instanceof Konva.Group) {
      // Verificar si es un evento por su contenido o atributo
      const tieneConnector = child.children?.some(c => c instanceof Konva.Line);
      const tieneYear = child.children?.some(c => 
        c instanceof Konva.Text && c.text().match(/^\d{4}$/)
      );
      const esEventoTimeline = child.getAttr('timelineEvent');
      
      if ((tieneConnector && tieneYear) || esEventoTimeline) {
        elementosAEliminar.push(child);
      }
    }
  });
  
  elementosAEliminar.forEach(elemento => {
    const transformer = elemento.getAttr('myTransformer');
    if (transformer) {
      transformer.remove();
    }
    elemento.remove();
  });
}
private existeLineaTiempo(): boolean {
  return this.mainLayer.children?.some(child => 
    child instanceof Konva.Line && 
    child.points().length === 4
  ) || false;
}

// Método para identificar elementos que deben preservarse
private esElementoPreservar(node: Konva.Node): boolean {
  // Preservar título y descripción del proyecto
  if (node === this.proyectoTitleElement || node === this.proyectoDescriptionElement) {
    return true;
  }
  
  // Preservar transformers
  if (node.getClassName() === 'Transformer') {
    return true;
  }
  
  // Preservar elementos decorativos (rectángulos, círculos, texto adicional, etc.)
  const className = node.getClassName();
  const esElementoDecorativo = [
    'Rect', 'Circle', 'Text', 'Image', 'Star', 'Group'
  ].includes(className);
  
  // Pero NO preservar eventos de línea de tiempo (estos se recrean)
  const esEventoLineaTiempo = node.getAttr('esEvento') === true;
  
  return esElementoDecorativo && !esEventoLineaTiempo;
}

  createTimelineEvent(event: TimelineEvent): void {
  const x = this.calculateCanvasPosition(event.year);
  const y = this.stage.height() / 2;

  const group = new Konva.Group({
    x: x,
    y: y,
    draggable: true,
    dragBoundFunc: (pos) => {
      if (this.autoUpdateYears) {
        // Comportamiento original: solo movimiento horizontal en la línea de tiempo
        return {
          x: pos.x,
          y: y
        };
      } else {
        // Comportamiento nuevo: movimiento libre en todo el canvas
        return {
          x: pos.x,
          y: pos.y
        };
      }
    }
  });

  if (event.image && event.image.trim() !== '') {
    this.createEventWithImage(group, event);
  } else {
    this.createEventWithoutImage(group, event);
  }

  const yearText = new Konva.Text({
    x: -15,
    y: 50,
    text: event.year.toString(),
    fontSize: 14,
    fontFamily: 'Arial',
    fill: '#2c3e50',
    fontStyle: 'bold'
  });
  group.add(yearText);

  group.on('dblclick', (e) => {
    e.cancelBubble = true;
    this.editEvent(event);
  });

  group.on('dragend', () => {
    this.updateEventYear(event, group.x());
  });

  // Guardar referencia al grupo para poder actualizarlo después
  group.setAttr('timelineEvent', event);
  group.setAttr('originalY', y);

  this.mainLayer.add(group);
}

//======= Evento CON IMAGEN ========
  createEventWithImage(group: Konva.Group, event: TimelineEvent): void {
    const imageSize = 90;

    const connector = new Konva.Line({
      points: [0, 6, 0, 110],
      stroke: '#333e32ff',
      strokeWidth: 1,
      dash: [5, 5]
    });
    group.add(connector);

    const imageCircle = new Konva.Circle({
      x: 0,
      y: -75,
      radius: imageSize / 2,
      fill: '#ffffff',
      stroke: '#000000ff',
      strokeWidth: 7,
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowBlur: 8,
      shadowOffset: { x: 0, y: 3 },
      shadowOpacity: 0.5
    });
    group.add(imageCircle);

    const imageObj = new Image();
    imageObj.onload = () => {
      const image = new Konva.Image({
        x: -imageSize / 2,
        y: -75 - imageSize / 2,
        image: imageObj,
        width: imageSize,
        height: imageSize,
        cornerRadius: imageSize / 2,
        perfectDrawEnabled: false
      });
      group.add(image);
      group.getLayer()?.batchDraw();
    };
    imageObj.src = event.image!;

    const titleBox = new Konva.Rect({
      x: -50,
      y: 37,
      width: 100,
      height: 80,
      fill: 'white',
      stroke: '#06060625',
      strokeWidth: 1,
      cornerRadius: 4,
      shadowColor: 'rgba(75, 72, 72, 1)',
      shadowBlur: 5,
      shadowOffset: { x: 0, y: 2 }
    });
    group.add(titleBox);

    const titleText = new Konva.Text({
      x: -45,
      y: 75,
      text: this.truncateText(event.title, 80),
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#2c3e50',
      width: 90,
      align: 'center',
      fontStyle: 'bold'
    });
    group.add(titleText);
  }

  //======= Evento SIN IMAGEN ========

  createEventWithoutImage(group: Konva.Group, event: TimelineEvent): void {
    const connector = new Konva.Line({
      points: [0, 6, 0, 40],
      stroke: '#2a2a2aff',
      strokeWidth: 1,
      dash: [5, 5]
    });
    group.add(connector);

    const titleBox = new Konva.Rect({
      x: -50,
      y: 37,
      width: 100,
      height: 80,
      fill: 'white',
      stroke: '#06060625',
      strokeWidth: 1,
      cornerRadius: 4,
      shadowColor: 'rgba(75, 72, 72, 1)',
      shadowBlur: 5,
      shadowOffset: { x: 0, y: 2 }
    });
    group.add(titleBox);

    const titleText = new Konva.Text({
      x: -45,
      y:75,
      text: this.truncateText(event.title, 80),
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#363535ff',
      width: 90,
      align: 'center',
      fontStyle: 'bold'
    });
    group.add(titleText);
  }



  // ========== MÉTODOS DE EVENTOS ==========
  editEvent(event: TimelineEvent): void {
    this.selectedEvent = event;
    this.editedEvent = { ...event };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedEvent = null;
    this.resetEditedEvent();
  }

  resetEditedEvent(): void {
    this.editedEvent = {
      year: 0,
      title: '',
      person: '',
      description: '',
      image: ''
    };
  }

  updateEvent(): void {
    if (!this.editedEvent.year || !this.editedEvent.title) {
      alert('Por favor, complete al menos el año y el título del evento.');
      return;
    }

    if (this.selectedEvent) {
      Object.assign(this.selectedEvent, this.editedEvent);
      this.timelineEvents.sort((a, b) => a.year - b.year);
      this.calculateYearRange();
      this.renderTimelineEvents();
      this.closeEditModal();
    }
  }

 async onEditImageSelected(event: any): Promise<void> {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecciona un archivo de imagen');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert('La imagen es demasiado grande. Máximo 10MB.');
    return;
  }

  try {
    if (this.proyectoActualId) {
      // PROYECTO EXISTENTE: Subir directamente
      const usuario = this.authService.getCurrentUser();
      if (!usuario || !usuario.id) {
        throw new Error('Usuario no autenticado');
      }

      const respuesta = await lastValueFrom(
        this.archivoService.subirAssetProyectoUser(file, usuario.id, this.proyectoActualId)
      );

      this.editedEvent.image = this.archivoService.obtenerUrlDesdeRespuesta(respuesta);
      console.log('✅ Imagen editada subida a proyecto existente');
      
    } else {
      // PROYECTO NUEVO: Data URL temporal
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editedEvent.image = e.target.result;
      };
      reader.readAsDataURL(file);
    }

  } catch (error) {
    console.error('❌ Error procesando imagen editada:', error);
    
    // Fallback a Data URL
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.editedEvent.image = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}


  removeImage(): void {
    this.editedEvent.image = '';
  }

  deleteEvent(): void {
    if (this.selectedEvent && confirm('¿Está seguro de que desea eliminar este evento?')) {
      const index = this.timelineEvents.indexOf(this.selectedEvent);
      if (index > -1) {
        this.timelineEvents.splice(index, 1);
        this.calculateYearRange();
        this.renderTimelineEvents();
        this.closeEditModal();
      }
    }
  }

  // ========== MÉTODOS UTILITARIOS ==========
  truncateText(text: string, maxWidth: number): string {
    if (text.length <= 30) return text;
    return text.substring(0, 10) + '...';
  }

 updateEventYear(event: TimelineEvent, xPosition: number): void {
  if (this.autoUpdateYears) {
    // Comportamiento original: actualizar año basado en posición X
    const newYear = this.calculateYearFromPosition(xPosition);
    event.year = newYear;
    this.timelineEvents.sort((a, b) => a.year - b.year);
    this.renderTimelineEvents();
  } else {
    // Comportamiento nuevo: mantener el año original, pero permitir movimiento libre
    // No hacemos nada aquí, el evento mantiene su año original
    console.log(`Evento "${event.title}" mantiene año ${event.year} (movimiento libre)`);
    
    // Opcional: Podemos forzar un re-render para asegurar que se vea bien
    // pero sin cambiar la posición lógica del evento
    this.actualizarPosicionVisualEvento(event);
  }
}


onAutoUpdateChange(): void {
  console.log(`Auto-update years: ${this.autoUpdateYears}`);
  
  // Si se desactiva el auto-update, re-renderizar para permitir movimiento libre
  if (!this.autoUpdateYears) {
    this.renderTimelineEvents();
  }
}


private actualizarPosicionVisualEvento(event: TimelineEvent): void {
  // Encontrar el grupo correspondiente a este evento
  const grupoEvento = this.mainLayer.findOne((node: Konva.Node) => {
    return node.getClassName() === 'Group' && 
           node.getAttr('timelineEvent') === event;
  });

  if (grupoEvento && grupoEvento instanceof Konva.Group) {
    // Si autoUpdateYears está desactivado, el evento puede estar en cualquier posición X
    // pero queremos que el texto del año se mantenga visible
    const yearText = grupoEvento.findOne((node: Konva.Node) => {
      return node.getClassName() === 'Text' && 
             node.getAttr('text') === event.year.toString();
    });

    if (yearText && yearText instanceof Konva.Text) {
      yearText.text(event.year.toString());
    }
    
    this.mainLayer.batchDraw();
  }
}






mostrarMenuExportar = false;

toggleExportMenu() {
  this.mostrarMenuExportar = !this.mostrarMenuExportar;
}


compartirProyecto() {
  this.mostrarMenuExportar = false;
  // Tu lógica para compartir (por ejemplo copiar enlace)
  const link = window.location.href;
  navigator.clipboard.writeText(link);
  alert("🔗 Enlace copiado al portapapeles");
}

  calculateYearFromPosition(x: number): number {
    const effectiveWidth = this.stage.width() - 100;
    const normalizedX = x - 50;
    const percentage = normalizedX / effectiveWidth;
    return Math.round(this.minYear + percentage * (this.maxYear - this.minYear));
  }

  openEventModal(): void {
    this.showEventModal = true;
  }

  closeEventModal(): void {
    this.showEventModal = false;
    this.resetNewEvent();
  }

  resetNewEvent(): void {
    this.newEvent = {
      year: 0,
      title: '',
      person: '',
      description: '',
      image: ''
    };
  }

  addEventToTimeline(): void {
    if (!this.newEvent.year || !this.newEvent.title) {
      alert('Por favor, complete al menos el año y el título del evento.');
      return;
    }

    this.timelineEvents.push({...this.newEvent});
    this.timelineEvents.sort((a, b) => a.year - b.year);
    this.calculateYearRange();
    this.renderTimelineEvents();
    this.closeEventModal();
  }

  addHistoricalEvent(year: number, person: string): void {
    this.newEvent.year = year;
    this.newEvent.title = person;
    this.newEvent.person = person;
    this.newEvent.image = '';
    this.addEventToTimeline();
  }

  calculateYearRange(): void {
    if (this.timelineEvents.length > 0) {
      this.minYear = Math.min(...this.timelineEvents.map(event => event.year));
      this.maxYear = Math.max(...this.timelineEvents.map(event => event.year));
      this.minYear = Math.max(1800, this.minYear - 10);
      this.maxYear = Math.min(2000, this.maxYear + 10);
    }
  }

  calculateCanvasPosition(year: number): number {
    const range = this.maxYear - this.minYear;
    return 50 + ((year - this.minYear) / range) * (this.stage.width() - 100);
  }

  selectEvent(event: TimelineEvent): void {
    console.log('Evento seleccionado:', event);
    alert(`Evento: ${event.title}\nAño: ${event.year}\nPersonaje: ${event.person}\nDescripción: ${event.description}`);
  }

  async onImageSelected(event: any): Promise<void> {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecciona un archivo de imagen');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert('La imagen es demasiado grande. Máximo 10MB.');
    return;
  }

  try {
    // PARA PROYECTOS NUEVOS: Usar Data URL temporal
    // PARA PROYECTOS EXISTENTES: Subir directamente al servidor
    
    if (this.proyectoActualId) {
      // PROYECTO EXISTENTE: Subir directamente al servidor
      console.log('📤 Subiendo imagen a proyecto EXISTENTE...');
      const usuario = this.authService.getCurrentUser();
      if (!usuario || !usuario.id) {
        throw new Error('Usuario no autenticado');
      }

      const respuesta = await lastValueFrom(
        this.archivoService.subirAssetProyectoUser(file, usuario.id, this.proyectoActualId)
      );

      this.newEvent.image = this.archivoService.obtenerUrlDesdeRespuesta(respuesta);
      console.log('✅ Imagen subida a proyecto existente');
      
    } else {
      // PROYECTO NUEVO: Usar Data URL temporal (se subirá después de guardar)
      console.log('💾 Guardando imagen temporalmente (Data URL)...');
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newEvent.image = e.target.result;
        console.log('✅ Imagen guardada temporalmente');
      };
      reader.readAsDataURL(file);
    }

  } catch (error) {
    console.error('❌ Error procesando imagen:', error);
    
    // Fallback: siempre usar Data URL si hay error
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.newEvent.image = e.target.result;
    };
    reader.readAsDataURL(file);
    
    alert('Error al procesar la imagen. Se guardará temporalmente.');
  }
}




  changeBackgroundColor(color: string): void {
    this.updateBackgroundColor(color);
  }

  addEvent(): void {
    const currentYear = Math.round((this.minYear + this.maxYear) / 2);
    this.newEvent = {
      year: currentYear,
      title: 'Nuevo Evento',
      person: '',
      description: '',
      image: ''
    };
    this.openEventModal();
  }

  addMilestone(): void {
    const x = this.stage.width() / 2;
    const y = this.stage.height() / 2;

    const star = new Konva.Star({
      x: x,
      y: y,
      numPoints: 5,
      innerRadius: 15,
      outerRadius: 25,
      fill: '#e74c3c',
      stroke: '#c0392b',
      strokeWidth: 2,
      draggable: true
    });

    this.mainLayer.add(star);
    this.mainLayer.batchDraw();
  }

  addText(): void {
    const x = this.stage.width() / 2;
    const y = this.stage.height() / 2;

    const text = new Konva.Text({
      x: x,
      y: y,
      text: 'Texto editable',
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#2c3e50',
      draggable: true
    });

    this.mainLayer.add(text);
    this.mainLayer.batchDraw();
  }

  addRectangle(): void {
    const x = this.stage.width() / 2;
    const y = this.stage.height() / 2;

    const rect = new Konva.Rect({
      x: x - 50,
      y: y - 30,
      width: 100,
      height: 60,
      fill: '#3498db',
      stroke: '#2980b9',
      strokeWidth: 2,
      draggable: true,
      cornerRadius: 5
    });

    this.mainLayer.add(rect);
    this.mainLayer.batchDraw();
  }

  addCircle(): void {
    const x = this.stage.width() / 2;
    const y = this.stage.height() / 2;

    const circle = new Konva.Circle({
      x: x,
      y: y,
      radius: 30,
      fill: '#9b59b6',
      stroke: '#8e44ad',
      strokeWidth: 2,
      draggable: true
    });

    this.mainLayer.add(circle);
    this.mainLayer.batchDraw();
  }
  //########################################

async exportAsImage(): Promise<void> {
  try {
    if (!this.stage) {
      alert('Error: El editor no está listo para exportar');
      return;
    }

    console.log('🔄 Iniciando exportación...');

    // ✅ YA NO NECESITAMOS PRECARGAR porque las imágenes ya están en data URLs
    // Solo forzar un redraw para asegurar que todo esté visible
    
    this.stage.batchDraw();

    // Pequeña espera para asegurar el renderizado
    setTimeout(() => {
      try {
        const dataURL = this.stage.toDataURL({
          pixelRatio: 2, // ✅ Mejor calidad
          quality: 1,
          mimeType: 'image/png'
        });

        if (!dataURL || dataURL.length < 100) {
          throw new Error('Data URL inválida');
        }

        this.descargarDataURL(dataURL, `linea-tiempo-${new Date().getTime()}.png`);
        
        console.log('✅ Exportación exitosa');
        
      } catch (error) {
        console.error('❌ Error en exportación:', error);
        // Intentar con configuración más simple
        this.intentarExportacionSimple();
      }
    }, 100);
    
  } catch (error) {
    console.error('❌ Error general en exportación:', error);
    alert('Error al exportar la imagen. Por favor, intenta nuevamente.');
  }
}

/**
 * ✅ NUEVO MÉTODO: Intentar exportación simple como fallback
 */
private intentarExportacionSimple(): void {
  try {
    this.stage.batchDraw();
    
    setTimeout(() => {
      const dataURL = this.stage.toDataURL({
        pixelRatio: 1,
        quality: 0.9,
        mimeType: 'image/jpeg'
      });

      this.descargarDataURL(dataURL, `linea-tiempo-${new Date().getTime()}.jpg`);
      console.log('✅ Exportación JPEG exitosa (fallback)');
    }, 50);
  } catch (error) {
    console.error('❌ Error incluso en exportación simple:', error);
    alert('❌ Error crítico: No se pudo exportar la imagen.');
  }
}

/**
 * ✅ NUEVO MÉTODO: Descargar data URL
 */
private descargarDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


private async prepararImagenesParaExportacion(): Promise<void> {
  return new Promise((resolve) => {
    let imagesToLoad = 0;
    let imagesLoaded = 0;

    // Buscar todas las imágenes en el stage
    const images: Konva.Image[] = [];
    
    this.stage.find('Image').forEach((node: Konva.Node) => {
      if (node instanceof Konva.Image) {
        images.push(node);
      }
    });

    // Buscar imágenes en grupos
    this.stage.find('Group').forEach((group: Konva.Node) => {
      if (group instanceof Konva.Group) {
        group.children?.forEach((child: Konva.Node) => {
          if (child instanceof Konva.Image) {
            images.push(child);
          }
        });
      }
    });

    // Buscar imágenes en eventos de timeline
    this.stage.find('Group').forEach((group: Konva.Node) => {
      if (group instanceof Konva.Group) {
        const hasConnector = group.children?.some(c => c instanceof Konva.Line);
        const hasYear = group.children?.some(c => 
          c instanceof Konva.Text && c.text().match(/^\d{4}$/)
        );
        
        if (hasConnector && hasYear) {
          group.children?.forEach((child: Konva.Node) => {
            if (child instanceof Konva.Image) {
              images.push(child);
            }
          });
        }
      }
    });

    imagesToLoad = images.length;

    // Si no hay imágenes, resolver inmediatamente
    if (imagesToLoad === 0) {
      resolve();
      return;
    }

    console.log(`🖼️ Preparando ${imagesToLoad} imágenes para exportación...`);

    const checkAllLoaded = () => {
      imagesLoaded++;
      console.log(`📊 Imágenes cargadas: ${imagesLoaded}/${imagesToLoad}`);
      
      if (imagesLoaded >= imagesToLoad) {
        console.log('✅ Todas las imágenes listas para exportación');
        resolve();
      }
    };

    images.forEach((imageNode: Konva.Image) => {
      const currentImage = imageNode.image();
      
      // ✅ CORRECCIÓN: Verificar el tipo específico antes de acceder a propiedades
      if (this.isImageLoaded(currentImage)) {
        checkAllLoaded();
        return;
      }

      // Si es una URL externa, crear una nueva imagen y cargarla
      const imageSrc = imageNode.getAttr('imageSrc') || '';
      
      if (imageSrc && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))) {
        const newImage = new Image();
        newImage.crossOrigin = 'Anonymous';
        
        newImage.onload = () => {
          imageNode.image(newImage);
          this.stage.batchDraw();
          checkAllLoaded();
        };
        
        newImage.onerror = () => {
          console.error('❌ Error cargando imagen para exportación:', imageSrc);
          this.crearPlaceholderParaImagen(imageNode);
          checkAllLoaded();
        };
        
        newImage.src = imageSrc;
      } else {
        // Si no es URL externa o ya está cargada de otra forma
        checkAllLoaded();
      }
    });
  });
}

/**
 * ✅ NUEVO MÉTODO: Verificar si una imagen está cargada de manera segura
 */
private isImageLoaded(imageSource: CanvasImageSource | undefined): boolean {
  if (!imageSource) {
    return false;
  }

  // Verificar si es un elemento HTMLImageElement
  if (imageSource instanceof HTMLImageElement) {
    return imageSource.complete && imageSource.naturalHeight !== 0;
  }

  // Verificar si es un elemento HTMLCanvasElement (ya está "cargado")
  if (imageSource instanceof HTMLCanvasElement) {
    return true;
  }

   // Verificar si es un elemento HTMLVideoElement
  if (imageSource instanceof HTMLVideoElement) {
    // ✅ CORRECCIÓN: Usar la constante correctamente
    return imageSource.readyState >= 2; // HAVE_CURRENT_DATA = 2
  }

  // Para SVG y otros tipos, asumir que están cargados
  return true;
}

private crearPlaceholderParaImagen(imageNode: Konva.Image): void {
  const canvas = document.createElement('canvas');
  canvas.width = imageNode.width();
  canvas.height = imageNode.height();
  const ctx = canvas.getContext('2d')!;
  
  // Fondo gris
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Borde
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  
  // Texto
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❌ Imagen no disponible', canvas.width / 2, canvas.height / 2);
  
  const placeholderImage = new Image();
  placeholderImage.src = canvas.toDataURL();
  placeholderImage.onload = () => {
    imageNode.image(placeholderImage);
    this.stage.batchDraw();
  };
}




/**
 * Fallback: exportar como JPEG
 */
private exportarComoJPEG(): void {
  try {
    this.stage.batchDraw();
    
    setTimeout(() => {
      const dataURL = this.stage.toDataURL({
        pixelRatio: 1,
        quality: 0.8,
        mimeType: 'image/jpeg'
      });

      const link = document.createElement('a');
      link.download = `linea-tiempo-${new Date().getTime()}.jpg`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Exportación JPEG exitosa');
      alert('✅ Imagen exportada como JPEG');
      
    }, 50);
    
  } catch (error) {
    console.error('❌ Error en exportación JPEG:', error);
    alert('❌ Error crítico: No se pudo exportar la imagen.');
  }
}
 //##############################################

   onResize(): void {
    if (this.stage) {
      if (this.isPresentacionMode) {
        // En modo presentación, usar toda la pantalla
        this.stage.width(window.innerWidth);
        this.stage.height(window.innerHeight);
      } else {
        // Modo normal
        const container = this.container.nativeElement;
        const scale = this.containerSize / 100;
        
        this.stage.width(container.offsetWidth / scale);
        this.stage.height(container.offsetHeight / scale);
      }
      
      this.updateBackgroundColor(this.backgroundColor);
      this.renderTimelineEvents();
      
      // Actualizar anchos de los textos
      if (this.proyectoTitleElement) {
        this.proyectoTitleElement.width(this.stage.width() - 100);
      }
      if (this.proyectoDescriptionElement) {
        this.proyectoDescriptionElement.width(this.stage.width() - 100);
      }
      
      this.mainLayer.batchDraw();
    }
  }





/**
 * Exporta el proyecto completo como JSON
 */



/*exportarComoJSON(nombreProyecto: string = 'mi-proyecto'): void {
  try {
    const proyectoExport: ProyectoExport = {
      metadata: {
        nombre: nombreProyecto,
        descripcion: `Proyecto exportado desde el editor de líneas de tiempo`,
        fechaExportacion: new Date().toISOString(),
        version: '1.0',
        totalEventos: this.timelineEvents.length
      },
      configuracion: {
        backgroundColor: this.backgroundColor,
        minYear: this.minYear,
        maxYear: this.maxYear,
        stageWidth: this.stage.width(),
        stageHeight: this.stage.height()
      },
      eventos: this.timelineEvents.map(event => ({
        ...event,
        // Asegurar que las imágenes sean data URLs si existen
        image: event.image && event.image.startsWith('data:') ? event.image : ''
      })),
      elementosKonva: this.serializarElementosKonva(),
      estilos: this.getCurrentStyles()
    };

    this.descargarJSON(proyectoExport, nombreProyecto);
    
    console.log('✅ Proyecto exportado correctamente:', proyectoExport);
    this.mostrarMensaje('Proyecto exportado como JSON correctamente');
    
  } catch (error) {
    console.error('❌ Error exportando proyecto:', error);
    this.mostrarMensaje('Error al exportar el proyecto', 'error');
  }
}*/

/**
 * Serializa todos los elementos Konva del layer principal
 */
 serializarElementosKonva(): any[] {
  const elementosSerializados: any[] = [];
  
  if (!this.mainLayer || !this.mainLayer.children) {
    return elementosSerializados;
  }

  this.mainLayer.children.forEach((node: Konva.Node) => {
    // No serializar la línea de tiempo base ni los transformers
    if (this.esElementoSerializable(node)) {
      const elementoSerializado = this.serializarNodoKonva(node);
      if (elementoSerializado) {
        elementosSerializados.push(elementoSerializado);
      }
    }
  });

  return elementosSerializados;
}

/**
 * Determina si un nodo Konva debe ser serializado
 */
private esElementoSerializable(node: Konva.Node): boolean {
  const className = node.getClassName();
  const esTransformer = className === 'Transformer';
  const esLineaTiempo = node instanceof Konva.Line && 
                       node.points().length === 4 && 
                       node.stroke() === '#070707ff';
  
  return !esTransformer && !esLineaTiempo;
}

/**
 * Serializa un nodo Konva individual
 */
private serializarNodoKonva(node: Konva.Node): any {
  const baseProps = {
    tipo: node.getClassName(),
    x: node.x(),
    y: node.y(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    rotation: node.rotation(),
    draggable: node.draggable()
  };

  // ✅ CORREGIDO: No llamar a serializarNodoKonva dentro de los métodos específicos
  switch (node.getClassName()) {
    case 'Group':
      return {
        ...baseProps,
        ...this.serializarGrupo(node as Konva.Group)
      };
    
    case 'Rect':
      return {
        ...baseProps,
        ...this.serializarRect(node as Konva.Rect)
      };
    
    case 'Circle':
      return {
        ...baseProps,
        ...this.serializarCircle(node as Konva.Circle)
      };
    
    case 'Text':
      return {
        ...baseProps,
        ...this.serializarText(node as Konva.Text)
      };
    
    case 'Image':
      return {
        ...baseProps,
        ...this.serializarImage(node as Konva.Image)
      };
    
    case 'Line':
      return {
        ...baseProps,
        ...this.serializarLine(node as Konva.Line)
      };
    
    case 'Star':
      return {
        ...baseProps,
        ...this.serializarStar(node as Konva.Star)
      };
    
    default:
      return baseProps;
  }
}

/**
 * Serializa un grupo Konva
 */
private serializarGrupo(group: Konva.Group): any {
  const hijosSerializados: any[] = [];
  
  group.children?.forEach((child: Konva.Node) => {
    // ✅ SOLO serializar propiedades básicas para hijos, no recursión completa
    hijosSerializados.push(this.serializarPropiedadesBasicas(child));
  });

  return {
    hijos: hijosSerializados,
    clip: this.obtenerClipGrupo(group)
  };
}

private serializarPropiedadesBasicas(node: Konva.Node): any {
  return {
    tipo: node.getClassName(),
    x: node.x(),
    y: node.y(),
    // Solo propiedades esenciales para identificar el nodo
  };
}

private serializarLine(line: Konva.Line): any {
  return {
    points: line.points(),
    stroke: line.stroke(),
    strokeWidth: line.strokeWidth(),
    dash: line.dash()
  };
}

/**
 * Serializa un rectángulo Konva
 */
private serializarRect(rect: Konva.Rect): any {
  return {
    width: rect.width(),
    height: rect.height(),
    fill: rect.fill(),
    stroke: rect.stroke(),
    strokeWidth: rect.strokeWidth(),
    cornerRadius: rect.cornerRadius(),
    shadow: this.obtenerShadow(rect)
  };
}

/**
 * Serializa un círculo Konva
 */
private serializarCircle(circle: Konva.Circle): any {
  return {
    radius: circle.radius(),
    fill: circle.fill(),
    stroke: circle.stroke(),
    strokeWidth: circle.strokeWidth(),
    shadow: this.obtenerShadow(circle)
  };
}

/**
 * Serializa texto Konva
 */
private serializarText(text: Konva.Text): any {
  return {
    text: text.text(),
    fontSize: text.fontSize(),
    fontFamily: text.fontFamily(),
    fill: text.fill(),
    fontStyle: text.fontStyle(),
    align: text.align(),
    width: text.width(),
    height: text.height(),
    shadow: this.obtenerShadow(text)
  };
}

/**
 * Serializa imagen Konva
 */
private serializarImage(image: Konva.Image): any {
  // ✅ MODIFICACIÓN: Guardar ambos - URL para BD y data URL para exportación
  const imageUrl = image.getAttr('imageSrc') || '';
  
  // Solo crear data URL si es necesario (imágenes locales/temporales)
  let imageData = '';
  if (!imageUrl || imageUrl.startsWith('data:')) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = image.width();
        canvas.height = image.height();
        image.toCanvas(ctx);
        imageData = canvas.toDataURL('image/png');
      }
    } catch (error) {
      console.warn('No se pudo serializar la imagen:', error);
    }
  }
  
  return {
    width: image.width(),
    height: image.height(),
    imageUrl: imageUrl, // ← Para la base de datos
    imageData: imageData, // ← Para exportación/backup
    cornerRadius: image.cornerRadius(),
    shadow: this.obtenerShadow(image)
  };
}

/**
 * Serializa línea Konva
 */


/**
 * Serializa estrella Konva
 */
private serializarStar(star: Konva.Star): any {
  return {
    numPoints: star.numPoints(),
    innerRadius: star.innerRadius(),
    outerRadius: star.outerRadius(),
    fill: star.fill(),
    stroke: star.stroke(),
    strokeWidth: star.strokeWidth()
  };
}

/**
 * Obtiene información del clipping de un grupo
 */
private obtenerClipGrupo(group: Konva.Group): any {
  const clipType = group.getAttr('clipType');
  if (!clipType) return null;

  return {
    type: clipType,
    radius: group.getAttr('clipRadius'),
    x: group.getAttr('clipX'),
    y: group.getAttr('clipY'),
    width: group.getAttr('clipWidth'),
    height: group.getAttr('clipHeight')
  };
}

/**
 * Obtiene información de sombra de un nodo
 */
private obtenerShadow(node: Konva.Shape): any {
  return {
    color: node.shadowColor(),
    blur: node.shadowBlur(),
    offset: node.shadowOffset(),
    opacity: node.shadowOpacity()
  };
}

/**
 * Descarga el JSON como archivo
 */
private descargarJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().getTime()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Liberar memoria
  URL.revokeObjectURL(url);
}

/**
 * Muestra un mensaje al usuario
 */
private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' = 'success'): void {
  // Puedes implementar un sistema de notificaciones más elegante
  alert(`${tipo === 'success' ? '✅' : '❌'} ${mensaje}`);
}

/**
 * Método para importar proyecto desde JSON
 */
/*importarDesdeJSON(event: any): void {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e: any) => {
    try {
      const proyectoImport: ProyectoExport = JSON.parse(e.target.result);
      this.cargarProyectoDesdeJSON(proyectoImport);
    } catch (error) {
      console.error('❌ Error importando proyecto:', error);
      this.mostrarMensaje('Error al importar el proyecto. Formato inválido.', 'error');
    }
  };
  reader.readAsText(file);
  
  // Limpiar el input para permitir re-seleccionar el mismo archivo
  event.target.value = '';
}*/

/**
 * Carga un proyecto desde objeto JSON
 */
private cargarProyectoDesdeJSON(proyecto: ProyectoExport): void {
  try {
    // 1. Limpiar el editor actual
    this.timelineEvents = [];
    this.limpiarEditorCompletamente();

    // 2. Cargar configuración
    this.backgroundColor = proyecto.configuracion.backgroundColor;
    this.minYear = proyecto.configuracion.minYear;
    this.maxYear = proyecto.configuracion.maxYear;
    this.updateBackgroundColor(this.backgroundColor);

    // 3. Cargar eventos
    this.timelineEvents = proyecto.eventos;
    
    // 4. Cargar elementos Konva
    proyecto.elementosKonva.forEach(elemento => {
      this.crearElementoDesdeSerializacion(elemento);
    });

    // 5. Renderizar
    this.renderTimelineEvents();
    
    this.mostrarMensaje('Proyecto importado correctamente');
    
  } catch (error) {
    console.error('❌ Error cargando proyecto desde JSON:', error);
    this.mostrarMensaje('Error al cargar el proyecto', 'error');
  }
}

/**
 * Limpia el editor completamente
 */
private limpiarEditorCompletamente(): void {
  this.mainLayer.destroyChildren();
  this.backgroundLayer.destroyChildren();
  this.drawTimelineBase();
  this.updateBackgroundColor(this.backgroundColor);
}

}