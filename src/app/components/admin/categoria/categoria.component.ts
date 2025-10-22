import { Component , OnInit} from '@angular/core';
import { Categoria, CategoriaService } from '../../../core/services/categoria.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VerticalHeaderComponent } from "../vertical-header/vertical-header.component";

@Component({
  selector: 'app-categoria',
  imports: [FormsModule, CommonModule, VerticalHeaderComponent],
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css'
})
export class CategoriaComponent  implements OnInit  {
 // Propiedades para la lista
  categorias: Categoria[] = [];
  categoriasFiltradas: Categoria[] = [];
  
  // Propiedades para el formulario
  categoria: Categoria = {
    nombre: '',
    descripcion: ''
  };
  
  // Estados del componente
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  buscando: boolean = false;
  
  // Mensajes y errores
  errorMessage: string = '';
  successMessage: string = '';
  terminoBusqueda: string = '';

  constructor(private categoriaService: CategoriaService) { }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  // ========== MÉTODOS PARA LISTA ==========

  cargarCategorias(): void {
    this.categoriaService.obtenerTodas().subscribe({
      next: (data) => {
        this.categorias = data;
        this.categoriasFiltradas = data;
        this.errorMessage = '';
        console.log('Categorías cargadas:', data); // Debug
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar las categorías';
        console.error('Error:', error);
      }
    });
  }

  eliminarCategoria(id: number | undefined): void {
    // Validar que el ID exista
    if (!id) {
      console.error('ID de categoría es undefined');
      this.errorMessage = 'Error: ID de categoría no válido';
      return;
    }

    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      console.log('Intentando eliminar categoría con ID:', id); // Debug
      
      this.categoriaService.eliminar(id).subscribe({
        next: (response) => {
          this.successMessage = response;
          this.cargarCategorias();
          this.ocultarMensajesDespuesDeTiempo();
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.errorMessage = error.error || 'Error al eliminar la categoría';
          this.ocultarMensajesDespuesDeTiempo();
        }
      });
    }
  }

  buscarCategorias(): void {
    if (this.terminoBusqueda.trim() === '') {
      this.categoriasFiltradas = this.categorias;
      this.buscando = false;
      return;
    }

    this.buscando = true;
    this.categoriaService.buscar(this.terminoBusqueda).subscribe({
      next: (data) => {
        this.categoriasFiltradas = data;
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = 'Error al buscar categorías';
        console.error('Error:', error);
      }
    });
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.categoriasFiltradas = this.categorias;
    this.buscando = false;
  }

  // ========== MÉTODOS PARA FORMULARIO ==========

  nuevoCategoria(): void {
    this.mostrarFormulario = true;
    this.modoEdicion = false;
    this.categoria = { nombre: '', descripcion: '' };
    this.errorMessage = '';
    this.successMessage = '';
  }

  editarCategoria(categoria: Categoria): void {
    // Validar que la categoría tenga ID
    if (!categoria.idCategoria) {
      console.error('Categoría sin ID:', categoria);
      this.errorMessage = 'Error: Categoría no tiene ID válido';
      return;
    }

    this.mostrarFormulario = true;
    this.modoEdicion = true;
    this.categoria = { ...categoria };
    this.errorMessage = '';
    this.successMessage = '';
  }

  guardarCategoria(): void {
    if (this.modoEdicion) {
      this.actualizarCategoria();
    } else {
      this.crearCategoria();
    }
  }

  crearCategoria(): void {
    this.categoriaService.crear(this.categoria).subscribe({
      next: (data) => {
        this.successMessage = 'Categoría creada exitosamente';
        this.cancelarEdicion();
        this.cargarCategorias();
        this.ocultarMensajesDespuesDeTiempo();
      },
      error: (error) => {
        this.errorMessage = error.error;
        console.error('Error:', error);
        this.ocultarMensajesDespuesDeTiempo();
      }
    });
  }

  actualizarCategoria(): void {
    if (!this.categoria.idCategoria) {
      this.errorMessage = 'Error: No se puede actualizar sin ID';
      return;
    }

    this.categoriaService.actualizar(this.categoria.idCategoria, this.categoria).subscribe({
      next: (data) => {
        this.successMessage = 'Categoría actualizada exitosamente';
        this.cancelarEdicion();
        this.cargarCategorias();
        this.ocultarMensajesDespuesDeTiempo();
      },
      error: (error) => {
        this.errorMessage = error.error;
        console.error('Error:', error);
        this.ocultarMensajesDespuesDeTiempo();
      }
    });
  }

  cancelarEdicion(): void {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.categoria = { nombre: '', descripcion: '' };
    this.errorMessage = '';
  }

  // ========== MÉTODOS AUXILIARES ==========

  ocultarMensajesDespuesDeTiempo(): void {
    setTimeout(() => {
      this.errorMessage = '';
      this.successMessage = '';
    }, 5000);
  }

  // Método para debug
  verificarCategoria(categoria: Categoria): void {
    console.log('Categoría clickeada:', categoria);
    console.log('ID de categoría:', categoria.idCategoria);
    console.log('Tipo de ID:', typeof categoria.idCategoria);
  }
}
