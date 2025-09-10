
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Plantilla } from '../models/plantilla';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PlantillaService {
  private apiUrl = 'http://localhost:8080/api/plantillas/admin';

  constructor(private http: HttpClient) {}

  crearPlantilla(plantilla: any): Observable<any> {
    // Aquí pones tu token manualmente
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwiZW1haWwiOiJtYXJ0YUBlbWFpbC5jb20iLCJyb2wiOiJhZG1pbiIsInN1YiI6Im1hcnRhQGVtYWlsLmNvbSIsImlhdCI6MTc1NzQ4MzcwNiwiZXhwIjoxNzU3NTcwMTA2fQ.bE7S0hmQ07E-GMher33zoAzTuwQKsDb-Oo5MmXvJ2mw'; 

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // enviando JWT
    });

    return this.http.post(this.apiUrl, plantilla, { headers });
  }
}