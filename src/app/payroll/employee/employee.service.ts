import { Injectable } from '@angular/core';
import {
  NABLUS_ATTENDANCE,
  NABLUS_EMPLOYEES,
} from '../../core/demo/nablus-road-contracting.data';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private employees = NABLUS_EMPLOYEES.map((e) => ({ ...e }));

  private attendance = NABLUS_ATTENDANCE.map((a) => ({
    employeeId: a.employeeId,
    records: a.records.map((r) => ({ ...r })),
  }));

  getEmployees() {
    return this.employees;
  }

  getEmployeeById(id: string) {
    return this.employees.find(e => e.basicInfo.employeeId === id);
  }

  getAttendanceByEmployeeId(id: string) {
    return this.attendance.find(a => a.employeeId === id)?.records || [];
  }

  getAllAttendanceRecords() {
    // Flatten all attendance records and add employeeName for each
    const records: any[] = [];
    for (const emp of this.employees) {
      const empAttendance = this.attendance.find(a => a.employeeId === emp.basicInfo.employeeId);
      if (empAttendance) {
        for (const rec of empAttendance.records) {
          records.push({
            employeeId: emp.basicInfo.employeeId,
            employeeName: emp.basicInfo.firstName + ' ' + emp.basicInfo.lastName,
            ...rec
          });
        }
      }
    }
    return records;
  }
}
