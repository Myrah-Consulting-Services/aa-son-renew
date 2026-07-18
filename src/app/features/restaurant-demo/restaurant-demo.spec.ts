import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestaurantDemo } from './restaurant-demo';

describe('RestaurantDemo', () => {
  let component: RestaurantDemo;
  let fixture: ComponentFixture<RestaurantDemo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantDemo],
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurantDemo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create and render merchant branding', () => {
    expect(component).toBeTruthy();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Al Manara Kitchen');
    expect(el.textContent).toContain('Demo data');
    expect(el.textContent).toContain('simulated integrations');
  });

  it('should open VAT bill for selected order', () => {
    component.openBill();
    fixture.detectChanges();
    expect(component.activeSection).toBe('bill');
    expect(component.selected?.invoiceNumber).toBeTruthy();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('TAX INVOICE');
    expect(el.textContent).toContain('VAT 5%');
  });

  it('should navigate to owner dashboard and payout sections', () => {
    component.goTo('dashboard');
    fixture.detectChanges();
    expect(component.activeSection).toBe('dashboard');
    expect(component.dashboard.orderCount).toBeGreaterThan(0);

    component.goTo('reconcile');
    fixture.detectChanges();
    expect(component.activeSection).toBe('reconcile');
    expect(component.payout.matched).toBeTrue();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Talabat payout reconciliation');
  });
});
