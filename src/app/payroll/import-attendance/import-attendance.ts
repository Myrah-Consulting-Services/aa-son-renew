import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-import-attendance',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './import-attendance.html',
  styleUrl: './import-attendance.scss'
})
export class ImportAttendance {
  @Input() modalRef: any;
  attendanceForm: FormGroup;
  rejected: any;
  showRejectedList: boolean = false;
  statusData: any = [{ "id": 1, "value": "Present" },
  { "id": 2, "value": "Absent" },
  { "id": 3, "value": "Sick Leave" },
  { "id": 4, "value": "Casual Leave" },
  { "id": 5, "value": "Late" },
  { "id": 6, "value": "weekoff" },
  { "id": 7, "value": "Compensatory off" },
  { "id": 8, "value": "Half Day" }]
  constructor(private fb: FormBuilder, private toast: ToastService,
    private http: HttpClient, private api: Api
  ) {
    this.attendanceForm = this.fb.group({
      file: [null],
      company_id:[]
    });   
  }
  ngOnInit() {

  }


  downloadXl() {
    console.log('working');

    const url = 'assets/Excel/Attendance sample.xlsx';
    this.http.get(url, { responseType: 'blob' })
      .subscribe((data: any) => {
        const blob = new Blob([data], { type: 'application/vnd.ms-excel' }); // Specify the file type here
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Attendance_Data.xlsx';
        a.click();
      });
  }

  handleFileInput(event: any) {
    console.log(event.target.files[0], 'event');
    this.attendanceForm.get('file')?.setValue(event.target.files[0]);
    // this.uploadFile()
    // if (event.target.files[0]) {
    //   const reader = new FileReader();
    //   reader.onload = () => {
    //     this.attendanceForm.get('file')?.setValue(event.target.files[0]);
    //   };
    //   reader.readAsDataURL(event.target.files[0]);
    // }
    // if (event.target.files[0] !== undefined) {
    //   // this.uploadFile()
    //   // this.upload = true
    // }
  }



  uploadFile(): void {
    // this.resGet=false
    const formData = new FormData();
    formData.append('file', this.attendanceForm.get('file')?.value);

    this.api.uplaoadImg('/attendance/import-attendance/', formData).subscribe((res: any) => {
      // do something, if upload success
      console.log(res, 'after submit');
      if (res.status == 200) {
        //     this.showList=true
        if (res.code == 1) {
          // this.toast.success('Attendance imported successfully')
          this.modalRef.close()
        } else if (res.status == 2) {
          this.showRejectedList = true
          this.rejected = res.rejected
        }

      } else if (res.status == 400) {
        this.showRejectedList = true
        this.rejected = res.rejected
      } else {
        // this.toast.error('Something went wrong')
      }
      //   this.resGet=true
      //   this.partyList.getPartList('')
      // }, error => {
      //   this.resGet=true
      //   console.log(error);
    });
  }
  submitAndEdit(a: any, c: any) {
    console.log(a, 'submitAndEdit');
    if (a.staff !== null || a.staff !== "") {
      if (a.status !== null) {
        let b = []
        b.push(a)
        this.api.post('attendance/create_attendance/', b).subscribe((res: any) => {
          console.log(res, 'res');
          if (res.status == 200) {
            this.rejected.splice(c, 1)
            if (this.rejected.length == 0) {
              this.showRejectedList = false
              this.modalRef.close()

            }
            // this.toast.success("Attendance register successfully")
          } else if (res.status == 500) {
            this.toast.show(res.msg, 'error')
          }
        })
      } else {
        // this.toast.warning("Select Status");
      }
    } else {
      // this.toast.warning("Enter Staff ID");
    }

  }
  calculateWorkingHours(staff: any) {
    const format = 'HH:mm:ss'; // Time format including seconds

    // if (staff.clock_in && staff.clock_out) {
    //   let clockIn = moment(staff.clock_in, format);
    //   let clockOut = moment(staff.clock_out, format);

    // If clock_out is before clock_in, assume clock_out is on the next day
    //   if (clockOut.isBefore(clockIn)) {
    //     clockOut.add(1, 'day');
    //   }

    //   // Calculate the duration between clock_in and clock_out
    //   const duration = moment.duration(clockOut.diff(clockIn));

    //   // Get total hours as a floating-point number
    //   const hours = duration.asHours(); // Returns hours including the decimal part for minutes

    //   // Set the total working hours in decimal format
    //   staff.total_working_hour = parseFloat(hours.toFixed(2)); // Round to 2 decimal places
    // } else {
    //   staff.total_working_hour = 0;  // If one of the fields is missing
    // }
  }


  // Helper function to pad numbers with leading zeros
  padNumber(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

}
