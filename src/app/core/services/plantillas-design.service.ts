import { Injectable } from '@angular/core';
import { PlantillaDesign, ElementoPlantilla, EventoGlobal } from '../models/plantilla-design.interface';

@Injectable({
  providedIn: 'root'
})
export class PlantillaDesignService {
  private plantillas: PlantillaDesign[] = [
    this.crearPlantillaHistorica(),
    this.crearPlantillaProyecto(),
    this.crearPlantillaBiografia()
  ];

  constructor() {
    this.cargarDesdeLocalStorage();
  }

  obtenerPlantillas(): PlantillaDesign[] {
    return this.plantillas;
  }

  obtenerPlantillaPorId(id: string): PlantillaDesign | undefined {
    return this.plantillas.find(p => p.id === id);
  }

  guardarPlantilla(plantilla: PlantillaDesign): void {
    if (!plantilla.id) {
      plantilla.id = this.generarId();
      plantilla.fechaCreacion = new Date();
      this.plantillas.push(plantilla);
    } else {
      const index = this.plantillas.findIndex(p => p.id === plantilla.id);
      if (index !== -1) {
        this.plantillas[index] = plantilla;
      }
    }
    this.guardarEnLocalStorage();
  }

  eliminarPlantilla(id: string): void {
    this.plantillas = this.plantillas.filter(p => p.id !== id);
    this.guardarEnLocalStorage();
  }

  private generarId(): string {
    return 'plantilla_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private guardarEnLocalStorage(): void {
    localStorage.setItem('plantillas-design', JSON.stringify(this.plantillas));
  }

  private cargarDesdeLocalStorage(): void {
    const guardadas = localStorage.getItem('plantillas-design');
    if (guardadas) {
      this.plantillas = JSON.parse(guardadas);
    }
  }

  private getEstilosGlobalesPorDefecto() {
    return {
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
    };
  }

  // Plantillas predefinidas actualizadas con eventos globales
  private crearPlantillaHistorica(): PlantillaDesign {
    const eventoId1 = 'evento-historica-1';
    const eventoId2 = 'evento-historica-2';
    
    return {
      id: 'historica_clasica',
      nombre: 'Línea Histórica Clásica',
      descripcion: 'Diseño tradicional para eventos históricos',
      categoria: 'historica',
      esPublica: true,
      configuracion: {
        tipoLinea: 'recta',
        orientacionEventos: 'alternada',
        espaciado: 150,
        mostrarLineaTiempo: true,
        animaciones: true
      },
      eventosGlobales: [
        {
          id: eventoId1,
          numero: 1,
         // nombre: 'Evento 1',
          contenedores: ['contenedor_1']
        },
        {
          id: eventoId2,
          numero: 2,
          //nombre: 'Evento 2',
          contenedores: ['contenedor_2']
        }
      ],
      elementos: [
        {
          id: 'contenedor_1',
          tipo: 'contenedor',
          posicion: { x: 100, y: 250, ancho: 200, alto: 120, tipoPosicion: 'absoluta' },
          estilos: {
            backgroundColor: '#ffffff',
            borderRadius: 10,
            border: '#3498db',
            shadow: '0 4px 8px rgba(0,0,0,0.1)'
          },
          esContenedor: true,
          eventoAsignadoId: eventoId1,
          configuracionContenedor: {
            maxElementos: 4,
            forma: 'rectangulo',
            alineacion: 'centro'
          },
          elementosInternos: [
            {
              id: 'año_1',
              tipo: 'año',
              posicion: { x: 10, y: 10, ancho: 180, alto: 25, tipoPosicion: 'relativa' },
              estilos: {
                color: '#e74c3c',
                fontSize: 14,
                fontFamily: 'Arial',
                fontWeight: 'bold'
              },
              contenido: '1492'
            },
            {
              id: 'titulo_1',
              tipo: 'titulo',
              posicion: { x: 10, y: 40, ancho: 180, alto: 25, tipoPosicion: 'relativa' },
              estilos: {
                color: '#2c3e50',
                fontSize: 16,
                fontFamily: 'Arial',
                fontWeight: 'bold'
              },
              contenido: 'Descubrimiento de América'
            }
          ]
        },
        {
          id: 'contenedor_2',
          tipo: 'contenedor',
          posicion: { x: 350, y: 250, ancho: 200, alto: 120, tipoPosicion: 'absoluta' },
          estilos: {
            backgroundColor: '#ffffff',
            borderRadius: 10,
            border: '#3498db',
            shadow: '0 4px 8px rgba(0,0,0,0.1)'
          },
          esContenedor: true,
          eventoAsignadoId: eventoId2,
          configuracionContenedor: {
            maxElementos: 4,
            forma: 'rectangulo',
            alineacion: 'centro'
          },
          elementosInternos: [
            {
              id: 'año_2',
              tipo: 'año',
              posicion: { x: 10, y: 10, ancho: 180, alto: 25, tipoPosicion: 'relativa' },
              estilos: {
                color: '#e74c3c',
                fontSize: 14,
                fontFamily: 'Arial',
                fontWeight: 'bold'
              },
              contenido: '1789'
            },
            {
              id: 'titulo_2',
              tipo: 'titulo',
              posicion: { x: 10, y: 40, ancho: 180, alto: 25, tipoPosicion: 'relativa' },
              estilos: {
                color: '#2c3e50',
                fontSize: 16,
                fontFamily: 'Arial',
                fontWeight: 'bold'
              },
              contenido: 'Revolución Francesa'
            }
          ]
        }
      ],
      estilosGlobales: this.getEstilosGlobalesPorDefecto()
    };
  }

  private crearPlantillaProyecto(): PlantillaDesign {
    const eventoId1 = 'evento-proyecto-1';
    
    return {
      id: 'proyecto_moderna',
      nombre: 'Línea de Proyecto Moderna',
      descripcion: 'Diseño contemporáneo para fases de proyecto',
      categoria: 'proyecto',
      esPublica: true,
      configuracion: {
        tipoLinea: 'escalonada',
        orientacionEventos: 'unilateral',
        espaciado: 120,
        mostrarLineaTiempo: true,
        animaciones: true
      },
      eventosGlobales: [
        {
          id: eventoId1,
          numero: 1,
          //nombre: 'Fase 1',
          contenedores: ['contenedor_proyecto_1']
        }
      ],
      elementos: [
        {
          id: 'contenedor_proyecto_1',
          tipo: 'contenedor',
          posicion: { x: 200, y: 250, ancho: 180, alto: 100, tipoPosicion: 'absoluta' },
          estilos: {
            backgroundColor: '#ffffff',
            borderRadius: 8,
            border: '#27ae60',
            shadow: '0 2px 6px rgba(0,0,0,0.1)'
          },
          esContenedor: true,
          eventoAsignadoId: eventoId1,
          configuracionContenedor: {
            maxElementos: 4,
            forma: 'rectangulo',
            alineacion: 'centro'
          },
          elementosInternos: [
            {
              id: 'fase_1',
              tipo: 'titulo',
              posicion: { x: 10, y: 15, ancho: 160, alto: 25, tipoPosicion: 'relativa' },
              estilos: {
                color: '#27ae60',
                fontSize: 14,
                fontFamily: 'Arial',
                fontWeight: 'bold',
                textAlign: 'center'
              },
              contenido: 'Planificación'
            }
          ]
        }
      ],
      estilosGlobales: {
        colores: {
          primario: '#27ae60',
          secundario: '#2ecc71',
          fondo: '#f8f9fa',
          texto: '#2c3e50',
          acento: '#e67e22'
        },
        tipografia: {
          familia: 'Arial, sans-serif',
          tamañoBase: 14
        },
        espaciado: {
          entreEventos: 120,
          margen: 40
        }
      }
    };
  }

  private crearPlantillaBiografia(): PlantillaDesign {
    const eventoId1 = 'evento-bio-1';
    
    return {
      id: 'biografia_elegante',
      nombre: 'Línea Biográfica Elegante',
      descripcion: 'Diseño sofisticado para biografías',
      categoria: 'biografia',
      esPublica: true,
      configuracion: {
        tipoLinea: 'curva',
        orientacionEventos: 'central',
        espaciado: 180,
        mostrarLineaTiempo: false,
        animaciones: true
      },
      eventosGlobales: [
        {
          id: eventoId1,
          numero: 1,
         // nombre: 'Nacimiento',
          contenedores: ['contenedor_bio_1']
        }
      ],
      elementos: [
        {
          id: 'contenedor_bio_1',
          tipo: 'contenedor',
          posicion: { x: 200, y: 230, ancho: 220, alto: 140, tipoPosicion: 'absoluta' },
          estilos: {
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '#9b59b6',
            shadow: '0 4px 12px rgba(0,0,0,0.15)'
          },
          esContenedor: true,
          eventoAsignadoId: eventoId1,
          configuracionContenedor: {
            maxElementos: 4,
            forma: 'rectangulo',
            alineacion: 'centro'
          },
          elementosInternos: [
            {
              id: 'nombre_1',
              tipo: 'titulo',
              posicion: { x: 10, y: 15, ancho: 200, alto: 25, tipoPosicion: 'relativa' },
              estilos: {
                color: '#2c3e50',
                fontSize: 16,
                fontFamily: 'Georgia, serif',
                fontWeight: 'bold'
              },
              contenido: 'Nombre de la persona'
            }
          ]
        }
      ],
      estilosGlobales: {
        colores: {
          primario: '#9b59b6',
          secundario: '#8e44ad',
          fondo: '#fafafa',
          texto: '#2c3e50',
          acento: '#e74c3c'
        },
        tipografia: {
          familia: 'Georgia, serif',
          tamañoBase: 14
        },
        espaciado: {
          entreEventos: 180,
          margen: 60
        }
      }
    };
  }

  crearPlantillaVacia(): PlantillaDesign {
    return {
      id: this.generarId(),
      nombre: 'Nueva Plantilla',
      descripcion: 'Descripción de la plantilla',
      categoria: 'personalizado',
      esPublica: false,
      configuracion: {
        tipoLinea: 'recta',
        orientacionEventos: 'alternada',
        espaciado: 150,
        mostrarLineaTiempo: true,
        animaciones: true
      },
      elementos: [],
      eventosGlobales: [], // Inicializar vacío
      estilosGlobales: this.getEstilosGlobalesPorDefecto(),
      fechaCreacion: new Date()
    };
  }
}