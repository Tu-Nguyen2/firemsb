import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  profilePicUrl: string | null = null; // Store profile picture URL
  userId: string | null = null;

  constructor(private authService: AuthService, 
              private router: Router, 
              private firebaseService : FirebaseService, 
              private afAuth: AngularFireAuth) 
              {}

  ngOnInit(): void {
  // Subscribe to auth state to get the logged-in user's ID
  this.afAuth.authState.subscribe(user => {
    if (user) {
      this.userId = user.uid;
      this.loadProfilePicture(); // Fetch and set profile picture
    } else {
      console.error('No authenticated user');
      this.profilePicUrl = 'assets/default-profile.png'; // Fallback for unauthenticated users
    }
  });
  }

  loadProfilePicture(): void {
  if (this.userId) {
    this.firebaseService.getProfile(this.userId).subscribe(profileData => {
      if (profileData && profileData.pic) {
        this.profilePicUrl = profileData.pic; // Use user's profile picture
      } else {
        this.profilePicUrl = 'assets/default-profile.png'; // Default picture
      }
    }, error => {
      console.error('Error fetching profile picture:', error);
      this.profilePicUrl = 'assets/default-profile.png'; // Default picture on error
    });
  }
  }

  logout() {
    // Call the AuthService to handle logout
    this.authService.logout().then(() => {
      // Redirect to the login page after logout
      this.router.navigate(['/home']);
    }).catch(error => {
      console.error('Logout failed:', error);
      // Optionally, handle any errors that occur during logout
    });
  }
}

