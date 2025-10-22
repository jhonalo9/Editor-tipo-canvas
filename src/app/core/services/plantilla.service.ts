import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

// ✅ CORREGIDO: Interfaces que coinciden con la respuesta del backend
export interface Plantilla {
  id: number; // ← Cambiado de idPlantilla a id
  nombre: string;
  descripcion: string;
  data: any; // Puede ser string JSON u objeto
  favorito:boolean;
  estado: string;
  esPublica: boolean;
  creadoPorId: number;
  creadoPorNombre: string;
  fechaCreacion: string;
  portadaUrl?: string;
}

export interface PlantillaRequest {
  nombre: string;
  descripcion: string;
  data: any;
  portadaUrl?: string;
  esPublica?: boolean;
}


export interface PlantillaEstadisticaDTO {
  id: number;
  nombre: string;
  descripcion: string;
  data: any;
  esPublica: boolean;
  creadoPorNombre: string;
  fechaCreacion: string;
  portadaUrl?: string;
  
  // Estadísticas
  totalFavoritos: number;
  totalUsos: number;
  vecesUtilizada: number;
  promedioCalificacion?: number;
  // Puedes agregar más campos según lo que retorne tu backend
}

@Injectable({
  providedIn: 'root'
})
export class PlantillaService {
  private apiUrl = `${environment.apiUrl}/plantillas`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }


  // ✅ MÉTODO NUEVO: Obtener plantillas populares
  getPlantillasPopulares(): Observable<PlantillaEstadisticaDTO[]> {
    return this.http.get<PlantillaEstadisticaDTO[]>(`${this.apiUrl}/populares`);
  }

  // ✅ MÉTODO NUEVO: Obtener plantillas populares con autenticación (si es necesario)
  getPlantillasPopularesAdmin(): Observable<PlantillaEstadisticaDTO[]> {
    return this.http.get<PlantillaEstadisticaDTO[]>(`${this.apiUrl}/populares`, { 
      headers: this.getAuthHeaders() 
    });
  }
  getPlantillasPublicas(): Observable<Plantilla[]> {
    return this.http.get<Plantilla[]>(`${this.apiUrl}/publicas`);
  }

  getPlantillasAdmin(): Observable<Plantilla[]> {
    return this.http.get<Plantilla[]>(`${this.apiUrl}/admin`, { 
      headers: this.getAuthHeaders() 
    });
  }

  getPlantillaById(id: number): Observable<Plantilla> {
    return this.http.get<Plantilla>(`${this.apiUrl}/${id}`);
  }

  createPlantilla(plantilla: PlantillaRequest): Observable<Plantilla> {
    return this.http.post<Plantilla>(`${this.apiUrl}/admin`, plantilla, { 
      headers: this.getAuthHeaders() 
    });
  }

  updatePlantilla(id: number, plantilla: PlantillaRequest): Observable<Plantilla> {
    return this.http.put<Plantilla>(`${this.apiUrl}/admin/${id}`, plantilla, { 
      headers: this.getAuthHeaders() 
    });
  }

  deletePlantilla(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // ✅ NUEVO: Método para parsear data si viene como string
  parsePlantillaData(plantilla: Plantilla): any {
    if (typeof plantilla.data === 'string') {
      try {
        return JSON.parse(plantilla.data);
      } catch (error) {
        console.error('Error parseando data de plantilla:', error);
        return {};
      }
    }
    return plantilla.data;
  }
}