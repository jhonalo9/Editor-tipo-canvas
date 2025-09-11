import { Component, OnInit } from '@angular/core';
import Konva from 'konva';
import { PlantillaService } from '../../../core/services/plantilla.service';

@Component({
  selector: 'app-editor-admin',
  imports: [],
  templateUrl: './editor-admin.component.html',
  styleUrl: './editor-admin.component.scss'
})
export class EditorAdminComponent implements OnInit{

  backgroundColor: string = '#ffffff';


  constructor(private plantillaService: PlantillaService) {}

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private backgroundRect!: Konva.Rect;

  selectedNode: Konva.Node | null = null;

  ngOnInit() {
  this.stage = new Konva.Stage({
    container: 'container',
    width: 900,
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

  // Teclas para eliminar figura seleccionada
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNode) {
      this.selectedNode.destroy();
      this.layer.draw();
      this.selectedNode = null;
    }
  });
}

// Ejemplo: seleccionar un nodo al hacer clic
selectNode(node: Konva.Node) {
  this.selectedNode = node;
}


addRect() {
  const rect = new Konva.Rect({
    x: 50,
    y: 50,
    width: 150,
    height: 80,
    fill: 'lightblue',
    stroke: 'black',
    strokeWidth: 0.1,
    cornerRadius: [5, 5, 5, 5], 
    shadowColor: 'rgba(0,0,0,0.3)', // color de sombra
    shadowBlur: 7,     // desenfoque
    shadowOffset: { x: 5, y: 4 }, // desplazamiento de la sombra
    shadowOpacity: 0.5,  // opacidad de la sombra
  
    draggable: true,
  });
  this.layer.add(rect);

  const tr = new Konva.Transformer({
    nodes: [rect],
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    keepRatio: false,
  });
  this.layer.add(tr);
  tr.visible(false);
  this.layer.draw();

  // Mostrar transformer al seleccionar el rectángulo
  rect.on('click', () => {
    tr.visible(true);
    tr.forceUpdate();
    this.layer.draw();
  });

  // Ocultar transformer al terminar transformación
  rect.on('transformend', () => {
    tr.visible(false);
    this.layer.draw();
  });

  // Cambiar color al hacer doble clic en el rectángulo
  rect.on('dblclick', () => {
    const newColor = prompt('Escribe un color (nombre o hex):');
    if (newColor) {
      rect.fill(newColor);
      this.layer.draw();
    }
  });

  // Agregar texto al rectángulo
  rect.on('dblclick', () => {
    const textContent = prompt('Escribe el texto:');
    if (!textContent) return;

    const text = new Konva.Text({
      x: rect.x() + 10,
      y: rect.y() + 10,
      text: textContent,
      fontSize: 18,
      fontFamily: 'Calibri',
      fill: 'black',
      draggable: true,
    });
    this.layer.add(text);

    const padding = 10;

    const adjustRectSize = () => {
      const textBox = text.getClientRect();
      rect.width(textBox.width + padding * 2);
      rect.height(textBox.height + padding * 2);
      text.position({ x: rect.x() + padding, y: rect.y() + padding });
      this.layer.draw();
    };

    adjustRectSize();

    text.on('dblclick', () => {
      const newText = prompt('Editar texto:', text.text());
      if (newText !== null) {
        text.text(newText);
        adjustRectSize();
      }
    });

    text.on('dragend', adjustRectSize);
    rect.on('transformend', () => {
      tr.visible(false);
      adjustRectSize();
      this.layer.draw();
    });
  });
}





  addCircle() {
  const circle = new Konva.Circle({
    x: 200,
    y: 200,
    radius: 50,
    fill: 'pink',
    stroke: 'black',
    strokeWidth: 2,
    draggable: true,
  });
  this.layer.add(circle);
  this.layer.draw();

  // Doble clic para agregar imagen dentro del círculo
  circle.on('dblclick', () => {
    const imageUrl = prompt('Ingresa la URL de la imagen o ruta dentro de assets:');
    if (!imageUrl) return;

    const imageObj = new Image();
    imageObj.src = imageUrl;

    imageObj.onload = () => {
      const radius = circle.radius();
      const konvaImage = new Konva.Image({
        x: circle.x() - radius,
        y: circle.y() - radius,
        image: imageObj,
        width: radius * 2,
        height: radius * 2,
        draggable: true,
        clipFunc: (ctx: CanvasRenderingContext2D) => {
          ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
        }
      });

      // Opcional: hacer que al mover el círculo, la imagen siga
      circle.on('dragmove', () => {
        konvaImage.position({
          x: circle.x() - radius,
          y: circle.y() - radius
        });
        this.layer.draw();
      });

      this.layer.add(konvaImage);
      this.layer.draw();
    };
  });
}


 addLine() {
  const line = new Konva.Line({
    points: [100, 100, 300, 200],
    stroke: 'green',
    strokeWidth: 5,
    draggable: false,
    hitStrokeWidth: 20,
  });

  this.layer.add(line);

  // Círculos en los extremos
  const startCircle = new Konva.Circle({ x: 100, y: 100, radius: 8, fill: 'red', draggable: true, visible: false });
  const endCircle = new Konva.Circle({ x: 300, y: 200, radius: 8, fill: 'red', draggable: true, visible: false });
  this.layer.add(startCircle, endCircle);

  // Círculo central
  const centerCircle = new Konva.Circle({
    x: (100 + 300) / 2,
    y: (100 + 200) / 2,
    radius: 6,
    fill: 'blue',
    draggable: true,
    visible: false
  });
  this.layer.add(startCircle, endCircle, centerCircle);

  const relatedNodes = [line, startCircle, endCircle, centerCircle];
  // Selección
  line.on('click', () => {
    this.selectedNode = line;
    relatedNodes.forEach(n => n.visible(true));
    this.layer.draw();
  });

  // Ocultar círculos al hacer clic fuera
  this.stage.on('click', (e) => {
    if (e.target !== line && e.target !== startCircle && e.target !== endCircle && e.target !== centerCircle) {
      startCircle.visible(false);
      endCircle.visible(false);
      centerCircle.visible(false);
      this.layer.draw();
      this.selectedNode = null; // deseleccionar
    }
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

  // Escuchar tecla Suprimir / Delete
 window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNode === line) {
      relatedNodes.forEach(n => n.destroy()); // destruye línea + círculos
      this.layer.draw();
      this.selectedNode = null;
    }
  });

  this.layer.draw();
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

  addText() {
  const text = new Konva.Text({
    x: 100,
    y: 400,
    text: 'Texto de prueba',
    fontSize: 24,
    fontFamily: 'Calibri',
    fill: 'black',
    draggable: true,
  });
  this.layer.add(text);
   text.on('click', () => {
    this.selectedNode = text;
  });
  this.layer.draw();

  // Doble clic para editar
  text.on('dblclick', () => {
    const newText = prompt('Editar texto:', text.text());
    if (newText !== null) {
      text.text(newText);
      this.layer.draw();
    }
  });

  // Detectar cuando arrastra el texto
  text.on('dragend', () => {
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
});

}

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
}




addCircleEvents(circle: Konva.Circle) {
  circle.on('dblclick', () => {
    const imageUrl = prompt('Ingresa la URL de la imagen o ruta dentro de assets:');
    if (!imageUrl) return;

    const imageObj = new Image();
    imageObj.src = imageUrl;

    imageObj.onload = () => {
      const radius = circle.radius();
      const konvaImage = new Konva.Image({
        x: circle.x() - radius,
        y: circle.y() - radius,
        image: imageObj,
        width: radius * 2,
        height: radius * 2,
        draggable: true,
        clipFunc: (ctx: CanvasRenderingContext2D) => {
          ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
        }
      });

      // Hacer que la imagen siga al círculo
      circle.on('dragmove', () => {
        konvaImage.position({ x: circle.x() - radius, y: circle.y() - radius });
        this.layer.draw();
      });

      this.layer.add(konvaImage);
      this.layer.draw();
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

  rect.on('click', () => { tr.visible(true); tr.forceUpdate(); this.layer.draw(); });
  rect.on('transformend', () => { tr.visible(false); this.layer.draw(); });
  rect.on('dblclick', () => {
    const newColor = prompt('Escribe un color (nombre o hex):');
    if (newColor) { rect.fill(newColor); this.layer.draw(); }
  });
}


//recupere la plantilla

guardarEnBackend() {
  const data = this.stage.toJSON();
  const plantilla = {
    nombre: 'Plantilla de prueba',
    descripcion: 'Guardando JSON desde Angular',
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


/*
cargarPlantilla(plantilla: Plantilla) {
  const data = JSON.parse(plantilla.data);
  this.loadJSONFromData(data);
}*/


}
