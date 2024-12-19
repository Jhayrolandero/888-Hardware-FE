import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageOrderDraftsComponent } from './manage-order-drafts.component';

describe('ManageOrderDraftsComponent', () => {
  let component: ManageOrderDraftsComponent;
  let fixture: ComponentFixture<ManageOrderDraftsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageOrderDraftsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageOrderDraftsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
