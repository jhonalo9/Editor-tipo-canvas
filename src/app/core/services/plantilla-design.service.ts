import { Injectable } from '@angular/core';

export interface PlantillaDiseno {
  id?: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  fechaCreacion: Date;
  configuracion: {
    backgroundColor: string;
    elementos: ElementoPlantilla[];
  };
  thumbnail?: string;
}

export interface ElementoPlantilla {
  tipo: 'Rect' | 'Circle' | 'Text' | 'Image' | 'Group' | 'Line';
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
  points?: number[];
  shadow?: {
    color: string;
    blur: number;
    offset: { x: number; y: number };
    opacity: number;
  };
  children?: ElementoPlantilla[];
  relativeX?: number;
  relativeY?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlantillaDesignService {
  private storageKey = 'plantillas_diseno_admin';
  private plantillas: PlantillaDiseno[] = [];

  constructor() {
    this.cargarPlantillasDesdeStorage();
    this.inicializarPlantillasPorDefecto();
  }

  /**
   * Obtiene todas las plantillas disponibles
   */
  obtenerPlantillas(): PlantillaDiseno[] {
    return [...this.plantillas];
  }

  /**
   * Obtiene una plantilla por ID
   */
  obtenerPlantillaPorId(id: string): PlantillaDiseno | undefined {
    return this.plantillas.find(p => p.id === id);
  }

  /**
   * Obtiene plantillas filtradas por categoría
   */
  obtenerPlantillasPorCategoria(categoria: string): PlantillaDiseno[] {
    return this.plantillas.filter(p => p.categoria === categoria);
  }

  /**
   * Guarda una nueva plantilla o actualiza una existente
   */
  guardarPlantilla(plantilla: PlantillaDiseno): void {
    if (!plantilla.id) {
      plantilla.id = this.generarId();
      this.plantillas.push(plantilla);
    } else {
      const index = this.plantillas.findIndex(p => p.id === plantilla.id);
      if (index !== -1) {
        this.plantillas[index] = plantilla;
      }
    }
    
    this.guardarEnStorage();
  }

  /**
   * Elimina una plantilla por ID
   */
  eliminarPlantilla(id: string): void {
    const index = this.plantillas.findIndex(p => p.id === id);
    if (index !== -1) {
      this.plantillas.splice(index, 1);
      this.guardarEnStorage();
    }
  }

  /**
   * Genera un ID único para las plantillas
   */
  private generarId(): string {
    return `plantilla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Guarda las plantillas en localStorage
   */
  private guardarEnStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.plantillas));
    } catch (error) {
      console.error('Error guardando plantillas en localStorage:', error);
    }
  }

  /**
   * Carga las plantillas desde localStorage
   */
  private cargarPlantillasDesdeStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const plantillas = JSON.parse(data);
        this.plantillas = plantillas.map((p: any) => ({
          ...p,
          fechaCreacion: new Date(p.fechaCreacion)
        }));
      }
    } catch (error) {
      console.error('Error cargando plantillas desde localStorage:', error);
      this.plantillas = [];
    }
  }

  /**
   * Inicializa plantillas por defecto si no existen
   */
  private inicializarPlantillasPorDefecto(): void {
    if (this.plantillas.length === 0) {
      this.plantillas = [
        {
          id: this.generarId(),
          nombre: 'Diseño Moderno Azul',
          descripcion: 'Plantilla moderna con tonos azules y elementos geométricos',
          categoria: 'Moderna',
          fechaCreacion: new Date(),
          configuracion: {
            backgroundColor: '#e3f2fd',
            elementos: [
              {
                tipo: 'Rect',
                x: 50,
                y: 50,
                width: 200,
                height: 100,
                fill: '#2196f3',
                stroke: '#1976d2',
                strokeWidth: 2,
                cornerRadius: 10
              },
              {
                tipo: 'Circle',
                x: 400,
                y: 100,
                radius: 50,
                fill: '#64b5f6',
                stroke: '#1976d2',
                strokeWidth: 3
              },
              {
                tipo: 'Text',
                x: 100,
                y: 200,
                text: 'Línea de Tiempo Moderna',
                fontSize: 24,
                fontFamily: 'Arial',
                fill: '#1565c0'
              }
            ]
          }
        },
        {
          id: this.generarId(),
          nombre: 'Estilo Vintage',
          descripcion: 'Diseño retro con colores cálidos y texturas clásicas',
          categoria: 'Histórica',
          fechaCreacion: new Date(),
          configuracion: {
            backgroundColor: '#fff8e1',
            elementos: [
              {
                tipo: 'Rect',
                x: 100,
                y: 80,
                width: 180,
                height: 120,
                fill: '#d7ccc8',
                stroke: '#8d6e63',
                strokeWidth: 3,
                cornerRadius: 5
              },
              {
                tipo: 'Text',
                x: 120,
                y: 220,
                text: 'Historia Clásica',
                fontSize: 20,
                fontFamily: 'Georgia',
                fill: '#5d4037'
              },
              {
                tipo: 'Circle',
                x: 450,
                y: 120,
                radius: 40,
                fill: '#bcaaa4',
                stroke: '#8d6e63',
                strokeWidth: 2
              }
            ]
          }
        },
        {
          id: this.generarId(),
          nombre: 'Minimalista Oscuro',
          descripcion: 'Diseño minimalista con fondo oscuro y acentos claros',
          categoria: 'Minimalista',
          fechaCreacion: new Date(),
          configuracion: {
            backgroundColor: '#263238',
            elementos: [
              {
                tipo: 'Line',
                x: 0,
                y: 0,
                points: [100, 150, 500, 150],
                stroke: '#78909c',
                strokeWidth: 2
              },
              {
                tipo: 'Circle',
                x: 100,
                y: 150,
                radius: 8,
                fill: '#ffffff',
                stroke: '#78909c',
                strokeWidth: 2
              },
              {
                tipo: 'Circle',
                x: 500,
                y: 150,
                radius: 8,
                fill: '#ffffff',
                stroke: '#78909c',
                strokeWidth: 2
              },
              {
                tipo: 'Text',
                x: 250,
                y: 200,
                text: 'Línea de Tiempo',
                fontSize: 18,
                fontFamily: 'Arial',
                fill: '#eceff1'
              }
            ]
          }
        },
        {
          id: this.generarId(),
          nombre: 'Colorido y Alegre',
          descripcion: 'Diseño vibrante con múltiples colores y formas divertidas',
          categoria: 'Decorativa',
          fechaCreacion: new Date(),
          configuracion: {
            backgroundColor: '#fff9c4',
            elementos: [
              {
                tipo: 'Circle',
                x: 100,
                y: 100,
                radius: 40,
                fill: '#ff5252',
                stroke: '#d32f2f',
                strokeWidth: 2
              },
              {
                tipo: 'Circle',
                x: 250,
                y: 100,
                radius: 40,
                fill: '#4caf50',
                stroke: '#388e3c',
                strokeWidth: 2
              },
              {
                tipo: 'Circle',
                x: 400,
                y: 100,
                radius: 40,
                fill: '#2196f3',
                stroke: '#1976d2',
                strokeWidth: 2
              },
              {
                tipo: 'Rect',
                x: 150,
                y: 180,
                width: 200,
                height: 80,
                fill: '#ff9800',
                stroke: '#f57c00',
                strokeWidth: 2,
                cornerRadius: 15
              },
              {
                tipo: 'Text',
                x: 180,
                y: 210,
                text: '¡Eventos Importantes!',
                fontSize: 18,
                fontFamily: 'Arial',
                fill: '#ffffff'
              }
            ]
          }
        },
        {
          id: this.generarId(),
          nombre: 'Profesional Corporativo',
          descripcion: 'Diseño elegante para presentaciones profesionales',
          categoria: 'General',
          fechaCreacion: new Date(),
          configuracion: {
            backgroundColor: '#fafafa',
            elementos: [
              {
                tipo: 'Rect',
                x: 50,
                y: 50,
                width: 500,
                height: 150,
                fill: '#ffffff',
                stroke: '#e0e0e0',
                strokeWidth: 1,
                cornerRadius: 8,
                shadow: {
                  color: 'rgba(0,0,0,0.2)',
                  blur: 10,
                  offset: { x: 0, y: 4 },
                  opacity: 0.3
                }
              },
              {
                tipo: 'Text',
                x: 80,
                y: 90,
                text: 'Timeline Corporativo',
                fontSize: 28,
                fontFamily: 'Arial',
                fill: '#424242'
              },
              {
                tipo: 'Text',
                x: 80,
                y: 130,
                text: 'Profesional y Elegante',
                fontSize: 16,
                fontFamily: 'Arial',
                fill: '#757575'
              }
            ]
          }
        }
      ];
      
      this.guardarEnStorage();
    }
  }

  /**
   * Exporta una plantilla como JSON
   */
  exportarPlantillaJSON(plantilla: PlantillaDiseno): string {
    return JSON.stringify(plantilla, null, 2);
  }

  /**
   * Importa una plantilla desde JSON
   */
  importarPlantillaJSON(jsonString: string): PlantillaDiseno | null {
    try {
      const plantilla: PlantillaDiseno = JSON.parse(jsonString);
      plantilla.id = this.generarId();
      plantilla.fechaCreacion = new Date();
      this.guardarPlantilla(plantilla);
      return plantilla;
    } catch (error) {
      console.error('Error importando plantilla desde JSON:', error);
      return null;
    }
  }
}