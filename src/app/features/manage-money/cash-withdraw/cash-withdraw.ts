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
  selector: 'app-cash-withdraw',
  standalone: true,
  imports: [CreateCash, CreateBank, CommonModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './cash-withdraw.html',
  styleUrl: './cash-withdraw.scss'
})
export class CashWithdraw {
  @Input() editinvoiceId: any;
  @Input() modalRef: any;
  cashWForm: FormGroup;
  bankList: any[] = [];
  cashList: any[] = [];
  modalRef1: any;
  isModal: boolean = false;

  constructor(private fb: FormBuilder, private modalService: NgbModal, private api: Api, private toast: ToastService, @Optional() public activeModal?: NgbActiveModal) {
    this.cashWForm = this.fb.group({
      bank: ['', Validators.required],
      ledger: ['', Validators.required],
      amount: [1, [Validators.required]],
      date: ['', [Validators.required]],
      company: [this.api.getUserCompany()]
    });
    // Set default date for date (yyyy-MM-dd)
    const today = new Date();
    this.cashWForm.controls['date'].patchValue(today.toISOString().slice(0, 10));
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
        if(response.status === 200){
          this.cashWForm.patchValue(response.data);
        }
        console.log('Cash Withdrawal:', response);
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }
  getBankList(){
    this.api.get('/money/list-bank/'+this.api.getUserCompany()+'/').subscribe({
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
        // this.toast.show('Error', 'Failed to load bank list', 'danger');
      }
    });
  }
  getCashList(){
    this.api.get('/money/list-cash/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Cash list:', response);
        if(response.status === 200){
          this.cashList = response.data;
          console.log('Cash list:', this.cashList);
          // this.toast.show('Success', 'Cash list loaded successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error loading cash list:', error);
        // this.toast.show('Error', 'Failed to load cash list', 'danger');
      }
    });
  }
  onSubmit() {
    if (this.cashWForm.valid) {
      console.log('Cash Withdraw Form Value:', this.cashWForm.value);
      // Add your API call or logic here
      if(this.editinvoiceId){
        this.api.put('/money/update-withdrawal/'+this.editinvoiceId+'/', this.cashWForm.value).subscribe({
          next: (response: any) => {
            if(response.status === 200){
              this.cashWForm.reset();
              this.toast.show('Success', 'Cash Withdraw Successfully', 'success');
              // this.modalRef.close();
              this.close()
            }
          }
        });
      }else{
        this.api.post('/money/cash-withdrawal/', this.cashWForm.value).subscribe({
        next: (response: any) => {
          if(response.status === 200){
            this.cashWForm.reset();
            this.modalRef.close();
            this.toast.show('Success', 'Cash Withdraw Successfully', 'success');
          }else{
            this.toast.show('Error', 'Cash Withdraw Failed', 'danger');
          }
          console.log('Cash Withdraw Response:', response);
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
  close() {
    if (this.activeModal) {
      this.activeModal.close();
    }
  }
}
