import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-create-cash',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,TranslateModule],
  templateUrl: './create-cash.html',
  styleUrl: './create-cash.scss'
})
export class CreateCash {
  @Input() cashId: string | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() ledger: any;
  @Input() ledger2: any;
  @Input() modalRef: any;
  @Output() cashAddLedger1: EventEmitter<any> = new EventEmitter();
  reactiveForm: FormGroup;
  currencies = [
    { id: 1, code: 'AED', name: 'UAE Dirham' },
    { id: 2, code: 'USD', name: 'US Dollar' }
  ];

  constructor(
    private fb: FormBuilder, 
    private api: Api,
    private toast: ToastService
  ) {
    this.reactiveForm = this.fb.group({
      ledger_name: ['', Validators.required],
      opening_balance: ['', Validators.required],
      as_on: ['', Validators.required],
      id: [''],
      company: [this.api.getCompanyId()],
      cash_type: [1, Validators.required],
    });
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.cashId) {
      this.getCashDetails();
    }
  }

  getCashDetails() {
    this.api.get(`/money/get-cash/${this.cashId}/`).subscribe({
      next: (data: any) => {
        if (data.status === 200) {
          this.reactiveForm.patchValue(data.data);
          this.toast.show('Success', 'Cash details loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading cash details:', error);
        this.toast.show('Error', 'Failed to load cash details', 'danger');
      }
    });
  }

  onCashLedger() {
    if (this.reactiveForm.valid) {
      if (this.mode === 'edit' && this.cashId) {
        this.api.put(`/money/update-cash/`, this.reactiveForm.value).subscribe({
          next: (response: any) => {
            if(response.status === 200){
              this.reactiveForm.reset();
              this.modalRef.dismiss();
              this.toast.show('Success', 'Cash ledger updated successfully', 'success');
            }
          },
          error: (error) => {
            console.error('Error updating cash ledger:', error);
            this.toast.show('Error', 'Failed to update cash ledger', 'danger');
          }
        });
      } else {
        this.api.post('/money/create-cash/', this.reactiveForm.value).subscribe({
          next: (response: any) => {
            if(response.status === 200){
              this.reactiveForm.reset();
              this.modalRef.dismiss();
              this.toast.show('Success', 'Cash ledger created successfully', 'success');
            }
          },
          error: (error) => {
            console.error('Error creating cash ledger:', error);
            this.toast.show('Error', 'Failed to create cash ledger', 'danger');
          }
        });
      }
    } else {
      this.toast.show('Error', 'Please fill all required fields correctly', 'danger');
    }
  }
  OnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        event.preventDefault();
    }
}
getcurrency(){
   
  return this.api.getcurrencies();
}
getcurrencysecond(){
 
  return this.api.getcurrenciesecond();
}

}
