import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-deduction-create',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './deduction-create.html',
  styleUrl: './deduction-create.scss'
})
export class DeductionCreate {
 // Deduction form
  deductionForm!: FormGroup;
  deductionNames: any
  deductionEndRules: any[] = [
   {id:1, label: 'Ends on selected month'},// 1
    {id:2, label: 'Ends on recovering a specified amount'},//2
    {id:3, label: 'Never ends'}//3
  ];
  @Input() id:any;
  @Input() deductionModalRef:any
  @Input() data:any
  constructor(private api: Api,private fb:FormBuilder,private toast:ToastService) {}
   ngOnInit(): void {
    this.initializeDeductionForm()
    console.log(this.id,this.data,'id and data');
    if(this.data!=null)
      {this.patchData()    
      }
    this.getotherDeductionList()
  }
  patchData(){
    console.log(this.data,'data');
    this.deductionForm.patchValue({   
      deductionName: this.data.deductionName,
      amountMode: this.data.amountMode,
      amountValue: this.data.amountValue, 
      employee_percent: this.data.employee_percent,
      endRule: this.data.endRule,
      endMonth: this.data.endMonth ? this.data.endMonth.slice(0, 7) : '',
      endTotalAmount: this.data.endTotalAmount 
    });
  }
    getotherDeductionList(){
    // /employee/payroll_heads_special_groups/
    this.api.get('/employee/payroll_heads_special_groups/'+this.id+"/").subscribe((res:any)=>{
      if(res.status==200){
        this.deductionNames=res.deduction
      }
    })
  }
    initializeDeductionForm(){
    this.deductionForm = this.fb.group({
      deductionName: ['', Validators.required],
      amountMode: [1, Validators.required],
      amountValue: [null, [Validators.required, Validators.min(0)]],
      employee_percent:[],
      endRule: [1, Validators.required],
      endMonth: [''],
      endTotalAmount: [{value: null, disabled: true}],
      employee:[this.id],
      company:[this.api.getCompanyId()]
    });
    // Manage end rule dependent fields
    this.deductionForm.get('endRule')!.valueChanges.subscribe((rule: any)=>{
      const monthCtrl = this.deductionForm.get('endMonth');
      const amountCtrl = this.deductionForm.get('endTotalAmount');
      if(rule == 1){
        monthCtrl!.setValidators([Validators.required]);
        amountCtrl!.clearValidators();
        amountCtrl!.disable();
        monthCtrl!.enable();
      } else if(rule == 2){
        amountCtrl!.setValidators([Validators.required, Validators.min(0)]);
        monthCtrl!.clearValidators();
        monthCtrl!.disable();
        amountCtrl!.enable();
      } else {
        monthCtrl!.clearValidators();
        amountCtrl!.clearValidators();
        monthCtrl!.disable();
        amountCtrl!.disable();
      }
      monthCtrl!.updateValueAndValidity();
      amountCtrl!.updateValueAndValidity();
    });
  }
    saveDeduction(): void{
    console.log(this.deductionForm.value);
    this.deductionForm.value.employee=this.id
    this.deductionForm.value.company=this.api.getCompanyId()
    if(this.deductionForm.valid){
      const deductionData = { ...this.deductionForm.value };
      if (deductionData.endMonth) {
        const [year, month] = deductionData.endMonth.split('-');
        deductionData.endMonth = `${year}-${month}-01`;
      }
      //put/ update_deductions/<int:pk>/
      if (this.data && this.data.id) {
      // 🔹 UPDATE
      this.api.put(`/employee/update_deductions/${this.data.id}/`, deductionData)
        .subscribe({
          next: (res: any) => {
            console.log('Update response:', res);
            this.deductionModalRef.close(res); // ✅ return updated data
            this.toast.show('success', "Deduction updated successfully");
          },
          error: (err) => {
            console.error('Update error:', err);
            this.toast.show('error', "Failed to update deduction");
          }
        });
    } else {
      // 🔹 CREATE
      this.api.post('/employee/create_deductions/', deductionData)
        .subscribe({
          next: (res: any) => {
            console.log('Create response:', res);
            this.deductionModalRef.close(res); // ✅ return new data
            this.toast.show('success', "Deduction added successfully");
          },
          error: (err) => {
            console.error('Create error:', err);
            this.toast.show('error', "Failed to create deduction");
          }
        });
    }
    } else {
      this.deductionForm.markAllAsTouched();
    }
  }
}
