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
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  async login() {
    try {
      await this.authService.login(this.email, this.password);
      
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Login failed:', error.message);
      this.errorMessage = error.message || 'Login failed, please check credentials'; // Display the error message to the user
    }
  }
}
