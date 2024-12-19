import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentConfirmDialogComponent } from './payment-confirm-dialog.component';

describe('PaymentConfirmDialogComponent', () => {
  let component: PaymentConfirmDialogComponent;
  let fixture: ComponentFixture<PaymentConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
