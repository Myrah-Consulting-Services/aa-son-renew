import { Component, OnInit, Input, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-putaway-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './putaway-task-form.component.html',
  styleUrls: ['./putaway-task-form.component.scss']
})
export class PutawayTaskFormComponent implements OnInit {
  form: FormGroup;
  @Input() taskId: number | null = null;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private api: Api,
    private toast: ToastService,
    private router: Router,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.form = this.fb.group({
      grnRef: ['', Validators.required],
      itemName: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      priority: ['normal', Validators.required],
      fromLocation: ['', Validators.required],
      toLocation: ['', Validators.required],
      assignedWorker: [''],
      estimatedTime: [30],
      notes: [''],
      requiresFragileHandling: [false],
      requiresTemperatureControl: [false],
      requiresForklift: [false],
      equipmentPalletJack: [false],
      equipmentDolly: [false],
      equipmentStraps: [false]
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.taskId;
    
    if (this.isEditMode) {
      this.loadTaskData();
    }
  }

  loadTaskData(): void {
    if (this.taskId) {
      // In a real implementation, this would load actual task data
      console.log('Loading task data for ID:', this.taskId);
    }
  }

  save(): void {
    if (!this.form.valid) {
      this.toast.show('Error', 'Please fill all required fields', 'danger');
      return;
    }

    const taskData = {
      ...this.form.value,
      status: 'pending',
      createdAt: new Date().toISOString(),
      id: this.isEditMode ? this.taskId : `PT-${Date.now()}`
    };

    console.log('Creating putaway task:', taskData);
    
    this.toast.show('Success', `Putaway task ${this.isEditMode ? 'updated' : 'created'} successfully`, 'success');
    
    if (this.activeModal) {
      this.activeModal.close(taskData);
    } else {
      this.router.navigate(['/warehouse/putaway-tasks/list']);
    }
  }

  cancel(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    } else {
      this.router.navigate(['/warehouse/putaway-tasks/list']);
    }
  }
} 