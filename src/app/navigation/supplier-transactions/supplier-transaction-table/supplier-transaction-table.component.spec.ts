import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierTransactionTableComponent } from './supplier-transaction-table.component';

describe('SupplierTransactionTableComponent', () => {
  let component: SupplierTransactionTableComponent;
  let fixture: ComponentFixture<SupplierTransactionTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupplierTransactionTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierTransactionTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
