import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) { }

  register() {
    // Assume the AuthService handles registration and returns a promise or observable
    this.authService.register(this.email, this.password).then(() => {
      // Redirect to the login page on successful registration
      this.router.navigate(['/login']);
    }).catch(error => {
      console.error('Registration failed:', error);
      // Handle registration failure (show error message, etc.)
    });
  }
}
