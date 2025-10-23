import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';


interface MenuItem {
  icon: string;
  label: string;
  route?: string;
  action?: string;
  badge?: number;
  isActive?: boolean;
}
@Component({
  selector: 'app-vertical-header',
  imports: [CommonModule],
  templateUrl: './vertical-header.component.html',
  styleUrl: './vertical-header.component.css'
})
export class VerticalHeaderComponent {
   @Output() menuToggle = new EventEmitter<void>();
getIcon(iconName: string): string {
  const icons: { [key: string]: string } = {
    dashboard: '📊',
    template: '📝',
    category: '📂',
    users: '👥',
    analytics: '📈',
    settings: '⚙️',
    help: '❓',
    logout: '🚪'
  };
  return icons[iconName] || '📄';
}
  menuItems: MenuItem[] = [
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/admin/home',
      isActive: false
    },
    {
      icon: 'template',
      label: 'Plantillas',
      route: '/admin/plantillas',
      isActive: false
    },
    {
      icon: 'category',
      label: 'Categorías',
      route: '/admin/categorias',
      isActive: false
    },
    {
      icon: 'users',
      label: 'Usuarios',
      route: '/admin/usuarios',
      isActive: false
    },
    {
      icon: 'analytics',
      label: 'Estadísticas',
      route: '/admin/estadisticas',
      isActive: false
    },
    /*{
      icon: 'settings',
      label: 'Configuración',
      route: '/admin/configuracion',
      isActive: false
    },
    {
      icon: 'help',
      label: 'Ayuda',
      route: '/admin/ayuda',
      isActive: false
    }*/
  ];

  bottomMenuItems: MenuItem[] = [
    {
      icon: 'logout',
      label: 'Cerrar Sesión',
      action: 'logout'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.updateActiveRoute();
  }

  ngOnInit() {
    // Escuchar cambios de ruta para actualizar el item activo
    this.router.events.subscribe(() => {
      this.updateActiveRoute();
    });
  }

  updateActiveRoute() {
    const currentRoute = this.router.url;
    this.menuItems.forEach(item => {
      item.isActive = item.route === currentRoute;
    });
  }

  onMenuItemClick(item: MenuItem) {
    if (item.route) {
      this.router.navigate([item.route]);
    } else if (item.action === 'logout') {
      this.logout();
    }
  }

  logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  toggleMenu() {
    this.menuToggle.emit();
  }

}
