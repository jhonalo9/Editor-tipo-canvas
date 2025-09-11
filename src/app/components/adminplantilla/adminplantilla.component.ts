import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PlantillaService, PlantillaRequest, Plantilla } from '../../core/services/plantilla.service';
import { EditorAdminComponent } from '../admin/editor-admin/editor-admin.component';

@Component({
  selector: 'app-admin-plantilla',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,EditorAdminComponent],
  templateUrl: './adminplantilla.component.html',
  styleUrls: ['./adminplantilla.component.css']
})
export class AdminPlantillaComponent implements OnInit {
  plantillaForm: FormGroup;
  mensaje: string = '';
  isLoggedIn = false;

  plantillas: Plantilla[] = [];
  plantillaSeleccionada: Plantilla | null = null;

  constructor(
    private fb: FormBuilder,
    private plantillaService: PlantillaService,
    private authService: AuthService
  ) {
    this.plantillaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
      data: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });

    this.cargarPlantillasPublicas();
  }

  cargarPlantillasPublicas(): void {
    this.plantillaService.getPlantillasPublicas().subscribe({
      next: (res) => {
        console.log('Plantillas recibidas:', res); // 👈 Verifica el campo ID
        this.plantillas = res;
      },
      error: (err) => console.error('Error al cargar plantillas', err)
    });
  }

  crearPlantilla(): void {
  const dataJSON = (document.querySelector('app-editor-plantilla') as any).saveToPlantilla();
  const nuevaPlantilla: PlantillaRequest = {
    nombre: this.plantillaForm.value.nombre ?? '',
    descripcion: this.plantillaForm.value.descripcion ?? '',
    data: dataJSON
  };
  this.plantillaService.createPlantilla(nuevaPlantilla).subscribe({
  next: (res) => {
    console.log('Plantilla creada', res);
    this.mensaje = 'Plantilla creada exitosamente';
    this.plantillaForm.reset();
    this.cargarPlantillasPublicas();
  },
  error: (err) => {
    console.error('Error creando plantilla', err);
    this.mensaje = 'Error al crear la plantilla';
  }
});
}

  seleccionarPlantilla(plantilla: Plantilla): void {
    this.plantillaSeleccionada = plantilla;
    this.plantillaForm.patchValue(plantilla);
  }

  actualizarPlantilla(): void {
    if (!this.plantillaSeleccionada) return;

    const id = (this.plantillaSeleccionada as any).id ?? (this.plantillaSeleccionada as any).idPlantilla;

    if (!id) {
      console.error('ID no encontrado en plantilla seleccionada');
      return;
    }

    const plantillaActualizada: PlantillaRequest = {
      nombre: this.plantillaForm.value.nombre ?? '',
      descripcion: this.plantillaForm.value.descripcion ?? '',
      data: this.plantillaForm.value.data ?? ''
    };

    this.plantillaService.updatePlantilla(id, plantillaActualizada).subscribe({
      next: () => {
        this.mensaje = 'Plantilla actualizada correctamente';
        this.plantillaSeleccionada = null;
        this.plantillaForm.reset();
        this.cargarPlantillasPublicas();
      },
      error: (err) => {
        console.error(err);
        this.mensaje = 'Error al actualizar la plantilla';
      }
    });
  }

  eliminarPlantilla(id: number | undefined): void {
    if (!id) {
      console.error('ID inválido para eliminar:', id);
      return;
    }

    this.plantillaService.deletePlantilla(id).subscribe({
      next: () => {
        this.mensaje = 'Plantilla eliminada';
        this.cargarPlantillasPublicas();
      },
      error: (err) => console.error(err)
    });
  }
}
