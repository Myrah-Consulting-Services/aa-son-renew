import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-create-bank',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
  providers: [DatePipe],
  templateUrl: './create-bank.html',
  styleUrl: './create-bank.scss'
})
export class CreateBank {
  @Input() bankId: string | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() modalRef: any;
  @Output() bankSaved = new EventEmitter<any>();
  bankForm: FormGroup;
  submitted = false;
  currencies = [
    { id: 1, code: 'AED', name: 'UAE Dirham' },
    { id: 2, code: 'USD', name: 'US Dollar' }
  ];

  constructor(
    private fb: FormBuilder, 
    private datepipe: DatePipe, 
    private translate: TranslateService, 
    private api: Api,
    private toast: ToastService
  ) {
    // Example: get company start date from session or set a default
    this.bankForm = this.fb.group({
      bank_name: ['', Validators.required],
      user: ['', Validators.required],
      account_no: ['', [Validators.required]],
      ifsc_code: ['', [Validators.required ]],
      address: ['', Validators.required],
      bank_branch: ['', Validators.required],
      ad_code: [''],
      swift_code: [''],
      opening_balance: [0, [Validators.required, this.amountValidator]],
      as_on: ['', [Validators.required]],
      id: [''],
      company: [this.api.getCompanyId()],
      bank_type: [1, Validators.required],
    });
    // this.ibanValidator()
    // this.bicSwiftValidator()
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.bankId) {
      this.getbankdetails();
    }
  }
  getbankdetails(){
    this.api.get(`/money/get-bank/${this.bankId}/`).subscribe({
      next: (data: any) => {
        if(data.status === 200){
          this.bankForm.patchValue(data.data);
          this.toast.show('Success', 'Bank details loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading bank details:', error);
        this.toast.show('Error', 'Failed to load bank details', 'danger');
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  inputValue(event: any) {
    event.target.value = event.target.value.toLocaleUpperCase();
  }
  getcurrency(){
   
    return this.api.getcurrencies();
  }
  getcurrencysecond(){
   
    return this.api.getcurrenciesecond();
  }

  get f() { return this.bankForm.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.bankForm.valid) {
      if (this.mode === 'edit' && this.bankId) {
        // Edit mode: update existing bank
        this.api.put(`/money/update-bank/`, this.bankForm.value).subscribe({
          next: (response: any) => {
            this.bankSaved.emit(response);
            this.modalRef.close();
            this.toast.show('Success', 'Bank updated successfully', 'success');
          },
          error: (error) => {
            console.error('Error updating bank:', error);
            this.toast.show('Error', 'Failed to update bank', 'danger');
          }
        });
      } else {
        // Create mode: create new bank
        this.api.post('/money/create-bank/', this.bankForm.value).subscribe({
          next: (response: any) => {
            this.bankSaved.emit(response);
            this.modalRef.close();
            this.toast.show('Success', 'Bank created successfully', 'success');
          },
          error: (error) => {
            console.error('Error creating bank:', error);
            this.toast.show('Error', 'Failed to create bank', 'danger');
          }
        });
      }
    } else {
      this.toast.show('Error', 'Please fill all required fields correctly', 'danger');
    }
  }

  amountValidator(control: AbstractControl) {
    const value = control.value;
    if (value < 0) {
      return { invalidAmount: true };
    }
    return null;
  }

  // Custom validator for UAE IBAN format
  ibanValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      
      // UAE IBAN format: AE + 2 check digits + 3 bank code + 16 account number = 23 characters
      const uaeIbanPattern = /^AE\d{2}[A-Z]{4}\d{16}$/;
      
      if (!uaeIbanPattern.test(value)) {
        return { 'invalidIban': { value: value } };
      }
      
      return null;
    };
  }

  // Custom validator for BIC/SWIFT code format
  bicSwiftValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      
      // BIC/SWIFT format: 4 letters (bank code) + 2 letters (country code) + 2 letters/numbers (location code) + 3 letters/numbers (branch code, optional)
      const bicSwiftPattern = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
      
      if (!bicSwiftPattern.test(value)) {
        return { 'invalidBicSwift': { value: value } };
      }
      
      return null;
    };
  }
}
