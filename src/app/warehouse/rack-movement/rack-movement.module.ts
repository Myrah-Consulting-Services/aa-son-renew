import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { RackMovementRoutingModule } from './rack-movement-routing.module';
import { RackMovementListComponent } from './rack-movement-list/rack-movement-list.component';
import { RackMovementFormComponent } from './rack-movement-form/rack-movement-form.component';
import { RackMovementHistoryComponent } from './rack-movement-history/rack-movement-history.component';
import { RackMovementDashboardComponent } from './rack-movement-dashboard/rack-movement-dashboard.component';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    RackMovementRoutingModule
  ],
  exports: [
  
  ]
})
export class RackMovementModule { } 