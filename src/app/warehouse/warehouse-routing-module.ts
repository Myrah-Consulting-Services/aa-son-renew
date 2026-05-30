import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WarehouseMain } from './warehouse-main/warehouse-main';

const routes: Routes = [
  {
    path: '',
    component: WarehouseMain,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./warehouse-dashboard/warehouse-dashboard').then(m => m.WarehouseDashboard) },
      { path: 'warehouses', loadComponent: () => import('./warehouse-list/warehouse-list').then(m => m.WarehouseList) },
      { path: 'warehouses/new', loadComponent: () => import('./warehouse-form/warehouse-form').then(m => m.WarehouseForm) },
      { path: 'warehouses/:id', loadComponent: () => import('./warehouse-form/warehouse-form').then(m => m.WarehouseForm) },
      { path: 'locations', loadComponent: () => import('./location-list/location-list').then(m => m.LocationList) },
      { path: 'locations/new', loadComponent: () => import('./location-form/location-form').then(m => m.LocationForm) },
      { path: 'locations/:id', loadComponent: () => import('./location-form/location-form').then(m => m.LocationForm) },
      { path: 'inward', loadComponent: () => import('./inward-list/inward-list').then(m => m.InwardList) },
      { path: 'inward/new', loadComponent: () => import('./inward-form/inward-form').then(m => m.InwardForm) },
      { path: 'outward', loadComponent: () => import('./outward-list/outward-list').then(m => m.OutwardList) },
      { path: 'outward/new', loadComponent: () => import('./outward-form/outward-form').then(m => m.OutwardForm) },
      { path: 'relocation', loadComponent: () => import('./relocation-list/relocation-list').then(m => m.RelocationList) },
      { path: 'relocation/new', loadComponent: () => import('./relocation-form/relocation-form').then(m => m.RelocationForm) },
      { path: 'stock', loadComponent: () => import('./stock-list/stock-list').then(m => m.StockList) },
      { path: 'damage', loadComponent: () => import('./damage-list/damage-list').then(m => m.DamageList) },
      { path: 'damage/new', loadComponent: () => import('./damage-form/damage-form').then(m => m.DamageForm) },
      { path: 'requisition', loadComponent: () => import('./requisition-list/requisition-list').then(m => m.RequisitionList) },
      { path: 'requisition/new', loadComponent: () => import('./requisition-form/requisition-form').then(m => m.RequisitionForm) },
      { path: 'pickup-task/new', loadComponent: () => import('./pickup-task-form/pickup-task-form.component').then(m => m.PickupTaskFormComponent) },
      { path: 'pickup-task/edit/:id', loadComponent: () => import('./pickup-task-form/pickup-task-form.component').then(m => m.PickupTaskFormComponent) },
      { path: 'rack-movements', loadChildren: () => import('./rack-movement/rack-movement-routing.module').then(m => m.RackMovementRoutingModule) },
      { path: 'putaway-tasks', loadChildren: () => import('./putaway-tasks/putaway-tasks-routing.module').then(m => m.PutawayTasksRoutingModule) },
      { path: 'reports', loadChildren: () => import('./reports/reports-routing-module').then(m => m.ReportsRoutingModule) },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WarehouseRoutingModule { }
