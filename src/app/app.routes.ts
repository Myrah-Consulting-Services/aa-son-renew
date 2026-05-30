import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then(m => m.Login)
      },
    {
        path: '',
        loadChildren: () => import('./features/features-routing-module').then(m => m.FeaturesRoutingModule)
    },
    {
        path:'warehouse',
        loadChildren:() => import('./warehouse/warehouse-module').then(m=> m.WarehouseModule)
    },
    {
        path:'payroll',
        loadChildren:() => import('./payroll/payroll-module').then(m=> m.PayrollModule)
    }
];
