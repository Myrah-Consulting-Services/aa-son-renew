import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-pay-schedule',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pay-schedule.html',
  styleUrls: ['./pay-schedule.scss']
})
export class PaySchedule implements OnInit {
  scheduleForm: FormGroup;
  daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  schedule :any
  upcomingPayrolls: any[] = []
  isChangePayDayOpen = false
  payDayForm!: FormGroup
  daysInMonth: number[] = Array.from({length: 31}, (_, i) => i + 1)
  salaryMonthLabelModal = ''
  month_list: any[] = []
  // for date input constraints/labels
  dateMin = '';
  dateMax = '';
  firstPayrollMonthLabel = '';
 

  constructor(private fb: FormBuilder,private api:Api) {
    this.scheduleForm = this.fb.group({
      work_week: this.fb.group({
        Sun: [false],
        Mon: [true],
        Tue: [true],
        Wed: [true],
        Thu: [true],
        Fri: [true],
        Sat: [false]
      }),
      salary_basis: ['2', Validators.required],
      org_working_days: [30],
      pay_on: ['specificDay', Validators.required],
      fixed_day: [7],
      first_payroll_month: ['', Validators.required],
      first_pay_date: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getSchedule()
    // Logic to enable/disable number inputs based on radio selection
    this.scheduleForm.get('salary_basis')?.valueChanges.subscribe(value => {
      const workingDaysControl = this.scheduleForm.get('org_working_days');
      if (value === '2') {
        workingDaysControl?.enable();
        workingDaysControl?.setValue(30);
      } else {
        workingDaysControl?.disable();
        workingDaysControl?.setValue(null);
      }
    });

    this.scheduleForm.get('pay_on')?.valueChanges.subscribe(value => {
      const payOnDayControl = this.scheduleForm.get('fixed_day');
      if (value === '4') {
        payOnDayControl?.enable();
      } else {
        payOnDayControl?.disable();
        payOnDayControl?.setValue(null);
      }
    });

    // Update date constraints when month changes
    this.scheduleForm.get('first_payroll_month')?.valueChanges.subscribe((val: string) => {
      if (val) {
        const [year, month] = val.split('-').map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        this.dateMin = this.toDateValue(start);
        this.dateMax = this.toDateValue(end);
        this.firstPayrollMonthLabel = start.toLocaleString(undefined, { month: 'long', year: 'numeric' });
        // If current selected date is out of range, reset
        const current = this.scheduleForm.get('first_pay_date')?.value as string;
        if (current) {
          if (current < this.dateMin || current > this.dateMax) {
            this.scheduleForm.get('first_pay_date')?.setValue('');
          }
        }
      } else {
        this.dateMin = '';
        this.dateMax = '';
        this.firstPayrollMonthLabel = '';
      }
    });
  }
  getSchedule(){
    // employee/list_schedules/
    this.api.get('/employee/detailed_schedules/'+this.api.getUserCompany()+'/').subscribe((response: any) => {
      if(response.status==200){
        this.schedule=response.data
        this.upcomingPayrolls = response.upcoming_payrolls || []
      }
    })
  }

  onSubmitSchedule(): void {
    if (this.scheduleForm.valid) {
      const payload = this.buildPayload();
      console.log('Pay Schedule Submitted:', payload);
      this.api.post('/employee/create_schedules/', payload).subscribe((response: any) => {
        if(response.status==200){
          // this.toast.show('Pay schedule created successfully', 'success');
          this.getSchedule();
        }
      })
      // Here you would typically save the data and update the main view
      // /employee/update_schedules/2/
    } else {
      console.log('Form is invalid.');
      this.scheduleForm.markAllAsTouched();
    }
  }

  private toDateValue(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private buildPayload() {
    const form = this.scheduleForm.value;
    const workWeekSelected: string[] = [];
    const week = form.work_week || {};
    const map: Record<string, string> = { Sun: 'SUN', Mon: 'MON', Tue: 'TUE', Wed: 'WED', Thu: 'THU', Fri: 'FRI', Sat: 'SAT' };
    Object.keys(map).forEach(k => { if (week[k]) workWeekSelected.push(map[k]); });

    // Convert month yyyy-MM to yyyy-MM-01
    let firstMonth = form.first_payroll_month || '';
    if (firstMonth && firstMonth.length === 7) {
      firstMonth = `${firstMonth}-01`;
    }
    return {
      company: this.api.getUserCompany(),
      work_week: workWeekSelected,
      salary_basis: Number(form.salary_basis) || 1,
      org_working_days: form.salary_basis === '2' ? Number(form.org_working_days) || null : null,
      pay_on: form.pay_on === '4' ? 2 : 3, // 4=>specific day, else last working day (3)
      fixed_day: form.pay_on === '4' ? Number(form.fixed_day) || null : null,
      first_payroll_month: firstMonth,
      first_pay_date: form.first_pay_date || ''
    };
  }

  // UI helpers for summary
  get workingDaysLabel(): string {
    if (!this.schedule || !Array.isArray(this.schedule.work_week)) return '';
    const codeToShort: Record<string, string> = { SUN: 'Sun', MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat' };
    return this.schedule.work_week.map((c: string) => codeToShort[c] || c).join(', ');
  }

  get payDayLabel(): string {
    if (!this.schedule) return '';
    if (this.schedule.pay_on === 4 && this.schedule.fixed_day) {
      return `${this.ordinal(this.schedule.fixed_day)} of every month`;
    }
    return 'Last working day of every month';
  }

  get firstPayPeriodLabel(): string {
    if (!this.schedule || !this.schedule.first_payroll_month) return '';
    const d = new Date(this.schedule.first_payroll_month);
    return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }

  private ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  }

  // Modal controls
  openChangePayDay(event?: Event) {
    if (event) { event.preventDefault(); }
    // Initialize modal form with current schedule values
    const payOn = String(this.schedule?.pay_on || 4)
    const fixed = this.schedule?.fixed_day || 1
    const dateStr = this.schedule?.pay_date || ''
    this.payDayForm = this.fb.group({
      pay_on: [payOn, Validators.required],
      fixed_day: [{value: fixed, disabled: payOn !== '4'}, [Validators.min(1), Validators.max(31)]],
      pay_date: [dateStr, Validators.required],
      id: [this.schedule?.id]
    })

    // this.updateSalaryMonthLabelFromDate(dateStr)

    this.payDayForm.get('pay_on')?.valueChanges.subscribe((v: string) => {
      const fd = this.payDayForm.get('fixed_day')
      if (v === '4') { fd?.enable() } else { fd?.disable()}
    })
    this.getlist()
    // this.payDayForm.get('pay_period_start_date')?.valueChanges.subscribe((v: string) => this.updateSalaryMonthLabelFromDate(v))

    this.isChangePayDayOpen = true;
  }

  closeChangePayDay() {
    this.isChangePayDayOpen = false;
  }

  // private updateSalaryMonthLabelFromDate(dateValue: string) {
  //   if (!dateValue) { this.salaryMonthLabelModal = ''; return }
  //   const d = new Date(dateValue)
  //   d.setMonth(d.getMonth() - 1)
  //   this.salaryMonthLabelModal = d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  // }

  savePayDay() {
    if (!this.payDayForm || this.payDayForm.invalid) { return }
    const form = this.payDayForm.getRawValue()
    form.pay_on = Number(form.pay_on)
    form.fixed_day = form.pay_on === 4 ? Number(form.fixed_day) : null
    form.pay_date = form.pay_date
    form.id = this.schedule.id
    this.api.put('/employee/update_schedules/'+this.schedule.id+'/', form).subscribe((response: any) => {
      if(response.status==200){
        this.getSchedule()
      }
    })
    // TODO: integrate API save when endpoint is ready
  
    this.closeChangePayDay()
  }
  getlist(){
    const form = this.payDayForm.getRawValue()
    form.pay_on = Number(form.pay_on)
    form.pay_day = form.pay_on === 4 ? Number(form.fixed_day) : null
    form.pay_period_start_date = ''
    form.id = this.schedule.id
    this.api.post('/employee/calculate_pay_dates/',form).subscribe((response: any) => {
      if(response.status==200){
        // this.schedule = response.data
        this.salaryMonthLabelModal = response.data.pay_period_formatted
        this.month_list = response.data.pay_dates
        this.payDayForm.get('pay_date')?.setValue(response.data.pay_dates[0].pay_date)

        console.log(response.data,'response.data');
      }
    })
  }

  // KPI Helper Method
  getWorkingDaysCount(): number {
    if (!this.schedule || !Array.isArray(this.schedule.work_week)) return 0;
    return this.schedule.work_week.length;
  }
}
