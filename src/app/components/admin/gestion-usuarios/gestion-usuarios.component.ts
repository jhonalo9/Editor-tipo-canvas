import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstadisticasUsuarios, Usuario, UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { VerticalHeaderComponent } from "../vertical-header/vertical-header.component";

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, VerticalHeaderComponent],
  templateUrl: './gestion-usuarios.component.html',
  styleUrl: './gestion-usuarios.component.css'
})
export class GestionUsuariosComponent implements OnInit, OnDestroy {

  usuarios: Usuario[] = [];
  estadisticas: EstadisticasUsuarios| null = null;
  loading = false;
  searchTerm = '';
  selectedUsuario: Usuario | null = null;
  
  // Forms
  editUsuarioForm: FormGroup;
  cambioPlanForm: FormGroup;
  cambioRolForm: FormGroup;
  
  // Estados de UI
  showEditModal = false;
  showPlanModal = false;
  showRolModal = false;
  showDeleteConfirm = false;
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.editUsuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.cambioPlanForm = this.fb.group({
      plan: ['', Validators.required]
    });

    this.cambioRolForm = this.fb.group({
      rol: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.verificarPermisosAdmin();
    this.cargarUsuarios();
    this.cargarEstadisticas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verificarPermisosAdmin(): void {
    if (!this.usuarioService.esAdmin()) {
      alert('No tienes permisos para acceder a esta sección');
      // Redirigir a home o página de error
    }
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.usuarioService.obtenerTodosUsuarios()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios;
          this.totalItems = usuarios.length;
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          alert('Error al cargar los usuarios');
        }
      });
  }

   trackByUserId(index: number, usuario: Usuario): number {
    return usuario.id;
  }

  cargarEstadisticas(): void {
    this.usuarioService.obtenerEstadisticas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estadisticas) => {
          this.estadisticas = estadisticas;
        },
        error: (error) => {
          console.error('Error al cargar estadísticas:', error);
        }
      });
  }

  buscarUsuarios(): void {
    if (this.searchTerm.trim()) {
      this.loading = true;
      this.usuarioService.buscarUsuariosPorNombre(this.searchTerm)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: (usuarios) => {
            this.usuarios = usuarios;
            this.totalItems = usuarios.length;
            this.currentPage = 1;
          },
          error: (error) => {
            console.error('Error al buscar usuarios:', error);
            alert('Error al buscar usuarios');
          }
        });
    } else {
      this.cargarUsuarios();
    }
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarUsuarios();
  }

  // Modal handlers
  abrirEditarUsuario(usuario: Usuario): void {
    console.log('Abriendo modal de edición para:', usuario); // Debug
    this.selectedUsuario = usuario;
    this.editUsuarioForm.patchValue({
      nombre: usuario.nombre,
      email: usuario.email
    });
    this.showEditModal = true;
  }

  abrirCambioPlan(usuario: Usuario): void {
    console.log('Abriendo modal de plan para:', usuario); // Debug
    this.selectedUsuario = usuario;
    this.cambioPlanForm.patchValue({
      plan: usuario.plan
    });
    this.showPlanModal = true;
  }

  abrirCambioRol(usuario: Usuario): void {
    this.selectedUsuario = usuario;
    this.cambioRolForm.patchValue({
      rol: usuario.rol
    });
    this.showRolModal = true;
  }

  abrirConfirmarEliminacion(usuario: Usuario): void {
    this.selectedUsuario = usuario;
    this.showDeleteConfirm = true;
  }

  cerrarModales(): void {
    this.showEditModal = false;
    this.showPlanModal = false;
    this.showRolModal = false;
    this.showDeleteConfirm = false;
    this.selectedUsuario = null;
    this.editUsuarioForm.reset();
    this.cambioPlanForm.reset();
    this.cambioRolForm.reset();
  }

  // Acciones
  guardarEdicionUsuario(): void {
    if (this.editUsuarioForm.valid && this.selectedUsuario) {
      this.loading = true;
      this.usuarioService.actualizarPerfil(this.editUsuarioForm.value)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading = false;
            this.cerrarModales();
          })
        )
        .subscribe({
          next: (usuarioActualizado) => {
            const index = this.usuarios.findIndex(u => u.id === usuarioActualizado.id);
            if (index !== -1) {
              this.usuarios[index] = usuarioActualizado;
            }
            alert('Usuario actualizado correctamente');
          },
          error: (error) => {
            console.error('Error al actualizar usuario:', error);
            alert('Error al actualizar el usuario');
          }
        });
    }
  }

  cambiarPlan(): void {
    if (this.cambioPlanForm.valid && this.selectedUsuario) {
      const nuevoPlan = this.cambioPlanForm.get('plan')?.value;
      this.loading = true;
      this.usuarioService.actualizarPlanUsuario(this.selectedUsuario.id, nuevoPlan)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading = false;
            this.cerrarModales();
          })
        )
        .subscribe({
          next: (usuarioActualizado) => {
            const index = this.usuarios.findIndex(u => u.id === usuarioActualizado.id);
            if (index !== -1) {
              this.usuarios[index] = usuarioActualizado;
            }
            alert('Plan actualizado correctamente');
          },
          error: (error) => {
            console.error('Error al cambiar plan:', error);
            alert('Error al cambiar el plan');
          }
        });
    }
  }

  cambiarRol(): void {
    if (this.cambioRolForm.valid && this.selectedUsuario) {
      const nuevoRol = this.cambioRolForm.get('rol')?.value;
      this.loading = true;
      this.usuarioService.actualizarRolUsuario(this.selectedUsuario.id, nuevoRol)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading = false;
            this.cerrarModales();
          })
        )
        .subscribe({
          next: (usuarioActualizado) => {
            const index = this.usuarios.findIndex(u => u.id === usuarioActualizado.id);
            if (index !== -1) {
              this.usuarios[index] = usuarioActualizado;
            }
            alert('Rol actualizado correctamente');
          },
          error: (error) => {
            console.error('Error al cambiar rol:', error);
            alert('Error al cambiar el rol');
          }
        });
    }
  }

  eliminarUsuario(): void {
    if (this.selectedUsuario) {
      this.loading = true;
      this.usuarioService.eliminarUsuario(this.selectedUsuario.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading = false;
            this.cerrarModales();
          })
        )
        .subscribe({
          next: () => {
            this.usuarios = this.usuarios.filter(u => u.id !== this.selectedUsuario?.id);
            this.totalItems = this.usuarios.length;
            this.cargarEstadisticas();
            alert('Usuario eliminado correctamente');
          },
          error: (error) => {
            console.error('Error al eliminar usuario:', error);
            alert('Error al eliminar el usuario');
          }
        });
    }
  }

  upgradeAPremium(usuario: Usuario): void {
    if (confirm(`¿Estás seguro de que quieres actualizar a ${usuario.nombre} a Premium?`)) {
      this.usuarioService.upgradeAPremium()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (usuarioActualizado) => {
            const index = this.usuarios.findIndex(u => u.id === usuarioActualizado.id);
            if (index !== -1) {
              this.usuarios[index] = usuarioActualizado;
            }
            alert('Usuario actualizado a Premium correctamente');
          },
          error: (error) => {
            console.error('Error al hacer upgrade:', error);
            alert('Error al actualizar a Premium');
          }
        });
    }
  }

  downgradeAFree(usuario: Usuario): void {
    if (confirm(`¿Estás seguro de que quieres degradar a ${usuario.nombre} a Free?`)) {
      this.usuarioService.downgradeAFree(usuario.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (usuarioActualizado) => {
            const index = this.usuarios.findIndex(u => u.id === usuarioActualizado.id);
            if (index !== -1) {
              this.usuarios[index] = usuarioActualizado;
            }
            alert('Usuario degradado a Free correctamente');
          },
          error: (error) => {
            console.error('Error al hacer downgrade:', error);
            alert('Error al degradar a Free');
          }
        });
    }
  }

  // Helpers para la template
  get usuariosPaginados(): Usuario[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.usuarios.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  cambiarPagina(pagina: number): void {
    this.currentPage = pagina;
  }

  getBadgeClass(plan: string): string {
    switch (plan) {
      case 'PREMIUM': return 'badge-premium';
      case 'FREE': return 'badge-free';
      default: return 'badge-secondary';
    }
  }

  getRolBadgeClass(rol: string): string {
    switch (rol) {
      case 'ADMIN': return 'badge-admin';
      case 'USER': return 'badge-user';
      default: return 'badge-secondary';
    }
  }

}
