import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDraftsComponent } from './order-drafts.component';

describe('OrderDraftsComponent', () => {
  let component: OrderDraftsComponent;
  let fixture: ComponentFixture<OrderDraftsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderDraftsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderDraftsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
