import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageWarehousePageComponent } from './manage-warehouse-page.component';

describe('ManageWarehousePageComponent', () => {
  let component: ManageWarehousePageComponent;
  let fixture: ComponentFixture<ManageWarehousePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageWarehousePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageWarehousePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
