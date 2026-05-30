import { Component, Input, Optional } from '@angular/core';
import { CreateCash } from '../create-cash/create-cash';
import { CreateBank } from '../create-bank/create-bank';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-cash-deposit',
  standalone: true,
  imports: [CreateCash, CreateBank, CommonModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './cash-deposit.html',
  styleUrl: './cash-deposit.scss'
})
export class CashDeposit {
  @Input() editinvoiceId: any;
  @Input() modalRef: any;
  cashdForm: FormGroup;
  bankData: any[] = [];
  cashLedger: any[] = [];
  modalRef1: any;
  isModal: boolean = false;
  constructor(private fb: FormBuilder, private modalService: NgbModal, private api: Api, private toast: ToastService, @Optional() public activeModal?: NgbActiveModal) {
    this.cashdForm = this.fb.group({
      bank: ['', Validators.required],
      ledger: ['', Validators.required],
      amount: [1, [Validators.required]],
      date: ['', [Validators.required]],
      company: [this.api.getUserCompany()]
    });
    // Set default date for date (yyyy-MM-dd)
    const today = new Date();
    this.cashdForm.controls['date'].patchValue(today.toISOString().slice(0, 10));
  }

  ngOnInit(){
    this.getBankList();
    this.getCashList();
    if(this.editinvoiceId){
      this.getparticular();
    }
  }
  getparticular(){
    this.api.get('/money/get-transaction/'+this.editinvoiceId+'/').subscribe({
      next: (response: any) => {
        console.log('Cash Deposit:', response);
        if(response.status === 200){
          this.cashdForm.patchValue(response.data);
        }
      }
    });
  }

  onSubmit() {
    if (this.cashdForm.valid) {
      console.log('Cash Deposit Form Value:', this.cashdForm.value);
      // Add your API call or logic here
      if(this.editinvoiceId){
        this.api.put('/money/update-withdrawal/'+this.editinvoiceId+'/', this.cashdForm.value).subscribe({
          next: (response: any) => {
            if(response.status === 200){
              this.cashdForm.reset();
              this.toast.show('Success', 'Cash Deposit Successfully', 'success');
              // this.modalRef.close();
              this.close()
            }
          }
        });
      }else{
        this.api.post('/money/cash-deposit/', this.cashdForm.value).subscribe({
        next: (response: any) => {
          if(response.status === 200){
            this.cashdForm.reset();
            this.modalRef.close();
            this.toast.show('Success', 'Cash Deposit Successfully', 'success');
          }else{
            this.toast.show('Error', 'Cash Deposit Failed', 'danger');
          }
              console.log('Cash Deposit Response:', response);
        }
      });}
    }
  }

  largeModalbank(largeDataModalbank: any) {
    this.modalRef1 = this.modalService.open(largeDataModalbank, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }
  largeModal2(largeDataModal2: any) {
    this.modalRef1 = this.modalService.open(largeDataModal2, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }
  getBankList(){
    this.api.get('/money/list-bank/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Bank list:', response);
        if(response.status === 200){
          this.bankData = response.data;
          console.log('Bank list:', this.bankData);
          // this.toast.show('Success', 'Bank list loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading bank list:', error);
        // this.toast.show('Error', 'Failed to load bank list', 'danger');
      }
    });
  }
  getCashList(){
    this.api.get('/money/list-cash/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Cash list:', response);
        if(response.status === 200){
          this.cashLedger = response.data;
          console.log('Cash list:', this.cashLedger);
          // this.toast.show('Success', 'Cash list loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading cash list:', error);
        // this.toast.show('Error', 'Failed to load cash list', 'danger');
      }
    });
  }
  close() {
    if(this.activeModal){
          this.activeModal.close();
        }
  }
}
