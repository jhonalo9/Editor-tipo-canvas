import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface PlantillaUsuario {
  idPlantillaUsuario?: number;
  nombre: string;
  descripcion: string;
  data: any;
  usuario: any;
  fechaCreacion?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PlantillaUsuarioService {
  private apiUrl = `${environment.apiUrl}/plantillas-usuario`;

  constructor(private http: HttpClient) { }

  getPlantillasUsuario(): Observable<PlantillaUsuario[]> {
    return this.http.get<PlantillaUsuario[]>(this.apiUrl);
  }

  createPlantillaUsuario(plantilla: PlantillaUsuario): Observable<PlantillaUsuario> {
    return this.http.post<PlantillaUsuario>(this.apiUrl, plantilla);
  }

  deletePlantillaUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}