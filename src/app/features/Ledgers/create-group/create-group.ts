import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-create-group',
  imports: [ReactiveFormsModule,CommonModule],
  standalone: true,
  templateUrl: './create-group.html',
  styleUrl: './create-group.scss'
})
export class CreateGroup {
  @Input() modalRef:any;
  @Output() addgroup = new EventEmitter<any>();
  groupForm:FormGroup;
  parentGroups:any[]=[];
   
  
  constructor(private fb:FormBuilder,private api:Api,private toast:ToastService){
    this.groupForm=this.fb.group({
      ledger_name:['',Validators.required],
      ledger_under:['1',Validators.required],
      company:['1'],
      id:[]
    });
  }
  ngOnInit(){
    this.getunderledger();
  }
  getunderledger(){
    this.api.get('/ledger/list-payment-under/').subscribe({
      next: (response: any) => {
        if(response.status === 200){
          this.parentGroups=response.data;
        }
      }
    });
  }

  onSubmit(){
    if(this.groupForm.valid){
      this.api.post('/ledger/create-ledger-group/',this.groupForm.value).subscribe({
        next:(response:any)=>{
          console.log(response);
          if(response.status === 200){
            this.toast.show('Success','Group created successfully!','success');
            this.addgroup.emit(response.data);
            this.modalRef.dismiss();
          }else{
            this.toast.show('Error','Failed to create group','danger');
          }
        }
      });
    }
  }

}
