import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  userId: string | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private afAuth: AngularFireAuth,
    private fb: FormBuilder
  ) {
    // Define the form with all fields for profile data
    this.profileForm = this.fb.group({
      driverBrand: [''],
      firstName: [''],
      height: [''],
      ironBrand: [''],
      lastName: [''],
      pic: [''],
      wedgeBrand: [''],
      wristToFloor: ['']
    });
  }

  ngOnInit(): void {
    // Get the authenticated user's ID
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        // Load the current profile data
        this.loadProfileData();
      }
    });
  }

  // Load existing profile data into the form
  loadProfileData(): void {
    if (this.userId) {
      this.firebaseService.getProfile(this.userId).subscribe((profileData: any) => {
        if (profileData) {
          this.profileForm.patchValue(profileData);  // Populate form with existing data
        }
      });
    }
  }

  // Save profile data
  saveProfile(): void {
    if (this.userId) {
      const profileData = this.profileForm.value;
      this.firebaseService.updateProfile(this.userId, profileData)
        .then(() => console.log('Profile updated successfully'))
        .catch((error) => console.error('Error updating profile:', error));
    }
  }
}
