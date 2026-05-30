import { Component, Input, Optional } from '@angular/core';
import { CreateBank } from '../create-bank/create-bank';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-bank-to-bank',
  standalone: true,
  imports: [CreateBank, CommonModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './bank-to-bank.html',
  styleUrl: './bank-to-bank.scss'
})
export class BankToBank {
  @Input() editinvoiceId: any;
  @Input() modalRef: any;
  bankToForm: FormGroup;
  bankData: any[] = [];
  modalRef1: any;
  isModal: boolean = false;
  constructor(private fb: FormBuilder, private modalService: NgbModal, private api: Api, private toast: ToastService, @Optional() public activeModal?: NgbActiveModal) {
    this.bankToForm = this.fb.group({
      bank: ['', Validators.required],
      to_bank: ['', Validators.required],
      amount: [1, [Validators.required]],
      date: ['', [Validators.required]],
      company: [this.api.getUserCompany()]
    });
    // Set default date for date (yyyy-MM-dd)
    const today = new Date();
    this.bankToForm.controls['date'].patchValue(today.toISOString().slice(0, 10));
  }
  ngOnInit(){
    this.getBankList();
    if(this.editinvoiceId){
      this.getparticular();
    }
  }
  getparticular(){
    this.api.get('/money/get-transaction/'+this.editinvoiceId+'/').subscribe({
      next: (response: any) => {
        console.log('Bank To Bank:', response);
        if(response.status === 200){
          this.bankToForm.patchValue(response.data);
        }
      }
    });
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

  onKeyPress(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  onClick() {
    if (this.bankToForm.valid) {
      console.log('Bank To Bank Form Value:', this.bankToForm.value);
      // Add your API call or logic here
      if(this.editinvoiceId){
        this.api.put('/money/bank-to-bank-update/'+this.editinvoiceId+'/', this.bankToForm.value).subscribe({
          next: (response: any) => {
            if(response.status === 200){
              this.bankToForm.reset();
              this.toast.show('Success', 'Bank To Bank Transfer Successfully', 'success');
              // this.modalRef.close();
              this.close()
            }
          }
        });
      }else{
        this.api.post('/money/bank-to-bank/', this.bankToForm.value).subscribe({
        next: (response: any) => {
          if(response.status === 200){
            this.bankToForm.reset();
            this.toast.show('Success', 'Bank To Bank Transfer Successfully', 'success');
            this.modalRef.close();
          }else{
            this.toast.show('Error', 'Bank To Bank Transfer Failed', 'danger');
          }
            console.log('Bank To Bank Response:', response);
        }
      });}
    }
  }

  largeModalbank(largeDataModalbank: any) {
    this.modalRef1 = this.modalService.open(largeDataModalbank, { size: 'lg', centered: true, keyboard: false, backdrop: 'static' });
  }

  close() {
    if(this.activeModal){
          this.activeModal.close();
        }
  }
}
