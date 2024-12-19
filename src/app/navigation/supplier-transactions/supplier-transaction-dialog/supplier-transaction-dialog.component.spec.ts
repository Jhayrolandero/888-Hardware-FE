import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierTransactionDialogComponent } from './supplier-transaction-dialog.component';

describe('SupplierTransactionDialogComponent', () => {
  let component: SupplierTransactionDialogComponent;
  let fixture: ComponentFixture<SupplierTransactionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupplierTransactionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierTransactionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
