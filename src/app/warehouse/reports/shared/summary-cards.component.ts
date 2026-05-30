import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SummaryCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row mb-4">
      <div class="col-md-3 mb-3" *ngFor="let card of cards">
        <div class="card bg-{{ card.color }} text-white h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h4 class="card-title mb-1">{{ card.value }}</h4>
                <p class="card-text mb-2">{{ card.title }}</p>
                <p class="card-text small opacity-75" *ngIf="card.subtitle">{{ card.subtitle }}</p>
                
                <!-- Trend Indicator -->
                <div class="d-flex align-items-center" *ngIf="card.trend">
                  <i class="bi me-1" 
                     [class.bi-arrow-up]="card.trend.direction === 'up'"
                     [class.bi-arrow-down]="card.trend.direction === 'down'"
                     [class.bi-dash]="card.trend.direction === 'neutral'">
                  </i>
                  <small>{{ card.trend.value }}%</small>
                </div>
              </div>
              <div class="flex-shrink-0">
                <i class="bi {{ card.icon }} fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
    }
    
    .card-title {
      font-size: 1.75rem;
      font-weight: 600;
    }
    
    .card-text {
      font-size: 0.875rem;
    }
    
    .bi {
      font-size: 2.5rem;
    }
  `]
})
export class SummaryCardsComponent {
  @Input() cards: SummaryCard[] = [];
} 