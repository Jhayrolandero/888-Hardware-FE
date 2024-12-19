import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfflineScreenComponent } from './offline-screen.component';

describe('OfflineScreenComponent', () => {
  let component: OfflineScreenComponent;
  let fixture: ComponentFixture<OfflineScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OfflineScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfflineScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
