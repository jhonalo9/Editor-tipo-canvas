import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map,shareReplay,switchMap } from 'rxjs';
import { 
  AdminTemplate, 
  AdminTemplateRequest, 
  AdminTemplateResponse, 
  Categoria
} from './admin-template.interface';
import { AuthService } from '../../../core/services/auth.service';
import { TemplateListItem } from '../../../components/admin/gestion-plantillas/template-list.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminTemplateService {
  private apiUrl = 'http://localhost:8080/api/plantillas';
  private categoriasUrl = 'http://localhost:8080/api/categorias';

   private categoriasCache$: Observable<Categoria[]> | null = null;

  constructor(private http: HttpClient,private authService: AuthService) {}

  private getAuthHeaders() {
  const token = this.authService.getToken(); 
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
}

  getCategorias(): Observable<Categoria[]> {
    if (!this.categoriasCache$) {
      this.categoriasCache$ = this.http.get<Categoria[]>(this.categoriasUrl).pipe(
        shareReplay(1) // Cache para múltiples suscripciones
      );
    }
    return this.categoriasCache$;
  }

   getCategoriaById(id: number): Observable<Categoria> {
    return this.getCategorias().pipe(
      map(categorias => categorias.find(c => c.idCategoria === id)!)
    );
  }

  //Obtener categoría por nombre

  getCategoriaByNombre(nombre: string): Observable<Categoria | undefined> {
    return this.getCategorias().pipe(
      map(categorias => categorias.find(c => c.nombre.toLowerCase() === nombre.toLowerCase()))
    );
  }

 /**
   * Obtener todas las plantillas del usuario actual
   */
  getMisPlantillas(): Observable<TemplateListItem[]> {
    return this.http.get<TemplateListItem[]>(`${this.apiUrl}/mis-plantillas`, {
      headers: this.getAuthHeaders()
    });
  }


 createTemplate(template: AdminTemplate): Observable<AdminTemplateResponse> {
  // Primero obtener las categorías, luego preparar el request
  return this.getCategorias().pipe(
    map(categorias => {
      const request: AdminTemplateRequest = this.prepareTemplateRequest(template, categorias);
      return { request, categorias };
    }),
    switchMap(({ request }) => 
      this.http.post<AdminTemplateResponse>(
        `${this.apiUrl}`, 
        request, 
        { headers: this.getAuthHeaders() }
      )
    )
  );
}

  /**
   * Actualizar plantilla existente
   */
   updateTemplate(id: number, template: AdminTemplate): Observable<AdminTemplateResponse> {
  return this.getCategorias().pipe(
    map(categorias => this.prepareTemplateRequest(template, categorias)),
    switchMap(request => 
      this.http.put<AdminTemplateResponse>(
        `${this.apiUrl}/${id}`, 
        request, 
        { headers: this.getAuthHeaders() } // ✅ AÑADIR HEADERS AQUÍ
      )
    )
  );
}

private prepareTemplateRequest(template: AdminTemplate, categorias: Categoria[]): AdminTemplateRequest {
  let categoriaId: number;

  if (typeof template.categoria === 'string') {
    const categoriaEncontrada = categorias.find(c => 
      c.nombre.toLowerCase() === template.categoria.toString().toLowerCase()
    );
    
    if (!categoriaEncontrada) {
      throw new Error(`Categoría "${template.categoria}" no encontrada`);
    }
    
    categoriaId = categoriaEncontrada.idCategoria;
  } else {
    categoriaId = template.categoria.idCategoria;
  }

  // 🔍 DEBUG: Ver qué tiene configuracionVisual antes de serializar
  console.log('🔧 prepareTemplateRequest - ANTES de serializar:');
  console.log('   portadaUrl en configuracionVisual:', template.configuracionVisual.portadaUrl);
  console.log('   configuracionVisual completo:', template.configuracionVisual);
  
  const dataJson = JSON.stringify(template.configuracionVisual);
  
  console.log('📤 JSON serializado (data):', dataJson);
  console.log('📤 ¿Contiene portadaUrl?:', dataJson.includes('portadaUrl'));

  const request = {
    nombre: template.nombre,
    descripcion: template.descripcion,
    data: dataJson,
    esPublica: template.esPublica,
    categoria: {
      idCategoria: categoriaId
    }
  };

  console.log('📮 Request completo que se enviará:', request);

  return request;
}
  
  /**
   * Obtener todas las plantillas (admin)
   */
  

  getPlantillasPublicas(): Observable<TemplateListItem[]> {
    return this.http.get<TemplateListItem[]>(`${this.apiUrl}/publicas`, {
      headers: this.getAuthHeaders()
    });
  }


  getTodasPlantillas(): Observable<TemplateListItem[]> {
    return this.http.get<TemplateListItem[]>(`${this.apiUrl}/admin/todas`, {
      headers: this.getAuthHeaders()
    });
  }


   /**
   * Eliminar plantilla
   */
  eliminarPlantilla(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }



 

  /**
   * Obtener plantillas públicas (para usuarios)
   */
 

  /**
   * Obtener plantilla por ID
   */
  getTemplateById(id: number): Observable<AdminTemplate> {
    return this.http.get<AdminTemplateResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.parseTemplate(response))
    );
  }

  /**
   * Duplicar plantilla
   */
  duplicarPlantilla(id: number): Observable<TemplateListItem> {
    return this.http.post<TemplateListItem>(`${this.apiUrl}/${id}/duplicar`, {}, {
      headers: this.getAuthHeaders()
    });
  }


   /**
   * Cambiar visibilidad de plantilla
   */
  cambiarVisibilidad(id: number, esPublica: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/visibilidad`, { esPublica }, {
      headers: this.getAuthHeaders()
    });
  }


  /**
   * Buscar plantillas
   */
  buscarPlantillas(query: string): Observable<TemplateListItem[]> {
    return this.http.get<TemplateListItem[]>(`${this.apiUrl}/buscar?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Parsear respuesta del servidor a modelo de aplicación
   */
 private parseTemplate(response: AdminTemplateResponse): AdminTemplate {
    return {
      id: response.id,
      nombre: response.nombre,
      descripcion: response.descripcion,
      categoria: response.categoria,
      esPublica: response.esPublica,
      configuracionVisual: this.parseConfig(response.data),
      metadatos: {
        fechaCreacion: new Date(response.fechaCreacion),
        fechaModificacion: new Date(),
        creadoPor: response.creadoPor?.id || 1,
        version: '1.0',
        vecesUsada: 0,
        thumbnail: ''
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