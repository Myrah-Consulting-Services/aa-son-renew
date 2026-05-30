import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shifts',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './shifts.html',
  styleUrl: './shifts.scss'
})
export class Shifts {
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  shifts: any[] = [
    { label: 'Morning', value: 'morning' },
    { label: 'Afternoon', value: 'afternoon' },
    { label: 'Night', value: 'night' },
    { label: 'Off', value: 'off' }
  ];

  employees: any[] = [
    { id: 1, name: 'Ayesha Khan' },
    { id: 2, name: 'Ahmed Raza' },
    { id: 3, name: 'Zainab Farah' }
  ];

  scheduleForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.scheduleForm = this.fb.group({
      roster: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.initRoster();
  }

  get roster(): FormArray {
    return this.scheduleForm.get('roster') as FormArray;
  }

  initRoster() {
    this.employees.forEach(emp => {
      const row = this.fb.group({
        employeeId: emp.id,
        shifts: this.fb.array(
          this.weekDays.map(() => this.fb.control('off'))
        )
      });
      this.roster.push(row);
    });
  }

  submit() {
    console.log(this.scheduleForm.value);
    // Send to backend
  }
}
