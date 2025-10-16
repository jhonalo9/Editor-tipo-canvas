import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';

import { GestionPlantillasComponent } from './components/admin/gestion-plantillas/gestion-plantillas.component';
//import { EditorUsuarioComponent } from './usuario/editor-usuario/editor-usuario.component';
import { MisProyectosComponent } from './usuario/mis-proyectos/mis-proyectos.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
//import { AdminPlantillaComponent } from './components/adminplantilla/adminplantilla.component';
import { EditorComponent } from './components/editor/editor.component';
import { PreviewProyectComponent } from './components/preview-proyect/preview-proyect.component';
import { PlantillaComponent } from './components/plantilla/plantilla.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminEditorOficialComponent } from './admin-editor-oficial/admin-editor-oficial.component';
import { PlantillaDesignEditorComponent } from './plantilla-design-editor-component/plantilla-design-editor-component.component';
import { EditorofiadminComponent } from './editorofiadmin/editorofiadmin.component';
import { UpgradePremiumComponent } from './usuario/upgrade-premium/upgrade-premium.component';
import { EditorOFIofiComponent } from './editor-ofiofi/editor-ofiofi.component';
import { TemplateEditorComponent } from './features/admin/template-editor/template-editor.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, 
  
  { path: 'editor', component: EditorComponent },

  /*{ path: 'admin/plantillas', component: GestionPlantillasComponent, canActivate: [AdminGuard] },*/
  { path: 'usuario/editor/:id', component: EditorComponent},
  //{ path: 'usuario/proyectos', component: MisProyectosComponent },
  {path:'usuario/descripcion-proyect',component:PreviewProyectComponent},
  {path:'usuario/plantillas',component:PlantillaComponent},
  //{path:'usuario/proyecto',component:EditorUsuarioComponent},
  {path:'usuario/mis-proyectos',component:MisProyectosComponent},
  {path:'admineditor',component:AdminEditorOficialComponent},
  //{path:'admin/admineditor',component:EditorAdminComponent},
  {path:'editores',component:PlantillaDesignEditorComponent},
  {path:'editorofi',component:EditorofiadminComponent},
  {path:'plan',component:UpgradePremiumComponent},
  {path:'plantillaofi',component:EditorOFIofiComponent},

  {path:'TemplateEditorComponent',component:TemplateEditorComponent}

  
 


];