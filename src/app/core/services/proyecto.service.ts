import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Proyecto {
  idProyecto?: number;
  titulo: string;
  descripcion: string;
  data: any;
  usuario: any;
  plantillaBase?: any;
  fechaCreacion?: Date;
  fechaModificacion?: Date;
}

export interface ProyectoRequest {
  titulo: string;
  descripcion: string;
  data: any;
  idPlantillaBase?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private apiUrl = `${environment.apiUrl}/proyectos`;

  constructor(private http: HttpClient) { }

  getProyectosByUsuario(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.apiUrl);
  }

  getProyectoById(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.apiUrl}/${id}`);
  }

  createProyecto(proyecto: ProyectoRequest): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.apiUrl, proyecto);
  }

  updateProyecto(id: number, proyecto: ProyectoRequest): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.apiUrl}/${id}`, proyecto);
  }

  deleteProyecto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}