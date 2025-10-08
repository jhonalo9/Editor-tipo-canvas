/*import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PlantillaService, PlantillaRequest, Plantilla } from '../../core/services/plantilla.service';
//import { EditorAdminComponent } from '../admin/editor-admin/editor-admin.component';


@Component({
  selector: 'app-admin-plantilla',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EditorAdminComponent],
  templateUrl: './adminplantilla.component.html',
  styleUrls: ['./adminplantilla.component.css']
})
export class AdminPlantillaComponent implements OnInit {
  plantillaForm: FormGroup;
  mensaje: string = '';
  isLoggedIn = false;
  plantillas: Plantilla[] = [];
  plantillaSeleccionada: Plantilla | null = null;
  
  @ViewChild('editor') editorComponent!: EditorAdminComponent;

  constructor(
    private fb: FormBuilder,
    private plantillaService: PlantillaService,
    private authService: AuthService
  ) {
    this.plantillaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (this.isLoggedIn) {
        this.cargarPlantillas();
      }
    });
  }

  cargarPlantillas(): void {
    this.plantillaService.getPlantillasPublicas().subscribe({
      next: (res) => {
        console.log('Plantillas recibidas:', res);
        this.plantillas = res;
      },
      error: (err) => {
        console.error('Error al cargar plantillas', err);
        this.mensaje = 'Error al cargar las plantillas';
      }
    });
  }

  crearPlantilla(): void {
    if (this.plantillaForm.invalid) {
      this.mensaje = 'Por favor, complete el nombre de la plantilla';
      return;
    }

    if (!this.editorComponent) {
      this.mensaje = 'Error: Editor no disponible';
      return;
    }

    const dataJSON = this.editorComponent.saveToPlantilla();
    const nuevaPlantilla: PlantillaRequest = {
      nombre: this.plantillaForm.value.nombre,
      descripcion: this.plantillaForm.value.descripcion || '',
      data: dataJSON
    };
    
    this.plantillaService.createPlantilla(nuevaPlantilla).subscribe({
      next: (res) => {
        console.log('Plantilla creada', res);
        this.mensaje = 'Plantilla creada exitosamente';
        this.plantillaForm.reset();
        this.plantillaSeleccionada = null;
        this.cargarPlantillas();
        
        // Limpiar el editor después de guardar
        setTimeout(() => {
          this.editorComponent.limpiarEditor();
        }, 100);
      },
      error: (err) => {
        console.error('Error creando plantilla', err);
        this.mensaje = 'Error al crear la plantilla';
      }
    });
  }

  seleccionarPlantilla(plantilla: Plantilla): void {
    console.log('Plantilla seleccionada:', plantilla);
    this.plantillaSeleccionada = plantilla;
    this.plantillaForm.patchValue({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion || ''
    });
    
    // Cargar automáticamente la plantilla en el editor
    this.cargarPlantillaEnEditor();
  }

  cargarPlantillaEnEditor(): void {
  if (this.plantillaSeleccionada && this.editorComponent) {
    // Pequeño retraso para asegurar que la UI se actualice
    setTimeout(() => {
      if (this.plantillaSeleccionada && this.editorComponent) {
        this.editorComponent.loadPlantilla(this.plantillaSeleccionada.data);
        this.mensaje = `Plantilla "${this.plantillaSeleccionada.nombre}" cargada en el editor`;
      }
    }, 100);
  } else {
    console.warn('No se puede cargar la plantilla: editor o plantilla no disponible');
  }
}

  actualizarPlantilla(): void {
    if (!this.plantillaSeleccionada) {
      this.mensaje = 'No hay plantilla seleccionada para actualizar';
      return;
    }

    if (this.plantillaForm.invalid) {
      this.mensaje = 'Por favor, complete el nombre de la plantilla';
      return;
    }

    if (!this.editorComponent) {
      this.mensaje = 'Error: Editor no disponible';
      return;
    }

    const id = this.plantillaSeleccionada.id;
    if (!id) {
      console.error('ID no encontrado en plantilla seleccionada');
      this.mensaje = 'Error: ID de plantilla no válido';
      return;
    }

    const dataJSON = this.editorComponent.saveToPlantilla();
    const plantillaActualizada: PlantillaRequest = {
      nombre: this.plantillaForm.value.nombre,
      descripcion: this.plantillaForm.value.descripcion || '',
      data: dataJSON
    };

    this.plantillaService.updatePlantilla(id, plantillaActualizada).subscribe({
      next: () => {
        this.mensaje = 'Plantilla actualizada correctamente';
        this.plantillaSeleccionada = null;
        this.plantillaForm.reset();
        this.cargarPlantillas();
      },
      error: (err) => {
        console.error('Error actualizando plantilla:', err);
        this.mensaje = 'Error al actualizar la plantilla';
      }
    });
  }

  eliminarPlantilla(plantilla: Plantilla): void {
    if (!plantilla.id) {
      console.error('ID inválido para eliminar:', plantilla.id);
      this.mensaje = 'Error: ID de plantilla no válido';
      return;
    }

    if (!confirm(`¿Está seguro de que desea eliminar la plantilla "${plantilla.nombre}"?`)) {
      return;
    }

    this.plantillaService.deletePlantilla(plantilla.id).subscribe({
      next: () => {
        this.mensaje = `Plantilla "${plantilla.nombre}" eliminada correctamente`;
        
        // Si la plantilla eliminada era la seleccionada, limpiar selección
        if (this.plantillaSeleccionada && this.plantillaSeleccionada.id === plantilla.id) {
          this.plantillaSeleccionada = null;
          this.plantillaForm.reset();
        }
        
        this.cargarPlantillas();
      },
      error: (err) => {
        console.error('Error eliminando plantilla:', err);
        this.mensaje = 'Error al eliminar la plantilla';
      }
    });
  }

  cancelarEdicion(): void {
    this.plantillaSeleccionada = null;
    this.plantillaForm.reset();
    this.mensaje = 'Edición cancelada';
    
    // Limpiar el editor
    if (this.editorComponent) {
      this.editorComponent.limpiarEditor();
    }
  }

  nuevaPlantilla(): void {
    this.cancelarEdicion();
    this.mensaje = 'Listo para crear una nueva plantilla';
  }
}*/