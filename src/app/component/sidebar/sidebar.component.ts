import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  constructor(private authService: AuthService, private router: Router) { }

  logout() {
    // Call the AuthService to handle logout
    this.authService.logout().then(() => {
      // Redirect to the login page after logout
      this.router.navigate(['/login']);
    }).catch(error => {
      console.error('Logout failed:', error);
      // Optionally, handle any errors that occur during logout
    });
  }
}

