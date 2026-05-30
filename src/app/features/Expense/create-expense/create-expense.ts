import { Component, Input, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../core/services/toast.service';
import { Party } from '../../parties/party/party';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../../core/services/api';
import { CreateCash } from '../../manage-money/create-cash/create-cash';
import { CreateBank } from '../../manage-money/create-bank/create-bank';
import { ExpenseCategory } from '../expense-category/expense-category';

@Component({
  selector: 'app-create-expense',
  templateUrl: './create-expense.html',
  styleUrls: ['./create-expense.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule,Party,CreateCash,CreateBank,ExpenseCategory],
  schemas: [] // Add NO_ERRORS_SCHEMA if needed for custom directives
})
export class CreateExpenseComponent implements OnInit {
@Input() modalRef:any;
@Input() isModal: any
@Input() editinvoiceId: any
  expenseForm!: FormGroup;
  keyword = 'category';
  keyword1 = 'Party_name';
  
  // UAE-specific fake data
  createdPartyData:any[]=[];
  categoryData:any[]=[];
  c_Ledger:any[]=[];
  bankList:any[]=[];

  // UAE VAT rate (5%)
  // vatRate = 5;
  
  // Calculated properties
  subTotal: number = 0;
  vat: number = 0;
  total_amount: number = 0;
  
  // Modal references
  partyModalRef: any;
  modal: any;

  companyTRN = '10000000001'; // Example: fetch from company settings or API
  partyTRN: string = '';
  vatWarning = '';

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private modalService: NgbModal,
    private api: Api,
    @Optional() public activeModal?: NgbActiveModal
  ) { 
    this.expenseForm = this.fb.group({
      party_name: [''],
      expense_category: ['', Validators.required],
      payment_date: ['', Validators.required],
      payment_type: [1, Validators.required],
      handover_to: [''],
      bank_name: [''],
      cleared_date: [''],
      reference_no: [''],
      invoice_date: [''],
      invoice_no: [''],
      is_vat: [false],
      vat_rate: [0],
      vat_type: ['1'],
      catName: [''],
      data: this.fb.array([]),
      company: [ this.api.getUserCompany()],
      subTotal: [0],
      vat: [0],
      total_amount: [0],
      id:[]
    });
  }
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    
 
    this.loadParties();
    this.getExpenseList();
    this.getCashList();
    this.getBankList();
    this.getcompany();
    // Remove checkVatEligibility from here as it might override API data
    if(this.editinvoiceId){
      this.getparticulars();
    }else{
      this.expenseForm.patchValue({
        payment_date: this.formatDate(new Date()),
        cleared_date: this.formatDate(new Date()),
        invoice_date: this.formatDate(new Date()),
      })
    this.addExpensesField(); // Add one row by default
    // Check VAT eligibility after form is initialized
    setTimeout(() => this.checkVatEligibility(), 100);

    }
  }
  getcurrency(){
   
    return this.api.getcurrencies();
  }
  getcurrencysecond(){
   
    return this.api.getcurrenciesecond();
  }
  getparticulars(){
    this.api.post('/expense/get-expense/',{id:this.editinvoiceId,company:this.api.getUserCompany()}).subscribe({
      next: (response: any) => {
        console.log('Expense API Response:', response);
        
        if(response.status === "success" && response.data) {
          // Clear existing expense array first
          this.exArray.clear();
          
          // Patch the main form values
          this.expenseForm.patchValue({
            payment_date: response.data.payment_date,
            invoice_date: response.data.invoice_date,
            cleared_date: response.data.cleared_date,
            total_amount: response.data.total_amount,
            subTotal: response.data.subTotal,
            amount: response.data.amount,
            description: response.data.description,
            expense_category: response.data.expense_category,
            party_name: response.data.party_name,
            payment_type: response.data.payment_type,
            bank_name: response.data.bank_name,
            handover_to: response.data.handover_to,
            reference_no: response.data.reference_no,
            invoice_no: response.data.invoice_no,
            cheque_no: response.data.cheque_no,
            vat_rate: response.data.vat_rate,
            vat: response.data.vat,
            tax_amt: response.data.tax_amt,
            is_vat: response.data.is_vat,
            vat_type: response.data.vat_type,
            exp_currency: response.data.exp_currency,
            exchange_rate: response.data.exchange_rate
          });
          
          // Debug: Check if is_vat is properly set
          console.log('API is_vat value:', response.data.is_vat);
          console.log('Form is_vat value after patch:', this.expenseForm.get('is_vat')?.value);
          
          // Force update is_vat if needed
          if (response.data.is_vat !== undefined) {
            this.expenseForm.get('is_vat')?.setValue(response.data.is_vat);
            console.log('Force updated is_vat to:', response.data.is_vat);
          }
          
          // Add expense items from the data array
          if(response.data.data && Array.isArray(response.data.data)) {
            response.data.data.forEach((item: any) => {
              this.exArray.push(this.fb.group({
                desc: [item.desc || ''],
                amt: [item.amt || 0]
              }));
            });
          } else {
            // If no data array, add at least one empty row
            this.addExpensesField();
          }
          
          // Recalculate totals after loading data
          this.calculateAmount();
          
          // Load party TRN data for VAT eligibility check
          if (response.data.party_name) {
            this.onPartyChange(response.data.party_name);
          }
          
          // Check VAT eligibility after data is loaded
          setTimeout(() => this.checkVatEligibility(), 100);
          
          console.log('Expense form populated successfully');
        } else {
          console.error('Invalid response format or status:', response);
          this.toast.show('Error', 'Failed to load expense data', 'danger');
        }
      },
      error: (error) => {
        console.error('Error fetching expense data:', error);
        this.toast.show('Error', 'Failed to load expense data', 'danger');
      }
    });
  }
  getcompany(){
    this.api.get('/company/get-company/1/').subscribe({
      next: (response: any) => {
        console.log('Company response:', response);
        if (response.data && response.data.trn) {
          this.companyTRN = response.data.trn;
          console.log('Company TRN set to:', this.companyTRN);
        }
      },
      error: (error) => {
        console.error('Error loading company data:', error);
      }
    });
  }

  // Getter for easy access to form controls in the template
  get p() { return this.expenseForm.controls; }
  
  // Getter for the FormArray
  get exArray() {
    return this.expenseForm.get('data') as FormArray;
  }
  
  createExpenseItem(): FormGroup {
    return this.fb.group({
      desc: ['', Validators.required],
      amt: ['', [Validators.required, Validators.min(0)]]
    });
  }

  addExpensesField() {
    this.exArray.push(this.createExpenseItem());
  }
  
  delete(index: number) {
    if (this.exArray.length > 1) {
      this.exArray.removeAt(index);
      this.calculateAmount();
    }
  }

  // UAE VAT calculation
  calculateAmount() {
    let subTotal = 0;
    this.exArray.controls.forEach(control => {
        subTotal += control.get('amt')?.value || 0;
    });
    this.expenseForm.patchValue({
      subTotal: subTotal,
      vat: 0,
      total_amount: subTotal
    });
    
    const vatRate = this.expenseForm.get('vat_rate')?.value || 0;
    if(this.expenseForm.get('is_vat')?.value) {
      this.expenseForm.patchValue({
        vat: this.expenseForm.get('subTotal')?.value * (vatRate / 100),
        total_amount: this.expenseForm.get('subTotal')?.value + this.expenseForm.get('vat')?.value
      });
    } else {
      this.expenseForm.patchValue({
        vat: 0,
        total_amount: this.expenseForm.get('subTotal')?.value
      });
    }
    this.expenseForm.patchValue({
      total_amount: this.expenseForm.get('subTotal')?.value + this.expenseForm.get('vat')?.value
    });
    console.log('Calculating amount with UAE VAT...');
  }

  onClickSubmit() {
    if (this.expenseForm.valid) {
      const formValue = this.expenseForm.value;
      console.log('Expense Form Submitted:', formValue);
      
      // Add company to the payload
      formValue.company = this.api.getUserCompany();
      
      if (this.editinvoiceId) {
        // Update existing expense
        formValue.id = this.editinvoiceId;
        this.api.put('/expense/edit_expense/', formValue).subscribe({
          next: (response: any) => {
            if(response.status === "success" || response.status === 200){
              this.modalRef?.close();
              this.toast.show('Success', 'Expense updated successfully!', 'success');
            } else {
              this.toast.show('Error', response.message || 'Failed to update expense', 'danger');
            }
            console.log('Expense updated:', response);
          },
          error: (error) => {
            console.error('Error updating expense:', error);
            this.toast.show('Error', 'Failed to update expense', 'danger');
          }
        });
      } else {
        // Create new expense
        this.api.post('/expense/create_expense/', formValue).subscribe({
          next: (response: any) => {
            if(response.status === "success" || response.status === 200){
              this.modalRef?.close();
              this.toast.show('Success', 'Expense recorded successfully!', 'success');
            } else {
              this.toast.show('Error', response.message || 'Failed to record expense', 'danger');
            }
            console.log('Expense created:', response);
          },
          error: (error) => {
            console.error('Error creating expense:', error);
            this.toast.show('Error', 'Failed to record expense', 'danger');
          }
        });
      }
    } else {
      this.toast.show('Error', 'Please fill all required fields correctly', 'danger');
      this.markFormGroupTouched();
    }
  }
  
  markFormGroupTouched() {
    Object.keys(this.expenseForm.controls).forEach(key => {
      const control = this.expenseForm.get(key);
      control?.markAsTouched();
    });
  }
  
  closeModal() {
    if (this.activeModal) {
      this.activeModal.close();
    } else if (this.modalRef) {
      this.modalRef.close();
    }
  }

  blargeModal(content: any) { 
    this.partyModalRef=this.modalService.open(content, {
      centered: true,
      size: 'xl',
      backdrop: 'static'
    });
    console.log('blargeModal triggered'); }
    centerModal(content: any) {
    this.modal=this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: 'static'
    });
    console.log('centerModal triggered'); }
  largeModal2(content: any) {
    this.modal=this.modalService.open(content, {
      centered: true,
      size: 'xl',
      backdrop: 'static'
    });
    console.log('largeModal2 triggered'); }
  largeModalbank(content: any) {
    this.modal=this.modalService.open(content, {
      centered: true,
      size: 'xl',
      backdrop: 'static'
    });
    console.log('largeModalbank triggered'); }

  calculatePartygst(event: any) { console.log('calculatePartygst triggered', event); }
  onFocused(event: any) { console.log('onFocused triggered', event); }
  datetime(event: any) { console.log('datetime triggered', event.target.value); }

  checkvat(event: any) { // Changed from checktax to checkvat
    console.log('checkvat triggered', event.target.checked);
    this.calculateAmount();
  }
  
  catName() { console.log('catName triggered'); }
  partyCreation(event: any) { 
    }
    addBankFunction(event: any) { 
    console.log('addBankFunction triggered', event);
    this.getBankList();
  }
  cashAddLedger(event: any) {
    console.log('cashAddLedger triggered', event);
    this.getCashList();
  }

  loadParties() {
    this.api.post('/party/list-party/s=/', {
      // page_size: 9,
      // page: 1,
      company:  this.api.getUserCompany()
    }).subscribe({
      next: (response: any) => { 
        this.createdPartyData = response.data || [];
        console.log('Parties loaded:', this.createdPartyData);
        
        // If we're editing and have a party_name, set the TRN
        if (this.editinvoiceId && this.expenseForm.get('party_name')?.value) {
          this.onPartyChange(this.expenseForm.get('party_name')?.value);
        }
      },
      error: (error) => {
        console.error('Error loading parties:', error);
      }
    });
  }
  getExpenseList(){
    this.api.get('/expense/list-expense-category/'+ this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        this.categoryData=response.data;
        console.log('Expense list:', response);
      }
    });
  }
  getCashList(){
    this.api.get('/money/list-cash/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Cash list:', response);
        if(response.status === 200){
          this.c_Ledger = response.data;
          console.log('Cash list:', this.c_Ledger);
          // this.toast.show('Success', 'Cash list loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading cash list:', error);
        this.toast.show('Error', 'Failed to load cash list', 'danger');
      }
    });
  }
  getBankList(){
    this.api.get('/money/list-bank/'+ this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Bank list:', response);
        if(response.status === 200){
          this.bankList = response.data;
          console.log('Bank list:', this.bankList);
          // this.toast.show('Success', 'Bank list loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading bank list:', error);
        this.toast.show('Error', 'Failed to load bank list', 'danger');
      }
    });
  }
  getExpenseCategory(event: any) {
    console.log('getExpenseCategory triggered', event);
    this.getExpenseList();
  }

  onPartyChange(partyId: string) {
    if (!partyId) {
      this.partyTRN = '';
      this.checkVatEligibility();
      return;
    }
    // Find the selected party and get its TRN
    const party = this.createdPartyData.find(p => p.id == partyId);
    this.partyTRN = party?.trn || '';
    this.checkVatEligibility();
  }

  checkVatEligibility() {
    const isVatControl = this.expenseForm.get('is_vat');
    
    // Debug: Log TRN values
    console.log('Company TRN:', this.companyTRN);
    console.log('Party TRN:', this.partyTRN);
    console.log('Edit Mode:', this.editinvoiceId);
    
    if (this.companyTRN && this.partyTRN) {
      this.vatWarning = '';
      isVatControl?.enable();
      console.log('VAT control enabled');
    } else {
      this.vatWarning = 'VAT cannot be applied unless both company and party have valid TRNs.';
      
      // Don't disable VAT control when editing existing expenses
      if (!this.editinvoiceId) {
        isVatControl?.disable();
        this.expenseForm.patchValue({ is_vat: false });
        console.log('VAT control disabled for new expense');
      } else {
        // Keep VAT control enabled for editing, just show warning
        isVatControl?.enable();
        console.log('VAT control kept enabled for editing');
      }
    }
  }
  close() {
    if (this.activeModal) {
      this.activeModal.close();
    }
  }

  getSelectedPartyName(): string {
    const partyId = this.expenseForm.get('party_name')?.value;
    if (!partyId) return '';
    const party = this.createdPartyData.find(p => p.id == partyId);
    return party?.partyName || '';
  }

  getSelectedCategoryName(): string {
    const categoryId = this.expenseForm.get('expense_category')?.value;
    if (!categoryId) return '';
    const category = this.categoryData.find(c => c.id == categoryId);
    return category?.category || '';
  }

  openPartySearch() {
    // For now, just focus the hidden select
    // You can implement a search modal here if needed
    const select = document.querySelector('select[formControlName="party_name"]') as HTMLSelectElement;
    if (select) {
      select.focus();
      select.click();
    }
  }

  openCategorySearch() {
    // For now, just focus the hidden select
    // You can implement a search modal here if needed
    const select = document.querySelector('select[formControlName="expense_category"]') as HTMLSelectElement;
    if (select) {
      select.focus();
      select.click();
    }
  }
}
