import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProyectoService } from '../../core/services/proyecto.service';
import { HeaderComponent } from "../header/header.component";


@Component({
  selector: 'app-preview-proyect',
  imports: [FormsModule, HeaderComponent],
  templateUrl: './preview-proyect.component.html',
  styleUrl: './preview-proyect.component.css'
})
export class PreviewProyectComponent {
   titulo: string = '';
  descripcion: string = '';

  constructor(
    private router: Router,
    private proyectoService: ProyectoService
  ) {}

  empezar(): void {
    if (this.titulo) {
      // Guardar los metadatos temporalmente en el servicio
      this.proyectoService.setProyectoTemporal({
        titulo: this.titulo,
        descripcion: this.descripcion
      });
      
      this.router.navigate(['usuario/proyecto']);
    }
  }

}
