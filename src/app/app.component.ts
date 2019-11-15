import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private cookie: CookieService
  ) {
  }
  onActivate(event) {
    window.scroll(0, 0);
  }
  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.cookie.set('token', params['token']);
    });
  }
}
