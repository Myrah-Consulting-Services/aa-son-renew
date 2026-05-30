import { Component, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-log-reports',
  imports: [CommonModule],
  templateUrl: './log-reports.html',
  styleUrl: './log-reports.scss'
})
export class LogReports implements OnInit {
  public logData: any[] = [];

  constructor(private api: Api) {
  
  }

  ngOnInit() {
    this.getLogReports();
  }


  getLogReports() {
    this.api.get('/auth/portal-logs/').subscribe((res: any) => {
      if (res && res.status === 200 && Array.isArray(res.data)) {
        this.logData = res.data;
      } else {
        this.logData = [];
      }
    });
  }
}
