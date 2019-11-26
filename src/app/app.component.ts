import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';
import {Utility} from './shared/helpers/utility';
import {query} from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private cookie: CookieService,
    private router: Router
  ) {
  }
  onActivate(event) {
    window.scroll(0, 0);
  }
  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      if (!Utility.isEmpty(params)) {
        this.cookie.set('token', params['token']);
        if (this.router.url.includes('mobile')) {
          this.router.navigate(['mobile'], { queryParams: null });
        } else {
          this.router.navigate([''], { queryParams: null });
        }
      }
    });
  }
}
