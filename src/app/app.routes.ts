import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./workspace.component').then(m => m.WorkspaceComponent)
  }
];
