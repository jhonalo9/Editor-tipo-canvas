import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import Konva from 'konva';
import { PlantillaService } from '../../../core/services/plantilla.service';
import { CommonModule } from '@angular/common';
import { FileService } from '../../../core/services/file.service';
import { lastValueFrom } from 'rxjs';
import { ProyectoRequest } from '../../../core/services/proyecto.service';

interface ImagenUsuario {
  id: string;
  name: string;
  url: string;
  file?: File;
  serverPath?: string;
  pendienteUpload?: boolean;
}

interface ImagenPendiente {
  file: File;
  dataUrl: string;
}



@Component({
  selector: 'app-editor-admin',
  imports: [CommonModule ],
  templateUrl: './editor-admin.component.html',
  styleUrl: './editor-admin.component.css'
})
export class EditorAdminComponent implements OnInit{

  backgroundColor: string = '#ffffff';
  nombrePlantilla: string = '';
  descripcionPlantilla: string = '';
  lineWidth = 5;
  showTemplatesModal = false;

  //Para la subida de imagenes
   //private imagenesPendientes: Map<string, { file: File, dataUrl: string }> = new Map();
  //private usuarioId: number = 1; // Obtener del servicio de auth
  //public proyectoId: number | null = null; // Se asignará desde el componente padre

  userImages: ImagenUsuario[] = [];
  selectedGalleryImage: ImagenUsuario | null = null;

   private imagenesPendientes: Map<string, ImagenPendiente> = new Map();
  private usuarioId: number = 1;
  proyectoId: number | null = null;


  //MODAL PARA LAS PLANTILLAS

  
  


  constructor(private plantillaService: PlantillaService,private ngZone: NgZone, private cd: ChangeDetectorRef,private fileService: FileService) {}

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private backgroundRect!: Konva.Rect;

  selectedNode: Konva.Node | null = null;
  
  selectedType: 'circle'|'image'|'text'|'line' | 'rect' | null = null;
  circleToConvert: Konva.Circle | null = null;
  circleGroupToConvert: Konva.Group | null = null;

  ngOnInit() {
  this.stage = new Konva.Stage({
    container: 'container',
    width: 1000,
    height: 600,
  });

  

  this.layer = new Konva.Layer();
  this.stage.add(this.layer);

  // Fondo
  this.backgroundRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: this.stage.width(),
    height: this.stage.height(),
    fill: this.backgroundColor,
    listening: false, // no bloquea eventos
  });
  this.layer.add(this.backgroundRect);
  this.layer.draw();

  // En ngOnInit, modifica el event listener de teclado:
/*window.addEventListener('keydown', (e) => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNode) {
    // Si es una línea, buscar y eliminar también los círculos de control
    if (this.selectedNode instanceof Konva.Line) {
      this.layer.find('Circle').forEach(circle => {
        if (circle.getAttr('isControlPoint')) {
          circle.destroy();
        }
      });
    }
    
    // Si es texto, ocultar el transformer
    if (this.selectedNode instanceof Konva.Text) {
      const tr = this.layer.findOne('Transformer');
      if (tr) {
        tr.visible(false);
      }
    }
    
    this.selectedNode.destroy();
    this.layer.draw();
    this.selectedNode = null;
    this.selectedType = null;
    this.cd.detectChanges();
  }
});*/

   this.stage.on('click', (e) => {
    this.ngZone.run(() => {
      // Si se hace clic en el stage (fondo) o en el backgroundRect
      if (e.target === this.stage || e.target === this.backgroundRect) {
        this.deselectAll();
      }
    });
  });
}

deselectAll() {
  this.selectedNode = null;
  this.selectedType = null;
  
  // Ocultar todos los transformers
  this.layer.find('Transformer').forEach(tr => {
    (tr as Konva.Transformer).visible(false);
  });
  
  // Ocultar círculos de control de líneas
  this.layer.find('Circle').forEach(circle => {
    if (circle.getAttr('isControlPoint')) {
      circle.visible(false);
    }
  });
  
  this.layer.draw();
  this.cd.detectChanges();
}

// Ejemplo: seleccionar un nodo al hacer clic
selectNode(node: Konva.Node) {
  this.selectedNode = node;
}


rectStrokeWidth = 0.1;
rectFill = '#add8e6'; // lightblue por defecto
rectText = ''; 

addRect() {
  // Grupo que contendrá el rect y su texto
  const group = new Konva.Group({
    x: 50,
    y: 50,
    draggable: true,
  });

  const rect = new Konva.Rect({
    width: 150,
    height: 80,
    fill: this.rectFill,
    stroke: 'black',
    strokeWidth: this.rectStrokeWidth,
    cornerRadius: [5, 5, 5, 5],
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowBlur: 7,
    shadowOffset: { x: 5, y: 4 },
    shadowOpacity: 0.5,
  });

  const text = new Konva.Text({
    x: 10,
    y: 10,
    text: '',
    fontSize: 18,
    fontFamily: 'Calibri',
    fill: 'black',
    name: 'rect-label', // clave para encontrarlo luego
  });

  group.add(rect);
  group.add(text);

  this.layer.add(group);

  const tr = new Konva.Transformer({
    nodes: [group],
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    keepRatio: false,
  });
  this.layer.add(tr);
  tr.visible(false);
  

  // Selección del grupo
group.on('click', (e) => {
    e.cancelBubble = true; // Evitar que el evento llegue al stage
    
    this.ngZone.run(() => {
      this.deselectAll(); // Primero deseleccionar todo
      
      this.selectedNode = group;
      this.selectedType = 'rect';
      
      const rect = group.findOne<Konva.Rect>('Rect');
      const text = group.findOne<Konva.Text>('.rect-label');
      
      if (rect) {
        this.rectStrokeWidth = rect.strokeWidth();
        this.rectFill = rect.fill() as string;
      }
      if (text) {
        this.rectText = text.text();
      }
      
      tr.visible(true);
      this.layer.draw();
      this.cd.detectChanges();
    });
  });

  this.layer.draw();

  // Deseleccionar al hacer clic afuera
  this.stage.on('click', (e) => {
    if (e.target !== rect && e.target !== text) {
      tr.visible(false);
      this.layer.draw();
      this.selectedNode = null;
      this.selectedType = null;
    }
  });
}


//Para que sea mas dinamico el rectangulo

updateRectStrokeWidth(event: Event) {
  const input = event.target as HTMLInputElement;
  this.rectStrokeWidth = parseInt(input.value, 10);

  if (this.selectedNode && this.selectedNode.getClassName() === 'Group') {
    const group = this.selectedNode as Konva.Group;
    const rect = group.findOne<Konva.Rect>('Rect'); // 👈 Buscar el rect dentro del grupo
    
    if (rect) {
      rect.strokeWidth(this.rectStrokeWidth);
      this.layer.draw();
    }
  }
}

updateRectFill(event: Event) {
  const input = event.target as HTMLInputElement;
  this.rectFill = input.value;

  if (this.selectedNode && this.selectedNode.getClassName() === 'Group') {
    const group = this.selectedNode as Konva.Group;
    const rect = group.findOne<Konva.Rect>('Rect'); // 👈 Buscar el rect dentro del grupo
    
    if (rect) {
      rect.fill(this.rectFill);
      this.layer.draw();
    }
  }
}

updateRectText(event: Event) {
  const input = event.target as HTMLInputElement;
  this.rectText = input.value;

  if (this.selectedNode && this.selectedNode.getClassName() === 'Group') {
    const group = this.selectedNode as Konva.Group;
    const textNode = group.findOne<Konva.Text>('.rect-label');
    
    if (textNode) {
      textNode.text(this.rectText);

      const rectNode = group.findOne<Konva.Rect>('Rect');
      if (rectNode) {
        textNode.position({
          x: (rectNode.width() - textNode.width()) / 2,
          y: (rectNode.height() - textNode.height()) / 2,
        });
      }
      this.layer.draw();
    }
  }
}







  addCircle() {
    const circle = new Konva.Circle({
      x: 200,
      y: 200,
      radius: this.circleRadius, // Usar el valor actual
      fill: 'pink',
      stroke: this.circleStrokeColor,
      strokeWidth: this.circleStrokeWidth,
      draggable: true,
    });
    
    this.layer.add(circle);

    const tr = new Konva.Transformer({
      nodes: [circle],
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      keepRatio: true,
    });
    this.layer.add(tr);
    tr.visible(false);

    circle.on('click', (e) => {
      e.cancelBubble = true;
      this.ngZone.run(() => {
        this.deselectAll();
        this.selectedNode = circle;
        this.selectedType = 'circle'; // 👈 Esto activará el panel de círculo
        
        // Actualizar propiedades del panel con los valores del círculo
        this.circleRadius = circle.radius();
        this.circleStrokeWidth = circle.strokeWidth();
        this.circleStrokeColor = circle.stroke() as string;
        
        tr.visible(true);
        this.layer.draw();
        this.cd.detectChanges();
      });
    });

    circle.on('dblclick', () => {
      this.openImageGalleryForCircle(circle);
    });

    circle.setAttr('myTransformer', tr);
    this.layer.draw();
  }

  // Método para convertir círculo existente a círculo con imagen
  openImageGalleryForCircle(circle: Konva.Circle) {
    this.circleToConvert = circle;
    this.openImageGallery();
  }

  // Actualizar el método para manejar la conversión
 addImageCircleToCanvas() {
  if (!this.selectedGalleryImage) return;

  if (this.circleToConvert) {
    // Convertir círculo existente
    this.convertCircleToImageCircle(
      this.circleToConvert, 
      this.selectedGalleryImage.url
    );
    this.circleToConvert = null;
  } else if (this.circleGroupToConvert) {
    // Cambiar imagen de un grupo existente
    this.changeImageInCircleGroup(
      this.circleGroupToConvert,
      this.selectedGalleryImage.url
    );
    this.circleGroupToConvert = null;
  } else {
    // Crear nuevo círculo con imagen
    this.addCircleWithImage(
      this.selectedGalleryImage.url, 
      this.circleRadius, 
      this.circleStrokeWidth, 
      this.circleStrokeColor
    );
  }
  
  this.closeImageGallery();
}


changeImageInCircleGroup(group: Konva.Group, imageUrl: string) {
  const imageObj = new Image();
  imageObj.crossOrigin = 'Anonymous';
  imageObj.src = imageUrl;

  imageObj.onload = () => {
    // Encontrar la imagen existente
    const oldImage = group.findOne<Konva.Image>('Image');
    
    if (oldImage) {
      // 👇 SIMPLEMENTE ACTUALIZAR LA IMAGEN EXISTENTE
      oldImage.image(imageObj);
      this.layer.draw();
    }
  };

  imageObj.onerror = () => {
    alert('Error al cargar la nueva imagen.');
  };
}
  /*convertCircleToImageCircle(circle: Konva.Circle, imageUrl: string) {
    const imageObj = new Image();
    imageObj.crossOrigin = 'Anonymous';
    imageObj.src = imageUrl;

    imageObj.onload = () => {
      const radius = circle.radius();
      const tr = circle.getAttr('myTransformer');

      // Crear nuevo círculo con imagen
      const imageCircle = new Konva.Circle({
        x: circle.x(),
        y: circle.y(),
        radius: radius,
        fillPatternImage: imageObj,
        fillPatternScale: {
          x: (radius * 2) / imageObj.width,
          y: (radius * 2) / imageObj.height
        },
        draggable: true,
        stroke: circle.stroke(),
        strokeWidth: circle.strokeWidth(),
      });

      // Reemplazar el círculo original
      if (tr) {
        tr.nodes([imageCircle]);
      }

      circle.destroy();
      this.layer.add(imageCircle);

      // Configurar eventos
      imageCircle.on('click', (e) => {
        e.cancelBubble = true;
        this.ngZone.run(() => {
          this.deselectAll();
          this.selectedNode = imageCircle;
          if (tr) tr.visible(true);
          this.layer.draw();
          this.cd.detectChanges();
        });
      });

      imageCircle.setAttr('myTransformer', tr);
      this.layer.draw();
    };
  }*/

convertCircleToImageCircle(circle: Konva.Circle, imageUrl: string) {
  const imageObj = new Image();
  imageObj.crossOrigin = 'Anonymous';
  imageObj.src = imageUrl;

  imageObj.onload = () => {
    const radius = circle.radius();
    const x = circle.x();
    const y = circle.y();
    const strokeWidth = circle.strokeWidth();
    const strokeColor = circle.stroke();

    // Obtener el transformer del círculo original
    const tr = circle.getAttr('myTransformer');

    // Crear un grupo para la imagen con clipping
    const group = new Konva.Group({
      x: x,
      y: y,
      draggable: true,
    });

    // Crear la imagen
    const konvaImage = new Konva.Image({
      x: -radius,
      y: -radius,
      image: imageObj,
      width: radius * 2,
      height: radius * 2,
    });

    // Aplicar clipping circular
    group.clipFunc(function(ctx: CanvasRenderingContext2D) {
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
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      fill: 'transparent',
    });

    group.add(circleBorder);

    // Reemplazar el círculo original
    if (tr) {
      tr.nodes([group]);
    }

    circle.destroy();
    this.layer.add(group);

    // Configurar eventos para el nuevo grupo
    group.on('click', (e) => {
      e.cancelBubble = true;
      this.ngZone.run(() => {
        this.deselectAll();
        this.selectedNode = group;
        this.selectedType = 'circle';
        
        // Actualizar propiedades del panel
        this.circleRadius = radius;
        this.circleStrokeWidth = strokeWidth;
        this.circleStrokeColor = strokeColor as string;
        
        if (tr) tr.visible(true);
        this.layer.draw();
        this.cd.detectChanges();
      });
    });

    // Agregar doble clic para cambiar imagen
    group.on('dblclick', () => {
      this.openImageGalleryForCircleGroup(group);
    });

    group.setAttr('myTransformer', tr);
    this.layer.draw();
  };

  imageObj.onerror = () => {
    alert('Error al cargar la imagen. Verifica la URL.');
  };
}

openImageGalleryForCircleGroup(group: Konva.Group) {
  this.circleGroupToConvert = group;
  this.openImageGallery();
}


circleRadius = 50;
  circleStrokeWidth = 2;
  circleStrokeColor = '#000000';
    imageCornerRadius = 10;


 

  // Método para agregar círculo con imagen
  /*addImageCircleToCanvas() {
    if (!this.selectedGalleryImage) return;

    this.addCircleWithImage(
      this.selectedGalleryImage.url, 
      this.circleRadius, 
      this.circleStrokeWidth, 
      this.circleStrokeColor
    );
    this.closeImageGallery();
  }*/

  // Método para agregar imagen simple (sin círculo)
  addSimpleImageToCanvas() {
    if (!this.selectedGalleryImage) return;

    this.addImageToCanvas(this.selectedGalleryImage.url);
    this.closeImageGallery();
  }

  // Método mejorado para crear círculos con imágenes
  // Método que usa canvas temporal para procesar la imagen
addCircleWithImage(imageUrl: string, radius: number, strokeWidth: number, strokeColor: string) {
  const imageObj = new Image();
  imageObj.crossOrigin = 'Anonymous';
  imageObj.src = imageUrl;

  imageObj.onload = () => {
    // Calcular escala para que la imagen cubra todo el círculo
    const scale = Math.max(
      (radius * 2) / imageObj.width,
      (radius * 2) / imageObj.height
    );

    // Crear un grupo para manejar la imagen y el clipping
    const group = new Konva.Group({
      x: 300,
      y: 300,
      draggable: true,
    });

    // Crear la imagen escalada
    const konvaImage = new Konva.Image({
      x: -radius,
      y: -radius,
      image: imageObj,
      width: radius * 2,
      height: radius * 2,
    });

    // Aplicar clipping circular al grupo
    group.clipFunc(function(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
      ctx.closePath();
    });

    group.add(konvaImage);

    // Crear el borde del círculo
    const circleBorder = new Konva.Circle({
      x: 0,
      y: 0,
      radius: radius,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      fill: 'transparent',
    });

    group.add(circleBorder);
    this.layer.add(group);

    // Transformer para redimensionar
    const tr = new Konva.Transformer({
      nodes: [group],
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      keepRatio: true,
      rotateEnabled: true,
    });

    // Actualizar el clipping cuando se redimensiona
    tr.on('transform', () => {
  const currentScale = group.scaleX();
  const currentRadius = this.circleRadius * currentScale;
  
  // Actualizar el círculo
  const circle = group.findOne<Konva.Circle>('Circle');
  if (circle) {
    circle.radius(currentRadius);
  }
  
  // Actualizar la imagen
  const image = group.findOne<Konva.Image>('Image');
  if (image) {
    image.width(currentRadius * 2);
    image.height(currentRadius * 2);
    image.x(-currentRadius);
    image.y(-currentRadius);
  }
  
  // Actualizar el clipping
  group.clipFunc(function(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2, false);
    ctx.closePath();
  });
});

    this.layer.add(tr);
    tr.visible(false);

    // Manejar selección
    group.on('click', (e) => {
      e.cancelBubble = true;
      this.ngZone.run(() => {
        this.deselectAll();
        this.selectedNode = group;
        this.selectedType = 'circle';
        tr.visible(true);
        this.layer.draw();
        this.cd.detectChanges();
      });
    });

    group.on('dblclick', () => {
  this.openImageGalleryForCircleGroup(group);
});

    group.setAttr('myTransformer', tr);
    this.layer.draw();
  };

  imageObj.onerror = () => {
    alert('Error al cargar la imagen en el círculo.');
  };
}




openImageGalleryForSelectedCircle() {
    if (this.selectedNode && this.selectedNode instanceof Konva.Circle) {
      this.circleToConvert = this.selectedNode;
      this.openImageGallery();
    } else if (this.selectedNode && this.selectedNode.getClassName() === 'Group') {
      // Si es un grupo (círculo con imagen), encontrar el círculo dentro
      const group = this.selectedNode as Konva.Group;
      const circle = group.findOne<Konva.Circle>('Circle');
      if (circle) {
        this.circleToConvert = circle;
        this.openImageGallery();
      }
    }
  }

  // Método para actualizar el radio del círculo seleccionado
  updateCircleRadius(event: Event) {
  const input = event.target as HTMLInputElement;
  this.circleRadius = parseInt(input.value, 10);

  if (this.selectedNode) {
    if (this.selectedNode instanceof Konva.Circle) {
      // Círculo simple
      this.selectedNode.radius(this.circleRadius);
      this.layer.draw();
    } else if (this.selectedNode.getClassName() === 'Group') {
      // Grupo (círculo con imagen)
      const group = this.selectedNode as Konva.Group;
      const circle = group.findOne<Konva.Circle>('Circle');
      const image = group.findOne<Konva.Image>('Image');
      
      if (circle) {
        circle.radius(this.circleRadius);
        
        // Actualizar también la imagen y el clipping si existen
        if (image) {
          image.width(this.circleRadius * 2);
          image.height(this.circleRadius * 2);
          image.x(-this.circleRadius);
          image.y(-this.circleRadius);
        }
        
        // 👇 CORRECCIÓN: Usar una variable local en lugar de 'this'
        const currentRadius = this.circleRadius;
        
        // Actualizar el clipping del grupo
        group.clipFunc((ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius, 0, Math.PI * 2, false);
          ctx.closePath();
        });
        
        this.layer.draw();
      }
    }
  }
}


  updateCircleStroke(event: Event) {
  const input = event.target as HTMLInputElement;
  this.circleStrokeWidth = parseInt(input.value, 10);

  if (this.selectedNode) {
    if (this.selectedNode instanceof Konva.Circle) {
      this.selectedNode.strokeWidth(this.circleStrokeWidth);
    } else if (this.selectedNode.getClassName() === 'Group') {
      const group = this.selectedNode as Konva.Group;
      const circle = group.findOne<Konva.Circle>('Circle');
      if (circle) {
        circle.strokeWidth(this.circleStrokeWidth);
      }
    }
    this.layer.draw();
  }
}

  updateCircleStrokeColor(event: Event) {
  const input = event.target as HTMLInputElement;
  this.circleStrokeColor = input.value;

  if (this.selectedNode) {
    if (this.selectedNode instanceof Konva.Circle) {
      this.selectedNode.stroke(this.circleStrokeColor);
    } else if (this.selectedNode.getClassName() === 'Group') {
      const group = this.selectedNode as Konva.Group;
      const circle = group.findOne<Konva.Circle>('Circle');
      if (circle) {
        circle.stroke(this.circleStrokeColor);
      }
    }
    this.layer.draw();
  }
}

  // Método para imágenes simples
  updateImageCornerRadius(event: Event) {
    const input = event.target as HTMLInputElement;
    this.imageCornerRadius = parseInt(input.value, 10);

    if (this.selectedNode && this.selectedNode instanceof Konva.Image) {
      this.selectedNode.cornerRadius(this.imageCornerRadius);
      this.layer.draw();
    }
  }


  addImageToCanvas(imageUrl: string, imageId?: string): void {
    const id = imageId || this.generarImageId();
    
    Konva.Image.fromURL(imageUrl, (imageNode: Konva.Image) => {
      imageNode.setAttrs({
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        draggable: true,
        // @ts-ignore - Guardar referencia a la imagen original
        imageId: id,
        // @ts-ignore
        imageSrc: imageUrl
      });
      console.log('Imagen agregada al canvas con ID:', id);

      this.layer.add(imageNode);
      this.layer.batchDraw();
    });
  }

  // Método para imagen simple (actualizado)
  /*addImageToCanvas(imageUrl: string) {
    const imageObj = new Image();
    imageObj.crossOrigin = 'Anonymous';
    imageObj.src = imageUrl;

    imageObj.onload = () => {
      const konvaImage = new Konva.Image({
        x: 100,
        y: 100,
        image: imageObj,
        width: 200,
        height: 150,
        draggable: true,
        cornerRadius: 10,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowBlur: 7,
        shadowOffset: { x: 5, y: 4 },
        shadowOpacity: 0.5,
      });

      this.layer.add(konvaImage);

      const tr = new Konva.Transformer({
        nodes: [konvaImage],
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        keepRatio: true,
        rotateEnabled: true,
      });
      this.layer.add(tr);
      tr.visible(false);

      konvaImage.on('click', (e) => {
        e.cancelBubble = true;
        this.ngZone.run(() => {
          this.deselectAll();
          this.selectedNode = konvaImage;
          this.selectedType = 'image';
          tr.visible(true);
          this.layer.draw();
          this.cd.detectChanges();
        });
      });

      konvaImage.setAttr('myTransformer', tr);
      this.layer.draw();
    };
  }*/









 addLine() {
  const line = new Konva.Line({
    points: [100, 100, 300, 200],
    stroke: 'green',
    strokeWidth: this.lineWidth,
    draggable: false,
    hitStrokeWidth: 20,
  });

  this.layer.add(line);

  // Círculos en los extremos (marcarlos como puntos de control)
  const startCircle = new Konva.Circle({ 
    x: 100, y: 100, radius: 8, fill: 'red', draggable: true, visible: false,
    isControlPoint: true // 👈 Marcar como punto de control
  });
  const endCircle = new Konva.Circle({ 
    x: 300, y: 200, radius: 8, fill: 'red', draggable: true, visible: false,
    isControlPoint: true // 👈 Marcar como punto de control
  });

  // Círculo central
  const centerCircle = new Konva.Circle({
    x: (100 + 300) / 2,
    y: (100 + 200) / 2,
    radius: 6,
    fill: 'blue',
    draggable: true,
    visible: false,
    isControlPoint: true // 👈 Marcar como punto de control
  });

  this.layer.add(startCircle, endCircle, centerCircle);

  const relatedNodes = [line, startCircle, endCircle, centerCircle];

  // 👇 Selección simplificada
  line.on('click', (e) => {
    e.cancelBubble = true; // Evitar que el evento llegue al stage
    
    this.ngZone.run(() => {
      this.deselectAll(); // Primero deseleccionar todo
      
      this.selectedNode = line;
      this.selectedType = 'line';
      
      relatedNodes.forEach(n => n.visible(true));
      this.layer.draw();
      this.cd.detectChanges();
    });
  });

  // Mover línea con el centro
  centerCircle.on('dragmove', () => {
    const points = line.points();
    const dx = centerCircle.x() - (points[0] + points[2]) / 2;
    const dy = centerCircle.y() - (points[1] + points[3]) / 2;

    line.points([points[0] + dx, points[1] + dy, points[2] + dx, points[3] + dy]);
    startCircle.position({ x: points[0] + dx, y: points[1] + dy });
    endCircle.position({ x: points[2] + dx, y: points[3] + dy });

    this.layer.draw();
  });

  // Mover extremos
  [startCircle, endCircle].forEach((circle, i) => {
    circle.on('dragmove', () => {
      const points = line.points();
      if (i === 0) { points[0] = circle.x(); points[1] = circle.y(); }
      else { points[2] = circle.x(); points[3] = circle.y(); }

      line.points(points);
      centerCircle.position({ x: (points[0] + points[2]) / 2, y: (points[1] + points[3]) / 2 });
      this.layer.draw();
    });
  });

  this.layer.draw();
}

updateLineWidth(event: Event) {
  const input = event.target as HTMLInputElement;
  this.lineWidth = parseInt(input.value, 10);

  if (this.selectedNode && this.selectedNode instanceof Konva.Line) {
    this.selectedNode.strokeWidth(this.lineWidth);
    this.layer.draw();
  }
}




addImageInCircle() {
  const imageObj = new Image();
  imageObj.src = 'assets/images/logo.png';

  imageObj.onload = () => {
    const circleRadius = 50;
    const circleX = 400;
    const circleY = 200;

    const konvaImage = new Konva.Image({
      x: circleX - circleRadius,
      y: circleY - circleRadius,
      image: imageObj,
      width: circleRadius * 2,
      height: circleRadius * 2,
      draggable: true,
      clipFunc: (ctx: CanvasRenderingContext2D) => {
  ctx.arc(circleRadius, circleRadius, circleRadius, 0, Math.PI * 2, false);
}
    });

    this.layer.add(konvaImage);
    
    this.layer.draw();
  };
}








  addCurve() {
    const curve = new Konva.Line({
      points: [100, 300, 200, 250, 300, 350, 400, 300],
      stroke: 'purple',
      strokeWidth: 3,
      tension: 0.5, // 👉 hace la curva
      draggable: true,
    });
    this.layer.add(curve);
    curve.on('click', () => {
    this.selectedNode = curve;
  });
    this.layer.draw();
  }


  deleteSelectedNode() {
  if (!this.selectedNode) return;

  this.ngZone.run(() => {
    // TypeScript sabe que this.selectedNode no es null aquí
    // gracias al if de arriba, pero necesitamos usar ! para confirmarlo
    const nodeToDelete = this.selectedNode!;
    
    // Resetear selecciones
    this.selectedNode = null;
    this.selectedType = null;
    
    // Ocultar transformer
    const transformer = nodeToDelete.getAttr('myTransformer');
    if (transformer) {
      transformer.visible(false);
    }
    
    // Manejar líneas
    if (nodeToDelete instanceof Konva.Line) {
      this.layer.find('Circle').forEach(circle => {
        if (circle.getAttr('isControlPoint') && circle.getAttr('relatedTo') === nodeToDelete.id()) {
          circle.destroy();
        }
      });
    }
    
    // Destruir el nodo
    nodeToDelete.destroy();
    this.layer.draw();
    this.cd.detectChanges();
  });
}



 textContent = 'Texto de prueba';
textFontSize = 24;
textColor = '#000000';
textFontFamily = 'Calibri';



  addText() {
  const text = new Konva.Text({
    x: 100,
    y: 400,
    text: this.textContent,
    fontSize: this.textFontSize,
    fontFamily: this.textFontFamily,
    fill: this.textColor,
    draggable: true,
  });
  
  this.layer.add(text);
  
  // Transformer para el texto
  const tr = new Konva.Transformer({
    nodes: [text],
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    keepRatio: false,
    rotateEnabled: true,
  });
  this.layer.add(tr);
  tr.visible(false);
text.setAttr('myTransformer', tr);
  // 👇 Selección del texto
  text.on('click', (e) => {
    e.cancelBubble = true; // Evitar que el evento llegue al stage
    
    this.ngZone.run(() => {
      this.deselectAll(); // Primero deseleccionar todo
      
      this.selectedNode = text;
      this.selectedType = 'text';
      
      // Actualizar propiedades del panel
      this.textContent = text.text();
      this.textFontSize = text.fontSize();
      this.textColor = text.fill() as string;
      this.textFontFamily = text.fontFamily();
      
      tr.visible(true);
      this.layer.draw();
      this.cd.detectChanges();
    });
  });

  // 👇 Doble clic para editar directamente (opcional)
  text.on('dblclick', (e) => {
    e.cancelBubble = true;
    
    this.ngZone.run(() => {
      // Seleccionar el texto al hacer doble clic también
      this.deselectAll();
      this.selectedNode = text;
      this.selectedType = 'text';
      
      this.textContent = text.text();
      tr.visible(true);
      this.layer.draw();
      this.cd.detectChanges();
    });
  });

  // Detectar cuando arrastra el texto (manteniendo tu lógica original)
  /*text.on('dragend', () => {
    // Encontrar todas las figuras excepto el texto
    const shapes: Konva.Shape[] = this.layer.find((node: Konva.Shape) => 
      node !== text && 
      (node.getClassName() === 'Rect' || node.getClassName() === 'Circle' || node.getClassName() === 'Image')
    ) as Konva.Shape[];

    // Iterar sobre el array usando forEach
    shapes.forEach((shape: Konva.Node) => {
      const shapeBox = shape.getClientRect();
      const textBox = text.getClientRect();

      // Verifica colisión
      if (
        textBox.x + textBox.width > shapeBox.x &&
        textBox.x < shapeBox.x + shapeBox.width &&
        textBox.y + textBox.height > shapeBox.y &&
        textBox.y < shapeBox.y + shapeBox.height
      ) {
        // Centrar texto dentro de la figura
        text.position({
          x: shapeBox.x + (shapeBox.width - textBox.width) / 2,
          y: shapeBox.y + (shapeBox.height - textBox.height) / 2
        });
        this.layer.draw();
      }
    });
  });*/

  this.layer.draw();
}


// Métodos para actualizar las propiedades del texto
updateTextContent(event: Event) {
  const input = event.target as HTMLInputElement;
  this.textContent = input.value;

  if (this.selectedNode && this.selectedNode instanceof Konva.Text) {
    this.selectedNode.text(this.textContent);
    this.layer.draw();
  }
}

updateTextFontSize(event: Event) {
  const input = event.target as HTMLInputElement;
  this.textFontSize = parseInt(input.value, 10);

  if (this.selectedNode && this.selectedNode instanceof Konva.Text) {
    this.selectedNode.fontSize(this.textFontSize);
    this.layer.draw();
  }
}

updateTextColor(event: Event) {
  const input = event.target as HTMLInputElement;
  this.textColor = input.value;

  if (this.selectedNode && this.selectedNode instanceof Konva.Text) {
    this.selectedNode.fill(this.textColor);
    this.layer.draw();
  }
}

updateTextFontFamily(event: Event) {
  const input = event.target as HTMLSelectElement;
  this.textFontFamily = input.value;

  if (this.selectedNode && this.selectedNode instanceof Konva.Text) {
    this.selectedNode.fontFamily(this.textFontFamily);
    this.layer.draw();
  }
}

/*
saveToJSON() {

   this.layer.find('Image').forEach((node) => {
    const img = node as Konva.Image;
    // @ts-ignore
    img.setAttr('imageSrc', img.image()?.src || '');
  });
  const json = this.stage.toJSON();

  // Crear archivo descargable
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'canvas.json';
  a.click();
  URL.revokeObjectURL(url);

  console.log('Canvas guardado en JSON:', json);
}*/

//Para subir imagenes

showImageGallery = false;
//userImages: { name: string; url: string; file?: File }[] = [];
//selectedGalleryImage: { name: string; url: string; file?: File } | null = null;

openImageGallery() {
    this.showImageGallery = true;
    this.loadStoredImages();
  }

  closeImageGallery() {
    this.showImageGallery = false;
    this.selectedGalleryImage = null;
  }

  loadStoredImages() {
    const storedImages = localStorage.getItem('userImages');
    if (storedImages) {
      const parsed = JSON.parse(storedImages);
      this.userImages = parsed;
      
      // Reconstruir mapa de pendientes (solo metadata)
      this.imagenesPendientes.clear();
    }
  }
   private generarImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

   uploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processImageFile(file);
    }
  }

   processImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageId = this.generarImageId();
      const dataUrl = e.target?.result as string;

      // Guardar temporalmente con data URL
      this.imagenesPendientes.set(imageId, { file, dataUrl });

      const imageData: ImagenUsuario = {
        id: imageId,
        name: file.name,
        url: dataUrl,
        file: file,
        pendienteUpload: true
      };

      this.userImages.push(imageData);
      this.saveImagesToStorage();
      this.selectedGalleryImage = imageData;
      
      //this.cdRef.detectChanges();
    };
    reader.readAsDataURL(file);
  }


  takePhoto() {
    // Implementación básica para tomar foto (puedes mejorarla)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Para usar cámara trasera en móviles
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.processImageFile(target.files[0]);
      }
    };
    input.click();
  }

  selectImage(image: ImagenUsuario): void {
    this.selectedGalleryImage = image;
  }


  deleteImage(index: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      this.userImages.splice(index, 1);
      this.saveImagesToStorage();
      
      if (this.selectedGalleryImage === this.userImages[index]) {
        this.selectedGalleryImage = null;
      }
    }
  }

 saveImagesToStorage() {
    const imagesToSave = this.userImages.map(img => ({
      id: img.id,
      name: img.name,
      url: img.url,
      serverPath: img.serverPath,
      pendienteUpload: img.pendienteUpload
    }));
    localStorage.setItem('userImages', JSON.stringify(imagesToSave));
  }

  addSelectedImageToCanvas(): void {
    if (!this.selectedGalleryImage) return;

    this.addImageToCanvas(this.selectedGalleryImage.url, this.selectedGalleryImage.id);
    this.closeImageGallery();
  }



  
  



 private procesarImagenesParaGuardado(): void {
  this.layer.find('Image').forEach((node) => {
    const img = node as Konva.Image;
    const imageId = img.getAttr('imageId');
    const imageSrc = img.getAttr('imageSrc');
    
    console.log('Procesando imagen en canvas:', { imageId, imageSrc });

    // Buscar si esta imagen ya fue subida
    const imagenEnGaleria = this.userImages.find(imgData => imgData.id === imageId);
    
    if (imagenEnGaleria && imagenEnGaleria.serverPath) {
      // Ya está subida, usar ruta del servidor
      img.setAttr('imageServerPath', imagenEnGaleria.serverPath);
      console.log('Usando ruta del servidor:', imagenEnGaleria.serverPath);
    } else if (imagenEnGaleria && imagenEnGaleria.pendienteUpload) {
      console.warn('Imagen pendiente de upload:', imageId);
    }
    
    // Mantener imageSrc como respaldo
    img.setAttr('imageSrc', imageSrc);
  });
}

  private limpiarJsonImagenes(jsonData: string): string {
  try {
    const data = JSON.parse(jsonData);
    
    const limpiarNodo = (node: any) => {
      if (node.attrs) {
        console.log('Limpiando nodo:', node.className, 'attrs:', node.attrs);
        
        // Priorizar imageServerPath (ruta del servidor)
        if (node.attrs.imageServerPath) {
          node.attrs.imageSrc = node.attrs.imageServerPath;
          console.log('Reemplazando imageSrc con imageServerPath:', node.attrs.imageServerPath);
        }
        
        // Limpiar atributos temporales
        delete node.attrs.imageServerPath;
        delete node.attrs.imageId;
        delete node.attrs.myTransformer;
      }
      
      if (node.children) {
        node.children.forEach(limpiarNodo);
      }
    };
    
    limpiarNodo(data);
    return JSON.stringify(data);
    
  } catch (error) {
    console.error('Error limpiando JSON:', error);
    return jsonData; // Retornar original si hay error
  }
}






async saveToPlantilla(): Promise<string> {
  try {
    console.log('Iniciando saveToPlantilla...');
    
    // 1. Primero subir todas las imágenes pendientes
    if (this.imagenesPendientes.size > 0) {
      console.log('Subiendo imágenes pendientes:', this.imagenesPendientes.size);
      await this.subirImagenesPendientes();
    } else {
      console.log('No hay imágenes pendientes para subir');
    }

    // 2. Luego procesar el canvas para guardar rutas
    this.procesarImagenesParaGuardado();

    // 3. Finalmente exportar el JSON limpio
    const jsonData = this.stage.toJSON();
    console.log('JSON generado (antes de limpiar):', jsonData.substring(0, 500) + '...');
    
    const jsonLimpio = this.limpiarJsonImagenes(jsonData);
    console.log('JSON limpio generado correctamente');
    
    return jsonLimpio;
    
  } catch (error) {
    console.error('Error en saveToPlantilla:', error);
    throw error;
  }
}

   private async subirImagenesPendientes(): Promise<void> {
    if (!this.proyectoId) {
      throw new Error('No hay proyecto seleccionado para subir imágenes');
    }

    const uploadPromises: Promise<void>[] = [];

    for (const [imageId, imageData] of this.imagenesPendientes.entries()) {
      const uploadPromise = this.subirImagenIndividual(imageId, imageData.file);
      uploadPromises.push(uploadPromise);
    }

    // Esperar a que todas las imágenes se suban
    await Promise.all(uploadPromises);
    
    // Limpiar la lista de pendientes después del upload exitoso
    this.imagenesPendientes.clear();
  }


   private async subirImagenIndividual(imageId: string, file: File): Promise<void> {
  try {
    console.log('Subiendo imagen individual:', imageId, file.name);
    
    const rutaServidor = await lastValueFrom(
      this.fileService.subirRecursoProyecto(file, this.usuarioId, this.proyectoId!)
    );

    console.log('Imagen subida exitosamente. Ruta del servidor:', rutaServidor);

    // Actualizar la imagen en userImages con la ruta del servidor
    const imagenIndex = this.userImages.findIndex(img => img.id === imageId);
    if (imagenIndex !== -1) {
      this.userImages[imagenIndex].url = rutaServidor;
      this.userImages[imagenIndex].pendienteUpload = false;
      this.userImages[imagenIndex].serverPath = rutaServidor;
      
      // Actualizar en localStorage
      this.saveImagesToStorage();
      console.log('Imagen actualizada en userImages:', this.userImages[imagenIndex]);
    }

    // Actualizar todas las instancias de esta imagen en el canvas
    await this.actualizarImagenesEnCanvas(imageId, rutaServidor);
    
  } catch (error) {
    console.error(`Error subiendo imagen ${imageId}:`, error);
    throw new Error(`Error al subir la imagen ${imageId}: ${error}`);
  }
}

   private async actualizarImagenesEnCanvas(imageId: string, serverPath: string): Promise<void> {
  const promises: Promise<void>[] = [];
  
  this.layer.find('Image').forEach((node) => {
    const img = node as Konva.Image;
    const currentNodeImageId = img.getAttr('imageId');
    
    if (currentNodeImageId === imageId) {
      img.setAttr('imageServerPath', serverPath);
      
      // Cargar la nueva imagen y esperar a que termine
      const loadPromise = this.cargarImagenDesdeServidor(img, serverPath);
      promises.push(loadPromise);
    }
  });
  
  // Esperar a que todas las imágenes se actualicen
  await Promise.all(promises);
}

  // ✅ Cargar imagen desde servidor
 private cargarImagenDesdeServidor(img: Konva.Image, serverPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const imageObj = new Image();
    imageObj.crossOrigin = 'Anonymous';
    
    imageObj.onload = () => {
      img.image(imageObj);
      this.layer.batchDraw();
      console.log('Imagen cargada desde servidor:', serverPath);
      resolve();
    };
    
    imageObj.onerror = () => {
      console.error('Error cargando imagen desde servidor:', serverPath);
      reject(new Error(`No se pudo cargar la imagen: ${serverPath}`));
    };
    
    const fullUrl = this.fileService.obtenerUrlImagenCompleta(serverPath);
    console.log('Intentando cargar imagen desde:', fullUrl);
    imageObj.src = fullUrl;
  });
}





addCircleEvents(circle: Konva.Circle) {
  circle.on('dblclick', () => {
    const imageUrl = prompt('Ingresa la URL de la imagen o ruta dentro de assets:');
    if (!imageUrl) return;

    const imageObj = new Image();
    imageObj.crossOrigin = 'Anonymous';
    imageObj.src = imageUrl;

    imageObj.onload = () => {
      const radius = circle.radius();
      
      // Ocultar el círculo original
      circle.hide();
      
      // Crear un grupo para contener la imagen con máscara circular
      const group = new Konva.Group({
        x: circle.x() - radius,
        y: circle.y() - radius,
        draggable: true,
        width: radius * 2,
        height: radius * 2,
      });

      // Crear la imagen
      const konvaImage = new Konva.Image({
        image: imageObj,
        width: radius * 2,
        height: radius * 2,
      });

      // Aplicar función de recorte circular al grupo
      group.clipFunc(function(ctx) {
        ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
      });

      group.add(konvaImage);
      this.layer.add(group);

      // Actualizar la posición cuando se mueva el círculo
      circle.on('dragmove', () => {
        group.position({
          x: circle.x() - radius,
          y: circle.y() - radius
        });
        this.layer.draw();
      });

      this.layer.draw();
    };

    imageObj.onerror = () => {
      alert('Error al cargar la imagen. Verifica la URL.');
    };
  });
}

addTextEvents(text: Konva.Text) {
  // Doble clic para editar texto
  text.on('dblclick', () => {
    const newText = prompt('Editar texto:', text.text());
    if (newText !== null) {
      text.text(newText);
      this.layer.draw();
    }
  });

  // Detectar cuando arrastra el texto para centrarlo en figuras si colisiona
  text.on('dragend', () => {
    const shapes: Konva.Shape[] = this.layer.find((node: Konva.Shape) =>
      node !== text &&
      (node.getClassName() === 'Rect' || node.getClassName() === 'Circle' || node.getClassName() === 'Image')
    ) as Konva.Shape[];

    shapes.forEach((shape: Konva.Node) => {
      const shapeBox = shape.getClientRect();
      const textBox = text.getClientRect();

      if (
        textBox.x + textBox.width > shapeBox.x &&
        textBox.x < shapeBox.x + shapeBox.width &&
        textBox.y + textBox.height > shapeBox.y &&
        textBox.y < shapeBox.y + shapeBox.height
      ) {
        // Centrar texto dentro de la figura
        text.position({
          x: shapeBox.x + (shapeBox.width - textBox.width) / 2,
          y: shapeBox.y + (shapeBox.height - textBox.height) / 2
        });
        this.layer.draw();
      }
    });
  });
}

addLineEvents(line: Konva.Line) {
  // Cambiar grosor con doble clic
  line.on('dblclick', () => {
    const newWidthStr = prompt('Ingresa el grosor de la línea:', line.strokeWidth().toString());
    if (newWidthStr !== null) {
      const newWidth = parseInt(newWidthStr, 10);
      if (!isNaN(newWidth) && newWidth > 0) {
        line.strokeWidth(newWidth);
        this.layer.draw();
      }
    }
  });

  // Puedes agregar más eventos si quieres, como cambiar color al click
  line.on('click', () => {
    const newColor = prompt('Color de la línea (nombre o hex):');
    if (newColor) {
      line.stroke(newColor);
      this.layer.draw();
    }
  });
}

addImageEvents(img: Konva.Image) {
  // Doble clic para reemplazar la imagen
  img.on('dblclick', () => {
    const imageUrl = prompt('Ingresa la URL de la nueva imagen o ruta dentro de assets:');
    if (!imageUrl) return;

    const imageObj = new Image();
    imageObj.src = imageUrl;

    imageObj.onload = () => {
      img.image(imageObj);
      this.layer.draw();
    };
  });

  // Opcional: podrías agregar eventos de arrastre o redimensionamiento si lo deseas
}



loadJSON(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const json = reader.result as string;
      const stageData = JSON.parse(json);

      // Limpiar stage
      this.stage.destroyChildren();

      // Reconstruir capas
      stageData.children.forEach((layerData: any) => {
        if (layerData.className !== 'Layer') return;

        const layer = new Konva.Layer();
        this.stage.add(layer);

        layerData.children.forEach((item: any) => {
          let node: Konva.Node | null = null;

          switch (item.className) {
            case 'Rect':
              const rect = new Konva.Rect(item.attrs);
              layer.add(rect);
              this.addRectEvents(rect); // reaplicar eventos
              break;

            case 'Circle':
              const circle = new Konva.Circle(item.attrs);
              layer.add(circle);
              this.addCircleEvents(circle); // función que reaplica eventos al círculo
              break;

            case 'Text':
              const text = new Konva.Text(item.attrs);
              layer.add(text);
              this.addTextEvents(text); // función que reaplica eventos al texto
              break;

            case 'Line':
              const line = new Konva.Line(item.attrs);
              layer.add(line);
              this.addLineEvents(line); // función que reaplica eventos a la línea
              break;

            case 'Image':
              const imgObj = new Image();
              imgObj.src = item.attrs.imageSrc; // Asegúrate de guardar imageSrc al guardar

              imgObj.onload = () => {
                const img = new Konva.Image({ ...item.attrs, image: imgObj });
                layer.add(img);
                this.addImageEvents(img); // reaplicar eventos a la imagen
                layer.draw();
              };
              break;
          }
        });

        layer.draw();
      });

      console.log('Canvas cargado y editable');
    } catch (err) {
      console.error('Error leyendo JSON:', err);
    }
  };

  reader.readAsText(file);
}


// Ejemplo de función para reaplicar eventos a rectángulos
addRectEvents(rect: Konva.Rect) {
  const tr = new Konva.Transformer({
    nodes: [rect],
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    keepRatio: false,
  });
  
  this.layer.add(tr);
  tr.visible(false);
  
  rect.on('click', (e) => {
    e.cancelBubble = true;
    this.ngZone.run(() => {
      this.deselectAll();
      this.selectedNode = rect;
      this.selectedType = 'rect';
      tr.visible(true);
      this.layer.draw();
      this.cd.detectChanges();
    });
  });
  
  // Guardar referencia al transformer
  rect.setAttr('myTransformer', tr);
}


//recupere la plantilla

guardarEnBackend() {
  const data = this.stage.toJSON();
  const nombre = (document.getElementById('inputNombre') as HTMLInputElement)?.value || 'Sin nombre';
const descripcion = (document.getElementById('inputDescripcion') as HTMLInputElement)?.value || 'Sin descripción';

  const plantilla = {
    nombre: nombre,
    descripcion: descripcion,
    data: data
  };

  this.plantillaService.createPlantilla(plantilla).subscribe({
    next: res => console.log('¡Plantilla guardada!', res),
    error: err => console.error('Error guardando plantilla:', err)
  });
}


//Exportar Imagen

// Función para que el usuario cambie el color de fondo
onColorChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input) return;
  this.setBackgroundColor(input.value);
}

setBackgroundColor(color: string) {
  this.backgroundColor = color;
  this.backgroundRect.fill(color);
  this.layer.draw();
}
exportAsImage() {
  const dataURL = this.stage.toDataURL({ pixelRatio: 2 }); // mejor resolución
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'timeline.png';
  a.click();
}


// En editor-admin.component.ts
loadPlantilla(data: string) {
  try {
    const stageData = JSON.parse(data);
    
    // Limpiar el stage completamente
    this.stage.destroyChildren();
    
    // Recrear la capa
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    
    // Reconstruir el fondo
    this.backgroundRect = new Konva.Rect({
      x: 0, y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      fill: this.backgroundColor,
      listening: false,
    });
    this.layer.add(this.backgroundRect);
    
    // Reconstruir elementos desde los datos
    if (stageData.children && stageData.children.length > 0) {
      const layerData = stageData.children[0]; // Primera capa
      
      if (layerData.children) {
        // Filtrar solo los nodos que podemos manejar
        const nodosManejables = layerData.children.filter((nodeData: any) => 
          ['Rect', 'Circle', 'Text', 'Line', 'Image'].includes(nodeData.className)
        );
        
        console.log(`Cargando ${nodosManejables.length} nodos de ${layerData.children.length} totales`);
        
        nodosManejables.forEach((nodeData: any) => {
          this.createNodeFromData(nodeData);
        });
      }
    }
    
    this.layer.draw();
    console.log('Plantilla cargada correctamente');
    
  } catch (err) {
    console.error('Error cargando plantilla:', err);
  }
}

// En editor-admin.component.ts
createNodeFromData(nodeData: any): Konva.Node | null {
  try {
    // Filtrar nodos que no necesitan ser recreados manualmente
    if (nodeData.className === 'Transformer' || nodeData.className === 'Group') {
      console.log('Ignorando nodo de tipo:', nodeData.className);
      return null;
    }

    let node: Konva.Node | null = null;

    switch (nodeData.className) {
      case 'Rect':
        const rect = new Konva.Rect(nodeData.attrs);
        this.layer.add(rect);
        this.addRectEvents(rect);
        node = rect;
        break;

      case 'Circle':
        const circle = new Konva.Circle(nodeData.attrs);
        this.layer.add(circle);
        this.addCircleEvents(circle);
        node = circle;
        break;

      case 'Text':
        const text = new Konva.Text(nodeData.attrs);
        this.layer.add(text);
        this.addTextEvents(text);
        node = text;
        break;

      case 'Line':
        const line = new Konva.Line(nodeData.attrs);
        this.layer.add(line);
        this.addLineEvents(line);
        node = line;
        break;

      case 'Image':
        node = this.createImageFromData(nodeData);
        break;

      default:
        console.warn('Tipo de nodo no reconocido:', nodeData.className);
        return null;
    }

    return node;
  } catch (error) {
    console.error('Error creando nodo desde datos:', error, nodeData);
    return null;
  }
}


private createImageFromData(nodeData: any): Konva.Node | null {
  const imgObj = new Image();
  const imageSrc = nodeData.attrs.imageSrc || nodeData.attrs.imageServerPath || '';
  
  if (!imageSrc) {
    console.warn('Imagen sin source:', nodeData);
    return null;
  }

  imgObj.crossOrigin = 'Anonymous';
  imgObj.src = imageSrc;
  
  const img = new Konva.Image({ 
    ...nodeData.attrs, 
    image: null // Inicialmente null
  });
  
  this.layer.add(img);
  
  imgObj.onload = () => {
    img.image(imgObj);
    this.addImageEvents(img);
    this.layer.draw();
  };
  
  imgObj.onerror = () => {
    console.error('Error cargando imagen:', imageSrc);
    // Intentar con la ruta completa del servidor
    if (nodeData.attrs.imageServerPath) {
      const fullUrl = this.fileService.obtenerUrlImagenCompleta(nodeData.attrs.imageServerPath);
      imgObj.src = fullUrl;
    }
  };
  
  return img;
}

// En editor-admin.component.ts
limpiarEditor(): void {
  // Limpiar todos los elementos excepto el fondo
  this.layer.destroyChildren();
  
  // Recrear el fondo
  this.backgroundRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: this.stage.width(),
    height: this.stage.height(),
    fill: this.backgroundColor,
    listening: false,
  });
  this.layer.add(this.backgroundRect);
  
  this.layer.draw();
  this.selectedNode = null;
  console.log('Editor limpiado');
}


/*
cargarPlantilla(plantilla: Plantilla) {
  const data = JSON.parse(plantilla.data);
  this.loadJSONFromData(data);
}*/


}
