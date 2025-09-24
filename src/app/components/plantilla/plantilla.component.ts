import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantillaService } from '../../core/services/plantilla.service';
import { Router } from '@angular/router';
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-plantilla',
  imports: [CommonModule, HeaderComponent],
  templateUrl: './plantilla.component.html',
  styleUrl: './plantilla.component.css'
})
export class PlantillaComponent {

   plantillas: any[] = [];
  isLoading = true;

  constructor(
    private plantillaService: PlantillaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPlantillasPublicas();
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

}
