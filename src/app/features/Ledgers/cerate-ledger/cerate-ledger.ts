import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { Api } from '../../../core/services/api';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cerate-ledger',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './cerate-ledger.html',
  styleUrl: './cerate-ledger.scss'
})
export class CerateLedger {
  @Input() modalRef:any;
  @Input() emitid:any;
  @Output() addledger = new EventEmitter<any>();
ledgerForm:FormGroup
underledger:any[]=[]
  constructor(private api: Api,
     private toast: ToastService,private fb:FormBuilder) {
    this.ledgerForm = this.fb.group({
      ledger_name: ['', Validators.required],
      ledger_under: ['1', Validators.required],
      opening_balance: [0, Validators.required],
      payment_type: ["Debit"],
      group: [null],
      as_on_date: [[Validators.required]],
      company: [this.api.getCompanyId()],
      id: []
    });
  }
  ngOnInit(): void {
    if(this.emitid){
    this.getledger();
    }
    this.ledgerForm.patchValue({
      as_on_date: new Date().toISOString().split('T')[0]
    });
    this.getunderledger();

  }
  getledger(){
    this.api.get(`/ledger/get-ledger/${this.emitid}`).subscribe({
      next: (response: any) => {
        console.log(response);
        this.ledgerForm.patchValue({
          ledger_name: response.data.ledger_name,
          ledger_under: response.data.ledger_under,
          opening_balance: response.data.opening_balance,
          payment_type: response.data.payment_type,
          id: response.data.id
        });
      }
    });
  }

  getunderledger(){
    this.api.post('/ledger/ledger-under/',{company:1}).subscribe({
      next: (response: any) => {
        if(response.status === 200){
          this.underledger=response.data;
        }
      }
    });
  }

  onSubmit() {
    if (this.ledgerForm.valid) {
      // Handle form submission logic here
      if(this.emitid){
        this.api.put(`/ledger/update-ledger/`, this.ledgerForm.value).subscribe({
          next: (response: any) => {
            console.log(response);
            if(response.status === 200){
              this.addledger.emit(response.data);
              this.toast.show('Success', 'Ledger updated successfully!', 'success');
              this.modalRef.dismiss();
            }else{
              this.toast.show('Error', 'Failed to update ledger', 'danger');
            }
          }
        });
      }else{
      this.api.post('/ledger/create-ledger/', this.ledgerForm.value).subscribe({
        next: (response: any) => {
          console.log(response);
          if(response.status === 200){
            this.addledger.emit(response.data);
            this.toast.show('Success', 'Ledger created successfully!', 'success');
            this.modalRef.dismiss();
          }else{
            this.toast.show('Error', 'Failed to create ledger', 'danger');
          }
          }
        });
        console.log('Ledger form submitted:', this.ledgerForm.value);
      }
    }
  }

  onLedgerUnderChange(event: any) {
    const selectedId = Number(this.ledgerForm.value.ledger_under);
    const underLObj = this.underledger.find(u => u.id === selectedId);
    if (!underLObj) return;
    if (underLObj.type === 'parent') {
      if (underLObj.pay_type === true) {
        this.ledgerForm.patchValue({
          payment_type: 'Debit',
          group: null
        });
      } else {
        this.ledgerForm.patchValue({
          payment_type: 'Credit',
          group: null
        });
      }
    } else {
      this.ledgerForm.patchValue({
        payment_type: 'Credit',
        group: underLObj.id
      });
    }
  }
}
