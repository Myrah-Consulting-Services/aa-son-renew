import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PayrollLayout } from './payroll-layout/payroll-layout';
import { PayrollDashboard } from './payroll-dashboard/payroll-dashboard';
import { Attendance } from './attendance/attendance';
import { Career } from './career/career';
import { Document } from './document/document';
import { EmployeeComponent } from './employee/employee';
import { ParRun } from './par-run/par-run';
import { PaySchedule } from './pay-schedule/pay-schedule';
import { Payroll } from './payroll/payroll';
import { Salary } from './salary/salary';
import { SalaryStructure } from './salary-structure/salary-structure';
import { EmployeeAssignment } from './employee-assignment/employee-assignment';
import { Statutory } from './statutory/statutory';
import { AddEmployeeComponent } from './add-employee/add-employee';
import { LeaveManagement } from './leavemanagement/leavemanagement';
import { LoanManagementComponent } from './loan-management/loan-management';
import { PayrollProcessingComponent } from './payroll-processing/payroll-processing';
import { Shifts } from './shifts/shifts';
import { PayrollSettingsComponent } from './payroll-settings/payroll-settings';
import { GratuityComponent } from './gratuity/gratuity.component';
import { FinalSettlementComponent } from './final-settlement/final-settlement.component';
import { EosbAccrualDashboardComponent } from './eosb-accrual-dashboard/eosb-accrual-dashboard.component';
import { EmployeeViewDetails } from './employee-view-details/employee-view-details';
import { ReviseSalary } from './revise-salary/revise-salary';
import { SocialSecurityRoutingModule } from './social-security/social-security-routing-module';
import { PayrunDetail } from './payrun-detail/payrun-detail';
import { MissingData } from './missing-data/missing-data';
import { TerminateProcess } from './terminate-process/terminate-process';

const routes: Routes = [
  {
    path: '',
    component: PayrollLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: PayrollDashboard
      },
      {
        path: 'attendance',
        component: Attendance
      },
      {
        path: 'leavemanagement',
        component: LeaveManagement
      },
      {
        path: 'loan-management',
        component: LoanManagementComponent
      },
      {
        path: 'payroll-processing',
        component: PayrollProcessingComponent
      },
      {
        path: 'career',
        component: Career
      },
      {
        path: 'document',
        component: Document
      },
      {
        path: 'employee',
        component: EmployeeComponent
      },
      {
        path: 'add-employee/:id',
        component: AddEmployeeComponent
      },
      {
        path: 'employee/:id',
        component:EmployeeViewDetails
      },
      {
        path: 'par-run',
        component: ParRun
      },
      {
        path: 'pay-schedule',
        component: PaySchedule
      },
      {
        path: 'payroll',
        component: Payroll
      },
      {
        path: 'salary',
        component: Salary
      },
      {
        path: 'salary-structure',
        component: SalaryStructure
      },
      {
        path: 'employee-assignment',
        component: EmployeeAssignment
      },
      {
        path: 'statutory',
        component: Statutory
      },
      {
        path: 'shifts',
        component: Shifts
      },
      {
        path: 'payroll-settings',
        component: PayrollSettingsComponent
      },
      {
        path: 'gratuity',
        component: GratuityComponent
      },
      {
        path: 'final-settlement',
        component: FinalSettlementComponent
      },
      {
        path: 'eosb-accrual-dashboard',
        component: EosbAccrualDashboardComponent
      },
      {
        path: 'pay-run-detail/:data',
        component: PayrunDetail
      },
      {
        path: 'social-security',
        loadChildren: () =>
          import('./social-security/social-security-routing-module').then(m => m.SocialSecurityRoutingModule)
      },
      {
        path: 'missing-data/:payrollRunId',
        component: MissingData
      },
      {
        path: 'terminate-process/',
        component: TerminateProcess
      },
      {
        path: 'employee-view-details/:id',
        component: EmployeeViewDetails
      },
      {
        path: 'revise-salary/:id',
        component: ReviseSalary
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PayrollRoutingModule { }
