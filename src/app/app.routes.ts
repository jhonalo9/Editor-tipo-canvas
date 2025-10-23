import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { GestionPlantillasComponent } from './components/admin/gestion-plantillas/gestion-plantillas.component';
//import { EditorUsuarioComponent } from './usuario/editor-usuario/editor-usuario.component';
import { MisProyectosComponent } from './usuario/mis-proyectos/mis-proyectos.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { EditorComponent } from './components/editor/editor.component';
import { PreviewProyectComponent } from './components/preview-proyect/preview-proyect.component';
import { PlantillaComponent } from './components/plantilla/plantilla.component';
import { RegisterComponent } from './components/register/register.component';
import { UpgradePremiumComponent } from './usuario/upgrade-premium/upgrade-premium.component';
import { TemplateEditorComponent } from './features/admin/template-editor/template-editor.component';
import { MisFavoritosComponent } from './usuario/mis-favoritos/mis-favoritos.component';
import { FullPlantillasComponent } from './usuario/full-plantillas/full-plantillas.component';
import { CategoriaComponent } from './components/admin/categoria/categoria.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { GestionUsuariosComponent } from './components/admin/gestion-usuarios/gestion-usuarios.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, 
  { path: 'editor', component: EditorComponent },

  /*{ path: 'admin/plantillas', component: GestionPlantillasComponent, canActivate: [AdminGuard] },*/
  { path: 'usuario/editor/:id', component: EditorComponent},
  {path:'usuario/descripcion-proyect',component:PreviewProyectComponent},
  {path:'usuario/plantillas',component:PlantillaComponent},
  //{path:'usuario/proyecto',component:EditorUsuarioComponent},
  {path:'usuario/mis-proyectos',component:MisProyectosComponent},
  {path:'usuario/mis-favoritos',component:MisFavoritosComponent},
  {path:'plantillas',component:FullPlantillasComponent},

  //{path:'admin/admineditor',component:EditorAdminComponent},
  {path:'plan',component:UpgradePremiumComponent},
{ path: 'admin/plantillas', component: GestionPlantillasComponent},
{ path: 'admin/categorias', component: CategoriaComponent},
{ path: 'admin/home', component: DashboardComponent},
{ path: 'admin/usuarios', component: GestionUsuariosComponent},

  {path:'admin/design',component:TemplateEditorComponent},
 
  
 

  
 


];