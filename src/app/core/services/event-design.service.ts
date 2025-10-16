// services/event-design.service.ts
import { Injectable } from '@angular/core';
import { EventDesign,EventElement, EventStyles } from '../models/event-design.interface';



@Injectable({
  providedIn: 'root'
})
export class EventDesignService {
  private eventDesigns: EventDesign[] = [
    // Diseño por defecto (con imagen) - círculo
    {
      id: 'default-with-image',
      name: 'Círculo con Imagen',
      description: 'Imagen circular con título debajo',
      category: 'con-imagen',
      elements: [
        {
          type: 'connector',
          position: { x: 0, y: 6 },
          styles: {
            stroke: '#333e32ff',
            strokeWidth: 1,
            shadow: { color: 'rgba(0,0,0,0.3)', blur: 8, offset: { x: 0, y: 3 }, opacity: 0.5 }
          }
        },
        {
          type: 'image-container',
          position: { x: 0, y: -75 },
          size: { type: 'circle', radius: 45 }, // Tipo específico para círculo
          styles: {
            fill: '#ffffff',
            stroke: '#000000ff',
            strokeWidth: 7
          }
        },
        {
          type: 'image',
          position: { x: -45, y: -120 },
          size: { type: 'rectangle', width: 90, height: 90 }, // Tipo específico para rectángulo
          styles: { cornerRadius: 45 }
        },
        {
          type: 'title-box',
          position: { x: -50, y: 37 },
          size: { type: 'rectangle', width: 100, height: 80, cornerRadius: 4 },
          styles: {
            fill: 'white',
            stroke: '#06060625',
            strokeWidth: 1
          }
        },
        {
          type: 'title-text',
          position: { x: -45, y: 75 },
          size: { type: 'rectangle', width: 90, height: 20 },
          styles: {
            fontSize: 12,
            fontFamily: 'Arial',
            fill: '#2c3e50',
            fontStyle: 'bold',
            textAlign: 'center'
          },
          content: { field: 'title', maxLength: 80 }
        },
        {
          type: 'year-text',
          position: { x: -15, y: 50 },
          styles: {
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#2c3e50',
            fontStyle: 'bold'
          },
          content: { field: 'year' }
        }
      ],
      styles: {
        backgroundColor: 'transparent',
        spacing: 120,
        connectorStyle: 'dashed',
        shadowIntensity: 5
      }
    },
    // Diseño cuadrado
    {
      id: 'square-design',
      name: 'Cuadrado con Imagen',
      description: 'Imagen cuadrada con bordes redondeados',
      category: 'con-imagen',
      elements: [
        {
          type: 'connector',
          position: { x: 0, y: 6 },
          styles: {
            stroke: '#333e32ff',
            strokeWidth: 1
          }
        },
        {
          type: 'image-container',
          position: { x: 0, y: -75 },
          size: { type: 'square', size: 80, cornerRadius: 10 }, // Tipo específico para cuadrado
          styles: {
            fill: '#ffffff',
            stroke: '#000000ff',
            strokeWidth: 3
          }
        },
        {
          type: 'image',
          position: { x: -40, y: -115 },
          size: { type: 'square', size: 80, cornerRadius: 10 },
          styles: { cornerRadius: 10 }
        },
        {
          type: 'title-box',
          position: { x: -60, y: 37 },
          size: { type: 'rectangle', width: 120, height: 60, cornerRadius: 8 },
          styles: {
            fill: '#f8f9fa',
            stroke: '#dee2e6',
            strokeWidth: 1
          }
        },
        {
          type: 'title-text',
          position: { x: -55, y: 55 },
          size: { type: 'rectangle', width: 110, height: 20 },
          styles: {
            fontSize: 11,
            fontFamily: 'Arial',
            fill: '#495057',
            textAlign: 'center'
          },
          content: { field: 'title', maxLength: 100 }
        }
      ],
      styles: {
        backgroundColor: 'transparent',
        spacing: 130,
        connectorStyle: 'solid',
        shadowIntensity: 3
      }
    },
    // Diseño sin imagen
    {
      id: 'no-image-design',
      name: 'Evento Simple',
      description: 'Para eventos sin imagen',
      category: 'sin-imagen',
      elements: [
        {
          type: 'connector',
          position: { x: 0, y: 6 },
          styles: {
            stroke: '#2a2a2aff',
            strokeWidth: 1
          }
        },
        {
          type: 'title-box',
          position: { x: -50, y: 37 },
          size: { type: 'rectangle', width: 100, height: 80, cornerRadius: 4 },
          styles: {
            fill: 'white',
            stroke: '#06060625',
            strokeWidth: 1,
            shadow: { color: 'rgba(75, 72, 72, 1)', blur: 5, offset: { x: 0, y: 2 }, opacity: 1 }
          }
        },
        {
          type: 'title-text',
          position: { x: -45, y: 75 },
          size: { type: 'rectangle', width: 90, height: 20 },
          styles: {
            fontSize: 12,
            fontFamily: 'Arial',
            fill: '#363535ff',
            fontStyle: 'bold',
            textAlign: 'center'
          },
          content: { field: 'title', maxLength: 80 }
        },
        {
          type: 'year-text',
          position: { x: -15, y: 50 },
          styles: {
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#2c3e50',
            fontStyle: 'bold'
          },
          content: { field: 'year' }
        }
      ],
      styles: {
        backgroundColor: 'transparent',
        spacing: 100,
        connectorStyle: 'dashed',
        shadowIntensity: 5
      }
    }
  ];

  getEventDesigns(): EventDesign[] {
    return this.eventDesigns;
  }

  getEventDesignById(id: string): EventDesign | undefined {
    return this.eventDesigns.find(design => design.id === id);
  }

  saveEventDesign(design: EventDesign): void {
    const index = this.eventDesigns.findIndex(d => d.id === design.id);
    if (index >= 0) {
      this.eventDesigns[index] = design;
    } else {
      this.eventDesigns.push(design);
    }
    localStorage.setItem('event-designs', JSON.stringify(this.eventDesigns));
  }

  deleteEventDesign(id: string): void {
    this.eventDesigns = this.eventDesigns.filter(design => design.id !== id);
    localStorage.setItem('event-designs', JSON.stringify(this.eventDesigns));
  }
}