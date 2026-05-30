import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { NgbActiveModal, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reconciliation',
  standalone:true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule, NgbPaginationModule],
  templateUrl: './reconciliation.html',
  styleUrl: './reconciliation.scss'
})
export class Reconciliation implements OnInit {
  bankStatement: any[] = [];
  selectedBankStatementTransaction = new Set<number>();
  selectedExistingTransaction: any | null = null;
  transactions: boolean = false;
  tableData: string[][] | undefined;
  bankStatementForm: any;
  @Input() bankReconcile: string | undefined
  @Input() modalRef: any = [];
  @Output() bankReconcileData: EventEmitter<any> = new EventEmitter();
  bankDisplayedColumns: any = ['select','date', 'receipt_no', 'particular', 'debit', 'credit', 'balance_final'];
  
  // For Payments table (server-side pagination)
  dataSource: any[] = [];
  paymentsPage = 1;
  paymentsPageSize = 10;
  paymentsCollectionSize = 0;

  loading: boolean=false;
  bankDate: any;
  previousData: any;
  reconciliation: boolean=false;
  
  // For Bank Statements table (client-side pagination)
  bankDataSource: any[] = [];
  paginatedBankDataSource: any[] = [];
  bankStatementPage = 1;
  bankStatementPageSize = 10;

  selectedStatements: any;
  toasts: any[] = [];
  selectedTransactions: any;
  previousLinkedData: any;

  constructor(public modal: NgbActiveModal, private fb: FormBuilder, private api: Api,public modalService:NgbModal) {
    this.bankStatementForm = this.fb.group({
      file: [null],
      company_id: [this.api.getCompanyId()],
      bank_id: [''],
      from_date: [''],
      to_date: ['']
    });

  }

  ngOnInit(): void {
    console.log(this.bankReconcile);
    this.getDate() 
    if (this.bankReconcile) {
      this.bankStatementForm.patchValue({
        bank_id: this.bankReconcile,
        from_date: this.bankDate.start_date,
        to_date: this.bankDate.end_date 
      });
      this.bankWiseLedger(this.bankReconcile)
    }
    this.getPreviousdata()
  }
  
  getDate() {
      // this.bankDate.start_date = this.api.getDateByVj().oneMonthAgo
      // this.bankDate.end_date = this.api.getDateByVj().today
  }
  bankWiseLedger(id: any) {
    this.loading = true
    let companyId = this.api.getCompanyId()
    this.api.post("get_bank_ledger_pag/" + id + "/", { 
      company_name: companyId, 
      start_date: this.bankStatementForm.value.from_date, 
      end_date: this.bankStatementForm.value.to_date,
      page_number: this.paymentsPage,
      limit: this.paymentsPageSize
    }).subscribe((response: any) => {
      console.log(response,'pag');
       this.loading = false
       this.dataSource = response.data
       this.paymentsCollectionSize = response.pagination_data.total_data;
    }, (error) => {
      console.error(error);
    });
  }

  onPaymentsPageChange(page: number) {
    this.paymentsPage = page;
    this.bankWiseLedger(this.bankReconcile);
  }

  onBankStatementPageChange(page: number): void {
    this.bankStatementPage = page;
    this.refreshBankStatements();
  }

  refreshBankStatements() {
    const startIndex = (this.bankStatementPage - 1) * this.bankStatementPageSize;
    this.paginatedBankDataSource = this.bankDataSource.slice(startIndex, startIndex + this.bankStatementPageSize);
  }

 getPreviousdata(){
  const formData = new FormData();
  if (this.bankReconcile) {
    formData.append('bank', this.bankReconcile);
  }
  formData.append('from_date', this.bankStatementForm.value.from_date);
  formData.append('to_date', this.bankStatementForm.value.to_date);
  formData.append('company', this.api.getCompanyId().toString());
  if (this.bankStatementForm.value.file) {
    formData.append('file', this.bankStatementForm.value.file);
  }

  this.bankWiseLedger(this.bankReconcile)
  this.api.uplaoadImg('get_previous_statement_data/', formData).subscribe(
    (prev: any = []) => {
      if(prev.status==200){
      this.previousData = prev.data;
      console.log(this.previousData,"get_previous_statement_data");
      this.reconciliation=true
      this.bankDataSource = this.previousData;
      this.refreshBankStatements();
      if(this.previousData && this.previousData.length > 0) {
        this.getPreviousLinkedData(this.previousData[0].statement_id);
      }
      }else if(prev.status==500 && this.bankStatementForm.value.file!=null){
        console.log(prev.msg);
        this.onSubmit()
      }else if(prev.status==500 && this.bankStatementForm.value.file==null){
        this.reconciliation=false
      }
    },
    error => {
      console.error('Upload error', error);
    })
 }

  removeAttachment() {
    this.bankStatementForm.patchValue({
      file: null,
    });
  }
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.bankStatementForm.patchValue({ file });
    }
  }
  deleteStatement(){
    this.api.post("delete_statement_data/",{
      "statement_id": this.previousData[0].statement_id
    }).subscribe((res:any) => {
      if(res.status==200){
        this.getPreviousdata()
      }else{
        console.error(res.msg);
      }
    })
  }
  unlinkTrans(){
    this.api.post('unlink_data/',{
      "statement_id": this.previousData[0].statement_id,
      "statement_data": this.previousData[0].statement_data
    }).subscribe((res:any) => {
      if(res.status==200){
        this.getPreviousdata()
      }else{
        console.error(res.msg);
      }
    })
  }
  LinkAllTrans(){
    this.api.post('match_transactions/',{
      "statement_id": this.previousData[0].statement_id,
    }).subscribe((res:any) => {
      if(res.status==200){
        this.getPreviousdata()
      }else{
        console.error(res.msg);
      }
    })
  }
  compareAndLink(): void {
    const matchedTransactions: number[] = [];
    const matchedStatements: number[] = [];

    const linkedData:any = {
      transaction: [],
      statement_data: [],
      "is_complete": Boolean,
      "statement" : [],
      statement_id:[]
    };
     this.selectedStatements = this.bankDataSource.filter(item => item.selected);
     this.selectedTransactions = this.dataSource.filter(item => item.selected);
     console.log(this.selectedStatements,this.selectedTransactions);

     this.selectedTransactions.forEach((tra: any) => {
       const transaction = this.dataSource.find(t => t.id == tra.id);
       if (!transaction) return;

       this.selectedStatements.forEach((statement: any) => {
         const foundStatement = this.bankDataSource.find((s: any) => s.id == statement.id);
         if (!foundStatement) return;

         if (
           (transaction.debit == foundStatement.credit)|| (transaction.credit == foundStatement.debit) && 
           transaction.date === foundStatement.date
         ) {
           let type=''
           if(transaction.type=='payment_in' || transaction.type=='payment_out'){
             type='payment_in_out'
           }else if(transaction.type=='deposit' || transaction.type=='to_bank' || transaction.type=='withdrawal'){
             type='withdrawal_deposit'
           }else if(transaction.type=='expense'){
             type='expense'
           }
           else{
             type=transaction.type
           }
           linkedData.transaction.push({ transaction_id: transaction.id, entry_type: type });
           linkedData.statement_data.push({ id: foundStatement.id });
           linkedData.statement=statement.statement_id
           linkedData.statement_id=statement.statement_id

           matchedTransactions.push(transaction.id);
           matchedStatements.push(foundStatement.id);
           console.log(matchedStatements, matchedTransactions, 'matchedStatements');
         }
       });
     });

    if (linkedData.transaction.length > 0) {
      this.linkTransactions(linkedData);
      this.bankDataSource = this.bankDataSource.filter((t: { id: number; }) => !matchedStatements.includes(t.id));
      this.refreshBankStatements();
      this.dataSource = this.dataSource.filter(s => !matchedTransactions.includes(s.id));
      this.selectedTransactions=[];
      this.selectedStatements=[];
    }
  }
  onSubmit(): void {
    const formData = new FormData();
    formData.append('file', this.bankStatementForm.get('file').value);
    formData.append('company_id', this.bankStatementForm.get('company_id').value);
    formData.append('bank_id', this.bankStatementForm.get('bank_id').value);
    formData.append('from_date', this.bankStatementForm.get('from_date').value);
    formData.append('to_date', this.bankStatementForm.get('to_date').value);

    this.api.uplaoadImg('get_bank_statement_details/', formData).subscribe(
      (response: any = []) => {
        this.transactions = true
        this.reconciliation=true

        if (response.status == 400) {
          console.error(response.msg);
        } else if (response.status == 200) {
          console.log('Upload successful', response);
           this.bankDataSource = response.trans_data;
           this.refreshBankStatements();
           this.getPreviousLinkedData(response.trans_data[0].statement_id);
        }else{
          console.error("Unable to upload this statement");
        }
      },
      error => {
        console.error('Upload error', error);
      }
    );
  }

  toggleSelection(checked:any,id: any): void {
    if (checked) {
      id.selected = true;
    }else{
      id.selected = false;
    }
  }
  toggleSelection1(checked:any,id: any): void {
    if (checked) {
      id.selected = true;
    }else{
      id.selected = false;
    }
  }
  selectAll(event:any){
    const checked = (event.target as HTMLInputElement).checked;
    this.paginatedBankDataSource.forEach(item => item.selected = checked);
  }
  selectAll1(event:any){
    const checked = (event.target as HTMLInputElement).checked;
    this.dataSource.forEach(item => item.selected = checked);
  }
  linkTransactions(data:any){
    this.selectedStatements = this.bankDataSource.filter((item:any) => item.selected);
    this.selectedTransactions = this.dataSource.filter((item:any) => item.selected);
    console.log(this.selectedStatements,"selectedStatements");
    
    console.log(data);
    
    this.api.post('link_statements/',data).subscribe((res:any) => {
      console.log(res,"success");
      if(res.status == 200){
        console.log("Statements Linked Successfully");
      }else{
        console.error(res.msg);
      }
      
    })
    if(this.selectedStatements.length > 0){
      // this.linkTransactionsModal = true;
    } else {
      console.warn('Please select at least one transaction');
    }
  }
  getPreviousLinkedData(s_id:any) {
    this.api.post('get_previous_linked_data/' ,{"statement": s_id}).subscribe((res:any) => {
      console.log(res);
      if(res.status == 200){
        this.previousLinkedData = res.linked_data;
        this.previousLinkedData.forEach((item:any) => {
          const transaction = this.bankDataSource.find((t: { id: any; }) => t.id == item.statement_data[0].id);
          if (transaction) {
            transaction.linked = true;
          }
        });
        this.refreshBankStatements();

        this.previousLinkedData.forEach((item:any) => {
          const transaction = this.dataSource.find((t: { id: any; }) => t.id == item.transaction[0].id);
          if (transaction) {
            transaction.linked = true;
          }
        });
      }
    })
  }
}
