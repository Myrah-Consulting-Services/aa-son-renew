import { Component } from '@angular/core';
import { Api } from '../../../core/services/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-expense-register',
  imports: [FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './expense-register.html',
  styleUrl: './expense-register.scss'
})
export class ExpenseRegister {
  expenseRegister: unknown;
  pagination: any;
  page_size: number = 10;
  current_page: number = 1;
  dateFrom: string = '';
  dateTo: string = '';
  isLoading: boolean = false;
  constructor(private api: Api) {}
ngOnInit(): void {
  //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
  //Add 'implements OnInit' to the class.
  this.getDates();
}
getDates() {
  this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  this.dateTo = new Date().toISOString().split('T')[0];
  this.getExpenseRegister();
}
getExpenseRegister() {
  this.isLoading = true;
  const params = {
    company: this.api.getCompanyId(),
    start_date: this.dateFrom,
    end_date: this.dateTo,
    limit: this.page_size,
    page_number: this.current_page
  }
  
  this.api.post('/reports/search-expense-register/all/', params).subscribe((res:any) => { 
    if(res.status == 200) {
      this.isLoading = false;
      this.expenseRegister = res.data;
      this.pagination = res.pagination;
    }
  });
}

  // Computed summary getters for template
  get totalRecords(): number {
    const list: any[] = (this.expenseRegister as any[]) || [];
    return list.length;
  }

  get totalTaxable(): number {
    const list: any[] = (this.expenseRegister as any[]) || [];
    return list.reduce((sum, e) => sum + (e?.taxable_amount || 0), 0);
  }

  get totalVat(): number {
    const list: any[] = (this.expenseRegister as any[]) || [];
    return list.reduce((sum, e) => sum + (e?.vat || 0), 0);
  }

  get totalAmount(): number {
    const list: any[] = (this.expenseRegister as any[]) || [];
    return list.reduce((sum, e) => sum + (e?.total_amount || 0), 0);
  }

  get totalPaid(): number {
    const list: any[] = (this.expenseRegister as any[]) || [];
    return list.reduce((sum, e) => sum + (e?.amount || 0), 0);
  }
}
