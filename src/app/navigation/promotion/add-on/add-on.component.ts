import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-on',
  templateUrl: './add-on.component.html',
  styleUrl: './add-on.component.css'
})
export class AddOnComponent {
  test = ''
  showLimit = false

  constructor(    
    private router: Router,
  ) {}

  public testChange(e: any) {
    if(e.target.value.toLowerCase() === 'set limit'){
      this.showLimit = true
    } else {
      this.showLimit = false
    }
  }

  goTo(){
    this.router.navigate(['/promotions']);
  }
}
