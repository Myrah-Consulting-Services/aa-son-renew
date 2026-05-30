import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pending-requisition',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pending-requisition.html',
  styleUrl: './pending-requisition.scss'
})
export class PendingRequisition {

}
