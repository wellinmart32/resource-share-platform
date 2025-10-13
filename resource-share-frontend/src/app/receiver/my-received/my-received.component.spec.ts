import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MyReceivedComponent } from './my-received.component';

describe('MyReceivedComponent', () => {
  let component: MyReceivedComponent;
  let fixture: ComponentFixture<MyReceivedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MyReceivedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyReceivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
