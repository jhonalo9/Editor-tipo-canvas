// template.service.ts
import { Injectable } from '@angular/core';



// template.interface.ts
export interface TimelineTemplate {
  id?: string;
  name: string;
  description: string;
  category: string;
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  
  // ESTILOS VISUALES
  styles: TemplateStyles;
  
  // CONFIGURACIÓN DE DISEÑO
  layout: TemplateLayout;
}

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

export interface TemplateLayout {
  timelinePosition: 'top' | 'center' | 'bottom';
  eventOrientation: 'alternate' | 'above' | 'below';
  eventSpacing: number;
  markerStyle: 'dot' | 'line' | 'icon';
  compactMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private readonly STORAGE_KEY = 'timeline-design-templates';

  // Plantillas predefinidas
  private defaultTemplates: TimelineTemplate[] = [
    {
      id: 'classic',
      name: 'Clásico Elegante',
      description: 'Diseño tradicional con colores sobrios y tipografía clásica',
      category: 'Profesional',
      createdBy: 'system',
      createdAt: new Date(),
      isPublic: true,
      styles: {
        backgroundColor: '#ffffff',
        timelineColor: '#2c3e50',
        eventColor: '#3498db',
        textColor: '#2c3e50',
        accentColor: '#e74c3c',
        fontFamily: 'Arial, sans-serif',
        titleFontSize: 14,
        yearFontSize: 12,
        imageStyle: 'circle',
        imageSize: 80,
        imageBorder: true,
        shadows: true,
        animations: true,
        connectorStyle: 'dashed'
      },
      layout: {
        timelinePosition: 'center',
        eventOrientation: 'alternate',
        eventSpacing: 120,
        markerStyle: 'dot',
        compactMode: false
      }
    },
    {
      id: 'modern',
      name: 'Moderno Minimalista',
      description: 'Diseño limpio con colores vibrantes y espacios amplios',
      category: 'Moderno',
      createdBy: 'system',
      createdAt: new Date(),
      isPublic: true,
      styles: {
        backgroundColor: '#f8f9fa',
        timelineColor: '#667eea',
        eventColor: '#764ba2',
        textColor: '#2d3748',
        accentColor: '#f093fb',
        fontFamily: 'Segoe UI, sans-serif',
        titleFontSize: 16,
        yearFontSize: 14,
        imageStyle: 'rounded',
        imageSize: 90,
        imageBorder: false,
        shadows: false,
        animations: true,
        connectorStyle: 'solid'
      },
      layout: {
        timelinePosition: 'top',
        eventOrientation: 'below',
        eventSpacing: 150,
        markerStyle: 'line',
        compactMode: true
      }
    }
  ];

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultTemplates));
    }
  }

  getTemplates(): TimelineTemplate[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getTemplateById(id: string): TimelineTemplate | null {
    const templates = this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  saveTemplate(template: TimelineTemplate): void {
    const templates = this.getTemplates();
    
    if (template.id) {
      // Actualizar existente
      const index = templates.findIndex(t => t.id === template.id);
      if (index > -1) {
        templates[index] = template;
      }
    } else {
      // Crear nuevo
      template.id = this.generateId();
      template.createdAt = new Date();
      templates.push(template);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
  }

  deleteTemplate(id: string): void {
    const templates = this.getTemplates().filter(t => t.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
  }

  applyTemplate(template: TimelineTemplate, editor: any): void {
    // Aplicar estilos al editor
    editor.applyTemplateStyles(template.styles, template.layout);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}