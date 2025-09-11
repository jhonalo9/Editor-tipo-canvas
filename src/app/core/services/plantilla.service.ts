import { Injectable } from '@angular/core';
import { HttpClient, HttpParams,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
export interface Plantilla {
  idPlantilla?: number;
  nombre: string;
  descripcion: string;
  data: any;
  creadoPor?: any;
  esPublica?: boolean;
}



export interface PlantillaRequest {
  nombre: string;
  descripcion: string;
  data: any;
}

export interface Plantilla extends PlantillaRequest {
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlantillaService {
  private apiUrl = `${environment.apiUrl}/plantillas`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
  }



  getPlantillasPublicas(): Observable<Plantilla[]> {
    return this.http.get<Plantilla[]>(`${this.apiUrl}/public`);
  }

  getPlantillasAdmin(): Observable<Plantilla[]> {
    return this.http.get<Plantilla[]>(`${this.apiUrl}/admin`, { headers: this.getAuthHeaders() });
  }

  getPlantillaById(id: number): Observable<Plantilla> {
    return this.http.get<Plantilla>(`${this.apiUrl}/${id}`);
  }

  createPlantilla(plantilla: PlantillaRequest): Observable<Plantilla> {
    return this.http.post<Plantilla>(`${this.apiUrl}/admin`, plantilla, { headers: this.getAuthHeaders() });
  }

  updatePlantilla(id: number, plantilla: PlantillaRequest): Observable<Plantilla> {
    return this.http.put<Plantilla>(`${this.apiUrl}/admin/${id}`, plantilla, { headers: this.getAuthHeaders() });
  }

  deletePlantilla(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/${id}`, { headers: this.getAuthHeaders() });
  }
}