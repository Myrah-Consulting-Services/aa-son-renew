import { Component } from '@angular/core';
import { Api } from '../../../core/services/api';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExpenseCategory } from '../expense-category/expense-category';
import { ToastService } from '../../../core/services/toast.service';
import { CreateExpenseComponent } from '../create-expense/create-expense';
import { ExpenseLedger } from '../expense-ledger/expense-ledger';

@Component({
  selector: 'app-expense-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ExpenseCategory, CreateExpenseComponent, ExpenseLedger],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss'
})
export class ExpenseList {
  expenses:any[]=[];
  currentPage = 1;
  pageSize = 10;
  get paginatedExpenses() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.expenses.slice(start, start + this.pageSize);
  }
  get totalPages() {
    return Math.ceil(this.expenses.length / this.pageSize) || 1;
  }
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  expenselistform:FormGroup;
  expenseSelected:any;
  modalRef:any;
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  constructor(private api: Api,private fb:FormBuilder,private modalService: NgbModal,private toast:ToastService) {
 
    this.expenselistform=this.fb.group({
      start_date: [],
      end_date: [],
    })
  }
  ngOnInit(): void {
    this.expenselistform.patchValue({
      start_date: this.formatDate(new Date()),
      end_date: this.formatDate(new Date()),
    })
    this.getExpenseList();

  }
  getExpenseList(){
    this.api.post('/expense/expense-report/'+ this.api.getUserCompany()+'/',this.expenselistform.value).subscribe({
      next: (response: any) => {
        this.expenses=response.data;
        console.log('Expense list:', response);
      }
    });
  }
  get startItem() {
    return this.expenses.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }
  get endItem() {
    const end = this.currentPage * this.pageSize;
    return end > this.expenses.length ? this.expenses.length : end;
  }
  openExpenseCategoryModal(modal: any, expense?: any) {
    if(expense){
      this.expenseSelected=expense;
    }
   this.modalRef= this.modalService.open(modal, {
      centered: true,
      size: 'md',
      backdrop: 'static'
    });
  }
  getcurrency(){
   
    return this.api.getcurrencies();
  }
  getcurrencysecond(){
   
    return this.api.getcurrenciesecond();
  }
  openExpenseLedgerModal(modal: any, expense?: any) {
    if(expense){
      this.expenseSelected=expense.id;
    }
    this.modalRef= this.modalService.open(modal, {
      centered: true,
      size: 'xl',
      backdrop: 'static'
    });
  }
  getExpenseCategory(data:any){
    this.getExpenseList();
    console.log(data);
  }
  closeModal(){
    this.modalService.dismissAll();
  }
  deleteExpenseCategory(id:any){
//  ask before delete
    if(confirm('Are you sure you want to delete this expense category?')){
    this.api.delete('/expense/delete-expense-category/'+id+'/').subscribe({
      next: (response: any) => {
        if(response.status==200){
          this.getExpenseList();
          this.toast.show('Success', 'Expense category deleted successfully', 'success');
        }else{
          this.toast.show('Error', response.message, 'danger');
        }
        }
      });
    }else{
      this.toast.show('Error', 'Expense category not deleted', 'danger');
    }
  }
  createExpense(expenseModal:any) {
    this.modalRef= this.modalService.open(expenseModal, {
      centered: true,
      size: 'xl',
      backdrop: 'static'
    });
  }
  onSubmit() {
    // Handle form submission, e.g., fetch filtered expenses
    this.getExpenseList();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}
