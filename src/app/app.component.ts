import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  onActivate(event) {
    window.scroll(0, 0);
  }
  ngOnInit(): void {
  }
}
