import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RackMovementDashboardComponent } from './rack-movement-dashboard/rack-movement-dashboard.component';
import { RackMovementListComponent } from './rack-movement-list/rack-movement-list.component';
import { RackMovementHistoryComponent } from './rack-movement-history/rack-movement-history.component';
import { RackMovementFormComponent } from './rack-movement-form/rack-movement-form.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: RackMovementDashboardComponent
  },
  {
    path: 'list',
    component: RackMovementListComponent
  },
  {
    path: 'history',
    component: RackMovementHistoryComponent
  },
  {
    path: 'form',
    component: RackMovementFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RackMovementRoutingModule { } 