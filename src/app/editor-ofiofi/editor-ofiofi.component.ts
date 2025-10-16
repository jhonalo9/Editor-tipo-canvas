import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Konva from 'konva';
import { PlantillaDesignService } from '../core/services/plantilla-design.service';
import { EventDesign, EventElement } from '../core/models/event-design.interface';
import { EventDesignService } from '../core/services/event-design.service';


@Component({
  selector: 'app-editor-ofiofi',
  imports: [CommonModule, FormsModule],
  templateUrl: './editor-ofiofi.component.html',
  styleUrl: './editor-ofiofi.component.css'
})
export class EditorOFIofiComponent {
 designs: EventDesign[] = [];
  selectedDesign: EventDesign | null = null;
  isEditing = false;
  previewEvent = {
    title: 'Título del Evento de Ejemplo',
    year: 2024,
    description: 'Esta es una descripción de ejemplo para el evento',
    image: 'assets/images/placeholder-event.jpg'
  };

  // Opciones para el formulario
  elementTypes = [
    { value: 'connector', label: 'Conector' },
    { value: 'image-container', label: 'Contenedor de Imagen' },
    { value: 'image', label: 'Imagen' },
    { value: 'title-box', label: 'Caja de Título' },
    { value: 'title-text', label: 'Texto del Título' },
    { value: 'year-text', label: 'Texto del Año' },
    { value: 'description-text', label: 'Texto de Descripción' }
  ];

  connectorStyles = [
    { value: 'solid', label: 'Sólido' },
    { value: 'dashed', label: 'Punteado' },
    { value: 'dotted', label: 'Puntos' }
  ];

  fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' }
  ];

  constructor(private eventDesignService: EventDesignService) {}

  ngOnInit(): void {
    this.loadDesigns();
  }

  loadDesigns(): void {
    this.designs = this.eventDesignService.getEventDesigns();
  }

  createNewDesign(): void {
    this.selectedDesign = {
      id: 'design-' + Date.now(),
      name: 'Nuevo Diseño',
      description: 'Descripción del nuevo diseño',
      category: 'con-imagen',
      elements: [],
      styles: {
        backgroundColor: 'transparent',
        spacing: 120,
        connectorStyle: 'dashed',
        shadowIntensity: 5
      }
    };
    this.isEditing = true;
  }

  editDesign(design: EventDesign): void {
    this.selectedDesign = JSON.parse(JSON.stringify(design)); // Deep copy
    this.isEditing = true;
  }

  saveDesign(): void {
    if (this.selectedDesign) {
      // Validaciones básicas
      if (!this.selectedDesign.name.trim()) {
        alert('El nombre del diseño es requerido');
        return;
      }

      this.eventDesignService.saveEventDesign(this.selectedDesign);
      this.loadDesigns();
      this.cancelEdit();
      alert('Diseño guardado correctamente');
    }
  }

  cancelEdit(): void {
    this.selectedDesign = null;
    this.isEditing = false;
  }

  deleteDesign(design: EventDesign): void {
    if (confirm(`¿Estás seguro de que quieres eliminar el diseño "${design.name}"?`)) {
      this.eventDesignService.deleteEventDesign(design.id);
      this.loadDesigns();
      alert('Diseño eliminado correctamente');
    }
  }

  duplicateDesign(design: EventDesign): void {
    const duplicated: EventDesign = {
      ...JSON.parse(JSON.stringify(design)),
      id: 'design-' + Date.now(),
      name: design.name + ' (Copia)'
    };
    this.eventDesignService.saveEventDesign(duplicated);
    this.loadDesigns();
    alert('Diseño duplicado correctamente');
  }

  // Métodos para gestionar elementos
  addElement(elementType: EventElement['type']): void {
    if (!this.selectedDesign) return;

    const newElement: EventElement = {
      type: elementType,
      position: { x: 0, y: 0 },
      styles: this.getDefaultStyles(elementType)
    };

    // Configurar tamaño por defecto según el tipo
    switch (elementType) {
      case 'connector':
        newElement.position = { x: 0, y: 6 };
        break;
      case 'image-container':
        newElement.size = { type: 'circle', radius: 45 };
        newElement.position = { x: 0, y: -75 };
        break;
      case 'image':
        newElement.size = { type: 'rectangle', width: 90, height: 90 };
        newElement.position = { x: -45, y: -120 };
        break;
      case 'title-box':
        newElement.size = { type: 'rectangle', width: 100, height: 80, cornerRadius: 4 };
        newElement.position = { x: -50, y: 37 };
        break;
      case 'title-text':
        newElement.size = { type: 'rectangle', width: 90, height: 20 };
        newElement.position = { x: -45, y: 75 };
        newElement.content = { field: 'title', maxLength: 80 };
        break;
      case 'year-text':
        newElement.position = { x: -15, y: 50 };
        newElement.content = { field: 'year' };
        break;
      case 'description-text':
        newElement.size = { type: 'rectangle', width: 120, height: 40 };
        newElement.position = { x: -60, y: 120 };
        newElement.content = { field: 'description', maxLength: 200 };
        break;
    }

    this.selectedDesign.elements.push(newElement);
  }

  removeElement(index: number): void {
    if (this.selectedDesign) {
      this.selectedDesign.elements.splice(index, 1);
    }
  }

  moveElementUp(index: number): void {
    if (this.selectedDesign && index > 0) {
      const element = this.selectedDesign.elements[index];
      this.selectedDesign.elements.splice(index, 1);
      this.selectedDesign.elements.splice(index - 1, 0, element);
    }
  }

  moveElementDown(index: number): void {
    if (this.selectedDesign && index < this.selectedDesign.elements.length - 1) {
      const element = this.selectedDesign.elements[index];
      this.selectedDesign.elements.splice(index, 1);
      this.selectedDesign.elements.splice(index + 1, 0, element);
    }
  }




  hasCircleImageContainer(design: EventDesign): boolean {
    return design.elements.some(e => 
      e.type === 'image-container' && 
      e.size?.type === 'circle'
    );
  }

  hasSquareImageContainer(design: EventDesign): boolean {
    return design.elements.some(e => 
      e.type === 'image-container' && 
      e.size?.type === 'square'
    );
  }

  hasRectangleImageContainer(design: EventDesign): boolean {
    return design.elements.some(e => 
      e.type === 'image-container' && 
      e.size?.type === 'rectangle'
    );
  }

  // Método general para contar elementos por tipo
  countElementsByType(design: EventDesign, type: string): number {
    return design.elements.filter(e => e.type === type).length;
  }

  // Métodos para cambiar el tipo de tamaño
  changeSizeType(element: EventElement, newType: 'circle' | 'rectangle' | 'square'): void {
    switch (newType) {
      case 'circle':
        element.size = { type: 'circle', radius: 45 };
        break;
      case 'rectangle':
        element.size = { type: 'rectangle', width: 100, height: 80, cornerRadius: 4 };
        break;
      case 'square':
        element.size = { type: 'square', size: 80, cornerRadius: 10 };
        break;
    }
  }

  private getDefaultStyles(elementType: string): any {
    const defaults: { [key: string]: any } = {
      'connector': { 
        stroke: '#333e32ff', 
        strokeWidth: 1,
        shadow: { color: 'rgba(0,0,0,0.3)', blur: 8, offset: { x: 0, y: 3 }, opacity: 0.5 }
      },
      'image-container': { 
        fill: '#ffffff', 
        stroke: '#000000ff', 
        strokeWidth: 7,
        shadow: { color: 'rgba(0,0,0,0.3)', blur: 8, offset: { x: 0, y: 3 }, opacity: 0.5 }
      },
      'image': { 
        cornerRadius: 45 
      },
      'title-box': { 
        fill: 'white', 
        stroke: '#06060625', 
        strokeWidth: 1,
        cornerRadius: 4,
        shadow: { color: 'rgba(75, 72, 72, 1)', blur: 5, offset: { x: 0, y: 2 }, opacity: 1 }
      },
      'title-text': { 
        fontSize: 12, 
        fontFamily: 'Arial', 
        fill: '#2c3e50', 
        fontStyle: 'bold', 
        textAlign: 'center' 
      },
      'year-text': { 
        fontSize: 14, 
        fontFamily: 'Arial', 
        fill: '#2c3e50', 
        fontStyle: 'bold' 
      },
      'description-text': { 
        fontSize: 11, 
        fontFamily: 'Arial', 
        fill: '#666666', 
        textAlign: 'center' 
      }
    };

    return defaults[elementType] || {};
  }

  // Método para previsualizar cambios
  previewDesign(): void {
    // En una implementación real, aquí renderizarías la previsualización
    console.log('Previsualizando diseño:', this.selectedDesign);
    alert('Previsualización actualizada (en una implementación real se vería el cambio)');
  }

  // Métodos de utilidad para el template
  getElementTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'connector': 'Conector',
      'image-container': 'Contenedor Imagen',
      'image': 'Imagen',
      'title-box': 'Caja Título',
      'title-text': 'Texto Título',
      'year-text': 'Texto Año',
      'description-text': 'Texto Descripción'
    };
    return labels[type] || type;
  }

  getSizeDescription(element: EventElement): string {
    if (!element.size) return 'Sin tamaño definido';
    
    switch (element.size.type) {
      case 'circle':
        return `Círculo (radio: ${element.size.radius}px)`;
      case 'rectangle':
        return `Rectángulo (${element.size.width}x${element.size.height}px)`;
      case 'square':
        return `Cuadrado (${element.size.size}x${element.size.size}px)`;
      default:
        return 'Tipo desconocido';
    }
  }
}
