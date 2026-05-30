import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AddEmployeeComponent } from '../add-employee/add-employee';
import { ToastService } from '../../core/services/toast.service';
import { BenefitCreation } from '../benefit-creation/benefit-creation';
import { AirTravelEarningCreate } from "../air-travel-earning-create/air-travel-earning-create";
import { DeductionCreate } from '../deduction-create/deduction-create';
import { EmployeeDetail } from '../employee-detail/employee-detail';
import { TerminateProcess } from '../terminate-process/terminate-process';
import { SalaryHistory } from '../salary-history/salary-history';
import { CreateLoanComponent } from '../create-loan/create-loan';

@Component({
  selector: 'app-employee-view-details',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, AddEmployeeComponent, BenefitCreation, AirTravelEarningCreate,DeductionCreate,EmployeeDetail],
  templateUrl: './employee-view-details.html',
  styleUrl: './employee-view-details.scss'
})
export class EmployeeViewDetails {
  employee: any = null;
  attendance: any[] = [];
  tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'salary', label: 'Salary Details' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'payslips', label: 'Payslips' },
    { key: 'loans', label: 'Loans' },
    { key: 'documents', label: 'Documents' },
  ];
  activeTab = 'overview';
  selectedEmployee: any;
  loanLedgers: any;
  documentList: any;
  selectedMonth: any;
  companyInfo: any = null;

  
 
  types: any;
  id: any | null;
  deductionModalRef: any;
  benefitsModalRef: any;
  airTravelModalRef: any;
  salaryObject: any;
  deductions: any;
  benefits: any;
  airDeductions: any;
  benefitData: any;
  deductionData: any;
  airData: any;
  for_emit: any;
  payslipData: any;
  constructor(private route:ActivatedRoute, private router: Router, private modalService: NgbModal, private api: Api, private fb: FormBuilder,
    private toast:ToastService
  ) {}

  getcurrency() {
    return this.api.getcurrencies();
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.api.get(`/employee/get_employee/${this.id}`).subscribe((res: any) => {
      this.employee = res.data;
      console.log(this.employee,'employee');
    });
    const navigation = this.router.getCurrentNavigation();
    this.activeTab = navigation?.extras?.state?.['tab'] || 'overview';
    console.log(navigation?.extras?.state?.['tab'],'activeTab');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = ('0' + (currentDate.getMonth() + 1)).slice(-2); // Get current month in "MM" format
    this.selectedMonth = `${currentYear}-${currentMonth}`;
    this.loadData();
    this.loadLoanLedgers(this.id)
    this.loadDocuments(this.id)
    this.getotherDeductionList()
    this.loadPayslipDetails(this.id)
  }
  getotherDeductionList(){
    // /employee/payroll_heads_special_groups/
    // this.api.get('/employee/payroll_heads_special_groups/'+this.id+"/").subscribe((res:any)=>{
    //   if(res.status==200){
    //     this.earningNames=res.Air_tickiting_allowance
    //     this.deductionNames=res.deduction
    //     this.benefitPlans=res.benifits
    //     console.log(this.earningNames,'earning names');
    //   }
    // })
  //  list_air_travel_allowances/2/
    this.api.get('/employee/list_air_travel_allowances/'+this.id+"/").subscribe((res:any)=>{
      if(res.status==200){
        this.airDeductions=res.data;
      }
    })
    this.api.get('/employee/list_benefits/'+this.id+"/").subscribe((res:any)=>{
      if(res.status==200){
        this.benefits=res.data
        console.log(this.benefits,'benefits');
      }
    })
    this.api.get('/employee/list_deductions/'+this.id+"/").subscribe((res:any)=>{
      if(res.status==200){
        this.deductions=res.data
        console.log(this.deductions,'deductions');
      }
    })
  }
  openBenefitModal(data:any,modal: any) {
    this.activeTab='salary'
    this.benefitData=data
    this.benefitsModalRef=this.modalService.open(modal, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
    });
    // afterclosed
    this.benefitsModalRef.result.then((result: any) => {
      this.getotherDeductionList()
    }).catch((error: any) => {
      this.getotherDeductionList()
    });
  }



  openAirTravelModal(data:any,modal: any){
    this.activeTab='salary'
    this.airData=data
    this.airTravelModalRef=this.modalService.open(modal, { centered: true, backdrop: 'static', keyboard: false });
    this.airTravelModalRef.result.then((result: any) => {
      this.getotherDeductionList()
    }).catch((error: any) => {
      this.getotherDeductionList()
    });
  }
  openDeductionModal(data:any,modal: any){
    this.activeTab='salary'
    this.deductionData=data
    this.deductionModalRef=this.modalService.open(modal, { centered: true, backdrop: 'static', keyboard: false });
    this.deductionModalRef.result.then((result: any) => {
      this.getotherDeductionList()
    }).catch((error: any) => {
      this.getotherDeductionList()
    });
  }
  deleteDeduction(deduction: any): void { 
    if (confirm('Are you sure you want to delete this deduction?')) {
      this.api.delete('/employee/delete_deductions/'+deduction.id +"/").subscribe((res: any) => {
        if (res.status == 200) {
          this.toast.show('success', 'Deduction deleted successfully');
          this.getotherDeductionList();
        } else {
          this.toast.show('error', 'Failed to delete deduction');
        }
      });
    }
  }
  deleteBenefit(benefit: any): void { 
    if (confirm('Are you sure you want to delete this benefit?')) {
      this.api.delete('/employee/delete_benefits/'+benefit.id+"/").subscribe((res: any) => {
        if (res.status == 200) {
          this.toast.show('success', 'Benefit deleted successfully');
          this.getotherDeductionList();
        } else {
          this.toast.show('error', 'Failed to delete benefit');
        }
      } );
    }
  }
  deleteAirTravel(airTravel: any): void { 
    if (confirm('Are you sure you want to delete this Air Travel Allowance?')) {
      this.api.delete('/employee/delete_air_travel_allowance/'+airTravel.id+"/").subscribe((res: any) => {
        if (res.status == 200) {
          this.toast.show('success', 'Air Travel Allowance deleted successfully');
          this.getotherDeductionList();
        } else {
          this.toast.show('error', 'Failed to delete Air Travel Allowance');
        }
      } );
    }
  }
  // /employee/employee_based_document/18/
  loadDocuments(emp:any){
    this.api.get('/employee/employee_based_document/'+emp+"/").subscribe((response:any)=>{
      if (response.status == 200) {
        this.documentList=response.documents
      }
    })

  }
  // /attendance/employee-loan-payment-history/
  loadLoanLedgers(employeeId: any): void {
    this.api.post('/attendance/employee-loan-payment-history/',{
      employee_id: employeeId,
      company_id:this.api.getCompanyId()
    }).subscribe((response: any) => {
      if (response.status == 200) {
        this.loanLedgers =[response.data];
        // this.summary = response.data.overall_summary;
        // this.repayment_history = response.data.repayment_history;
      }
    });
  }
  editLoan(loanId: string): void {
    if (!loanId) return;
    const modalRef = this.modalService.open(CreateLoanComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    
    // Pass employee data to the create loan component
    modalRef.componentInstance.modalRef = modalRef;
    modalRef.componentInstance.loanData = loanId;
    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        // Refresh loan data if needed
        this.loadLoanLedgers(this.employee.id);
      }
    }).catch((error) => {
      // Modal was dismissed
    });
  }
    deleteLoan(loanId: string): void {
    if (!loanId) return;
    const ok = confirm('Are you sure you want to delete this loan?');
    if (!ok) return;
    this.api.delete(`/attendance/delete-loan/${loanId}/`).subscribe((response: any) => {
      this.toast.show('Loan deleted','success');
      this.loadLoanLedgers(this.id);});
  }
  loadData(){
    const id = this.route.snapshot.paramMap.get('id');
    let for_emit = {
      // "start_date": this.start_date,
      // "end_date": this.end_date,
      "employee_id": id,
      "company_id": this.api.getCompanyId(),
      "date":this.selectedMonth

    }
    this.api.post('/attendance/get-employee-attendance/', for_emit).subscribe((res: any) => {
      console.log(res, 'success');
      if (res.status == 200) {
        this.for_emit = res
        this.for_emit.selectedMonth=this.selectedMonth
      }
    });
  }
  togglePortalAccess(){
    this.employee.portal_access_enabled = !this.employee.portal_access_enabled;
  }
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Salary helpers
   getSalaryObject() {
    return this.employee?.salary_components[0]
 
  }

  getEarnings(): any[] {
    const s = this.getSalaryObject();
    return s?.earnings || [];
  }

  getDeductions(): any[] {
    const s = this.getSalaryObject();
    return s?.deductions || [];
  }

  getBenefits(): any[] {
    const s = this.getSalaryObject();
    return s.benefits || [];
  }

  sumMonthly(items: any[]): number {
    return (items || []).reduce((sum, i) => sum + Number(i.monthly_amount || i.monthly_value || 0), 0);
  }

  sumAnnual(items: any[]): number {
    return (items || []).reduce((sum, i) => {
      const annual = Number(i.annual_amount || i.annual_value);
      if (!isNaN(annual) && annual > 0) return sum + annual;
      const monthly = Number(i.monthly_amount || i.monthly_value || 0);
      return sum + monthly * 12;
    }, 0);
  }

  getMonthlyIncome(): number {
    return this.sumMonthly(this.getEarnings());
  }

  getAnnualIncome(): number {
    return this.sumAnnual(this.getEarnings());
  }

  deductionCalcText(d: any): string {
    if (!d) return '';
    if (d.percentage) {
      return `${Number(d.percentage).toFixed(2)}% of Contributory Wages`;
    }
    if (d.calculation_type_name) return d.calculation_type_name;
    if (d.calculation_type) return String(d.calculation_type);
    return '';
  }
  prepareForAction(employeeId: any,modal:any) {
    this.selectedEmployee = employeeId;
    if(modal){
      this.modalService.open(modal, {
        size: 'xl',
        centered: true,
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
      });
    }
  }

  getBenefitCalculationType(amountMode: number, amountValue: number): string {
    console.log(amountMode, amountValue, 'amountMode, amountValue');
    if (amountMode == 1) {
      return `Fixed Amount of ${this.getcurrency()}${amountValue?.toFixed(2) || '0.00'}`;
    } else if (amountMode == 2) {
      return `${amountValue}% of Contributory Wages`;
    }
    return `Fixed Amount of ${this.getcurrency()}${amountValue?.toFixed(2) || '0.00'}`;
  }

  // Action methods for three-dots dropdown
  sendSalaryTransferCertificate(): void {
    // Implementation for sending salary transfer certificate
    console.log('Sending salary transfer certificate for employee:', this.employee?.id);
    
    // You can add confirmation dialog here
    if (confirm('Are you sure you want to send the salary transfer certificate?')) {
      // Add your API call here
      // this.api.post('/employee/send-salary-transfer-certificate', { employeeId: this.employee?.id })
      //   .subscribe(response => {
      //     // Handle success
      //   });
      
      alert('Salary transfer certificate sent successfully!');
    }
  }

  initiateExitProcess(): void {
    // Implementation for initiating exit process
    console.log('Initiating exit process for employee:', this.employee);
    // Navigate to terminate process page
    let terminateProcessModalRef = this.modalService.open(TerminateProcess, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    terminateProcessModalRef.componentInstance.employeeData = this.employee;
  }
  onReviseSalary(){
    console.log('Revising salary for employee:', this.employee);
    // Navigate to revise salary page
    // 
    this.getSalaryHistory(this.employee.id);
  }
  getSalaryHistory(employeeId: any): void {
    this.api.get('/employee/get_revise_salary_by_employee/' + employeeId + '/').subscribe(
      (response: any) => {
        if (response.status == 200) {
          console.log('Salary history loaded:', response.data);
          // Navigate to revise-salary component with existing salary data
          this.router.navigate(['/payroll/revise-salary', this.employee.id], {
            state: { salaryData: response.data }
          });
        } else {
          // Navigate to revise-salary component without existing data
          this.router.navigate(['/payroll/revise-salary', this.employee.id], {
            state: { salaryData: null }
          });
        }
      }
    );
  }
  // Salary Certificate Methods
  generateSalaryCertificate(event: Event): void {
    event.preventDefault();
    console.log('Generating salary certificate for employee:', this.employee);
    
    if (!this.employee) {
      this.toast.show('Error', 'Employee data not found', 'danger');
      return;
    }
    
    this.generateSalaryCertificatePDF();
  }

  generateSalaryCertificatePDF(): void {
    const certificateData = this.prepareSalaryCertificateData();
    const htmlContent = this.generateSalaryCertificateHTML(certificateData);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
    
    this.toast.show('Success', 'Salary certificate generated successfully', 'success');
  }

  prepareSalaryCertificateData(): any {
    const earnings = this.getEarnings();
    const totalAmount = this.sumMonthly(earnings);
    
    return {
      companyName: 'Myrah Global Softwares FZCO',
      companyAddress: '102, abcd, dubai Dubai U.A.E',
      employeeName: `${this.employee?.first_name || ''} ${this.employee?.last_name || ''}`.trim(),
      employeeId: this.employee?.employee_id || 'N/A',
      employeeAddress: this.employee?.address || 'N/A',
      currentDate: new Date().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      earnings: earnings,
      totalAmount: totalAmount
    };
  }

  generateSalaryCertificateHTML(data: any): string {
    const earningsRows = data.earnings.map((earning: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${earning.name || earning.head_name || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${this.getcurrency()} ${(earning.monthly_value || earning.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salary Certificate</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
          .certificate-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          .company-info {
            margin-bottom: 30px;
          }
          .company-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .company-address {
            font-size: 14px;
            color: #333;
          }
          .certificate-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .recipient-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .certification-text {
            margin-bottom: 30px;
            line-height: 1.6;
            font-size: 14px;
          }
          .salary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .salary-table th {
            background-color: #f5f5f5;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
          }
          .salary-table td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
          }
          .confirmation-text {
            margin-top: 30px;
            line-height: 1.6;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .certificate-container { max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <!-- Company Information -->
          <div class="company-info">
            <div class="company-name">${data.companyName}</div>
            <div class="company-address">${data.companyAddress}</div>
          </div>

          <!-- Certificate Title -->
          <div class="certificate-title">Salary Certificate</div>

          <!-- Recipient and Date -->
          <div class="recipient-info">
            <div>To Whom it may concern</div>
            <div>Date: ${data.currentDate}</div>
          </div>

          <!-- Certification Statement -->
          <div class="certification-text">
            This is to certify that <strong>${data.employeeName}</strong> (Employee ID: <strong>${data.employeeId}</strong>), 
            residing at <strong>${data.employeeAddress}</strong>, is working at <strong>${data.companyName}</strong>. 
            The salary break-up is as given below:
          </div>

          <!-- Salary Break-up Table -->
          <table class="salary-table">
            <thead>
              <tr>
                <th style="width: 70%;">EARNINGS</th>
                <th style="width: 30%; text-align: right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${earningsRows}
              <tr class="total-row">
                <td style="padding: 12px 8px; border-top: 2px solid #333;">TOTAL AMOUNT</td>
                <td style="padding: 12px 8px; border-top: 2px solid #333; text-align: right;">${this.getcurrency()} ${data.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Confirmation Statement -->
          <div class="confirmation-text">
            We hereby confirm that all the above details provided are as per our records. 
            This certificate is being issued upon the request of the above employee for whatever legal purpose it may serve them best.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  downloadSalaryCertificate(event: Event): void {
    event.preventDefault();
    console.log('Downloading salary certificate for employee:', this.employee);
    
    if (!this.employee) {
      this.toast.show('Error', 'Employee data not found', 'danger');
      return;
    }
    
    this.downloadSalaryCertificatePDF();
  }

  downloadSalaryCertificatePDF(): void {
    const certificateData = this.prepareSalaryCertificateData();
    const htmlContent = this.generateSalaryCertificateHTML(certificateData);
    
    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Salary_Certificate_${certificateData.employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    this.toast.show('Success', 'Salary certificate downloaded successfully', 'success');
  }

  viewSalaryHistory(event: Event): void {
    event.preventDefault();
    console.log('Viewing salary history for employee:', this.employee);
    
    if (!this.employee?.id) {
      this.toast.show('Error', 'Employee ID not found', 'danger');
      return;
    }
    
    this.openSalaryHistoryModal();
  }

  openSalaryHistoryModal(): void {
    const modalRef = this.modalService.open(SalaryHistory, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    
    // Pass employee ID to the salary history component
    modalRef.componentInstance.employeeId = this.employee.id;
  }

  openCreateLoanModal(): void {
    const modalRef = this.modalService.open(CreateLoanComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    
    // Pass employee data to the create loan component
    modalRef.componentInstance.selectedEmployee = this.employee;
    modalRef.componentInstance.modalRef = modalRef;
    modalRef.componentInstance.loanData = null;
    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.toast.show('Success', 'Loan created successfully', 'success');
        // Refresh loan data if needed
        this.loadLoanLedgers(this.employee.id);
      }
    }).catch((error) => {
      // Modal was dismissed
    });
  }
  // Download Document Method
  downloadDocument(doc: any) {
    if (!doc?.document?.file) {
      this.toast.show('Document file not found', 'error');
      return;
    }

    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = doc.document.file;
      link.download = this.getDocumentFileName(doc);
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.toast.show('Document download started', 'success');
    } catch (error) {
      console.error('Error downloading document:', error);
      this.toast.show('Failed to download document', 'error');
    }
  }

  // Get document file name for download
  getDocumentFileName(doc: any): string {
    if (!doc?.document?.file) return 'document';
    
    // Extract filename from URL
    const url = doc.document.file;
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Decode URL encoded characters
    return decodeURIComponent(fileName);
  }
  // /employee/employee_payslip_details/1/
  loadPayslipDetails(employeeId: any){
    this.api.get('/employee/employee_payslip_details/'+employeeId+"/").subscribe((response: any) => {
      if (response.status == 200) {
        this.payslipData = response.data.employee_payslip_details;
        console.log('Payslip Data:', this.payslipData);
      }
    });
  }

  // View Payslip Method
  viewPayslip(payslip: any) {
    console.log('Viewing payslip:', payslip);
    // You can implement a modal or navigate to a detailed view here
    // For now, we'll just log the data
    this.toast.show('Payslip view functionality coming soon', 'info');
  }

  // Download Payslip Method
  downloadPayslip(payslip: any) {
    console.log('Downloading payslip:', payslip);
    const payslipData = this.preparePayslipData();

    try {
      // Generate payslip PDF or use existing download logic
      this.generatePayslipPDF(payslipData);
      this.toast.show('Payslip download started', 'success');
    } catch (error) {
      console.error('Error downloading payslip:', error);
      this.toast.show('Failed to download payslip', 'error');
    }
  }
  preparePayslipData(): any {    
    // Use actual payslip data if available, otherwise use calculated values
    const payslipData = this.payslipData?.payslip || {};
    
    return {
      company: {
        name: payslipData.company_info?.company_name || 'Esarwa Softwares',
        address: payslipData.company_info?.address || '88 Awolowo Road, Ikoyi, Lagos',
        payslipMonth: payslipData.company_info?.payslip_month || 'September 2025'
      },
      employee: {
        name: payslipData.employee_summary?.employee_name || 'N/A',
        designation: payslipData.employee_summary?.designation || 'N/A',
        employeeId: payslipData.employee_summary?.employee_id || 'EMP-2',
        molId: payslipData.employee_summary?.mol_id || '',
        dateOfJoining: payslipData.employee_summary?.date_of_joining || '',
        payPeriod: payslipData.employee_summary?.pay_period || '',
        payDate: payslipData.employee_summary?.pay_date || '',
        bankAccount: payslipData.employee_summary?.bank_account || ''
      },
      paySummary: {
        payableDays: payslipData.pay_summary?.paid_days || 0,
        lopDays: payslipData.pay_summary?.lop_days || 0,
        actualPayableDays: (payslipData.pay_summary?.paid_days || 0) - (payslipData.pay_summary?.lop_days || 0),
        netPay: payslipData.pay_summary?.total_net_pay || 0
      },
      earnings: {
        items: payslipData.earnings?.items || [],
        grossEarnings: payslipData.earnings?.gross_earnings || 0
      },
      deductions: {
        items: payslipData.deductions?.items || [],
        totalDeductions: payslipData.deductions?.total_deductions || 0
      },
      benefits: {
        items: this.payslipData.benefits
      },
      netPay: {
        grossEarnings: payslipData.net_pay?.gross_earnings || 0,
        totalDeductions: payslipData.net_pay?.total_deductions || 0,
        netPay: payslipData.net_pay?.net_pay || 0,
        amountInWords: payslipData.net_pay?.amount_in_words || this.numberToWords(payslipData.net_pay?.net_pay || 0)
      }
    };
  }
  // Generate Payslip PDF
  generatePayslipPDF(payslip: any) {
    // This is a placeholder - you can implement actual PDF generation here
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the payslip');
      return;
    }
    const payslipHTML = this.generatePayslipContent(payslip);
    printWindow.document.write(payslipHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
  numberToWords(num: number): string {
    // Simple number to words conversion for UAE Dirhams    
    if (num === 0) return 'Zero';
    
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let result = this.convertHundreds(integerPart);
    if (decimalPart > 0) {
      result += ' and ' + this.convertHundreds(decimalPart) + ' Fils';
    }
    
    return result;
  }
  convertHundreds(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) {
      const hundreds = ones[Math.floor(num / 100)] + ' Hundred';
      const remainder = num % 100;
      return hundreds + (remainder ? ' ' + this.convertHundreds(remainder) : '');
    }
    if (num < 100000) {
      const thousands = this.convertHundreds(Math.floor(num / 1000)) + ' Thousand';
      const remainder = num % 1000;
      return thousands + (remainder ? ' ' + this.convertHundreds(remainder) : '');
    }
    return 'Very Large Number';
  }
  // Generate Payslip Content (placeholder)
  generatePayslipContent(data: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payslip - ${data.employee.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { 
          size: A4; 
          margin: 15mm; 
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.3; 
          color: #333; 
          background: white;
        }
        .payslip-container { 
          width: 100%; 
          max-width: 180mm; 
          margin: 0 auto; 
          background: white;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        .company-info h1 { 
          margin: 0; 
          font-size: 20px; 
          color: #333; 
          font-weight: bold;
        }
        .company-info p { 
          margin: 5px 0 0 0; 
          color: #666; 
          font-size: 11px;
        }
        .payslip-period { 
          text-align: right; 
        }
        .payslip-period p { 
          margin: 0; 
          font-size: 11px; 
          color: #666; 
        }
        .payslip-period h2 { 
          margin: 5px 0 0 0; 
          font-size: 18px; 
          color: #333; 
          font-weight: bold;
        }
        .content { 
          display: flex; 
          gap: 20px; 
          margin-bottom: 20px; 
        }
        .employee-summary { 
          flex: 1; 
        }
        .net-pay-summary { 
          flex: 1; 
          background: #f0f8f0; 
          padding: 15px; 
          border: 1px solid #ddd; 
          text-align: center; 
        }
        .section-title { 
          font-weight: bold; 
          margin-bottom: 10px; 
          color: #333; 
          font-size: 13px;
          text-transform: uppercase;
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 5px; 
          font-size: 11px;
        }
        .net-pay-amount { 
          font-size: 24px; 
          font-weight: bold; 
          color: #28a745; 
          margin: 10px 0; 
        }
        .earnings-deductions { 
          margin-top: 20px; 
        }
        .table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px; 
          font-size: 11px;
        }
        .table th, .table td { 
          padding: 8px 6px; 
          text-align: left; 
          border: 1px solid #ddd; 
        }
        .table th { 
          background-color: #f8f9fa; 
          font-weight: bold; 
          font-size: 11px;
        }
        .amount { 
          text-align: right; 
          font-weight: 600;
        }
        .total-section { 
          margin-top: 20px; 
          text-align: center; 
          background: #f8f9fa; 
          padding: 15px; 
          border: 1px solid #ddd;
        }
        .total-amount { 
          font-size: 20px; 
          font-weight: bold; 
          color: #28a745; 
          margin: 10px 0;
        }
        .amount-in-words { 
          margin-top: 8px; 
          font-style: italic; 
          color: #666; 
          font-size: 11px;
        }
        .benefits-section {
          margin-top: 20px;
        }
        .benefits-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
          font-size: 13px;
        }
        .benefits-description {
          font-size: 10px;
          color: #666;
          margin-bottom: 10px;
          font-style: italic;
        }
        .benefits-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .benefits-table th, .benefits-table td {
          padding: 6px;
          text-align: left;
          border: 1px solid #ddd;
        }
        .benefits-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .system-generated {
          text-align: center;
          margin-top: 20px;
          font-size: 10px;
          color: #999;
          font-style: italic;
        }
        @media print { 
          body { background: white; margin: 0; font-size: 11px; }
          .payslip-container { box-shadow: none; margin: 0; }
          .net-pay-summary, .total-section { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="payslip-container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            <h1>${data.company.name}</h1>
            <p>${data.company.address}</p>
          </div>
          <div class="payslip-period">
            <p>Payslip For the Month</p>
            <h2>${data.company.payslipMonth || data.company.payslip_month}</h2>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Employee Summary -->
          <div class="employee-summary">
            <div class="section-title">Employee Summary</div>
            <div class="detail-row">
              <span>Employee Name:</span>
              <span>${data.employee.name}</span>
            </div>
            <div class="detail-row">
              <span>Designation:</span>
              <span>${data.employee.designation}</span>
            </div>
            <div class="detail-row">
              <span>Employee ID:</span>
              <span>${data.employee.employeeId}</span>
            </div>
            <div class="detail-row">
              <span>MOL ID:</span>
              <span>${data.employee.molId}</span>
            </div>
            <div class="detail-row">
              <span>Date of Joining:</span>
              <span>${data.employee.dateOfJoining}</span>
            </div>
            <div class="detail-row">
              <span>Pay Period:</span>
              <span>${data.employee.payPeriod}</span>
            </div>
            <div class="detail-row">
              <span>Pay Date:</span>
              <span>${data.employee.payDate}</span>
            </div>
            <div class="detail-row">
              <span>Bank Account No:</span>
              <span>${data.employee.bankAccount}</span>
            </div>
          </div>

          <!-- Net Pay Summary -->
          <div class="net-pay-summary">
            <div class="net-pay-amount">${this.getcurrency()} ${data.netPay.netPay.toFixed(2)}</div>
            <div style="color: #28a745; font-weight: bold;">Total Net Pay</div>
            <div style="margin-top: 15px;">
              <div class="detail-row">
                <span>Paid Days:</span>
                <span>${data.paySummary.payableDays}</span>
              </div>
              <div class="detail-row">
                <span>LOP Days:</span>
                <span>${data.paySummary.lopDays}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Earnings and Deductions -->
        <div class="earnings-deductions">
          <table class="table">
            <thead>
              <tr>
                <th>EARNINGS</th>
                <th class="amount">AMOUNT</th>
                <th>DEDUCTIONS</th>
                <th class="amount">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${this.generateEarningsDeductionsRows(data.earnings.items, data.deductions.items, data.earnings.grossEarnings, data.deductions.totalDeductions)}
            </tbody>
          </table>
        </div>

        <!-- Total Net Payable -->
        <div class="total-section">
          <div class="section-title">TOTAL NET PAYABLE</div>
          <p>Gross Earnings - Total Deductions</p>
          <div class="total-amount">${this.getcurrency()} ${data.netPay.netPay.toFixed(2)}</div>
          <div class="amount-in-words">
            Amount In Words: ${data.netPay.amountInWords}
          </div>
        </div>

        <!-- Benefits Section -->
        <div class="benefits-section">
          <div class="benefits-title">Benefits Summary</div>
          <div class="benefits-description">This section provides a detailed breakdown of benefit contributions made by both you and your employer.</div>
          <table class="benefits-table">
            <thead>
              <tr>
                <th>BENEFITS</th>
                <th class="amount">EMPLOYEE CONTRIBUTION</th>
                <th class="amount">EMPLOYER CONTRIBUTION</th>
              </tr>
            </thead>
            <tbody>
              ${this.generateBenefitsRows(this.payslipData.benefits || [])}
              <tr style="font-weight: bold; background-color: #f8f9fa;">
                <td>Total Benefits:</td>
                <td class="amount">${this.formatCurrency(this.payslipData.benefits?.employee_value || 0)}</td>
                <td class="amount">${this.formatCurrency(this.payslipData.benefits?.employer_value || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="system-generated">
          --- This is a system-generated document. ---
        </div>
      </div>
    </body>
    </html>
    `;
  }
  formatCurrency(value: any): string {
    const num = Number(value || 0);
    return `${this.getcurrency()}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  generateEarningsDeductionsRows(earnings: any[], deductions: any[], grossEarnings: number, totalDeductions: number): string {
    const maxRows = Math.max(earnings.length, deductions.length);
    let rows = '';
    
    for (let i = 0; i < maxRows; i++) {
      const earning = earnings[i] || {};
      const deduction = deductions[i] || {};
      
      rows += `
        <tr>
          <td>${earning.name || earning.head_type_name_display || ''}</td>
          <td class="amount">${earning.name ? this.formatCurrency(earning.amount || earning.value) : ''}</td>
          <td>${deduction.name || deduction.head_type_name_display || ''}</td>
          <td class="amount">${deduction.name ? this.formatCurrency(deduction.amount || deduction.value) : ''}</td>
        </tr>
      `;
    }
    
    // Add totals row using the passed parameters
    rows += `
      <tr style="font-weight: bold; border-top: 2px solid #333;">
        <td>Gross Earnings</td>
        <td class="amount">${this.formatCurrency(grossEarnings)}</td>
        <td>Total Deductions</td>
        <td class="amount">${this.formatCurrency(totalDeductions)}</td>
      </tr>
    `;
    
    return rows;
  }
  generateBenefitsRows(benefits: any[]): string {
    if (!benefits || benefits.length === 0) {
      return '<tr><td colspan="3" class="text-center">No benefits data available</td></tr>';
    }

    let rows = '';
    benefits.forEach((benefit: any) => {
      rows += `
        <tr>
          <td>${benefit.head_type_name_display || benefit.pension_name || 'Unknown Benefit'}:</td>
          <td class="amount">${this.formatCurrency(benefit.employee_value || 0)}</td>
          <td class="amount">${this.formatCurrency(benefit.employer_value || 0)}</td>
        </tr>
      `;
    });

    return rows;
  }
}
