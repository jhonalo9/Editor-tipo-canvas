import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PlantillaService, Plantilla } from '../../core/services/plantilla.service'; // ✅ Importar Plantilla
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [
    CommonModule, 
    RouterModule,
    HeaderComponent
  ],
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  plantillas: Plantilla[] = []; // ✅ Usar la interfaz Plantilla
  isLoading = true;

  constructor(
    private authService: AuthService,
    private plantillaService: PlantillaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;

      if (this.isLoggedIn && this.authService.getUserRole() === 'ADMIN') { // ✅ Cambiado a 'ADMIN'
        this.cargarPlantillasAdmin();
      } else {
        this.cargarPlantillasPublicas();
      }
    });
  }

  cargarPlantillasAdmin(): void {
    this.plantillaService.getPlantillasAdmin().subscribe({
      next: (plantillas) => {
        // ✅ Opcional: Parsear data si es necesario
        this.plantillas = plantillas.map(plantilla => ({
          ...plantilla,
          data: this.plantillaService.parsePlantillaData(plantilla)
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar plantillas de admin', error);
        this.isLoading = false;
        // Fallback a plantillas públicas si hay error de permisos
        this.cargarPlantillasPublicas();
      }
    });
  }

  cargarPlantillasPublicas(): void {
    this.plantillaService.getPlantillasPublicas().subscribe({
      next: (plantillas) => {
        // ✅ Opcional: Parsear data si es necesario
        this.plantillas = plantillas.map(plantilla => ({
          ...plantilla,
          data: this.plantillaService.parsePlantillaData(plantilla)
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar plantillas', error);
        this.isLoading = false;
        this.plantillas = []; // Asegurar que sea array vacío
      }
    });
  }

  crearProyecto(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/usuario/descripcion-proyect']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  usarPlantilla(plantilla: Plantilla): void { // ✅ Tipo específico
    if (this.isLoggedIn) {
      this.router.navigate(['/usuario/descripcion-proyect'], { 
        state: { plantilla: plantilla } 
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  // ✅ NUEVO: Método para obtener el tema de la plantilla (para estilos CSS)
  getPlantillaTheme(plantilla: Plantilla): string {
    const data = this.plantillaService.parsePlantillaData(plantilla);
    return data?.theme || 'default';
  }

  // ✅ NUEVO: Método para obtener el color de la plantilla
  getPlantillaColor(plantilla: Plantilla): string {
    const data = this.plantillaService.parsePlantillaData(plantilla);
    return data?.color || '#007bff';
  }
}