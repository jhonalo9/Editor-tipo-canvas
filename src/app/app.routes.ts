import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { GestionPlantillasComponent } from './components/admin/gestion-plantillas/gestion-plantillas.component';
import { MisProyectosComponent } from './usuario/mis-proyectos/mis-proyectos.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { PremiunGuard } from './core/guards/premiun.guard'
import { EditorComponent } from './components/editor/editor.component';
import { PreviewProyectComponent } from './components/preview-proyect/preview-proyect.component';
import { RegisterComponent } from './components/register/register.component';
import { UpgradePremiumComponent } from './usuario/upgrade-premium/upgrade-premium.component';
import { TemplateEditorComponent } from './features/admin/template-editor/template-editor.component';
import { MisFavoritosComponent } from './usuario/mis-favoritos/mis-favoritos.component';
import { FullPlantillasComponent } from './usuario/full-plantillas/full-plantillas.component';
import { CategoriaComponent } from './components/admin/categoria/categoria.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { GestionUsuariosComponent } from './components/admin/gestion-usuarios/gestion-usuarios.component';
import { MisPlantillasComponent } from './usuario/mis-plantillas/mis-plantillas.component';
import { DesignGuard } from './core/guards/design.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, 
  { path: 'editor', component: EditorComponent },
  { path: 'plan',component:UpgradePremiumComponent},
  { path: 'plantillas',component:FullPlantillasComponent},


  { path: 'usuario/editor/:id', component: EditorComponent},
  { path: 'usuario/descripcion-proyect',component:PreviewProyectComponent},
  { path: 'usuario/mis-proyectos',component:MisProyectosComponent, canActivate: [AuthGuard]},
  { path: 'usuario/mis-favoritos',component:MisFavoritosComponent,canActivate: [AuthGuard]},

  { path: 'usuario/mis-plantillas',component:MisPlantillasComponent,canActivate:[PremiunGuard]},
  

 

  { path: 'admin/plantillas', component: GestionPlantillasComponent,canActivate: [AdminGuard] },
  { path: 'admin/categorias', component: CategoriaComponent,canActivate: [AdminGuard]},
  { path: 'admin/home', component: DashboardComponent,canActivate: [AdminGuard] },
  { path: 'admin/usuarios', component: GestionUsuariosComponent,canActivate: [AdminGuard]},
  { path: 'admin/design',component:TemplateEditorComponent,canActivate:[PremiunGuard]}

];