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
        path: 'select-company',
        loadComponent: () =>
          import('./features/auth/select-company/select-company').then(m => m.SelectCompany)
      },
    {
        path: 'create-company',
        loadComponent: () =>
          import('./features/auth/create-company/create-company').then(m => m.CreateCompany)
      },
    {
        path: 'restaurant-demo',
        loadComponent: () =>
          import('./features/restaurant-demo/restaurant-demo').then(m => m.RestaurantDemo)
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
