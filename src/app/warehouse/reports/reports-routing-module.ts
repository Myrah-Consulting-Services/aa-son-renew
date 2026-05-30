import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports-layout/reports-layout').then(m => m.ReportsLayout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./reports-dashboard/reports-dashboard').then(m => m.ReportsDashboard)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./inventory-report/inventory-report').then(m => m.InventoryReport)
      },
      {
        path: 'movements',
        loadComponent: () => import('./movements-report/movements-report').then(m => m.MovementsReport)
      },
      {
        path: 'damage',
        loadComponent: () => import('./damage-report/damage-report').then(m => m.DamageReport)
      },
      {
        path: 'requisitions',
        loadComponent: () => import('./requisitions-report/requisitions-report').then(m => m.RequisitionsReport)
      },
      {
        path: 'warehouse-performance',
        loadComponent: () => import('./warehouse-performance/warehouse-performance').then(m => m.WarehousePerformance)
      },
      {
        path: 'pending-requisition',
        loadComponent: () => import('./pending-requisition/pending-requisition').then(m => m.PendingRequisition)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { } 