import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    // Assume the AuthService handles login and returns a promise or observable
    this.authService.login(this.email, this.password).then(() => {
      // Redirect to the msb page on successful login
      this.router.navigate(['/msb']);
    }).catch(error => {
      console.error('Login failed:', error);
      // Handle login failure (show error message, etc.)
    });
  }
}
