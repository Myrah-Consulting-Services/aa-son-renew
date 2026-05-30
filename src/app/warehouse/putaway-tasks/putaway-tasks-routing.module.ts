import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PutawayTasksDashboardComponent } from './putaway-tasks-dashboard/putaway-tasks-dashboard.component';
import { PutawayTasksListComponent } from './putaway-tasks-list/putaway-tasks-list.component';
import { TaskAssignmentComponent } from './task-assignment/task-assignment.component';
import { PutawayTaskFormComponent } from './putaway-task-form/putaway-task-form.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: PutawayTasksDashboardComponent
  },
  {
    path: 'list',
    component: PutawayTasksListComponent
  },
  {
    path: 'assignment',
    component: TaskAssignmentComponent
  },
  {
    path: 'create',
    component: PutawayTaskFormComponent
  },
  {
    path: 'edit/:id',
    component: PutawayTaskFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PutawayTasksRoutingModule { } 