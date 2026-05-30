import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PutawayTasksRoutingModule } from './putaway-tasks-routing.module';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PutawayTasksRoutingModule
  ],
  exports: [
 
  ]
})
export class PutawayTasksModule { } 