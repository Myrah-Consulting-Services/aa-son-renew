import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private employees = [
    {
      basicInfo: {
        firstName: 'Ahmed',
        lastName: 'Al Mansoori',
        workEmail: 'ahmed.mansoori@company.ae',
        mobileNumber: '0501234567',
        gender: 'Male',
        dob: '1988-03-12',
        age: 36,
        nationality: 'Emirati',
        emiratesId: '784-1988-1234567-1',
        passportNumber: 'A1234567',
        molId: '100200300',
        workPermitNumber: 'WP123456',
        visaExpiry: '2025-06-30',
        laborCardNumber: 'LC987654',
        employeeId: 'UAE001',
        joiningDate: '2020-01-15',
        confirmationDate: '2020-07-15',
        contractType: 'Unlimited',
        emirate: 'Dubai',
        designation: 'Finance Manager',
        department: 'Finance',
        leaveAllowed: 30,
        totalLeaves: 30,
        addressLine: 'Villa 12, Al Barsha',
        city: 'Dubai',
        state: 'Dubai',
        pinCode: '00000',
      },
      salaryDetails: { annualCTC: 240000, earnings: [
        { salaryComponent: 'Basic', monthlyAmount: 10000 },
        { salaryComponent: 'HRA', monthlyAmount: 5000 },
        { salaryComponent: 'Transport Allowance', monthlyAmount: 2000 },
        { salaryComponent: 'Other Allowances', monthlyAmount: 3000 }
      ] },
      paymentDetails: {
        paymentMode: 'Bank Transfer',
        bankDetails: {
          accountHolderName: 'Ahmed Al Mansoori',
          bankName: 'Emirates NBD',
          iban: 'AE070331234567890123456',
          routingNumber: '110000',
          accountType: 'Current',
          wpsNumber: 'WPS123456'
        }
      }
    },
    {
      basicInfo: {
        firstName: 'Fatima',
        lastName: 'Al Farsi',
        workEmail: 'fatima.farsi@company.ae',
        mobileNumber: '0559876543',
        gender: 'Female',
        dob: '1992-11-05',
        age: 31,
        nationality: 'Egyptian',
        emiratesId: '784-1992-7654321-2',
        passportNumber: 'B7654321',
        molId: '200300400',
        workPermitNumber: 'WP765432',
        visaExpiry: '2026-02-15',
        laborCardNumber: 'LC123789',
        employeeId: 'UAE002',
        joiningDate: '2021-09-01',
        confirmationDate: '2022-03-01',
        contractType: 'Limited',
        emirate: 'Abu Dhabi',
        designation: 'HR Officer',
        department: 'Human Resources',
        leaveAllowed: 22,
        totalLeaves: 22,
        addressLine: 'Apt 45, Corniche Rd',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        pinCode: '00000',
      },
      salaryDetails: { annualCTC: 180000, earnings: [
        { salaryComponent: 'Basic', monthlyAmount: 7000 },
        { salaryComponent: 'HRA', monthlyAmount: 3500 },
        { salaryComponent: 'Transport Allowance', monthlyAmount: 1500 },
        { salaryComponent: 'Other Allowances', monthlyAmount: 2000 }
      ] },
      paymentDetails: {
        paymentMode: 'Bank Transfer',
        bankDetails: {
          accountHolderName: 'Fatima Al Farsi',
          bankName: 'Abu Dhabi Islamic Bank',
          iban: 'AE080331234567890987654',
          routingNumber: '120000',
          accountType: 'Savings',
          wpsNumber: 'WPS654321'
        }
      }
    }
  ];

  private attendance = [
    {
      employeeId: 'UAE001',
      records: [
        { date: '2024-06-01', status: 'Present', inTime: '09:00 AM', outTime: '06:00 PM', workedHours: '9', remarks: '' },
        { date: '2024-06-02', status: 'Present', inTime: '09:05 AM', outTime: '06:00 PM', workedHours: '8.92', remarks: '' },
        { date: '2024-06-03', status: 'Absent', inTime: '-', outTime: '-', workedHours: '0', remarks: 'Sick Leave' }
      ]
    },
    {
      employeeId: 'UAE002',
      records: [
        { date: '2024-06-01', status: 'Present', inTime: '08:45 AM', outTime: '05:30 PM', workedHours: '8.75', remarks: '' },
        { date: '2024-06-02', status: 'On Leave', inTime: '-', outTime: '-', workedHours: '0', remarks: 'Annual Leave' },
        { date: '2024-06-03', status: 'Present', inTime: '09:00 AM', outTime: '06:00 PM', workedHours: '9', remarks: '' }
      ]
    }
  ];

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