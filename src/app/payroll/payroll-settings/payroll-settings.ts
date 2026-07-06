import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { BenefitDetails } from "../social-security/benefit-details/benefit-details";

interface ShiftType {
  shift: number;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Employee {
  id: string;
  name: string;
  department: string;
}

interface AttendanceCode {
  id: string;
  code: string;
  description: string;
  payImpact: 'full' | 'half' | 'none';
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'regional' | 'company';
  description?: string;
}

interface ShiftAssignment {
  employeeId: string;
  shiftTypeId: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

interface LeaveType {
  id: string;
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  carryForward: boolean;
  allowEncashment: boolean;
  active: boolean;
}

@Component({
  selector: 'app-payroll-settings',
  templateUrl: './payroll-settings.html',
  styleUrls: ['./payroll-settings.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BenefitDetails],
  providers: [DatePipe]
})
export class PayrollSettingsComponent implements OnInit {
openEdit(arg0: string) {
throw new Error('Method not implemented.');
}
  // Tab management
  activeTab = 'shifts';
  // Form groups
  createShiftForm!: FormGroup;
  overtimeRulesForm!: FormGroup;
  // holidaySettingsForm!: FormGroup;
  shiftTypeForm!: FormGroup;
  // holidayForm!: FormGroup;
  leaveBalanceForm!: FormGroup;
  leaveApprovalForm!: FormGroup;
  createLeaveTypeForm!: FormGroup;
  employeeSettingsForm!: FormGroup;
  
  // Data arrays
  shiftTypes: any[] = [];
  attendanceCodes: AttendanceCode[] = [];
  holidays: Holiday[] = [];
  shiftAssignments: ShiftAssignment[] = [];
  leaveTypes: LeaveType[] = [];

  // Modal states
  editingShift: boolean = false;
  editingHoliday: Holiday | null = null;
  editingLeaveType: boolean = false;
  shifts: any;
  selectedShift: any = "";
  selectedLeaveType: any = "";
  
  // Enhanced functionality properties
  searchTerm: string = '';
  shiftDuration: string = '';
  leaveSearchTerm: string = '';
  payrollSettings: any;
  isSaving: boolean = false;
  custom: any;
  employeeConfig: any;
  employeeConfigForm: any;
employeIdOutput: any;
  constructor(private fb: FormBuilder,
    private apiService: Api,
    private toast: ToastService,
    private modal: NgbModal,
    private datePipe: DatePipe
  ) {
  }
  settingsTabs = [
    { key: 'shifts', label: 'Shifts', icon: 'bi bi-clock' },
    { key: 'attendance', label: 'Attendance', icon: 'bi bi-calendar-check' },
    { key: 'leaves', label: 'Leaves', icon: 'bi bi-calendar-plus' },
    { key: 'overtime', label: 'Overtime', icon: 'bi bi-stopwatch' },
    { key: 'employee-settings', label: 'Employee Settings', icon: 'bi bi-person-gear' },
    { key: 'social-security' , label: 'Social Security Benefits', }
    // { key: 'holidays', label: 'Holidays', icon: 'bi bi-calendar-event' }, // commented in HTML
  ];
  ngOnInit(): void {
    this.initializeForms();
    this.listShift();
    this.loadShifts(this.selectedShift);
    this.listPayrollSettings();
    this.onFinancialYearChange();
    this.getEmployeeSettings();
    this.setActiveTab('shifts')
  }
  onFinancialYearChange() {
    this.employeeSettingsForm.get('is_financial_year')?.valueChanges.subscribe((value: any) => {
      if (value) {
        let year = new Date().getFullYear();
        let year_next = year + 1;
        let startMonth = 3; // April
        let endMonth = 2; // March
        let startDay = 1;
        let endDay = 31;
        this.employeeSettingsForm.get('year_start')?.setValue(this.datePipe.transform(new Date(year, startMonth, startDay), 'yyyy-MM-dd'));
        this.employeeSettingsForm.get('year_end')?.setValue(this.datePipe.transform(new Date(year_next, endMonth, endDay), 'yyyy-MM-dd'));
      }
      else {
        let year = new Date().getFullYear();
        let year_next = year + 1;
        let startMonth = 0;
        let endMonth = 11;
        let startDay = 1;
        let endDay = 31;
        this.employeeSettingsForm.get('year_start')?.setValue(this.datePipe.transform(new Date(year, startMonth, startDay), 'yyyy-MM-dd'));
        this.employeeSettingsForm.get('year_end')?.setValue(this.datePipe.transform(new Date(year_next, endMonth, endDay), 'yyyy-MM-dd'));
      }
    });
  }
  // /attendance/list-payroll-settings/
  listPayrollSettings() {
    this.apiService.post('/attendance/list-payroll-settings/',{
      company: this.apiService.getCompanyId()
    }).subscribe((res: any) => {
      if (res.status == 200) {
        this.payrollSettings = res.data[0];
      
        // Unified form patch
        this.employeeSettingsForm.patchValue({
          working_hours_per_day: this.payrollSettings.working_hours_per_day,
          working_days_per_week: this.payrollSettings.working_days_per_week,
          is_financial_year: this.payrollSettings.is_financial_year,
          year_start: this.payrollSettings.year_start,
          year_end: this.payrollSettings.year_end,
          annual_leave_days: this.payrollSettings.annual_leave_days,
          sick_leave_days: this.payrollSettings.sick_leave_days,
          casual_leave_days: this.payrollSettings.casual_leave_days,
          carry_forward_limit: this.payrollSettings.carry_forward_limit,
          allow_leave_encashment: this.payrollSettings.allow_leave_encashment,
          auto_approval_limit: this.payrollSettings.auto_approval_limit,
          notification_days: this.payrollSettings.notification_days,
          require_manager_approval: this.payrollSettings.require_manager_approval,
          regular_multiplier: this.payrollSettings.regular_multiplier,
          holiday_multiplier: this.payrollSettings.holiday_multiplier,
          weekend_multiplier: this.payrollSettings.weekend_multiplier,
          night_shift_multiplier: this.payrollSettings.night_shift_multiplier,
          daily_overtime_threshold: this.payrollSettings.daily_overtime_threshold,
          weekly_overtime_threshold: this.payrollSettings.weekly_overtime_threshold,
          max_daily_overtime: this.payrollSettings.max_daily_overtime,
          max_weekly_overtime: this.payrollSettings.max_weekly_overtime,
          require_overtime_approval: this.payrollSettings.require_overtime_approval,
          attendance_mode:this.payrollSettings.attendance_mode
        });
      }
    });
  }

  initializeForms(): void {
    // Create Shift Form
    this.createShiftForm = this.fb.group({
      shift: ['', Validators.required],
      title: ['', Validators.required],
      time_start: ['', Validators.required],
      time_end: ['', Validators.required],
      active: [true],
      id:['']
    });

    // Unified Employee Settings Form (attendance + leaves + overtime + rules)
    this.employeeSettingsForm = this.fb.group({
      // Attendance
      working_hours_per_day: [8, [Validators.required, Validators.min(1), Validators.max(24)]],
      working_days_per_week: [5, [Validators.required, Validators.min(1), Validators.max(7)]],
      is_financial_year: [false],
      year_start: [],
      year_end: [],
      // Leave balances
      annual_leave_days: [21, Validators.required],
      sick_leave_days: [12, Validators.required],
      casual_leave_days: [7, Validators.required],
      carry_forward_limit: [5, Validators.required],
      allow_leave_encashment: [true],
      // Leave approval
      auto_approval_limit: [3, Validators.required],
      notification_days: [7, Validators.required],
      require_manager_approval: [true],
      // Overtime multipliers
      regular_multiplier: [1.25, [Validators.required, Validators.min(1)]],
      holiday_multiplier: [1.5, [Validators.required, Validators.min(1)]],
      weekend_multiplier: [1.5, [Validators.required, Validators.min(1)]],
      night_shift_multiplier: [1.75, [Validators.required, Validators.min(1)]],
      // Overtime rules
      daily_overtime_threshold: [8, [Validators.required, Validators.min(0), Validators.max(24)]],
      weekly_overtime_threshold: [40, [Validators.required, Validators.min(0), Validators.max(168)]],
      max_daily_overtime: [4, [Validators.required, Validators.min(0), Validators.max(24)]],
      max_weekly_overtime: [20, [Validators.required, Validators.min(0), Validators.max(168)]],
      require_overtime_approval: [true],
      attendance_mode:['daily']
    }); 
    this.employeeConfigForm=this.fb.group({
        custom_fields: this.fb.array([]),
        employee_code_config: this.fb.group({
          prefix: [""],
          start_number: [1],
          padding: [0]
        }),
        
    })
    // Ensure at least one custom field control exists for the UI
    if (this.customFields?.length === 0) {
      this.customFields.push(this.document_number());
    }
  }

  // Tab management
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getParticularShift(shift: any) {
    this.apiService.post('/attendance/get-subshifts/', { id: shift }).subscribe((res: any) => {
      if (res.status == 200) {
        this.createShiftForm.patchValue(res.data);
      }
    });
  }
  createShiftOpen(createShiftForm: any, shift: any) {
    if (shift) {
      this.editingShift = true;

      this.createShiftForm.patchValue({
        shift: shift.shift,
        title: shift.title,
        time_start: shift.time_start,
        time_end: shift.time_end,
        active: shift.active,
        id:shift.id
      });
      console.log(this.createShiftForm.value);
      // this.getParticularShift(shift.id);
    }
    else {
      this.editingShift = false;
    }
    this.modal.open(createShiftForm, { size: 'lg', centered: true });
  }
  // Shift Management
  createUpdateShift(): void {
    // /attendance/create-subshifts/
    if (this.editingShift) {
      this.apiService.put('/attendance/put-subshifts/'+this.createShiftForm.value.id+"/", this.createShiftForm.value).subscribe((res: any) => {
        if (res.status == 200) {
          this.toast.show(res.message, 'success');
          this.listShift();
          this.modal.dismissAll();
        }
        else {
          this.toast.show(res.message, 'error');
        }
      });
    }
    else {
      this.apiService.post('/attendance/create-subshifts/', this.createShiftForm.value).subscribe((res: any) => {
        if (res.status == 200) {
          this.toast.show(res.message, 'success');
          this.listShift();
          this.modal.dismissAll();
        }
        else {
          this.toast.show(res.message, 'error');
        }
      });
    }
  }
  // /attendance/list-shifts/
  listShift() {
    this.apiService.post('/attendance/list-shifts/', { company: this.apiService.getCompanyId() }).subscribe((res: any) => {
      if (res.status == 200) {
        this.shiftTypes = res.data;
      }
      else {
        this.toast.show(res.message, 'error');
      }
    });
  }
  loadShifts(shiftType: any) {
    this.apiService.post('/attendance/list-subshifts/', { shift: shiftType }).subscribe((res: any) => {
      if (res.status == 200) {
        this.shifts = res.data;
      }
      else {
        this.toast.show(res.message, 'error');
      }
    });
  }

  deleteShiftType(shiftId: number): void {
    if (confirm('Are you sure you want to delete this shift type?')) {
      this.apiService.delete('/attendance/delete-subshifts/'+ shiftId+"/").subscribe((res: any) => {
        if (res.status == 200) {
          this.toast.show(res.message, 'success');
          this.listShift();
        }
        else {
          this.toast.show(res.message, 'error');
        }
      });
    }
  }

 


 

  // Enhanced functionality methods
  getActiveShiftsCount(): number {
    return this.shifts?.filter((shift: any) => shift.active)?.length || 0;
  }

  getFilteredShifts(): any[] {
    if (!this.shifts) return [];
    
    let filtered = this.shifts;
    
    // Filter by search term
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter((shift: any) => 
        shift.title?.toLowerCase().includes(search) ||
        shift.code?.toLowerCase().includes(search)
      );
    }
    
    // Filter by shift type
    if (this.selectedShift) {
      filtered = filtered.filter((shift: any) => shift.shift == this.selectedShift);
    }
    
    return filtered;
  }

  calculateShiftDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '';
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  onShiftTypeChange(): void {
    const shiftType = this.createShiftForm.get('shift')?.value;
    if (shiftType) {
      // Auto-generate code based on shift type
      const code = shiftType === '1' ? 'GEN' : 'ROT';
      this.createShiftForm.patchValue({ code: code });
    }
  }

  calculateDuration(): void {
    const startTime = this.createShiftForm.get('time_start')?.value;
    const endTime = this.createShiftForm.get('time_end')?.value;
    
    if (startTime && endTime) {
      this.shiftDuration = this.calculateShiftDuration(startTime, endTime);
    } else {
      this.shiftDuration = '';
    }
  }

  // Enhanced form validation
  isFormValid(): boolean {
    return this.createShiftForm.valid && 
           this.createShiftForm.get('time_start')?.value && 
           this.createShiftForm.get('time_end')?.value;
  }

  // Quick actions
  clearSearch(): void {
    this.searchTerm = '';
  }

  resetFilters(): void {
    this.selectedShift = '';
    this.searchTerm = '';
  }

  // Enhanced shift management
  toggleShiftStatus(shift: any): void {
    shift.active = !shift.active;
    // Update in backend
    this.apiService.post('/attendance/update-shift/', {
      id: shift.shift,
      active: shift.active
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toast.show(`Shift ${shift.active ? 'activated' : 'deactivated'} successfully`, 'success');
        }
      },
      error: (error) => {
        this.toast.show('Error updating shift status', 'error');
        shift.active = !shift.active; // Revert on error
      }
    });
  }

  // Export functionality
  exportShifts(): void {
    const filteredShifts = this.getFilteredShifts();
    const csvContent = this.convertShiftsToCSV(filteredShifts);
    this.downloadCSV(csvContent, 'shifts_export.csv');
  }

  private convertShiftsToCSV(shifts: any[]): string {
    const headers = ['Shift Name', 'Code', 'Type', 'Start Time', 'End Time', 'Duration', 'Status'];
    const rows = shifts.map(shift => [
      shift.title,
      shift.code,
      shift.shift === 1 ? 'General' : 'Rotational',
      shift.time_start,
      shift.time_end,
      this.calculateShiftDuration(shift.time_start, shift.time_end),
      shift.active ? 'Active' : 'Inactive'
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Leave Settings Methods
  getActiveLeaveTypesCount(): number {
    return this.leaveTypes?.filter((leaveType: any) => leaveType.active)?.length || 0;
  }

  getFilteredLeaveTypes(): any[] {
    if (!this.leaveTypes) return [];
    
    let filtered = this.leaveTypes;
    
    // Filter by search term
    if (this.leaveSearchTerm) {
      const search = this.leaveSearchTerm.toLowerCase();
      filtered = filtered.filter((leaveType: any) => 
        leaveType.name?.toLowerCase().includes(search) ||
        leaveType.code?.toLowerCase().includes(search) ||
        leaveType.description?.toLowerCase().includes(search)
      );
    }
    
    // Filter by leave type
    if (this.selectedLeaveType) {
      filtered = filtered.filter((leaveType: any) => leaveType.type === this.selectedLeaveType);
    }
    
    return filtered;
  }

  createLeaveTypeOpen(createLeaveTypeForm: any, leaveType: any): void {
    this.editingLeaveType = !!leaveType;
    if (leaveType) {
      this.createLeaveTypeForm.patchValue(leaveType);
    } else {
      this.createLeaveTypeForm.reset();
      this.createLeaveTypeForm.patchValue({
        active: true,
        carryForward: false,
        allowEncashment: false
      });
    }
    this.modal.open(createLeaveTypeForm, { size: 'lg' });
  }

  

  updateSettings(): void {
      const settings = this.employeeSettingsForm.value;
      let company=this.apiService.getCompanyId()
      this.apiService.put('/attendance/update-payroll-settings/'+company+"/", settings).subscribe({
        next: (response: any) => {
          if (response.status==200) {
            this.toast.show('Leave balance settings updated successfully', 'success');
            this.listPayrollSettings()
          }
        },
        error: (error) => {
          console.error('Error updating leave balance settings:', error);
          this.toast.show('Error updating leave balance settings', 'error');
        }
      });
  }

  updateLeaveApprovalSettings(): void {
    if (this.leaveApprovalForm.valid) {
      const settings = this.leaveApprovalForm.value;
      this.apiService.post('/attendance/update-leave-approval-settings/', settings).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toast.show('Leave approval settings updated successfully', 'success');
          }
        },
        error: (error) => {
          console.error('Error updating leave approval settings:', error);
          this.toast.show('Error updating leave approval settings', 'error');
        }
      });
    }
  }

  // Unified save for employee settings
  saveAllSettings(): void {
    this.isSaving = true;
    const v = this.employeeSettingsForm.value;
    const leaveBalancePayload = {
      annualLeaveDays: v.annualLeaveDays,
      sickLeaveDays: v.sickLeaveDays,
      casualLeaveDays: v.casualLeaveDays,
      carryForwardLimit: v.carryForwardLimit,
      allowLeaveEncashment: v.allowLeaveEncashment
    };
    const leaveApprovalPayload = {
      autoApprovalLimit: v.autoApprovalLimit,
      notificationDays: v.notificationDays,
      requireManagerApproval: v.requireManagerApproval
    };
    const requests = [
      this.apiService.post('/attendance/update-leave-balance-settings/', leaveBalancePayload),
      this.apiService.post('/attendance/update-leave-approval-settings/', leaveApprovalPayload)
    ];
    let done = 0; let hadError = false;
    requests.forEach((req$) => {
      req$.subscribe({
        next: (res: any) => { if (!(res?.success || res?.status == 200)) hadError = true; },
        error: () => { hadError = true; },
        complete: () => {
          done++;
          if (done === requests.length) {
            this.isSaving = false;
            this.toast.show(hadError ? 'Some settings failed to save' : 'Employee settings saved', hadError ? 'error' : 'success');
          }
        }
      });
    });
  }
  // Custom fields helpers
  get customFields(): FormArray {
    return this.employeeConfigForm.get('custom_fields') as FormArray;
  }

  private document_number(field?: any): FormGroup {
    return this.fb.group({
      name: [field?.field_name || '', Validators.required],
      field_type_id: [field?.field_type_id || '', Validators.required],
      field_type:[field?.field_type],
      is_required: [field?.is_required ?? false]
    });
  }

  addCustomField(): void {
    this.customFields.push(this.document_number());
  }

  removeCustomField(index: number): void {
    // Remove from modal FormArray
    if (index > -1 && index < this.customFields.length) {
      this.customFields.removeAt(index);
    }
    // Reflect removal in snapshot table if present
    if (Array.isArray(this.custom) && index > -1 && index < this.custom.length) {
      this.custom.splice(index, 1);
    }
  }
 
  // /employee/get_employee_settings/
  getEmployeeSettings(){
    let company_id=this.apiService.getCompanyId()
    this.apiService.get('/employee/get_employee_settings/'+company_id+"/"  ,{}).subscribe((res: any) => {
      if(res.status == 200){
        const incomingRaw = Array.isArray(res.data?.custom_fields) ? res.data.custom_fields : [];
        this.custom = incomingRaw;
        let customFields = this.employeeConfigForm.get('custom_fields') as FormArray;
        customFields.clear();
          this.custom.forEach((item: any) => {
            customFields.push(this.fb.group({
              name: [item.field_name || item.name],
              field_type_id: [item.field_type_id || ''],
              field_type:[item.field_type],
              is_required: [item.is_required || false],
              id:[item.id]
            }));
          });
       
        this.employeeConfig=res.data.employee_code_config
     
        this.employeeConfigForm.patchValue({
          employee_code_config: {
            prefix: this.employeeConfig.prefix || "",
            start_number: this.employeeConfig.start_number || 1,
            padding: this.employeeConfig.padding || 0
          }
        });
        console.log(this.employeeConfigForm.value);
        
      }
    })
  }

  // Persist current custom fields to backend
  saveCustomFields(): void {
    const payload = {
      company: this.apiService.getCompanyId(),
      data:this.employeeConfigForm.value
      // custom_fields: this.customFields.value,
    };
    // employee/update_employee_settings/1/
    this.apiService.post('/employee/update_employee_settings/'+this.apiService.getCompanyId()+"/", payload).subscribe((res: any) => {
      if (res?.status == 200 || res?.success) {
        this.toast.show('Custom fields saved', 'success');
        this.getEmployeeSettings()
      } else {
        this.toast.show('Failed to save custom fields', 'error');
      }
    }, () => this.toast.show('Failed to save custom fields', 'error'));
  }
  get employeeIdPreview(): string {
    const config = this.employeeConfigForm.get('employee_code_config')?.value;
    if (!config) return '';
  
    const prefix = config.prefix || '';
    const startNumber = config.start_number || 0;
    const padding = config.padding || 0;
  
    // pad the number (e.g., 11 → 011 if padding=3)
    const numberPart = String(startNumber).padStart(padding, '0');
  
    return `${prefix}${numberPart}`;
  }
  
}
