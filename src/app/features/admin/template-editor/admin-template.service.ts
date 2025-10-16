import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { 
  AdminTemplate, 
  AdminTemplateRequest, 
  AdminTemplateResponse 
} from './admin-template.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminTemplateService {
  private apiUrl = 'http://localhost:8080/api/admin/templates';

  constructor(private http: HttpClient) {}

  /**
   * Crear nueva plantilla de admin
   */
  createTemplate(template: AdminTemplate): Observable<AdminTemplateResponse> {
    const request: AdminTemplateRequest = {
      nombre: template.nombre,
      descripcion: template.descripcion,
      categoria: template.categoria,
      esPublica: template.esPublica,
      configuracionVisual: JSON.stringify(template.configuracionVisual),
      thumbnail: template.metadatos.thumbnail
    };

    return this.http.post<AdminTemplateResponse>(`${this.apiUrl}`, request);
  }

  /**
   * Actualizar plantilla existente
   */
  updateTemplate(id: number, template: AdminTemplate): Observable<AdminTemplateResponse> {
    const request: AdminTemplateRequest = {
      nombre: template.nombre,
      descripcion: template.descripcion,
      categoria: template.categoria,
      esPublica: template.esPublica,
      configuracionVisual: JSON.stringify(template.configuracionVisual),
      thumbnail: template.metadatos.thumbnail
    };

    return this.http.put<AdminTemplateResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Obtener todas las plantillas (admin)
   */
  getAllTemplates(): Observable<AdminTemplate[]> {
    return this.http.get<AdminTemplateResponse[]>(`${this.apiUrl}`).pipe(
      map(responses => responses.map(r => this.parseTemplate(r)))
    );
  }

  /**
   * Obtener plantillas públicas (para usuarios)
   */
  getPublicTemplates(): Observable<AdminTemplate[]> {
    return this.http.get<AdminTemplateResponse[]>(`${this.apiUrl}/public`).pipe(
      map(responses => responses.map(r => this.parseTemplate(r)))
    );
  }

  /**
   * Obtener plantilla por ID
   */
  getTemplateById(id: number): Observable<AdminTemplate> {
    return this.http.get<AdminTemplateResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.parseTemplate(response))
    );
  }

  /**
   * Eliminar plantilla
   */
  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Parsear respuesta del servidor a modelo de aplicación
   */
  private parseTemplate(response: AdminTemplateResponse): AdminTemplate {
    return {
      id: response.id,
      nombre: response.nombre,
      descripcion: response.descripcion,
      categoria: response.categoria as any,
      esPublica: response.esPublica,
      configuracionVisual: JSON.parse(response.configuracionVisual),
      metadatos: {
        fechaCreacion: new Date(response.metadatos.fechaCreacion),
        fechaModificacion: new Date(response.metadatos.fechaModificacion),
        creadoPor: response.metadatos.creadoPor,
        version: response.metadatos.version,
        vecesUsada: response.metadatos.vecesUsada,
        thumbnail: response.thumbnail
      }
    };
  }

  /**
   * Serializar configuración visual para guardar
   */
  serializeConfig(config: any): string {
    return JSON.stringify(config);
  }

  /**
   * Parsear configuración visual desde JSON
   */
  parseConfig(configJson: string): any {
    try {
      return JSON.parse(configJson);
    } catch (error) {
      console.error('Error parseando configuración:', error);
      return null;
    }
  }

  /**
   * Generar thumbnail de la plantilla (desde canvas)
   */
  async generateThumbnail(stage: any): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const dataURL = stage.toDataURL({
            pixelRatio: 0.5, // Reducir calidad para thumbnail
            quality: 0.7,
            mimeType: 'image/jpeg'
          });
          resolve(dataURL);
        } catch (error) {
          console.error('Error generando thumbnail:', error);
          resolve('');
        }
      }, 100);
    });
  }
}