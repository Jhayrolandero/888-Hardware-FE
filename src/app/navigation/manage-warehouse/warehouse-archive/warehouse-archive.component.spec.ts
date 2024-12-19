import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehouseArchiveComponent } from './warehouse-archive.component';

describe('WarehouseArchiveComponent', () => {
  let component: WarehouseArchiveComponent;
  let fixture: ComponentFixture<WarehouseArchiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WarehouseArchiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarehouseArchiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
