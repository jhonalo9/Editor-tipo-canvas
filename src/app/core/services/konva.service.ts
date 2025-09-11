import { Injectable, ElementRef } from '@angular/core';
import Konva from 'konva';

@Injectable({
  providedIn: 'root'
})
export class KonvaService {
  private layer: any;
  private transformer: any;
  private selectedNode: any = null;
  private timelineGroup: any;
  private timeline: any;
  private timelineEvents: any[] = [];

  constructor() { }

  // Inicializar el stage de Konva - método corregido
  initStage(container: ElementRef): any {
    const htmlElement = container.nativeElement as HTMLElement;
    const width = htmlElement.offsetWidth;
    const height = htmlElement.offsetHeight || 600;

    // Usar Konva.Stage correctamente
    const stage = new Konva.Stage({
      container: htmlElement as HTMLDivElement,
      width: width,
      height: height
    });

    // Crear la capa principal
    this.layer = new Konva.Layer();
    stage.add(this.layer);

    // Inicializar el transformador para manipular objetos
    this.transformer = new Konva.Transformer({
      keepRatio: false,
      rotateEnabled: false,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    });
    this.layer.add(this.transformer);

    // Crear grupo para la línea de tiempo
    this.timelineGroup = new Konva.Group({
      x: 50,
      y: height / 2,
      draggable: false
    });
    this.layer.add(this.timelineGroup);

    // Dibujar la línea de tiempo base
    this.drawTimeline(width - 100);

    // Dibujar la cuadrícula de fondo
    this.drawGrid(stage);

    // Configurar eventos
    this.setupEvents(stage);

    return stage;
  }

  // Método alternativo si necesitas pasar un ID de elemento
  initStageById(containerId: string): any {
    const htmlElement = document.getElementById(containerId);
    if (!htmlElement) {
      throw new Error(`Element with id ${containerId} not found`);
    }

    const width = htmlElement.offsetWidth;
    const height = htmlElement.offsetHeight || 600;

    const stage = new Konva.Stage({
      container: containerId,
      width: width,
      height: height
    });

    // Resto del código de inicialización igual que arriba
    this.layer = new Konva.Layer();
    stage.add(this.layer);

    this.transformer = new Konva.Transformer({
      keepRatio: false,
      rotateEnabled: false,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    });
    this.layer.add(this.transformer);

    this.timelineGroup = new Konva.Group({
      x: 50,
      y: height / 2,
      draggable: false
    });
    this.layer.add(this.timelineGroup);

    this.drawTimeline(width - 100);
    this.drawGrid(stage);
    this.setupEvents(stage);

    return stage;
  }

  // Dibujar la línea de tiempo base
  private drawTimeline(width: number): void {
    // Limpiar eventos existentes
    this.timelineEvents = [];

    // Crear la línea principal
    this.timeline = new Konva.Line({
      points: [0, 0, width, 0],
      stroke: '#4a5568',
      strokeWidth: 3,
      lineCap: 'round',
      lineJoin: 'round'
    });
    this.timelineGroup.add(this.timeline);

    // Añadir marcadores cada 100px
    for (let i = 0; i <= width; i += 100) {
      const marker = new Konva.Line({
        points: [i, -10, i, 10],
        stroke: '#718096',
        strokeWidth: 1
      });
      this.timelineGroup.add(marker);

      // Añadir texto con la posición
      const text = new Konva.Text({
        x: i - 10,
        y: 20,
        text: (i / 100).toString(),
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#718096'
      });
      this.timelineGroup.add(text);
    }

    this.layer.draw();
  }

  // Dibujar cuadrícula de fondo
  private drawGrid(stage: any): void {
    const gridLayer = new Konva.Layer();
    stage.add(gridLayer);

    const width = stage.width();
    const height = stage.height();

    // Líneas verticales
    for (let x = 0; x < width; x += 20) {
      gridLayer.add(new Konva.Line({
        points: [x, 0, x, height],
        stroke: x % 100 === 0 ? '#e2e8f0' : '#f7fafc',
        strokeWidth: 1
      }));
    }

    // Líneas horizontales
    for (let y = 0; y < height; y += 20) {
      gridLayer.add(new Konva.Line({
        points: [0, y, width, y],
        stroke: y % 100 === 0 ? '#e2e8f0' : '#f7fafc',
        strokeWidth: 1
      }));
    }

    gridLayer.moveToBottom();
  }

  // Configurar eventos del stage
  private setupEvents(stage: any): void {
    // Evento de clic para seleccionar objetos
    this.layer.on('click', (e: any) => {
      // Si hacemos clic en un objeto, lo seleccionamos
      if (e.target !== this.layer && e.target !== this.timelineGroup) {
        this.selectNode(e.target);
      } else {
        // Si hacemos clic en un espacio vacío, deseleccionamos
        this.deselectNode();
      }
    });

    // Evento para eliminar objeto seleccionado con tecla DELETE
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Delete' && this.selectedNode) {
        this.removeSelectedNode();
      }
    });

    // Redibujar el stage cuando cambia el tamaño de la ventana
    window.addEventListener('resize', () => {
      const container = stage.container();
      if (container) {
        const width = (container as HTMLElement).offsetWidth;
        const height = (container as HTMLElement).offsetHeight || 600;
        
        stage.width(width);
        stage.height(height);
        stage.draw();
      }
    });
  }

  // Seleccionar un nodo
  selectNode(node: any): void {
    if (this.selectedNode) {
      this.deselectNode();
    }

    this.selectedNode = node;
    this.transformer.nodes([node]);
    this.layer.draw();
  }

  // Deseleccionar nodo
  deselectNode(): void {
    this.selectedNode = null;
    this.transformer.nodes([]);
    this.layer.draw();
  }

  // Eliminar nodo seleccionado
  removeSelectedNode(): void {
    if (this.selectedNode) {
      // Eliminar de la lista de eventos si es un evento de timeline
      const index = this.timelineEvents.indexOf(this.selectedNode);
      if (index > -1) {
        this.timelineEvents.splice(index, 1);
      }
      
      this.selectedNode.destroy();
      this.deselectNode();
    }
  }

  // Crear un evento en la línea de tiempo
  createTimelineEvent(text: string, x: number, y: number): any {
    const eventGroup = new Konva.Group({
      x: x,
      y: y,
      draggable: true,
      name: 'timeline-event'
    });

    // Crear círculo para el evento
    const circle = new Konva.Circle({
      radius: 15,
      fill: '#4299e1',
      stroke: '#2b6cb0',
      strokeWidth: 2
    });

    // Crear texto para el evento
    const eventText = new Konva.Text({
      text: text,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: 'white',
      align: 'center',
      verticalAlign: 'middle',
      offset: {
        x: 0,
        y: -40
      }
    });

    // Añadir elementos al grupo
    eventGroup.add(circle);
    eventGroup.add(eventText);

    // Añadir evento de arrastre para snap a la línea de tiempo
    eventGroup.on('dragmove', () => {
      // Hacer snap a la línea de tiempo en el eje Y
      const timelineY = this.timelineGroup.y() + this.timelineGroup.height() / 2;
      eventGroup.y(timelineY);
    });

    // Añadir a la capa y a la lista de eventos
    this.layer.add(eventGroup);
    this.timelineEvents.push(eventGroup);

    return eventGroup;
  }

  // Crear un hito (milestone)
  createMilestone(text: string, x: number, y: number): any {
    const milestoneGroup = new Konva.Group({
      x: x,
      y: y,
      draggable: true,
      name: 'milestone'
    });

    // Crear triángulo para el hito
    const triangle = new Konva.RegularPolygon({
      sides: 3,
      radius: 20,
      fill: '#e53e3e',
      stroke: '#c53030',
      strokeWidth: 2,
      rotation: 90
    });

    // Crear texto para el hito
    const milestoneText = new Konva.Text({
      text: text,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: 'white',
      align: 'center',
      verticalAlign: 'middle',
      offset: {
        x: 0,
        y: -40
      }
    });

    // Añadir elementos al grupo
    milestoneGroup.add(triangle);
    milestoneGroup.add(milestoneText);

    // Añadir evento de arrastre para snap a la línea de tiempo
    milestoneGroup.on('dragmove', () => {
      // Hacer snap a la línea de tiempo en el eje Y
      const timelineY = this.timelineGroup.y() + this.timelineGroup.height() / 2;
      milestoneGroup.y(timelineY);
    });

    // Añadir a la capa
    this.layer.add(milestoneGroup);
    this.timelineEvents.push(milestoneGroup);

    return milestoneGroup;
  }

  // Añadir texto al canvas
  addText(text: string, x: number, y: number): any {
    const textNode = new Konva.Text({
      x: x,
      y: y,
      text: text,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#2d3748',
      draggable: true
    });

    this.layer.add(textNode);
    return textNode;
  }

  // Añadir imagen desde URL
  addImageFromUrl(url: string, x: number, y: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const imageNode = new Konva.Image({
          x: x,
          y: y,
          image: image,
          width: 100,
          height: 100,
          draggable: true
        });

        this.layer.add(imageNode);
        this.layer.draw();
        resolve(imageNode);
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  // Exportar el stage como imagen
  exportAsImage(stage: any, fileName: string = 'timeline'): void {
    const dataURL = stage.toDataURL({ 
      pixelRatio: 2, // Mayor resolución
      mimeType: 'image/png',
      quality: 1 
    });
    
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Exportar el estado del stage para guardar
  exportStage(stage: any): any {
    const data = stage.toJSON();
    return {
      stage: data,
      events: this.timelineEvents.map(event => ({
        type: event.name(),
        x: event.x(),
        y: event.y(),
        text: event.find('Text')[0]?.text()
      }))
    };
  }

  // Cargar una plantilla en el stage
  loadTemplate(stage: any, template: any): void {
    if (template && template.data) {
      try {
        // Limpiar el stage actual
        this.layer.destroyChildren();
        
        // Recrear el transformador
        this.transformer = new Konva.Transformer({
          keepRatio: false,
          rotateEnabled: false,
          enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
        });
        this.layer.add(this.transformer);
        
        // Recrear la línea de tiempo
        this.timelineGroup = new Konva.Group({
          x: 50,
          y: stage.height() / 2,
          draggable: false
        });
        this.layer.add(this.timelineGroup);
        
        // Dibujar la línea de tiempo
        this.drawTimeline(stage.width() - 100);
        
        // Cargar los objetos desde la plantilla
        if (template.data.objects) {
          const objects = Konva.Node.create(template.data.objects, this.layer);
          this.timelineEvents = objects.filter((node: any) => 
            node.name() === 'timeline-event' || node.name() === 'milestone'
          );
        }
        
        this.layer.draw();
      } catch (error) {
        console.error('Error loading template:', error);
      }
    }
  }

  // Herramientas de dibujo
  addDrawingTools(stage: any): void {
    let isDrawing = false;
    let lastLine: any;
    let currentColor = '#000000';
    let currentBrushSize = 5;

    stage.on('mousedown touchstart', (e: any) => {
      if (e.target !== stage) return;
      
      isDrawing = true;
      const pos = stage.getPointerPosition();
      
      lastLine = new Konva.Line({
        stroke: currentColor,
        strokeWidth: currentBrushSize,
        globalCompositeOperation: 'source-over',
        lineCap: 'round',
        lineJoin: 'round',
        points: [pos.x, pos.y]
      });
      
      this.layer.add(lastLine);
    });

    stage.on('mousemove touchmove', () => {
      if (!isDrawing) return;
      
      const pos = stage.getPointerPosition();
      const newPoints = lastLine.points().concat([pos.x, pos.y]);
      lastLine.points(newPoints);
      this.layer.batchDraw();
    });

    stage.on('mouseup touchend', () => {
      isDrawing = false;
    });

    // Métodos para cambiar configuración de dibujo
    this.setDrawingColor = (color: string) => {
      currentColor = color;
    };

    this.setBrushSize = (size: number) => {
      currentBrushSize = size;
    };
  }

  // Herramienta de texto
  addTextTool(stage: any): void {
    stage.on('dblclick dbltap', (e: any) => {
      if (e.target !== stage) return;
      
      const pos = stage.getPointerPosition();
      const text = this.addText('Doble clic para editar', pos.x, pos.y);
      this.selectNode(text);
      
      // Crear elemento de entrada de texto para edición
      const textPosition = text.absolutePosition();
      const stageBox = stage.container().getBoundingClientRect();
      
      const area = document.createElement('textarea');
      document.body.appendChild(area);
      
      area.value = text.text();
      area.style.position = 'absolute';
      area.style.top = `${textPosition.y + stageBox.top}px`;
      area.style.left = `${textPosition.x + stageBox.left}px`;
      area.style.width = `${text.width()}px`;
      area.style.fontSize = `${text.fontSize()}px`;
      area.style.border = 'none';
      area.style.padding = '0px';
      area.style.margin = '0px';
      area.style.overflow = 'hidden';
      area.style.background = 'none';
      area.style.outline = 'none';
      area.style.resize = 'none';
      area.style.fontFamily = text.fontFamily();
      area.style.transformOrigin = 'left top';
      area.style.textAlign = text.align();
      area.style.color = text.fill();
      
      area.focus();
      
      area.addEventListener('keydown', (e) => {
        if (e.keyCode === 13 && !e.shiftKey) {
          text.text(area.value);
          document.body.removeChild(area);
          this.layer.draw();
        }
        
        if (e.keyCode === 27) {
          document.body.removeChild(area);
          this.layer.draw();
        }
      });
    });
  }

  // Herramientas de formas
  addShapeTools(stage: any): void {
    this.addRectangle = (x: number, y: number) => {
      const rect = new Konva.Rect({
        x: x,
        y: y,
        width: 100,
        height: 60,
        fill: '#ed8936',
        stroke: '#c05621',
        strokeWidth: 2,
        draggable: true
      });
      
      this.layer.add(rect);
      return rect;
    };

    this.addCircle = (x: number, y: number) => {
      const circle = new Konva.Circle({
        x: x,
        y: y,
        radius: 40,
        fill: '#38a169',
        stroke: '#2f855a',
        strokeWidth: 2,
        draggable: true
      });
      
      this.layer.add(circle);
      return circle;
    };
  }

  // Métodos de utilidad para las herramientas
  setDrawingColor: (color: string) => void = () => {};
  setBrushSize: (size: number) => void = () => {};
  addRectangle: (x: number, y: number) => any = () => {};
  addCircle: (x: number, y: number) => any = () => {};
}