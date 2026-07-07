import { Component, OnDestroy, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup, FormArray, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Department } from '../department/department';
import { Branch } from '../branch/branch';
import { Designation } from '../designation/designation';
import { LocationPay } from '../location-pay/location-pay';
import { Api } from '../../core/services/api';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { CountryList } from '../../country-list';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BenefitCreation } from '../benefit-creation/benefit-creation';
import { log } from 'console';

export function matchValidator(source: string, target: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const sourceCtrl = control.get(source);
    const targetCtrl = control.get(target);

    return sourceCtrl && targetCtrl && sourceCtrl.value !== targetCtrl.value
      ? { mismatch: true }
      : null;
  };
}

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DecimalPipe, Department, Branch, Designation, LocationPay,BenefitCreation],
  templateUrl: './add-employee.html',
  styleUrls: ['./add-employee.scss']
})
export class AddEmployeeComponent implements OnInit, OnDestroy, OnChanges {
  @Input() employeeToEdit: any = null;
  
  employeeForm: FormGroup;
  activeTab: string = 'basicInfo';
  // Step completion flags
  basicCompleted = false;
  salaryCompleted = false;
  personalCompleted = false;
  paymentCompleted = false;
  
  totalMonthlyCost = 0;
  totalAnnualCost = 0;
  inHandMonthlySalary = 0;
  
  // New properties for salary summary
  grossMonthlyEarnings = 0;
  grossAnnualEarnings = 0;
  totalMonthlyDeductions = 0;
  totalAnnualDeductions = 0;
  totalMonthlyBenefits = 0;
  totalAnnualBenefits = 0;
  netMonthlySalary = 0;
  netAnnualSalary = 0;

  // CTC validation properties
  ctcValidationMessage = '';
  ctcValidationStatus = 'success'; // 'success', 'warning', 'error'
  netSalaryValidationMessage = '';
  netSalaryValidationStatus = 'success';

  // Modal properties
  showDepartmentModal = false;
  showBranchModal = false;
  showDesignationModal = false;
  showLocationPayModal = false;

  private destroy$ = new Subject<void>();
  countryCodes: any[] = [];
  departmentList: any[] = [];
  branchList: any;
  designationList: any;
  locationPayList: any;
  shiftList: any[] = [];
  
  // Salary Structure properties
  salaryStructures: any[] = [];
  selectedSalaryStructure: any = null;
  showSalaryStructureDropdown = false;
  salaryStructureSearchTerm = '';
  filteredSalaryStructures: any[] = [];
  
  // Payroll heads for component selection
  earning: any[] = [];
  deduction: any[] = [];
  benefit: any[] = [];
  
  // Search and select properties for earnings
  showEarningsDropdown: boolean[] = [];
  filteredEarnings: any[][] = [];
  earningsSearchTerms: string[] = [];
  
  // Search and select properties for deductions
  showDeductionsDropdown: boolean[] = [];
  filteredDeductions: any[][] = [];
  deductionsSearchTerms: string[] = [];
  
  // Search and select properties for benefits
  showBenefitsDropdown: boolean[] = [];
  filteredBenefits: any[][] = [];
  benefitsSearchTerms: string[] = [];
  
  // Document storage
  documents: any;
  
  // Document metadata storage (for titles and types)
  documentMetadata: any = {};
  
  // Document editing state
  editingDocument: { key: string; title: string; type: string } | null = null;
  
  // Document types for UAE
  requiredDocumentTypes = [
    {id: 1, type: 1, type_name: 'Emirates ID', required: true },
    {id: 2, type: 2, type_name: 'Passport', required: true },
    {id: 3, type: 3, type_name: 'Labor Card', required: true },
    {id: 4, type: 4, type_name: 'Visa Copy', required: true },
  ];
  
  optionalDocumentTypes = [
    {id: 5, type: 5, type_name: 'Educational Certificates', required: false },
    {id: 6, type: 6, type_name: 'Experience Letters', required: false }
  ];
  
  showSuccess: boolean = false;
  createdEmployeeFullName: string = '';
  employeeId: any;
  settings: any;
  // steps = [
  //   { label: 'Basic Details', completed: false },
  //   { label: 'Salary Details', completed: false },
  //   { label: 'Personal Details', completed: false },
  //   { label: 'Payment Information', completed: false },
  //   { label: 'Documents', completed: false }
  // ];
  steps = ['basicInfo', 'salaryDetails', 'personalDetails', 'paymentDetails', 'documents'];

  activeStep = 0;
  documentList: any;
  modalRef: any;
  note: any = null;
  salaryData: any;
  private pendingSalaryStructure: any = null;
  benefitsModalRef: any;
  benefitsData: any;
  missingData: any;
  constructor(private fb: FormBuilder, private api: Api, private router: Router, private toast: ToastService, private countryList: CountryList,
    private modalService:NgbModal, private cdr: ChangeDetectorRef
  ) {
    this.employeeForm = this.fb.group({
      basicInfo: this.fb.group({
        first_name: ['', [Validators.required, Validators.maxLength(100)]],
        last_name: ['', [Validators.required, Validators.maxLength(100)]],
        emp_id:[''],
        joining_date: ['', Validators.required],
        confirmation_date: [''],
        work_email: ['', [Validators.required, Validators.email]],
        phone_number: ['', Validators.required],
        phone_country: [1, Validators.required],
        gender: ['', Validators.required],
        emirates_id: ['', [Validators.required, Validators.maxLength(50)]],
        passport_number: ['', [Validators.required, Validators.maxLength(50)]],
        labour_card_number: [''],
        visa_expiry: [''],
        contract_type: ['', [Validators.required]],
        contract_start_date: [''],
        contract_end_date: [''],
        department: ['', Validators.required],
        location: ['', Validators.required],
        designation: ['', Validators.required],
        branch: ['', Validators.required],
        shift: [''],
        job_title: ['', Validators.maxLength(100)],
        portal_access_enabled: [false],
        is_gcc_national: [false],
        origin_country: [''],
        is_first_time_employed: [false],
        company: [this.api.getCompanyId()],
        // iban: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/)]],
        // custom_fields: this.fb.group({
        //   emergency_contact: [''],
        //   blood_group: ['']
        // })
      }, { validators: this.contractDateValidator }),
      personalDetails: this.fb.group({
        dob: ['', Validators.required],
        age: [{ value: '', disabled: true }],
        father_name: [''],
        personal_email: ['', [Validators.email]],
        // Present address
        present_address_line1: [''],
        present_address_line2: [''],
        present_city: [''],
        present_state: [''],
        present_country: [''],
        // Permanent address
        permanent_address_line1: [''],
        permanent_address_line2: [''],
        permanent_city: [''],
        permanent_state: [''],
        permanent_country: [''],
        permanent_pin_code: [''],
        company: [this.api.getCompanyId()],
        employee: [this.employeeId],
        id: [''],
      }),
      salaryDetails: this.fb.group({
        company: [this.api.getCompanyId()],
        employee: [this.employeeId],
        salaryStructure: [null],
        salaryStructureName:[],
        annualCTC: [0],
        earnings: this.fb.array([]),
        deductions: this.fb.array([]),
        benefits: this.fb.array([]),
        // Salary summary properties
        grossMonthlyEarnings: [0],
        grossAnnualEarnings: [0],
        totalMonthlyDeductions: [0],
        totalAnnualDeductions: [0],
        totalMonthlyBenefits: [0],
        totalAnnualBenefits: [0],
        netMonthlySalary: [0],
        netAnnualSalary: [0],
        id: [''],
      }),
      paymentDetails: this.fb.group({
        company: [this.api.getCompanyId()],
        employee: [this.employeeId],
        payment_mode: ['1'],
        account_holder_name: [''],
        bank_name: [''],
        iban: [''],
        swift_code: [''],
        id: [''],
      }),
      documents: this.fb.group({
        title: [''],
        type: ['', Validators.required],
        file: [''],
        document_number: [''],
        country: [''],
        issued_on: [''],
        valid_from: [''],
        expires_on: [''],
        is_primary: [true],
        company: [this.api.getCompanyId()],
        employee: [],
        id: [''],
      })
    });
  }

  private handleApiError(err: any): void {
    try {
      const status = err?.status;
      const data = err?.error || err;
      if (status === 500 && data && typeof data === 'object') {
        const messages: string[] = [];
        Object.keys(data).forEach((key) => {
          const value = (data as any)[key];
          if (Array.isArray(value)) {
            value.forEach((msg: any) => messages.push(`${key}: ${String(msg)}`));
          } else if (typeof value === 'string') {
            messages.push(`${key}: ${value}`);
          } else if (value && typeof value === 'object') {
            Object.keys(value).forEach((subKey) => {
              const subVal = (value as any)[subKey];
              if (Array.isArray(subVal)) {
                subVal.forEach((msg: any) => messages.push(`${String(msg)}`));
              } else if (typeof subVal === 'string') {
                messages.push(`${subVal}`);
              }
            });
          }
        });
        if (messages.length) {
          this.toast.show(messages.join('\n'), 'error');
          return;
        }
      }
      // Fallback
      const fallback = (data && data.detail) || err?.message || 'Something went wrong';
      this.toast.show(fallback, 'error');
    } catch (_) {
      this.toast.show('Something went wrong', 'error');
    }
  }
  ngOnInit(): void {
    console.log(this.employeeToEdit, 'edit employee');
    const today = new Date();
    this.employeeForm.get('basicInfo.joining_date')?.patchValue(new Date(today));
    const personal = this.employeeForm.get('personalDetails');
    personal?.get('dob')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (value) {
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        personal.get('age')?.setValue(age > 0 ? age : 0, { emitEvent: false });
      } else {
        personal?.get('age')?.setValue('', { emitEvent: false });
      }
    });

    this.employeeForm.get('salaryDetails')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // this.calculateSalary();
    });
    //  this.calculateSalary();
    this.getDepartmentList();
    this.getBranchList();
    this.getDesignationList();
    this.getLocationPayList();
    this.getShiftList();
    // Retry shift load if company context wasn't ready on first tick (e.g. modal)
    setTimeout(() => {
      if (!this.shiftList?.length) {
        this.getShiftList();
      }
    }, 400);
    this.getSalaryStructures();
    this.getPayrollheads();
    this.getSalaryheads()
    this.getEmployeeSettings();
  
    if (this.employeeToEdit) {
      this.patchData();
      this.getBenefits();
    }else{
      this.onGccNationalChange();
         // employee/employee-next-number/1/  ->get and 1 =company
         this.api.get('/employee/employee-next-number/'+this.api.getUserCompany()+"/").subscribe((res: any) => {
          console.log(res);
          this.employeeForm.get('basicInfo')?.patchValue({
            emp_id:res.data
          })
        });
    }
    // Initialize payment form state after form setup
    setTimeout(() => {
      this.initializePaymentFormState();
    }, 100);  

    // this.countryCodes = this.countryList.countryList;
  }

  getBenefits(){
    this.api.get('/employee/list_benefits/'+this.employeeId+"/").subscribe((res:any)=>{
      if(res.status==200){
        this.benefitsData=res.data
        console.log(this.benefitsData,'benefits');
      }
    })
  }
  openBenefitModal(modal: any) {
    // this.activeTab='salary'
    // this.benefitData=data
    this.benefitsModalRef=this.modalService.open(modal, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    this.benefitsModalRef.result.then((result: any) => {
      console.log(result, 'result');
      this.getBenefits()
    });
  }
  editBenefit(data:any,modal: any) {  
    this.benefitsData=data
    this.benefitsModalRef=this.modalService.open(modal, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
    });
  }
  getContributionType(mode: number): string {
  switch (mode) {
    case 1: return 'Fixed Amount';
    case 2: return '% of Basic';
    default: return 'Unknown';
  }
}


  deleteBenefit(benefit: any): void { 
    if (confirm('Are you sure you want to delete this benefit?')) {
      this.api.delete('/employee/delete_benefits/'+benefit.id+"/").subscribe((res: any) => {
        if (res.status == 200) {
          this.toast.show('success', 'Benefit deleted successfully');
          // this.getotherDeductionList();
        } else {
          this.toast.show('error', 'Failed to delete benefit');
        }
      } );
    }
  }
  getSalaryheads() {
    const companyId = this.api.getCompanyId();
    if (!companyId) {
      return;
    }
    this.api.get('/employee/grouped_payroll_heads/?company=' + companyId).subscribe((res: any) => {
      if (res.status == 200) {
        this.salaryData = res.data;
        if (!this.employeeToEdit && !this.selectedSalaryStructure) {
          this.buildEarningsForm();
        }
        if (this.pendingSalaryStructure) {
          const structure = this.pendingSalaryStructure;
          this.pendingSalaryStructure = null;
          this.populateFormArraysFromStructure(structure);
        }
      }
    });
  } 
    get earningsArray(): FormArray {
    return this.employeeForm.get('salaryDetails.earnings') as FormArray;
  }
 buildEarningsForm() {
this.salaryData.forEach((cat:any,index:number) => {
  if (cat.heads && cat.heads.length > 0) {
    console.log(cat.heads[0], 'cat.heads[0]');
    
    this.earnings.push(this.createEarningItemFromStructure({
      head_id: cat.heads[0].id,
      head: cat.heads[0].id,
      head_name: cat.heads[0].head_name,
      calculation_value: cat.heads[0].calculation_value || 0,
      calculation_type: cat.heads[0].calculation_type || 1,
      monthly_value: cat.heads[0].monthly_value || 0,
      annual_value: cat.heads[0].annual_value || 0,
      category_name: cat.category_name,
      calculation_type_name: cat.heads[0].calculation_type_name || 'Fixed'
    }, true));
    this.onCalculationValueChange(this.earnings.length - 1);
  }
  // Skip categories with no active payroll heads — never use category_id as head_id
});


  }
selectEarning(index: number, earning: any) {
    console.log('working', earning, index);
    
    console.log(earning, 'earning', index, 'index');
    
    const row = this.earnings.at(index);
    row.patchValue({
      head_id: earning.id,
      head: earning.id,
      head_name: earning.head_name,
      calculation_value: Number(earning.calculation_value) || 0,
      calculation_type: earning.calculation_type || 1,
      calculation_type_name: earning.calculation_type_name || 'Fixed'
    });
    this.earningsSearchTerms[index] = earning.head_name;
    this.showEarningsDropdown[index] = false;
  }
onHeadChange(index: number) {
  console.log(index);
  
  const a = this.earningsArray.at(index) as FormGroup;
    const selectedValue = a.get('head_name')?.value;

console.log(selectedValue, 'selected head');

  // Find the selected head from salaryData
  const selectedHead = this.salaryData[index]?.heads.find(
    (head: any) => head.head_name === selectedValue
  );
console.log(selectedHead, 'selected head details');

  const earningGroup = this.earnings.at(index) as FormGroup;

  if (selectedHead) {
    earningGroup.patchValue({
      head_name: selectedHead.head_name,
      head_id: selectedHead.id || null,
      head: selectedHead.id || null,
      calculation_type: selectedHead.calculation_type || 1,
      calculation_value: this.safeNumber(selectedHead.calculation_value || 0),
      calculation_type_name: this.getCalculationTypeName(selectedHead.calculation_type || 1),
      monthly_value: this.safeNumber(selectedHead.monthly_value || 0),
      annual_value: this.safeNumber(selectedHead.annual_value || 0)
    });

    console.log('Updated earning row:', earningGroup.value);

    // earningGroup.get('isDropdown')?.setValue(false);
  }else{
    earningGroup.patchValue({
      head_name: '',
      head_id: null,
      calculation_type: 1,
      calculation_value: 0,
      calculation_type_name: 'Fixed',
      monthly_value: 0,
      annual_value: 0
    });
  }
}


updateAnnual(index: number) {
  const row = this.earnings.at(index);
  const monthly = row.get('monthly_value')?.value || 0;
  row.patchValue({ annual_value: monthly * 12 });
}

getTotalMonthly() {
  return this.earnings.controls.reduce((sum, ctrl) => {
    return sum + (ctrl.get('monthly_value')?.value || 0);
  }, 0);
}

getTotalAnnual() {
  return this.earnings.controls.reduce((sum, ctrl) => {
    return sum + (ctrl.get('annual_value')?.value || 0);
  }, 0);
}
  // /employee/employee_based_document/18/
  loadDocuments(emp:any){
    this.api.get('/employee/employee_based_document/'+emp+"/").subscribe((response:any)=>{
      if (response.status == 200) {
        this.documentList=response.documents
      }
    })

  }
    // /employee/get_employee_settings/
    getEmployeeSettings(){
      this.api.get('/employee/get_employee_settings/'+this.api.getUserCompany()+"/",{
      }).subscribe((res: any) => {
        console.log(res);
        this.settings=res.data
        // const { prefix, start_number, padding } = this.settings.employee_code_config;
        // const empId = `${prefix}${start_number.toString().padStart(padding, '0')}`;
        // this.employeeForm.get('basicInfo')?.patchValue({
        //   emp_id:empId
        // })
        const basicInfoGroup = this.employeeForm.get('basicInfo') as FormGroup;
       this.settings.custom_fields.forEach((field: { is_required: any; name: any; }) => {
       const validators = field.is_required ? [Validators.required] : [];
       basicInfoGroup.addControl(field.name, this.fb.control('', validators));
      });
      });
    }
  patchData() {
    this.api.get(`/employee/get_employee/${this.employeeToEdit}`).subscribe((res: any) => {
      if (res.status == 200) {
        this.employeeId=res.data.id
        this.loadDocuments(this.employeeId)
        const shiftId = res.data.shift;
        // this.documents=res.data.documents
        // this.getRequiredDocuments=res.data.documents
        this.employeeForm.get('basicInfo')?.patchValue({
          first_name: res.data.first_name,
          last_name: res.data.last_name,
          work_email: res.data.work_email,
          emp_id:res.data.emp_id,
          phone_number: res.data.phone_number,
          phone_country: res.data.phone_country,
          department: res.data.department,
          designation: res.data.designation,
          location: res.data.location,
          branch: res.data.branch,
          shift: shiftId,
          contract_type: res.data.contract_type,
          contract_start_date: res.data.contract_start_date,
          contract_end_date: res.data.contract_end_date,
          contract_status: res.data.contract_status,
          labour_card_number: res.data.labour_card_number,
          passport_number: res.data.passport_number,
          visa_expiry: res.data.visa_expiry,
          joining_date: res.data.joining_date,
          confirmation_date: res.data.confirmation_date,
          job_title: res.data.job_title,
          origin_country: res.data.origin_country,
          gender: res.data.gender,
          portal_access_enabled: res.data.portal_access_enabled,
          is_first_time_employed: res.data.is_first_time_employed,
          emirates_id: res.data.emirates_id,
          is_gcc_national: res.data.is_gcc_national,
          id: res.data.id,
          company: this.api.getCompanyId()
        });
        if (this.shiftList.length === 0) {
          this.getShiftList(() => {
            this.employeeForm.get('basicInfo.shift')?.setValue(shiftId);
          });
        }
        this.onGccNationalChange()
        this.onOriginCountryChange({ target: { value: res.data.origin_country } });
        // Mark steps as completed based on existing data
        this.basicCompleted = true;
        this.employeeForm.get('salaryDetails')?.patchValue({
          employee: res.data.id,
        });
        if(res.data.salary_components?.length>0){
        this.salaryStructureSearchTerm = res.data.salary_components[0]?.salaryStructureName;
        this.selectedSalaryStructure = res.data.salary_components[0];
        // let a=this.selectedSalaryStructure
        this.selectSalaryStructure(this.selectedSalaryStructure);
        console.log(this.selectedSalaryStructure, 'salary components');
        this.employeeForm.get('salaryDetails')?.patchValue({
          "id": res.data.salary_components[0]?.id,
          "employee": res.data.id,
          "salaryStructure":res.data.salary_components[0].salaryStructure,
          "salaryStructureName": res.data.salary_components[0]?.salaryStructureName,
          "annualCTC": res.data.salary_components[0]?.annualCTC,
          "grossMonthlyEarnings": res.data.salary_components[0]?.grossMonthlyEarnings,
          "grossAnnualEarnings": res.data.salary_components[0]?.grossAnnualEarnings,
          "totalMonthlyDeductions": res.data.salary_components[0]?.totalMonthlyDeductions,
          "totalAnnualDeductions": res.data.salary_components[0]?.totalAnnualDeductions,
          "totalMonthlyBenefits": res.data.salary_components[0]?.totalMonthlyBenefits,
          "totalAnnualBenefits": res.data.salary_components[0]?.totalAnnualBenefits,
          "netMonthlySalary": res.data.salary_components[0]?.netMonthlySalary,
          "netAnnualSalary": res.data.salary_components[0]?.netAnnualSalary
        });
        this.salaryCompleted = !!res.data.salary_components?.[0]?.id;
      }
        this.employeeForm.get('personalDetails')?.patchValue({
          employee: res.data.id,
          dob: res.data.personal_info?.dob,
          father_name: res.data.personal_info?.father_name,
          permanent_address_line1: res.data.personal_info?.permanent_address_line1,
          permanent_address_line2: res.data.personal_info?.permanent_address_line2,
          permanent_city: res.data.personal_info?.permanent_city,
          permanent_country: res.data.personal_info?.permanent_country,
          permanent_pin_code: res.data.personal_info?.permanent_pin_code,
          permanent_state: res.data.personal_info?.permanent_state,
          personal_email: res.data.personal_info?.personal_email,
          present_address_line1: res.data.personal_info?.present_address_line1,
          present_address_line2: res.data.personal_info?.present_address_line2,
          present_city: res.data.personal_info?.present_city,
          present_country: res.data.personal_info?.present_country,
          present_state: res.data.personal_info?.present_state,
          id: res.data.personal_info?.id,
          company: this.api.getCompanyId()
        });
        this.personalCompleted = !!res.data.personal_info?.id;
        const paymentDetail = this.resolvePaymentDetail(res.data.payment_details);
        this.employeeForm.get('paymentDetails')?.patchValue({
          account_holder_name: paymentDetail?.account_holder_name,
          bank_name: paymentDetail?.bank_name,
          iban: paymentDetail?.iban,
          swift_code: paymentDetail?.swift_code,
          payment_mode: paymentDetail?.payment_mode != null ? String(paymentDetail.payment_mode) : '1',
          id: paymentDetail?.id,
          employee: res.data.id,
          company: paymentDetail?.company ?? this.api.getCompanyId(),
        });
        this.paymentCompleted = !!paymentDetail?.id;
        this.employeeForm.get('documents')?.patchValue({
         
        });
      }
    });
  }
  
  private resolvePaymentDetail(paymentDetails: any[] | undefined): any {
    if (!paymentDetails?.length) {
      return null;
    }
    return paymentDetails.reduce((latest: any, item: any) => {
      if (!latest || (item?.id && item.id > latest.id)) {
        return item;
      }
      return latest;
    }, null);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const employee = changes['employeeToEdit']?.currentValue;
    if (employee && typeof employee === 'object' && employee.basicInfo) {
      this.employeeId = this.employeeToEdit;
      return;
    }
    if (employee && (typeof employee === 'number' || typeof employee === 'string')) {
      this.employeeId = employee;
      if (!changes['employeeToEdit'].firstChange) {
        this.patchData();
      }
      return;
    }
    if (employee === null || employee === undefined) {
      // It's a new employee form, so reset carefully
      
      // Set default phone country code to UAE (+971) after reset
      
      this.employeeForm.get('paymentDetails')?.reset({
        employee: this.employeeId,
        company: this.api.getCompanyId()
      });
      this.employeeForm.get('personalDetails')?.reset({
        employee: this.employeeId,
        company: this.api.getCompanyId()
      });
      this.employeeForm.get('salaryDetails')?.reset({
        employee: this.employeeId,
        company: this.api.getCompanyId()
      });
      this.employeeForm.get('documents')?.reset({
        employee: this.employeeId,
        company: this.api.getCompanyId()
      });
      // this.employeeForm.get('paymentDetails.bankDetails')?.disable();
      // this.employeeForm.get('paymentDetails.wpsDetails')?.disable();
      
             const salaryDetails = this.employeeForm.get('salaryDetails');
      // salaryDetails?.get('annualCTC')?.setValue(0, { emitEvent: false });
       
               // Clear all form arrays
        const earnings = salaryDetails?.get('earnings') as FormArray;
        const deductions = salaryDetails?.get('deductions') as FormArray;
        const benefits = salaryDetails?.get('benefits') as FormArray;
        
        earnings.clear();
        deductions.clear();
        benefits.clear();
      
      this.calculateSalary(); // Manually trigger calculation after resetting defaults
      
      this.employeeForm.markAsPristine();
      this.employeeForm.markAsUntouched();
      this.activeTab = 'basicInfo';
    }
  }

  createEarningItem(component: string, value: number, type: string, isBalancing: boolean = false): FormGroup {
    return this.fb.group({
      head_id: [null],
      head_name: [component],
      calculation_value: [value],
      calculation_type: [this.getCalculationTypeId(type)],
      calculation_type_name: [type],
      monthly_value: [0],
      annual_value: [0],
      head_type: [1],
      head_type_name: ['Earning'],
    });
  }

  createDeductionItem(component: string, value: number, type: string): FormGroup {
    return this.fb.group({
      head_id: [null],
      head_name: [component],
      calculation_value: [value],
      calculation_type: [this.getCalculationTypeId(type)],
      calculation_type_name: [type],
      monthly_value: [0],
      annual_value: [0],
      head_type: [2],
      head_type_name: ['Deduction']
    });
  }

  createBenefitItem(component: string, value: number, type: string): FormGroup {
     return this.fb.group({
      id: [null],
      head_name: [component],
      calculation_value: [value],
      calculation_type: [this.getCalculationTypeId(type)],
      calculation_type_name: [type],
      monthly_value: [0],
      annual_value: [0],
      head_type: [3],
      head_type_name: ['Benifits']
    });
  }

  // Helper method to get calculation type ID
  getCalculationTypeId(type: string): number {
    switch (type) {
      case 'Fixed': return 1;
      case 'Percentage of Basic': return 2;
      case 'Percentage of Annual CTC': return 3;
      default: return 1;
    }
  }

  // Method to handle calculation type changes
  onCalculationTypeChange() {
    this.calculateSalary();
  }

  // Format number for display
  formatNumber(value: number): string {
    return value.toFixed(2);
  }
  

  get earnings(): FormArray { return this.employeeForm.get('salaryDetails.earnings') as FormArray; }
  
  get deductions(): FormArray { return this.employeeForm.get('salaryDetails.deductions') as FormArray; }
  get benefits(): FormArray { return this.employeeForm.get('salaryDetails.benefits') as FormArray; }

  // Custom validator for contract dates
  contractDateValidator(group: AbstractControl): ValidationErrors | null {
    const contractType = group.get('contract_type')?.value;
    const startDate = group.get('contract_start_date')?.value;
    const endDate = group.get('contract_end_date')?.value;

    if (contractType == '1' && (!endDate || endDate <= startDate)) {
      return { invalidContractDates: true };
    }

    return null;
  }

  onGccNationalChange() {
    console.log(this.note, 'gcc national value');

    let value = this.employeeForm.get('basicInfo')?.value;
    const sortOrder = [1, 129, 140, 14, 89, 150];

    if (value.is_gcc_national == true) {

      this.countryCodes = this.countryList.countryList
        .filter(c => sortOrder.includes(c.id)) // keep only matching IDs
        .sort((a, b) => sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id));
    } else {
      this.countryCodes = this.countryList.countryList
        .filter(c => !sortOrder.includes(c.id))
        .sort((a, b) => a.name.localeCompare(b.name));
        this.note=null
    }
  }

onOriginCountryChange(event: any) {
  console.log(event.target.value, 'origin country change');
  this.note = this.countryCodes.find(c => c.id == event.target.value)?.notes;
  console.log(this.note, 'note');

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

     calculateSalary() {
      console.log('calculateSalary() called');
      const salaryDetails = this.employeeForm.get('salaryDetails');
      if (!salaryDetails) return;

      const annualCTC = salaryDetails.get('annualCTC')?.value || 0;
      console.log('Annual CTC:', annualCTC);
      
      // --- Main Calculations ---
      const earningsControls = (salaryDetails.get('earnings') as FormArray).controls;
      
      // Only calculate if there are earnings
      if (earningsControls.length > 0) {
      console.log(earningsControls, 'earningsControls');
        
        const basicCtrl = earningsControls.find(c => c.get('id')?.value == 2);
      console.log(basicCtrl, 'basicCtrl');
        
        const basicValue = basicCtrl?.get('calculation_value')?.value || 0;
        // Calculate based on calculation type
        let annualBasic = 0;
        

        // Calculate Basic Salary
        if (basicCtrl?.get('calculation_type')?.value == 1) {
          annualBasic = basicValue * 12;
        } else if (basicCtrl?.get('calculation_type')?.value == 2) {
          annualBasic = annualCTC * (basicValue / 100);
        } else if (basicCtrl?.get('calculation_type')?.value == 3) {  
          annualBasic = annualCTC * (basicValue / 100);
        } else {
          annualBasic = 0;
        }

        const monthlyBasic = annualBasic / 12;

        // --- Update Form Values (Earnings) ---
        console.log('Updating Basic Salary - Monthly:', monthlyBasic, 'Annual:', annualBasic);
        basicCtrl?.patchValue({ 
          monthly_value: Number(monthlyBasic.toFixed(2)), 
          annual_value: Number(annualBasic.toFixed(2)) 
        }, { emitEvent: false });
        
        
       

        // Calculate other earnings
        earningsControls.forEach(ctrl => {
          const head_id = ctrl.get('id')?.value;
          const calculationValue = ctrl.get('calculation_value')?.value || 0;
          const calculationType = ctrl.get('calculation_type')?.value;
        console.log(head_id, calculationType, 'calcupp', calculationValue);
          
          if (head_id && head_id !== 2) {
            let annualValue = 0;
            let monthlyValue = 0;

            if (calculationType == 1) {
              annualValue = calculationValue * 12;
              monthlyValue = calculationValue;
            } else if (calculationType == 2) {
              annualValue = annualBasic * (calculationValue / 100);
              monthlyValue = annualValue / 12;
            } else if (calculationType == 3) {
              annualValue = annualCTC * (calculationValue / 100);
              monthlyValue = annualValue / 12;
            }

            ctrl.patchValue({ 
              monthly_value: Number(monthlyValue.toFixed(2)), 
              annual_value: Number(annualValue.toFixed(2)) 
            }, { emitEvent: false });
          }
        });

        // --- Update Form Values (Deductions) ---
        const deductionsControls = (salaryDetails.get('deductions') as FormArray).controls;
        deductionsControls.forEach(ctrl => {
          const calculationValue = ctrl.get('calculation_value')?.value || 0;
          const calculationType = ctrl.get('calculation_type')?.value;

          let annualValue = 0;
          let monthlyValue = 0;

          if (calculationType == 1) {
            annualValue = calculationValue * 12;
            monthlyValue = calculationValue;
          } else if (calculationType == 2) {
            annualValue = annualBasic * (calculationValue / 100);
            monthlyValue = annualValue / 12;
          } else if (calculationType == 3) {
            annualValue = annualCTC * (calculationValue / 100);
            monthlyValue = annualValue / 12;
          }

          ctrl.patchValue({ 
            monthly_value: Number(monthlyValue.toFixed(2)), 
            annual_value: Number(annualValue.toFixed(2)) 
          }, { emitEvent: false });
        });
        
        // --- Update Form Values (Benefits) ---
        const benefitsArray = salaryDetails.get('benefits') as FormArray;
        benefitsArray.controls.forEach(ctrl => {
          const calculationValue = Number(ctrl.get('calculation_value')?.value || 0);
          const calculationType = ctrl.get('calculation_type')?.value;

          let annualValue = 0;
          let monthlyValue = 0;

          if (calculationType == 1) {
            annualValue = calculationValue * 12;
            monthlyValue = calculationValue;
          } else if (calculationType == 2) {
            annualValue = annualBasic * (calculationValue / 100);
            monthlyValue = annualValue / 12;
          } else if (calculationType == 3) {
            annualValue = annualCTC * (calculationValue / 100);
            monthlyValue = annualValue / 12;
          }

          ctrl.patchValue({ 
              monthly_value: Number(monthlyValue.toFixed(2)), 
            annual_value: Number(annualValue.toFixed(2)) 
          }, { emitEvent: false });
        });
                // Calculate totals with proper number conversion and 2 decimal precision
        const totalMonthlyEarnings = Number((earningsControls.reduce((sum, ctrl) => {
          const value = Number(ctrl.get('monthly_value')?.value || 0);
          console.log(value, 'monthly value');
          return sum + value;
        }, 0)).toFixed(2));
        
        const totalAnnualEarnings = Number((earningsControls.reduce((sum, ctrl) => {  
          const value = Number(ctrl.get('annual_value')?.value || 0);
          console.log(value, 'annual value');
          return sum + value;
        }, 0)).toFixed(2));
        
        const totalMonthlyDeductions = Number((deductionsControls.reduce((sum, ctrl) => {
          const value = Number(ctrl.get('monthly_value')?.value || 0);
          console.log(value, 'monthly deduction value');
          return sum + value;
        }, 0)).toFixed(2));
        
        const totalAnnualDeductions = Number((deductionsControls.reduce((sum, ctrl) => {
          const value = Number(ctrl.get('annual_value')?.value || 0);
          console.log(value, 'annual deduction value');
          return sum + value;
        }, 0)).toFixed(2));
        
        const totalMonthlyBenefits = Number((benefitsArray.controls.reduce((sum, ctrl) => {
          const value = Number(ctrl.get('monthly_value')?.value || 0);
          console.log(value, 'monthly benefit value');
          return sum + value;
        }, 0)).toFixed(2));
        
        const totalAnnualBenefits = Number((benefitsArray.controls.reduce((sum, ctrl) => {
          const value = Number(ctrl.get('annual_value')?.value || 0);
          console.log(value, 'annual benefit value');
          return sum + value;
        }, 0)).toFixed(2));
        
        // --- Update Totals for Display ---
        console.log(totalMonthlyEarnings, totalAnnualEarnings, totalMonthlyDeductions, totalAnnualDeductions, totalMonthlyBenefits, totalAnnualBenefits, 'total values');
        
        // Calculate net salary using CTC-based formula: (Gross - Deductions) + Benefits
        const netAnnualSalary = Number(((totalAnnualEarnings - totalAnnualDeductions) + totalAnnualBenefits).toFixed(2));
        const netMonthlySalary = Number((netAnnualSalary / 12).toFixed(2));
        
        console.log(netAnnualSalary, netMonthlySalary, 'net salary values');
        
        // Update component properties for display
        this.grossMonthlyEarnings = totalMonthlyEarnings;
        this.grossAnnualEarnings = totalAnnualEarnings;
        this.totalMonthlyDeductions = totalMonthlyDeductions;
        this.totalAnnualDeductions = totalAnnualDeductions;
        this.totalMonthlyBenefits = totalMonthlyBenefits;
        this.totalAnnualBenefits = totalAnnualBenefits;
        this.netMonthlySalary = netMonthlySalary;
        this.netAnnualSalary = netAnnualSalary;
        
        // Update form values
        const salaryDetailsGroup = this.employeeForm.get('salaryDetails');
        if (salaryDetailsGroup) {
          salaryDetailsGroup.patchValue({
            grossMonthlyEarnings: totalMonthlyEarnings,
            grossAnnualEarnings: totalAnnualEarnings,
            totalMonthlyDeductions: totalMonthlyDeductions,
            totalAnnualDeductions: totalAnnualDeductions,
            totalMonthlyBenefits: totalMonthlyBenefits,
            totalAnnualBenefits: totalAnnualBenefits,
            netMonthlySalary: netMonthlySalary,
            netAnnualSalary: netAnnualSalary
          }, { emitEvent: false });
        }
        
        // Validate CTC calculation
        const calculatedCTC = netAnnualSalary + totalAnnualBenefits;
        const ctcDifference = Math.abs(calculatedCTC - annualCTC);
        
        // Set CTC validation status and message
        if (annualCTC > 0) {
          if (ctcDifference <= 0.01) {
            this.ctcValidationStatus = 'success';
            this.ctcValidationMessage = `✓ CTC validation successful: Net Salary (${netAnnualSalary.toFixed(2)}) + Benefits (${totalAnnualBenefits.toFixed(2)}) = ${calculatedCTC.toFixed(2)}`;
          } else {
            this.ctcValidationStatus = 'warning';
            this.ctcValidationMessage = `⚠ CTC mismatch: Expected ${annualCTC.toFixed(2)}, Calculated ${calculatedCTC.toFixed(2)} (Difference: ${ctcDifference.toFixed(2)})`;
          }
        } else {
          this.ctcValidationStatus = 'info';
          this.ctcValidationMessage = 'ℹ Enter Annual CTC to validate calculations';
        }
        
        // Set Net Salary validation
        const expectedNetSalary = totalAnnualEarnings - totalAnnualDeductions + totalAnnualBenefits;
        const netSalaryDifference = Math.abs(expectedNetSalary - netAnnualSalary);
        
        if (netSalaryDifference <= 0.01) {
          this.netSalaryValidationStatus = 'success';
          this.netSalaryValidationMessage = `✓ Net Salary calculation verified: (${totalAnnualEarnings.toFixed(2)} - ${totalAnnualDeductions.toFixed(2)}) + ${totalAnnualBenefits.toFixed(2)} = ${expectedNetSalary.toFixed(2)}`;
        } else {
          this.netSalaryValidationStatus = 'error';
          this.netSalaryValidationMessage = `✗ Net Salary calculation error: Expected ${expectedNetSalary.toFixed(2)}, Got ${netAnnualSalary.toFixed(2)}`;
        }
        
        // Set CTC-based totals
        this.totalAnnualCost = annualCTC > 0 ? annualCTC : totalAnnualEarnings;
        this.totalMonthlyCost = this.totalAnnualCost / 12;
        this.inHandMonthlySalary = totalMonthlyEarnings - totalMonthlyDeductions;
        
        console.log('Salary calculation completed. Final values:');
        console.log('Total Annual Cost:', this.totalAnnualCost);
        console.log('Total Monthly Cost:', this.totalMonthlyCost);
        console.log('In Hand Monthly Salary:', this.inHandMonthlySalary);
        
        // Log final form values for debugging
        const finalEarnings = (salaryDetails.get('earnings') as FormArray).controls.map(ctrl => ({
          head_id: ctrl.get('head_id')?.value,
          head_name: ctrl.get('head_name')?.value,
          calculation_value: ctrl.get('calculation_value')?.value,
          calculation_type_name: ctrl.get('calculation_type_name')?.value,
          monthly_value: ctrl.get('monthly_value')?.value,
          annual_value: ctrl.get('annual_value')?.value
        }));
        console.log('Final earnings values:', finalEarnings);
      } else {
        // Reset totals when no earnings
        this.totalAnnualCost = annualCTC;
        this.totalMonthlyCost = annualCTC / 12;
        this.inHandMonthlySalary = 0;
        
        // Reset summary values
        this.grossMonthlyEarnings = 0;
        this.grossAnnualEarnings = 0;
        this.totalMonthlyDeductions = 0;
        this.totalAnnualDeductions = 0;
        this.totalMonthlyBenefits = 0;
        this.totalAnnualBenefits = 0;
        this.netMonthlySalary = 0;
        this.netAnnualSalary = 0;
        
        // Reset validation messages
        this.ctcValidationMessage = '';
        this.ctcValidationStatus = 'info';
        this.netSalaryValidationMessage = '';
        this.netSalaryValidationStatus = 'info';
        
        // Reset form values
        const salaryDetailsGroup = this.employeeForm.get('salaryDetails');
        if (salaryDetailsGroup) {
          salaryDetailsGroup.patchValue({
            grossMonthlyEarnings: 0,
            grossAnnualEarnings: 0,
            totalMonthlyDeductions: 0,
            totalAnnualDeductions: 0,
            totalMonthlyBenefits: 0,
            totalAnnualBenefits: 0,
            netMonthlySalary: 0,
            netAnnualSalary: 0
          }, { emitEvent: false });
        }
      }
    }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'basicInfo' && (!this.shiftList || this.shiftList.length === 0)) {
      this.getShiftList();
    }
    // If switching to payment details tab, ensure form state is correct
    if (tab === 'paymentDetails') {
      this.initializePaymentFormState();
    }
  }

  onShiftDropdownFocus(): void {
    if (!this.shiftList?.length) {
      this.getShiftList();
    }
  }

  // Initialize payment form state based on current payment mode
  initializePaymentFormState(): void {
    const pd = this.employeeForm.get('paymentDetails');
    const mode = pd?.get('payment_mode')?.value;
    // Set validators dynamically for bank transfer; clear for others
    const requiredForBank = ['account_holder_name', 'bank_name', 'iban', 'swift_code', 'employee'];
    requiredForBank.forEach(ctrlName => {
      const ctrl = pd?.get(ctrlName);
      if (!ctrl) return;
      if (mode == '1') {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
      }
      // ctrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  onSubmit() {
    console.log('Form Submitted!',this.grossAnnualEarnings,this.grossMonthlyEarnings, this.employeeForm.getRawValue(), this.activeTab);
    const tab = this.activeTab;
    if (tab !== 'basicInfo' && !this.employeeToEdit && !this.employeeId) {
      this.toast.show('Please save Basic Information first', 'error');
      this.activeTab = 'basicInfo';
      return;
    }
    this.api.get('/employee/list_benefits/'+this.employeeId+"/").subscribe((res:any)=>{
      if(res.status==200){
        this.benefitsData=res.data
        console.log(this.benefitsData,'benefits');
      }
    })
    console.log(this.employeeToEdit, tab, 'employeeToEdit');
    switch (tab) {
      case 'basicInfo':
        this.submitBasicInfo();
        break;
      case 'salaryDetails':
        this.submitSalaryDetails();
        break;
      case 'personalDetails':
        this.submitPersonalDetails();
        break;
      case 'paymentDetails':
        this.submitPaymentDetails();
        break;
      case 'documents':
        this.submitDocuments();
        break;
      default:
        break;
    }
  }

  private getNextTab(current: string): string | null {
    const order = ['basicInfo', 'salaryDetails', 'personalDetails', 'paymentDetails', 'documents'];
    const idx = order.indexOf(current);
    return idx > -1 && idx < order.length - 1 ? order[idx + 1] : null;
  }

  private submitBasicInfo(): void {
    const group = this.employeeForm.get('basicInfo');

    if (!group?.valid) {
      this.employeeForm.markAllAsTouched();
      return;
    }
    console.log(group.value);

    if (this.employeeToEdit) {
      this.api.put('/employee/update_employee/' + this.employeeToEdit + "/", group?.value).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.toast.show('Employee updated successfully', 'success');
            this.basicCompleted = true;
            const next = this.getNextTab('basicInfo');
            if (next) this.activeTab = next;
          } else {
            this.toast.show(res.error, 'error');
            // this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    } else {
      this.api.post('/employee/create_employee/', group.value).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.employeeId = res.data;
            group.patchValue({ id: this.employeeId }, { emitEvent: false });
            ['salaryDetails', 'personalDetails', 'paymentDetails', 'documents'].forEach(path =>
              this.employeeForm.get(path)?.patchValue({ employee: this.employeeId })
            );
            this.toast.show('Employee created successfully', 'success');
            this.basicCompleted = true;
            const next = this.getNextTab('basicInfo');
            if (next) this.activeTab = next;
            this.api.get('/employee/list_benefits/'+this.employeeId+"/").subscribe((res:any)=>{
              if(res.status==200){
                this.benefitsData=res.data
                console.log(this.benefitsData,'benefits');
              }
            })
          } else {
            this.toast.show(res.error, 'error');
            // this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    }
  }

  private submitSalaryDetails(): void {
    this.updateEarningsTotals()
    const group = this.employeeForm.get('salaryDetails');
    console.log(group, 'group');
    
    if (!group?.valid) {
  this.employeeForm.markAllAsTouched();
      return;
    }
   
    const { payload, skippedHeads } = this.buildSalarySubmitPayload(group as FormGroup);
    if (skippedHeads.length) {
      this.toast.show(
        `Removed inactive payroll heads: ${skippedHeads.join(', ')}`,
        'warning'
      );
    }
    const earnings = payload['earnings'] as unknown[];
    if (!earnings?.length && (group.get('earnings') as FormArray)?.length) {
      this.toast.show('No valid payroll heads to save. Add active earning components.', 'error');
      return;
    }
    console.log(payload, 'payload');

    const salaryComponentId = group.get('id')?.value;
    if (this.employeeToEdit && salaryComponentId) {
      this.api.put('/employee/update_employee_salary_component/' + salaryComponentId + '/', payload).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.toast.show('Employee salary component Updated successfully', 'success');
            this.salaryCompleted = true;
            const next = this.getNextTab('salaryDetails');
            if (next) this.activeTab = next;
          } else {
            this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    } else {
      console.log(payload, 'payload908');
      this.api.post('/employee/create_employee_salary_component/', payload).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            if (res.id) {
              group.patchValue({ id: res.id }, { emitEvent: false });
            }
            this.toast.show('Employee salary component saved successfully', 'success');
            this.salaryCompleted = true;
            const next = this.getNextTab('salaryDetails');
            if (next) this.activeTab = next;
          } else {
            this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    }
  }

  private submitPersonalDetails(): void {
    const group = this.employeeForm.get('personalDetails');
    console.log(group);
    
    if (!group?.valid) {
  this.employeeForm.markAllAsTouched();
      return;
    }
    if (this.employeeToEdit && (this.employeeForm.get('personalDetails')?.get('id')?.value!=null || this.employeeForm.get('personalDetails')?.get('id')?.value!=undefined)) {
      this.api.put('/employee/update_employee_personal_details/' + this.employeeForm.get('personalDetails')?.get('id')?.value + "/", group?.value).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.toast.show('Employee personal details Updated successfully', 'success');
            this.personalCompleted = true;
            const next = this.getNextTab('personalDetails');
            if (next) this.activeTab = next;
          } else {
            this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    } else {
      this.api.post('/employee/create_employee_personal_details/', {employee: this.employeeId, ...group.value}).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.toast.show('Employee personal details saved successfully', 'success');
            this.personalCompleted = true;
            const next = this.getNextTab('personalDetails');
            if (next) this.activeTab = next;
          } else {
            this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    }
  }

  private submitPaymentDetails(): void {
    const group = this.employeeForm.get('paymentDetails');
    if (!group?.valid) {
  this.employeeForm.markAllAsTouched();
      return;
    }
    console.log(group?.getRawValue(), 'payment details');
    if (this.employeeToEdit && (this.employeeForm.get('paymentDetails')?.get('id')?.value!=null || this.employeeForm.get('paymentDetails')?.get('id')?.value!=undefined )) {
      this.api.put('/employee/update_bank/' + this.employeeForm.get('paymentDetails')?.get('id')?.value + "/", {employee: this.employeeId, ...group.value}).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.toast.show('Employee payment details Updated successfully', 'success');
            this.paymentCompleted = true;
            const next = this.getNextTab('paymentDetails');
            if (next) this.activeTab = next;
          } else {
            this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    } else {
      this.api.post('/employee/create_employee_payment_details/', {employee: this.employeeId, ...group.value}).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.toast.show('Employee payment details saved successfully', 'success');
            this.paymentCompleted = true;
            const next = this.getNextTab('paymentDetails');
            if (next) this.activeTab = next;
          } else {
            this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    }
  }

  isTabEnabled(tab: string): boolean {
    switch (tab) {
      case 'basicInfo':
        return true;
      case 'salaryDetails':
        return this.basicCompleted;
      case 'personalDetails':
        return this.basicCompleted && this.salaryCompleted;
      case 'paymentDetails':
        return this.basicCompleted && this.salaryCompleted && this.personalCompleted;
      case 'documents':
        return this.basicCompleted && this.salaryCompleted && this.personalCompleted && this.paymentCompleted;
      default:
        return false;
    }
  }
  private submitDocuments(): void {
    const group = this.employeeForm.get('documents');
    if(this.selectedFile){
    group?.get('file')?.patchValue(this.selectedFile)
    }
    console.log(group);
    
    if (!group?.valid) {
      this.employeeForm.markAllAsTouched();
      return;
    }    
  
    if (!group.get('file')?.value) return;
    console.log(this.employeeToEdit, 'employeeToEdit');

    const formData = new FormData();
    formData.append('title', group?.get('title')?.value);
    formData.append('type', group?.get('type')?.value);
    formData.append('file', group.get('file')?.value);
    formData.append('document_number', group.get('document_number')?.value);
    formData.append('country', group.get('country')?.value);
    formData.append('issued_on', group.get('issued_on')?.value);
    formData.append('valid_from', group.get('valid_from')?.value);
    formData.append('expires_on', group.get('expires_on')?.value);
    formData.append('is_primary', group.get('is_primary')?.value);
    formData.append('employee', this.employeeToEdit);
    formData.append('company', this.api.getCompanyId());
    
    
    if (this.employeeToEdit && this.employeeForm.get('documents')?.get('id')?.value) {
      this.api.uploadPut('/employee/update_document/' + this.employeeForm.get('documents')?.get('id')?.value + "/", formData).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.toast.show('Employee documents Updated successfully', 'success');
            this.modalRef.dismiss()
            const next = this.getNextTab('documents');
            this.loadDocuments(this.employeeToEdit)
            if (next) this.activeTab = next;
          } else {
            this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    } else {
      if (!group?.valid) {
      this.employeeForm.markAllAsTouched();
        return;
      }
      console.log(formData, 'formData');
      
      this.api.uplaoadImg('/employee/create_document/', formData).subscribe({
        next: (res: any) => {
          if (res.status == 200) {
            this.loadDocuments(this.employeeToEdit)
            // const bi = this.employeeForm.get('basicInfo');
            // const first = bi?.get('first_name')?.value || '';
            // const last = bi?.get('last_name')?.value || '';
            // this.createdEmployeeFullName = `${first} ${last}`.trim();
            // this.showSuccess = true;
            this.modalRef.dismiss()
            this.toast.show('Employee documents saved successfully', 'success');
          } else {
            this.handleApiError(res);
          }
        },
        error: (err: any) => this.handleApiError(err)
      });
    }
  }

  getDocument(id: any){
    this.api.get('/employee/get_document/'+id+'/').subscribe((res: any) => {
      if (res.status == 200) {
        let documentType=res.data[0]
        this.employeeForm.get('documents')?.patchValue({
          id:documentType.id,
          title:documentType.title,
          type:documentType.type,
          document_number:documentType.document_number,
          issued_on:documentType.issued_on,
          expires_on:documentType.expires_on,
          valid_from:documentType.valid_from,
          is_primary:documentType.is_primary,
          country:documentType.country,
          employee:documentType.employee,
          company:documentType.company,
          file:documentType.file
        })
        // this.documentList = res.data;
      }
    });
  }
  // Helper methods to calculate totals
  calculateTotalEarnings(): number {
    const earnings = this.employeeForm.get('salaryDetails.earnings')?.getRawValue() || [];
    return earnings.reduce((total: number, earning: any) => {
      return total + (parseFloat(earning.annual_value) || 0);
    }, 0);
  }

  calculateTotalDeductions(): number {
    const deductions = this.employeeForm.get('salaryDetails.deductions')?.getRawValue() || [];
    return deductions.reduce((total: number, deduction: any) => {
      return total + (parseFloat(deduction.annual_value) || 0);
    }, 0);
  }

  calculateTotalBenefits(): number {
    const benefits = this.employeeForm.get('salaryDetails.benefits')?.getRawValue() || [];
    return benefits.reduce((total: number, benefit: any) => {
      return total + (parseFloat(benefit.annual_value) || 0);
    }, 0);
  }
  selectedFile: File | null = null;
  isDragOver = false;
  get progressPercentage(): number {
    const index = this.steps.indexOf(this.activeTab);
    return ((index + 1) / this.steps.length) * 100;
  }
  openUploadModal(uploadModal:any,d:any){
    console.log(d);
    this.employeeForm.get('documents')?.reset();
    this.employeeForm.get('documents')?.patchValue({
      type:d
    })
    this.employeeForm.get('documents')?.patchValue({ is_primary: true });
    this.modalRef=this.modalService.open(uploadModal,{
      backdrop:'static',keyboard:false
    })
  }
  onFileSelected(event: any, uploadModal?:any): void {
    console.log(event, 'event');
    const input = event.target;
    console.log(input.files, 'input.files');
    if (input.files) {
      this.employeeForm.get('documents')?.reset();
      this.employeeForm.get('documents')?.patchValue({ is_primary: true });
      this.selectedFile = input.files[0];
      this.employeeForm.get('documents')?.patchValue({ file: this.selectedFile });
      if(uploadModal){
      this.modalRef=this.modalService.open(uploadModal,{
      backdrop:'static',keyboard:false
      })
    }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }
  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  cancelUpload(): void {
    this.selectedFile = null;
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf': return 'bi-file-earmark-pdf';
        case 'xlsx':
        case 'xls': return 'bi-file-earmark-excel';
        case 'zip': return 'bi-file-earmark-zip';
        case 'doc':
        case 'docx': return 'bi-file-earmark-word';
        default: return 'bi-file-earmark-text';
    }
  }

  // Modal methods
  openDepartmentModal(): void {
    this.showDepartmentModal = true;
  }

  closeDepartmentModal(): void {
    this.showDepartmentModal = false;
    this.getDepartmentList();
    
  }
  getDepartmentList(): void {
    this.api.get('/employee/list_departments/').subscribe((res: any) => {
      if (res.status == 200) {
        this.departmentList = res.data;
      }
    });
  }
  getBranchList(): void {
    this.api.get('/employee/list_branches/').subscribe((res: any) => {
      if (res.status == 200) {
        this.branchList = res.data;
      }
    });
  }
  openBranchModal(): void {
    this.showBranchModal = true;
  }

  closeBranchModal(): void {
    this.showBranchModal = false;
    this.getBranchList();
  }
  getDesignationList(): void {
    this.api.get('/employee/list_designations/').subscribe((res: any) => {
      if (res.status == 200) {
        this.designationList = res.data;
      }
    });
  }
  openDesignationModal(): void {
    this.showDesignationModal = true;
  }

  closeDesignationModal(): void {
    this.showDesignationModal = false;
    this.getDesignationList();
  }

  openLocationPayModal(): void {
    this.showLocationPayModal = true;
  }
  getLocationPayList(): void {
    this.api.get('/employee/list_locations/').subscribe((res: any) => {
      if (res.status == 200) {
        this.locationPayList = res.data;
      }
    });
  }
  getShiftList(onLoaded?: () => void): void {
    const company =
      this.api.getUserCompany() ??
      this.employeeForm?.get('basicInfo.company')?.value ??
      this.api.getCompanyId();

    if (company == null || company === '') {
      this.shiftList = [];
      return;
    }

    this.api.post('/attendance/list-subshifts/', { company: Number(company) }).subscribe({
      next: (res: any) => {
        if (res?.status == 200) {
          const rows = Array.isArray(res.data) ? res.data : [];
          this.shiftList = rows.filter((shift: any) => shift && shift.deleted !== true && shift.active !== false);
          this.cdr.markForCheck();
          onLoaded?.();
        } else {
          this.shiftList = [];
          this.cdr.markForCheck();
          this.toast.show('Error', res?.message || 'Failed to load shifts', 'danger');
        }
      },
      error: () => {
        this.shiftList = [];
        this.cdr.markForCheck();
        this.toast.show('Error', 'Failed to load shifts', 'danger');
      }
    });
  }
  closeLocationPayModal(): void {
    this.showLocationPayModal = false;
    this.getLocationPayList();
  }

  // Salary Structure methods
  getSalaryStructures() {
    this.api.get('/employee/list_salary_component_maps/?'+'company='+this.api.getCompanyId()).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.salaryStructures = res.data;
          this.filteredSalaryStructures = [...this.salaryStructures];
          console.log('Salary structures loaded:', this.salaryStructures);
        }
      },
      error: (error) => {
        console.error('Error loading salary structures:', error);
      }
    });
  }

  getPayrollheads() {
    const companyId = this.api.getCompanyId();
    if (!companyId) {
      return;
    }
    this.api.get('/employee/distributed_payroll_list/?company=' + companyId).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.earning = res.data.Earning || [];
          this.deduction = res.data.Deduction || [];
          this.benefit = res.data.Benefits || [];
          console.log('Payroll heads loaded:', res.data);
        }
      },
      error: (error) => {
        console.error('Error loading payroll heads:', error);
      }
    });
  }

  // Salary Structure search and select methods
  onSalaryStructureFocus() {
    this.showSalaryStructureDropdown = true;
    this.filterSalaryStructures();
  }

  onSalaryStructureInput(event: any) {
    this.salaryStructureSearchTerm = event.target.value.toLowerCase();
    this.filterSalaryStructures();
  }

  onSalaryStructureBlur() {
    setTimeout(() => {
      this.showSalaryStructureDropdown = false;
    }, 200);
  }

  filterSalaryStructures() {
    this.filteredSalaryStructures = this.salaryStructures.filter(structure =>
      structure.name.toLowerCase().includes(this.salaryStructureSearchTerm)
      // structure.description.toLowerCase().includes(this.salaryStructureSearchTerm)
    );
  }

  selectSalaryStructure(structure: any) {
    console.log('=== SELECT SALARY STRUCTURE DEBUG ===');
    console.log('selectSalaryStructure called with:', structure);
    
    this.selectedSalaryStructure = structure;
    this.employeeForm.get('salaryDetails.salaryStructure')?.setValue(structure.component_map_id);
    this.salaryStructureSearchTerm = structure.name;
    this.showSalaryStructureDropdown = false;
    
    console.log('Structure details:', {
      id: structure.component_map_id,
      name: structure.name,
      earnings: structure.earnings,
      earningsCount: structure.earnings?.length || 0
    });
    
    if (structure.earnings && structure.earnings.length > 0) {
      console.log('=== EARNINGS DATA FROM API ===');
      structure.earnings.forEach((earning: any, index: number) => {
        console.log(`Earning ${index} from API:`, {
          head_id: earning.id,
          head_name: earning.head_name,
          calculation_type: earning.calculation_type,
          calculation_value: earning.calculation_value,
          monthly_value: earning.monthly_value,
          annual_value: earning.annual_value,
          monthly_value_type: typeof earning.monthly_value,
          annual_value_type: typeof earning.annual_value,
          monthly_value_raw: earning.monthly_value,
          annual_value_raw: earning.annual_value
        });
        
      });
    }
    
    if (!this.salaryData) {
      this.pendingSalaryStructure = structure;
      return;
    }

    // Populate form arrays with structure data
    this.populateFormArraysFromStructure(structure);
  }

  // Flag to prevent recalculation during structure population
  private isPopulatingFromStructure = false;

  populateFormArraysFromStructure(structure: any) {
    console.log('populateFormArraysFromStructure called with:', structure);
    
    // Set flag to prevent recalculation
    this.isPopulatingFromStructure = true;
    this.earnings.clear();
    // Clear existing arrays
    const aaa=this.earnings;
    console.log(aaa, 'this.earnings 24102303');
    
   

    // Reset search arrays
    this.showEarningsDropdown = [];
    this.earningsSearchTerms = [];
    this.filteredEarnings = [];

    // Populate Earnings
    if (structure.earnings && Array.isArray(structure.earnings)) {
      // console.log('Populating earnings:', structure.earnings.length, 'items');
      
      structure.earnings.forEach((earning: any) => {
        const resolvedId = this.resolveActivePayrollHeadId(earning);
        if (resolvedId == null) {
          const label = earning.head_name || earning.categoryName || 'Unknown';
          this.toast.show(
            `Skipped "${label}": payroll head is deleted or not available.`,
            'warning'
          );
          return;
        }

        const newIndex = this.earnings.length;
        const earningFormGroup = this.createEarningItemFromStructure({
          ...earning,
          head_id: resolvedId,
          head: resolvedId,
        });
         this.earnings.push(earningFormGroup);
        
        // console.log('=== AFTER PUSH DEBUG ===');
        // console.log('this.earnings.controls:', this.earnings.controls);
        // console.log('this.earnings.length:', this.earnings.length);
        // console.log('this.earnings.value:', this.earnings.value);
        
        // Debug the last added form group
        // const lastIndex = this.earnings.length - 1;
        // const lastFormGroup = this.earnings.at(lastIndex);
        // console.log(`=== LAST ADDED FORM GROUP (Index ${lastIndex}) ===`);
        // console.log('Last form group object:', lastFormGroup);
        // console.log('Last form group value:', lastFormGroup?.value);
        
        // // Debug individual controls of the last added form group
        // console.log('Last form group controls:');
        // console.log('head_name:', lastFormGroup?.get('head_name')?.value);
        // console.log('calculation_value:', lastFormGroup?.get('calculation_value')?.value);
        // console.log('calculation_type:', lastFormGroup?.get('calculation_type')?.value);
        // console.log('monthly_value:', lastFormGroup?.get('monthly_value')?.value);
        // console.log('annual_value:', lastFormGroup?.get('annual_value')?.value);
        
        // Debug all form groups in the array
        // console.log('=== ALL FORM GROUPS IN ARRAY ===');
        // this.earnings.controls.forEach((control, index) => {
        //   console.log(`Form group ${index}:`, {
        //     head_name: control.get('head_name')?.value,
        //     calculation_value: control.get('calculation_value')?.value,
        //     calculation_type: control.get('calculation_type')?.value,
        //     monthly_value: control.get('monthly_value')?.value,
        //     annual_value: control.get('annual_value')?.value
        //   });
        // });
        
        
        // Initialize search arrays
        this.showEarningsDropdown[newIndex] = false;
        this.earningsSearchTerms[newIndex] = '';
        this.filteredEarnings[newIndex] = [...this.earning];
        // this.earnings.push(a);
        console.log(this.earnings, 'this.earnings 241023');
        
        
        // Log the created form group values
        // console.log(`Form group ${newIndex} created:`, {
        //   head_name: earningFormGroup.get('head_name')?.value,
        //   calculation_type: earningFormGroup.get('calculation_type')?.value,
        //   calculation_value: earningFormGroup.get('calculation_value')?.value,
        //   monthly_value: earningFormGroup.get('monthly_value')?.value,
        //   annual_value: earningFormGroup.get('annual_value')?.value
        // });
      });
    } else {
      console.log('No earnings found in structure or earnings is not an array');
    }

    // Update totals after populating (no recalculation needed since values are from structure)
    setTimeout(() => {
      this.earnings.controls.forEach((control, index) => {
        console.log(`Before updateEarningsTotals - Index ${index}:`, {
          head_name: control.get('head_name')?.value,
          monthly_value: control.get('monthly_value')?.value,
          annual_value: control.get('annual_value')?.value
        });
      });
      
      this.updateEarningsTotals();
      
      // Debug: Check form controls after population
      console.log('Form controls after population:');
      this.earnings.controls.forEach((control, index) => {
        const headIdControl = control.get('head_id');
        const monthlyControl = control.get('monthly_value');
        const annualControl = control.get('annual_value');
        const calculationValueControl = control.get('calculation_value');
        const calculationTypeControl = control.get('calculation_type');
        
        console.log(`Index ${index}:`, {
          head_name: control.get('head_name')?.value,
          head_id: headIdControl?.value,
          isDropdown: control.get('isDropdown')?.value,
          categoryName: control.get('categoryName')?.value,
          calculation_type: calculationTypeControl?.value,
          calculation_value: calculationValueControl?.value,
          monthly_value: monthlyControl?.value,
          annual_value: annualControl?.value,
          disabled: monthlyControl?.disabled,
          valid: monthlyControl?.valid
        });
      });
      
      console.log('Updated totals:', {
        grossMonthlyEarnings: this.grossMonthlyEarnings,
        grossAnnualEarnings: this.grossAnnualEarnings
      });
      
      // Force change detection to update the template
      this.cdr.detectChanges();
      
      // Reset the flag after population is complete
      this.isPopulatingFromStructure = false;
      console.log('Structure population complete, recalculation enabled');
    }, 100);
  }

  // Safely convert values to numbers, handling null, undefined, and string values
  private safeNumber(value: any): number {

    
    if (value === null || value === undefined || value === '') {
      console.log('safeNumber returning 0 due to null/undefined/empty');
      return 0;
    }
    
    const num = Number(value);
    const result = isNaN(num) ? 0 : num;
    return result;
  }

  // Debug function to check form control values
  private debugFormControl(formGroup: FormGroup, name: string) {
    const control = formGroup.get(name);
    console.log(`Form 67control ${name}:`, {
      value: control?.value,
      type: typeof control?.value,
      valid: control?.valid,
      disabled: control?.disabled
    });
  }
  /**
   * Returns PayrollHead id for API payloads.
   * Saved employee earnings use `head` (PayrollHead pk); `id` is EmployeeEarning row id.
   */
  private resolvePayrollHeadId(item: any): number | null {
    if (item == null) return null;
    if (item.head != null && item.head !== '') return Number(item.head);
    const headId = item.head_id != null && item.head_id !== '' ? Number(item.head_id) : null;
    const rowId = item.id != null && item.id !== '' ? Number(item.id) : null;
    const isEmployeeEarningRow = item.employee != null;
    if (headId != null && !(isEmployeeEarningRow && rowId != null && headId === rowId)) {
      return headId;
    }
    if (!isEmployeeEarningRow && rowId != null) return rowId;
    return null;
  }

  /** Active PayrollHead ids from grouped_payroll_heads (excludes deleted). */
  private getActivePayrollHeadIdSet(): Set<number> {
    const ids = new Set<number>();
    if (!this.salaryData || !Array.isArray(this.salaryData)) return ids;
    for (const cat of this.salaryData) {
      for (const h of cat.heads || []) {
        if (h?.id != null) ids.add(Number(h.id));
      }
    }
    return ids;
  }

  private findActivePayrollHeadByName(name: string): any | null {
    if (!name || !this.salaryData || !Array.isArray(this.salaryData)) return null;
    const normalized = name.trim().toLowerCase();
    for (const cat of this.salaryData) {
      for (const h of cat.heads || []) {
        const headName = (h.head_name || '').trim().toLowerCase();
        const payslipName = (h.payslip_name || '').trim().toLowerCase();
        if (headName === normalized || payslipName === normalized) return h;
      }
    }
    return null;
  }

  /** Resolve to an active PayrollHead id; null if deleted/unknown. */
  private resolveActivePayrollHeadId(item: any): number | null {
    const activeIds = this.getActivePayrollHeadIdSet();
    let id = this.resolvePayrollHeadId(item);
    if (id != null && activeIds.has(id)) return id;
    const byName = this.findActivePayrollHeadByName(
      item?.head_name || item?.categoryName || item?.category_name || ''
    );
    if (byName?.id != null) return Number(byName.id);
    return null;
  }

  private buildSalarySubmitPayload(group: FormGroup): {
    payload: Record<string, unknown>;
    skippedHeads: string[];
  } {
    const skippedHeads: string[] = [];
    const mapLineItem = (item: any): Record<string, unknown> | null => {
      const headId = item.head != null && item.head !== '' && this.getActivePayrollHeadIdSet().has(Number(item.head))
        ? Number(item.head)
        : this.resolveActivePayrollHeadId(item);
      if (headId == null) {
        const label = item.head_name || item.categoryName || 'Unknown';
        if (!skippedHeads.includes(label)) skippedHeads.push(label);
        return null;
      }
      const { head, ...rest } = item;
      return { ...rest, head_id: headId };
    };
    const dropNull = (rows: (Record<string, unknown> | null)[]) =>
      rows.filter((row): row is Record<string, unknown> => row != null);
    const earnings = dropNull(
      ((group.get('earnings') as FormArray)?.value || []).map(mapLineItem)
    );
    const deductions = dropNull(
      ((group.get('deductions') as FormArray)?.value || []).map(mapLineItem)
    );
    const benefits = dropNull(
      ((group.get('benefits') as FormArray)?.value || []).map(mapLineItem)
    );
    return {
      payload: {
        ...group.value,
        earnings,
        deductions,
        benefits,
        grossMonthlyEarnings: this.grossMonthlyEarnings,
        grossAnnualEarnings: this.grossAnnualEarnings,
        employee: this.employeeId,
        annualCTC: group.value.annualCTC || 0,
        total_earning: this.calculateTotalEarnings(),
        total_deduction: this.calculateTotalDeductions(),
        total_benefit: this.calculateTotalBenefits(),
        active: true,
      },
      skippedHeads,
    };
  }

  private createEarningItemFromStructure(earning: any, isDropdown = false): FormGroup {
  console.log('Creating earning item from structure:', earning, 'isDropdown:', isDropdown);
  const resolvedHeadId = this.resolveActivePayrollHeadId(earning);
  const hasHeads = this.salaryData.some((cat: { heads: any[]; }) =>
    cat.heads && cat.heads.some((h: any) => h.head_name === earning.head_name)
  );

  console.log(
    `Creating earning item for ${earning.head_name}, hasHeads:`,
    hasHeads
  );
  console.log(isDropdown, 'isDropdown');
  
  return this.fb.group({
    head_id: [resolvedHeadId],
    head: [resolvedHeadId ?? earning.head ?? null],
    head_name: [earning.head_name || ''],
    calculation_value: [this.safeNumber(earning.calculation_value)],
    calculation_type: [earning.calculation_type || 1],
    calculation_type_name: [this.getCalculationTypeName(earning.calculation_type || 1)],
    monthly_value: [this.safeNumber(earning.monthly_value)],
    annual_value: [this.safeNumber(earning.annual_value)],
    head_type: [earning.head_type || 1],
    head_type_name: [earning.head_type_name || 'Earning'],
    isDropdown: [hasHeads],   // ✅ store whether dropdown should show
    categoryName: [earning.category_name || earning.head_name || 'Earning'] // ✅ store category name
  });
}



//   createEarningItemFromStructure(earning: any): FormGroup {
//     console.log('Raw earning object:', earning);
//     console.log('Raw earning object keys:', Object.keys(earning));
//     console.log('Raw earning object values:', {
//       id: earning.id,
//       head_name: earning.head_name,
//       calculation_value: earning.calculation_value,
//       calculation_type: earning.calculation_type,
//       monthly_value: earning.monthly_value,
//       annual_value: earning.annual_value
//     });
    
//     // Check for alternative property names
//     console.log('=== PROPERTY NAME CHECK ===');
//     console.log('monthly_value exists:', 'monthly_value' in earning);
//     console.log('annual_value exists:', 'annual_value' in earning);
//     console.log('monthly_amount exists:', 'monthly_amount' in earning);
//     console.log('annual_amount exists:', 'annual_amount' in earning);
//     console.log('monthly exists:', 'monthly' in earning);
//     console.log('annual exists:', 'annual' in earning);
    
//     // Check all properties that might contain monthly/annual values
//     Object.keys(earning).forEach(key => {
//       if (key.toLowerCase().includes('monthly') || key.toLowerCase().includes('annual')) {
//         console.log(`Found property ${key}:`, earning[key]);
//       }
//     });
    
//   const calculationTypeName = this.getCalculationTypeName(earning.calculation_type || 1);
//   console.log('Creating earning item from structure:', {
//     id: earning.id,
//     head_name: earning.head_name,
//     calculation_value: earning.calculation_value,
//     calculation_type: earning.calculation_type,
//     calculation_type_name: calculationTypeName,
//     monthly_value: earning.monthly_value,
//     annual_value: earning.annual_value
//   });

//     const calculationValue = this.safeNumber(earning.calculation_value);
//     const monthlyValue = this.safeNumber(earning.monthly_value);
//     const annualValue = this.safeNumber(earning.annual_value);
    
//     console.log('Values before form group creation:', {
//       calculationValue,
//       monthlyValue,
//       annualValue
//     });
  
//   const earningItem = this.fb.group({
//     id: [earning.id || null],
//     head_name: [earning.head_name || ''],
//       calculation_value: [calculationValue],
//     calculation_type: [earning.calculation_type || 1],
//     calculation_type_name: [calculationTypeName],
//       monthly_value: [monthlyValue],
//       annual_value: [annualValue],
//     head_type: [1],
//     head_type_name: ['Earning']
//   });
    
//     // Debug: Check the form group values immediately after creation
//     console.log('Form group created with values:', {
//       id: earningItem.get('id')?.value,
//       head_name: earningItem.get('head_name')?.value,
//       calculation_value: earningItem.get('calculation_value')?.value,
//       calculation_type: earningItem.get('calculation_type')?.value,
//       monthly_value: earningItem.get('monthly_value')?.value,
//       annual_value: earningItem.get('annual_value')?.value
//     });
    
//     // Debug each form control individually
//     this.debugFormControl(earningItem, 'calculation_value');
//     this.debugFormControl(earningItem, 'monthly_value');
//     this.debugFormControl(earningItem, 'annual_value');
  
//   // Programmatically disable head_name field if it's Basic Salary (id === 2)
//     console.log(earning, 'earning id');
  
//   // if (earning.id == 2) {
//   //   earningItem.get('head_name')?.disable();
//   //   console.log('Disabled head_name field for Basic Salary (ID: 2)');
//   // }
  
//   return earningItem;
// }

  createDeductionItemFromStructure(deduction: any): FormGroup {
    const calculationTypeName = this.getCalculationTypeName(deduction.calculation_type || 2);
    return this.fb.group({
      id: [deduction.id || null],
      head_name: [deduction.head_name || ''],
      calculation_value: [Number(deduction.calculation_value) || 0],
      calculation_type: [deduction.calculation_type || 2],
      calculation_type_name: [calculationTypeName],
      monthly_value: [Number(deduction.monthly_value) || 0],
      annual_value: [Number(deduction.annual_value) || 0],
      head_type: [2],
      head_type_name: ['Deduction']
    });
  }

  createBenefitItemFromStructure(benefit: any): FormGroup {
    const calculationTypeName = this.getCalculationTypeName(benefit.calculation_type || 3);
    return this.fb.group({
      id: [benefit.id || null],
      head_name: [benefit.head_name || ''],
      calculation_value: [Number(benefit.calculation_value) || 0],
      calculation_type: [benefit.calculation_type || 3],
      calculation_type_name: [calculationTypeName],
      monthly_value: [Number(benefit.monthly_value) || 0],
      annual_value: [Number(benefit.annual_value) || 0],
      head_type: [3],
      head_type_name: ['Benifits']
    });
  }

  // Helper method to get calculation type name from ID
  getCalculationTypeName(type: number): string {
    switch (type) {
      case 1: return 'Fixed';
      case 2: return 'Percentage of Basic';
      case 3: return 'Percentage of Annual CTC';
      default: return 'Fixed';
    }
  }

  // Add row methods
  addEarningsRow() {
    const newIndex = this.earnings.length;
    this.earnings.push(this.createEarningItem('', 0, 'Fixed'));
    
    // Initialize search arrays
    this.showEarningsDropdown[newIndex] = false;
    this.earningsSearchTerms[newIndex] = '';
    this.filteredEarnings[newIndex] = [...this.earning];
  }

  addDeductionsRow() {
    const newIndex = this.deductions.length;
    this.deductions.push(this.createDeductionItem('', 0, 'Fixed'));
    
    // Initialize search arrays
    this.showDeductionsDropdown[newIndex] = false;
    this.deductionsSearchTerms[newIndex] = '';
    this.filteredDeductions[newIndex] = [...this.deduction];
  }

  addBenefitsRow() {
    const newIndex = this.benefits.length;
    this.benefits.push(this.createBenefitItem('', 0, 'Fixed'));
    
    // Initialize search arrays
    this.showBenefitsDropdown[newIndex] = false;
    this.benefitsSearchTerms[newIndex] = '';
    this.filteredBenefits[newIndex] = [...this.benefit];
  }

  // Remove row methods
  removeEarningsRow(index: number) {
    this.earnings.removeAt(index);
    this.showEarningsDropdown.splice(index, 1);
    this.earningsSearchTerms.splice(index, 1);
    this.filteredEarnings.splice(index, 1);
  }

  removeDeductionsRow(index: number) {
    this.deductions.removeAt(index);
    this.showDeductionsDropdown.splice(index, 1);
    this.deductionsSearchTerms.splice(index, 1);
    this.filteredDeductions.splice(index, 1);
  }

  removeBenefitsRow(index: number) {
    this.benefits.removeAt(index);
    this.showBenefitsDropdown.splice(index, 1);
    this.benefitsSearchTerms.splice(index, 1);
    this.filteredBenefits.splice(index, 1);
  }

  // Earnings search and select methods
  onEarningsFocus(index: number) {
    this.showEarningsDropdown[index] = true;
    this.filterEarnings(index);
  }

  onEarningsInput(index: number, event: any) {
    const searchTerm = (event.target?.value || '').toLowerCase();
    this.earningsSearchTerms[index] = searchTerm;
    this.filterEarnings(index);
  }

  onEarningsBlur(index: number) {
    setTimeout(() => {
      this.showEarningsDropdown[index] = false;
    }, 200);
  }

  filterEarnings(index: number) {
    const searchTerm = this.earningsSearchTerms[index]?.toLowerCase() || '';
    this.filteredEarnings[index] = this.earning.filter((item: any) =>
      (item.head_name || '').toLowerCase().includes(searchTerm)
    );
  }

  

  // Deductions search and select methods
  onDeductionsFocus(index: number) {
    this.showDeductionsDropdown[index] = true;
    this.filterDeductions(index);
  }

  onDeductionsInput(index: number, event: any) {
    const searchTerm = (event.target?.value || '').toLowerCase();
    this.deductionsSearchTerms[index] = searchTerm;
    this.filterDeductions(index);
  }

  onDeductionsBlur(index: number) {
    setTimeout(() => {
      this.showDeductionsDropdown[index] = false;
    }, 200);
  }

  filterDeductions(index: number) {
    const searchTerm = this.deductionsSearchTerms[index]?.toLowerCase() || '';
    this.filteredDeductions[index] = this.deduction.filter((item: any) =>
      (item.head_name || '').toLowerCase().includes(searchTerm)
    );
  }

  selectDeduction(index: number, deduction: any) {
    const row = this.deductions.at(index);
    row.patchValue({
      head_name: deduction.head_name,
      id: deduction.id,
      calculation_value: Number(deduction.calculation_value) || 0,
      calculation_type: deduction.calculation_type || 2,
      calculation_type_name: deduction.calculation_type_name || 'Fixed'
    });
    this.deductionsSearchTerms[index] = deduction.head_name;
    this.showDeductionsDropdown[index] = false;
  }

  // Benefits search and select methods
  onBenefitsFocus(index: number) {
    this.showBenefitsDropdown[index] = true;
    this.filterBenefits(index);
  }

  onBenefitsInput(index: number, event: any) {
    const searchTerm = (event.target?.value || '').toLowerCase();
    this.benefitsSearchTerms[index] = searchTerm;
    this.filterBenefits(index);
  }

  onBenefitsBlur(index: number) {
    setTimeout(() => {
      this.showBenefitsDropdown[index] = false;
    }, 200);
  }

  filterBenefits(index: number) {
    const searchTerm = this.benefitsSearchTerms[index]?.toLowerCase() || '';
    this.filteredBenefits[index] = this.benefit.filter((item: any) =>
      (item.head_name || '').toLowerCase().includes(searchTerm)
    );
  }

  selectBenefit(index: number, benefit: any) {
    const row = this.benefits.at(index);
    row.patchValue({
      head_name: benefit.head_name,
      id: benefit.id,
      calculation_value: Number(benefit.calculation_value) || 0,
      calculation_type: benefit.calculation_type || 3,
      calculation_type_name: benefit.calculation_type_name || 'Fixed'
    });
    this.benefitsSearchTerms[index] = benefit.head_name;
    this.showBenefitsDropdown[index] = false;
  }

  // UAE-specific helper methods
  validateUAEIBAN(iban: string): boolean {
    const cleanIBAN = iban.replace(/\s/g, '');
    const ibanPattern = /^AE\d{2}\d{3}\d{4}\d{4}\d{4}\d{4}$/;
    return ibanPattern.test(cleanIBAN);
  }

  // Format IBAN for display
  formatIBAN(iban: string): string {
    const cleanIBAN = iban.replace(/\s/g, '');
    if (cleanIBAN.length === 23 && cleanIBAN.startsWith('AE')) {
      return cleanIBAN.replace(/(.{4})/g, '$1 ').trim();
    }
    return iban;
  }

  // Format IBAN input as user types
  formatIBANInput(event: any, controlName: string): void {
    const input = event.target;
    let value = input.value.replace(/\s/g, '').toUpperCase();
    
    // Ensure it starts with AE
    if (!value.startsWith('AE')) {
      value = 'AE' + value.replace(/^AE/i, '');
    }
    
    // Limit to 23 characters
    if (value.length > 23) {
      value = value.substring(0, 23);
    }
    
    // Format with spaces every 4 characters
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    
    // Update the form control
    const bankDetails = this.employeeForm.get('paymentDetails');
    if (bankDetails) {
      bankDetails.patchValue({ [controlName]: formattedValue }, { emitEvent: false });
    }
    
    // Update input value
    input.value = formattedValue;
  }



  // Validate WPS details
  // validateWPSDetails(): boolean {
  //   const wpsDetails = this.employeeForm.get('paymentDetails.wpsDetails');
  //   if (wpsDetails) {
  //     const establishmentId = wpsDetails.get('wpsEstablishmentId')?.value;
  //     const employeeId = wpsDetails.get('wpsEmployeeId')?.value;
  //     return establishmentId && employeeId;
  //   }
  //   return false;
  // }

  // Validate UAE payment details
  validateUAEPaymentDetails(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const paymentMode = this.employeeForm.get('paymentDetails.payment_mode')?.value;
    
    if (paymentMode == '1') {
      const bankDetails = this.employeeForm.get('paymentDetails');
      if (bankDetails) {
        const iban = bankDetails.get('iban')?.value;
        if (!iban || !this.validateUAEIBAN(iban)) {
          errors.push('Valid UAE IBAN number is required for bank transfer');
        }
        
        const bankName = bankDetails.get('bank_name')?.value;
        if (!bankName) {
          errors.push('UAE bank name is required');
        }
      }

    } else if (paymentMode == '2') {
      // no validation for other payment modes
    } else if (paymentMode == '3') {
      // no validation for other payment modes
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Document management methods
  handleFileUpload(file: File, documentType: string): void {
    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Store the document
    this.documents[documentType] = file;
    
    this.employeeForm.get('documents')?.patchValue({
      file: file
    });
    
    console.log(`Document ${documentType} uploaded:`, file.name);
  }
  // Document editing methods
  editDocument(modalOpen:any,documentType: any): void {
    console.log(documentType);
    this.getDocument(documentType.id);

   
    
    this.modalRef=this.modalService.open(modalOpen)
   }
  removeDocument(documentType: any): void {
    delete this.documents[documentType];
    delete this.documentMetadata[documentType];
    if (this.editingDocument?.key === documentType) {
      this.editingDocument = null;
    }
    // employee/delete_document/1/
    this.api.delete('/employee/delete_document/'+documentType.id+"/").subscribe((res:any)=>{
      if(res.status==200
      ){
       this.toast.show("Document Removed Succesffully!", 'success')
      }
    })
    console.log(`Document ${documentType} removed`);
  }

  hasAnyDocuments(): boolean {
    return this.documentList && typeof this.documentList === 'object' && Object.keys(this.documentList).length > 0;
  }

  getTotalDocumentsCount(): number {
    return Object.keys(this.documentList).length;
  }
  isDocumentUploaded(typeName: string): boolean {
    // if (!this.documents || !Array.isArray(this.documents)) {
    //   return false;
    // }
    // Check if any document in the list matches the type name
    return this.documentList.find((doc: any) => doc.type_name == typeName);
  }
  // Helper to copy present address to permanent
  copyPresentToPermanent(): void {
    const p = this.employeeForm.get('personalDetails');
    if (!p) return;
    const patch: any = {
      permanent_address_line1: p.get('present_address_line1')?.value || '',
      permanent_address_line2: p.get('present_address_line2')?.value || '',
      permanent_city: p.get('present_city')?.value || '',
      permanent_state: p.get('present_state')?.value || '',
      permanent_country: p.get('present_country')?.value || ''
    };
    p.patchValue(patch);
  }

  // Success actions
  addAnotherEmployee(): void {
    this.showSuccess = false;
    // Reset form and go back to first tab
    this.employeeForm.reset();
    // Reapply defaults
    // this.employeeForm.get('basicInfo.phone_country')?.setValue(1);
    this.employeeForm.get('paymentDetails.company')?.setValue(this.api.getCompanyId());
    this.employeeForm.get('paymentDetails.payment_mode')?.setValue('1');
    this.activeTab = 'basicInfo';
  }

  goToEmployeeDetails(): void {
    this.router.navigate(['/payroll/employee']);
  }


  skipTab(): void {
    const order = ['basicInfo', 'salaryDetails', 'personalDetails', 'paymentDetails', 'documents'];
    const idx = order.indexOf(this.activeTab);
    if (idx > -1 && idx < order.length - 1) {
      this.activeTab = order[idx + 1];
    }
  }
  goToStep(index: number) {
    this.activeStep = index;
  }

  // Calculate total annual amount from earnings
  getTotalAnnualAmount(): number {
    let total = 0;
    if (this.earnings && this.earnings.length > 0) {
      this.earnings.controls.forEach((control: AbstractControl) => {
        const annualValue = parseFloat(control.get('annual_value')?.value || '0');
        if (!isNaN(annualValue)) {
          total += annualValue;
        }
      });
    }
    return total;
  }

  // Calculate total monthly amount from earnings
  getTotalMonthlyAmount(): number {
    let total = 0;
    if (this.earnings && this.earnings.length > 0) {
      this.earnings.controls.forEach((control: AbstractControl) => {
        const monthlyValue = parseFloat(control.get('monthly_value')?.value || '0');
        if (!isNaN(monthlyValue)) {
          total += monthlyValue;
        }
      });
    }
    return total;
  }

  // Calculate annual amount based on monthly amount and calculation type
  calculateAnnualAmount(monthlyAmount: number, calculationType: number, calculationValue: number): number {
    if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
      return 0;
    }

    switch (calculationType) {
      case 1: // Fixed
        return monthlyAmount * 12;
      case 2: // % of Basic
        // For percentage calculations, monthly amount is already calculated
        return monthlyAmount * 12;
      case 3: // % of CTC
        // For percentage calculations, monthly amount is already calculated
        return monthlyAmount * 12;
      default:
        return monthlyAmount * 12;
    }
  }

  // Handle monthly amount change and calculate annual
  onMonthlyAmountChange(index: number) {
    // Skip recalculation if we're populating from structure
    if (this.isPopulatingFromStructure) {
      console.log('Skipping monthly amount change during structure population');
      return;
    }
    
    console.log('onMonthlyAmountChange called for index:', index);
    const row = this.earnings.at(index);
    
    // Check if the form control is disabled
    const monthlyControl = row.get('monthly_value');
    console.log('Monthly control state:', {
      disabled: monthlyControl?.disabled,
      value: monthlyControl?.value,
      valid: monthlyControl?.valid
    });
    
    const monthlyAmount = parseFloat(row.get('monthly_value')?.value || '0');
    const calculationType = parseInt(row.get('calculation_type')?.value || '1');
    const calculationValue = parseFloat(row.get('calculation_value')?.value || '0');
    
    console.log('Values:', { monthlyAmount, calculationType, calculationValue });
    
    // Calculate annual amount
    const annualAmount = this.calculateAnnualAmount(monthlyAmount, calculationType, calculationValue);
    
    // Update annual amount without triggering change detection loop
    row.patchValue({ annual_value: annualAmount.toFixed(2) }, { emitEvent: false });
    
    // Update totals
     this.updateEarningsTotals();
  }

  // Handle calculation value change and recalculate amounts
  onCalculationValueChange(index: number) {
    // Skip recalculation if we're populating from structure
    if (this.isPopulatingFromStructure) {
      console.log('Skipping recalculation during structure population');
      return;
    }
    
    const row = this.earnings.at(index);
    const calculationType = parseInt(row.get('calculation_type')?.value || '1');
    const calculationValue = parseFloat(row.get('calculation_value')?.value || '0');
    
    // Recalculate monthly and annual amounts based on new calculation value
    this.recalculateAmounts(index, calculationType, calculationValue);
  }

  // Recalculate amounts based on calculation type and value
  recalculateAmounts(index: number, calculationType: number, calculationValue: number) {
    console.log(calculationType, calculationValue, 'calculationType, calculationValue1');
    
    const row = this.earnings.at(index);
    let monthlyAmount = 0;
    
    switch (calculationType) {
      case 1: // Fixed
        // For fixed amount, use the calculation_value as the monthly amount
        monthlyAmount = calculationValue;
        break;
        
      case 2: // % of Basic
        // Find basic salary component to calculate percentage
        const basicSalary = this.getBasicSalaryAmount();
        if (basicSalary > 0) {
          monthlyAmount = (basicSalary * calculationValue) / 100;
        } else {
          // If no basic salary found, use calculation_value as fixed amount temporarily
          monthlyAmount = calculationValue;
        }
        break;
        
      case 3: // % of CTC
        // Calculate based on total CTC (sum of all components)
        const totalCTC = this.getTotalMonthlyAmount();
        if (totalCTC > 0) {
          monthlyAmount = (totalCTC * calculationValue) / 100;
        } else {
          // If no total CTC found, use calculation_value as fixed amount temporarily
          monthlyAmount = calculationValue;
        }
        break;
        
      default:
        monthlyAmount = calculationValue;
    }
    
    // Update monthly amount
    row.patchValue({ monthly_value: monthlyAmount.toFixed(2) }, { emitEvent: false });
    
    // Calculate and update annual amount
    const annualAmount = this.calculateAnnualAmount(monthlyAmount, calculationType, calculationValue);
    row.patchValue({ annual_value: annualAmount.toFixed(2) }, { emitEvent: false });
    
    // Update totals
    this.updateEarningsTotals();
  }

  // Get basic salary amount from earnings
  getBasicSalaryAmount(): number {
    let basicAmount = 0;
    if (this.earnings && this.earnings.length > 0) {
      this.earnings.controls.forEach((control: AbstractControl) => {
        const headName = control.get('head_name')?.value || '';
        const monthlyValue = parseFloat(control.get('monthly_value')?.value || '0');
        
        // Check if this is a basic salary component (you can customize this logic)
        if (headName.toLowerCase().includes('basic') && monthlyValue > 0) {
          basicAmount = monthlyValue;
        }
      });
    }
    console.log('Basic salary amount found:', this.earnings.value, basicAmount);
    return basicAmount;
  }

  // Update earnings totals
  updateEarningsTotals() {
    const monthlyTotal = this.getTotalMonthlyAmount();
    const annualTotal = this.getTotalAnnualAmount();
    
    this.grossMonthlyEarnings = monthlyTotal;
    this.grossAnnualEarnings = annualTotal;
    // update its value in form also
    // this.employeeForm.get('salaryDetails')?.patchValue({
    //   gross_monthly_earnings: this.grossMonthlyEarnings,
    //   gross_annual_earnings: this.grossAnnualEarnings
    // }, { emitEvent: false });
    console.log('updateEarningsTotals called:', {
      monthlyTotal,
      annualTotal,
      earningsCount: this.earnings.length
    });
  }

  // Handle monthly input click for debugging
  onMonthlyInputClick(index: number) {
    console.log('Monthly input clicked for index:', index);
    const row = this.earnings.at(index);
    const monthlyControl = row.get('monthly_value');
    const annualControl = row.get('annual_value');
    const calculationValueControl = row.get('calculation_value');
    
    console.log('Form control state on click:', {
      index,
      monthly_value: monthlyControl?.value,
      annual_value: annualControl?.value,
      calculation_value: calculationValueControl?.value,
      disabled: monthlyControl?.disabled,
      valid: monthlyControl?.valid,
      rowValue: row.value
    });
  }

  // Debug method to check form control values in template
  debugFormControlValue(index: number, controlName: string): any {
    const row = this.earnings.at(index);
    const control = row.get(controlName);
    console.log(`Template debug - Index ${index}, Control ${controlName}:`, control?.value);
    return control?.value;
  }
  
} 