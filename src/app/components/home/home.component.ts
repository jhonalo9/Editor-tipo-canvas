import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PlantillaService } from '../../core/services/plantilla.service';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [
    FormsModule, CommonModule, RouterModule,
    HeaderComponent
],
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  plantillas: any[] = [];
  isLoading = true;


  

  constructor(
    private authService: AuthService,
    private plantillaService: PlantillaService,
    private router: Router
  ) {}

ngOnInit(): void {
  this.authService.currentUser$.subscribe(user => {
    this.isLoggedIn = !!user;

    if (this.isLoggedIn && this.authService.getUserRole() === 'admin') {
      this.cargarPlantillasAdmin();
    } else {
      this.cargarPlantillasPublicas();
    }
  });
}


cargarPlantillasAdmin(): void {
  this.plantillaService.getPlantillasAdmin().subscribe({
    next: (plantillas) => {
      this.plantillas = plantillas;
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error al cargar plantillas de admin', error);
      this.isLoading = false;
    }
  });
}


  cargarPlantillasPublicas(): void {
    this.plantillaService.getPlantillasPublicas().subscribe({
      next: (plantillas) => {
        this.plantillas = plantillas;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar plantillas', error);
        this.isLoading = false;
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

  usarPlantilla(plantilla: any): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/usuario/descripcion-proyect'], { 
        state: { plantilla: plantilla } 
      });
    } else {
      this.router.navigate(['/login']);
    }
  }



}