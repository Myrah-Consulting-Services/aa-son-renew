import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-benefit-creation',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './benefit-creation.html',
  styleUrl: './benefit-creation.scss'
})
export class BenefitCreation {
  benefitsForm!: FormGroup;
  benefitPlans: any
  contributionModes: any[] = [
    {id:1, label: 'Fixed amount'},//1
    {id:2, label: 'Percentage of wages'}//2
  ];
  contributionTypes: any[] = [
    {id:3, label: 'Never ends'},//3
    {id:2, label: 'Ends when specific amount is deducted'}//2
  ];
  @Input() employee:any;
  @Input() data:any;
  @Input() benefitsModalRef:any
  constructor(private api: Api, private fb: FormBuilder,private toast:ToastService) {
  }
  ngOnInit(): void {
    this.initializeForm()
    console.log(this.employee,this.data,'employee and data');
    if(this.data!=null)
      {this.patchData()    
      }
    this.getotherDeductionList()
  }
  patchData(){
    console.log(this.data,'data');
    this.benefitsForm.patchValue({  
      benefitPlan: this.data.benefitPlan,
      employer_amount_mode: this.data.employer_amount_mode,
      employer_amount_value: this.data.employer_amount_value, 
      employer_end_rule: this.data.employer_end_rule,
      employer_end_total_amount: this.data.employer_end_total_amount,
      employee_amount_mode: this.data.employee_amount_mode,
      employee_amount_value: this.data.employee_amount_value, 
      employee_end_rule: this.data.employee_end_rule,
      employee_end_total_amount: this.data.employee_end_total_amount 
    });
  }
    getotherDeductionList(){
    // /employee/payroll_heads_special_groups/
    this.api.get('/employee/payroll_heads_special_groups/'+this.employee+"/").subscribe((res:any)=>{
      if(res.status==200){
        this.benefitPlans=res.benifits
      }
    })
  }
    initializeForm(){
    this.benefitsForm = this.fb.group({
      company: [this.api.getCompanyId()],
      employee: [this.employee],
      benefitPlan: [null, Validators.required],

      employer_amount_mode: [1, Validators.required],
      employer_amount_value: [null],
      employer_end_rule: [3, Validators.required],
      employer_end_total_amount: [null, [Validators.min(0)]],

      employee_amount_mode: ['1', Validators.required],
      employee_amount_value: [null],
      employee_end_rule: [3, Validators.required],
      employee_end_total_amount: [null, [Validators.min(0)]],
    });
    this.benefitsForm.get('employer_end_rule')?.valueChanges.subscribe((value: any)=>{
      if(value==3){
        this.benefitsForm.get('employer_amount_mode')?.clearValidators()
        // this.benefitsForm.get('employer_amount_mode')?.disable()
      }
    })
  }
    onSubmit(): void {
    console.log(this.benefitsForm.value);
    this.benefitsForm.value.employee=this.employee
    this.benefitsForm.value.company=this.api.getCompanyId()
    if (this.benefitsForm.valid) {
      // update-benefits/<int:pk>/

      // /employee/create_benefits/
      const benefitsData = { ...this.benefitsForm.value };
      if(this.data.length!=0){
  this.api.put('/employee/update_benefits/'+this.data.id+"/", benefitsData).subscribe((res: any) => {
        console.log(res);
        if(res.status==201 || res.status==200){
          this.toast.show('success',"Benefit updated successfully")
          this.benefitsModalRef.dismiss();
        }
      })      
    }else{
      this.api.post('/employee/create_benefits/', benefitsData).subscribe((res: any) => {
        console.log(res);
        if(res.status==201 || res.status==200){
          this.toast.show('success',"Benefit added successfully")
          this.benefitsModalRef.dismiss();
        }
      })
    }
    } else {
      this.benefitsForm.markAllAsTouched();
    }
  }
}
