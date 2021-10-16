import { LoginResponse } from './../models/login/userlogin-response.model';
import { BaseService } from './../services/base.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    private httpClient: HttpClient,
    private toastrService: ToastrService,
    private router: Router,
    private baseService: BaseService
  ) {}

  ngOnInit(): void {}
  onUserLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }
    this.baseService
      .PostMethodWithPipe('login', this.loginForm.value)
      .subscribe(
        (responseData: LoginResponse) => {
          this.toastrService.success('Login', responseData.message);
          localStorage.setItem('userLogin', responseData.token);
        },
        (err) => {
          this.toastrService.error(err, 'Login');
        },
        () => {
          this.router.navigate(['/map']);
        }
      );
  }
}
