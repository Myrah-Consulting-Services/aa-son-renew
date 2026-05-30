import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
export interface StatutoryBenefit {
  id: string;
  name: string;
  employerContribution: number;
  employeeContribution: number;
  contributoryWageMax: number;
  contributoryWageMin?: number;
  proRata: boolean;
  renewal: boolean;
  employees: number;
}
@Component({
  selector: 'app-statutory-form',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './statutory-form.html',
  styleUrl: './statutory-form.scss'
})
export class StatutoryForm {
  @Input() title: string = '';
  @Input() benefit: StatutoryBenefit = {
    id: '',
    name: '',
    employerContribution: 0,
    employeeContribution: 0,
    contributoryWageMax: 0,
    contributoryWageMin: 0,
    proRata: false,
    renewal: false,
    employees: 0
  };

  @Output() saved = new EventEmitter<StatutoryBenefit>();

  save() {
    this.saved.emit(this.benefit);
  } 
}
