import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GratuityComponent } from "../gratuity/gratuity.component";
import { EosbAccrualDashboardComponent } from '../eosb-accrual-dashboard/eosb-accrual-dashboard.component';
import { FinalSettlementComponent } from "../final-settlement/final-settlement.component";
import { FormsModule } from '@angular/forms';
import { StatutoryBenefit, StatutoryForm } from '../statutory-form/statutory-form';


@Component({
  selector: 'app-statutory',
  standalone: true,
  imports: [CommonModule, FormsModule,StatutoryForm, GratuityComponent, EosbAccrualDashboardComponent, FinalSettlementComponent],
  templateUrl: './statutory.html',
  styleUrls: ['./statutory.scss']
})
export class Statutory {
  benefits: StatutoryBenefit[] = [];

  pifss: StatutoryBenefit = {
    id: 'pifss',
    name: 'Public Institution for Social Security (PIFSS)',
    employerContribution: 11,
    employeeContribution: 10,
    contributoryWageMax: 10000,
    contributoryWageMin: 0,
    proRata: false,
    renewal: true,
    employees: 1
  };

  sio: StatutoryBenefit = {
    id: 'sio',
    name: 'Social Insurance Organization (SIO)',
    employerContribution: 14,
    employeeContribution: 7,
    contributoryWageMax: 10000,
    contributoryWageMin: 0,
    proRata: false,
    renewal: true,
    employees: 1
  };

  onSave(benefit: StatutoryBenefit) {
    const index = this.benefits.findIndex(b => b.id === benefit.id);
    if (index > -1) {
      this.benefits[index] = benefit;
    } else {
      this.benefits.push(benefit);
    }
  }

  statutoryTabs = [
    { key: 'pension', label: 'Pension (GPSSA)' },
    { key: 'gosi', label: 'GOSI (Social Insurance)' },
    { key: 'sio', label: 'SIO (Social Insurance Organization)' },
    { key: 'pifss', label: 'PIFSS (Public Institution for Social Security)' },
    { key: 'wps', label: 'WPS (Wage Protection System)' },
    // { key: 'gratuity', label: 'Gratuity' },
    // { key: 'final-settlement', label: 'Final Settlement' },
    // { key: 'eosb', label: 'End of Service' },
  ];

  activeTab: 'pension' | 'gosi' | 'wps' | 'gratuity' | 'eosb' | 'final-settlement' | 'sio' | 'pifss' = 'pension';

  // GOSI Calculation State
  gosiGrossSalary: number | null = null;
  gosiIsEmirati: boolean = true;
  gosiEmployerPercent: number = 12.5;
  gosiEmployeePercent: number = 5;
  gosiGovPercent: number = 2.5;

  gosiResult = { employer: 0, employee: 0, government: 0, total: 0 };

  // GPSSA (Pension) state
  gpPlan: 'old' | 'new' = 'new';
  gpMonthlyWage: number | null = null;
  gpMaxWage: number = 50000; // per month
  gpProRata: boolean = false;
  gpPostpone: boolean = true;

  // constants (can be shown in UI)
  gpOld = { employeePct: 5, employerPct: 12.5, min: 1000, max: 50000 };
  gpNew = { employeePct: 11, employerPct: 15, employerPctLow: 12.5, lowThreshold: 20000, min: 3000, max: 70000 };

  gpResult = { employee: 0, employer: 0, total: 0 };


  setActiveTab(tab: string) {
    this.activeTab = tab as 'pension' | 'gosi' | 'wps' | 'gratuity' | 'eosb' | 'final-settlement';
  }

  computeGosi(): void {
    const salary = Number(this.gosiGrossSalary) || 0;
    if (!this.gosiIsEmirati || salary <= 0) {
      this.gosiResult = { employer: 0, employee: 0, government: 0, total: 0 };
      return;
    }
    const employer = +(salary * (this.gosiEmployerPercent / 100)).toFixed(2);
    const employee = +(salary * (this.gosiEmployeePercent / 100)).toFixed(2);
    const government = +(salary * (this.gosiGovPercent / 100)).toFixed(2);
    const total = +(employer + employee + government).toFixed(2);
    this.gosiResult = { employer, employee, government, total };
  }

  computeGp(): void {
    const wage = Number(this.gpMonthlyWage) || 0;
    if (wage <= 0) { this.gpResult = { employee: 0, employer: 0, total: 0 }; return; }
    const contributory = Math.min(wage, Number(this.gpMaxWage) || 0);
    if (this.gpPlan === 'old') {
      const emp = +(contributory * (this.gpOld.employeePct / 100)).toFixed(2);
      const empr = +(contributory * (this.gpOld.employerPct / 100)).toFixed(2);
      this.gpResult = { employee: emp, employer: empr, total: +(emp + empr).toFixed(2) };
    } else {
      const empPct = this.gpNew.employeePct;
      const emprPct = contributory < this.gpNew.lowThreshold ? this.gpNew.employerPctLow : this.gpNew.employerPct;
      const emp = +(contributory * (empPct / 100)).toFixed(2);
      const empr = +(contributory * (emprPct / 100)).toFixed(2);
      this.gpResult = { employee: emp, employer: empr, total: +(emp + empr).toFixed(2) };
    }
  }

  saveGp(): void {
    // Placeholder save. Integrate with backend when endpoint is available.
    console.log('Saving GPSSA settings', {
      plan: this.gpPlan,
      monthlyWage: this.gpMonthlyWage,
      maxWage: this.gpMaxWage,
      proRata: this.gpProRata,
      postpone: this.gpPostpone,
      result: this.gpResult
    });
    alert('GPSSA settings saved');
  }
}
