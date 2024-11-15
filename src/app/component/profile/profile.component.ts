import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  userId: string | null = null;
  profilePicUrl: string | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private afAuth: AngularFireAuth,
    private fb: FormBuilder
  ) {
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
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.loadProfileData();
      } else {
        console.error('User is not authenticated');
      }
    });
  }

  loadProfileData(): void {
    if (this.userId) {
      this.firebaseService.getProfile(this.userId).subscribe(
        (profileData: any) => {
          if (profileData) {
            this.profileForm.patchValue(profileData);
            this.profilePicUrl = profileData.pic || null;
          }
        },
        error => {
          console.error('Error loading profile data:', error);
        }
      );
    }
  }

  saveProfile(): void {
    if (this.userId) {
      const profileData = this.profileForm.value;
      this.firebaseService.updateProfile(this.userId, profileData)
        .then(() => console.log('Profile updated successfully'))
        .catch(error => console.error('Error updating profile:', error));
    } else {
      console.error('User ID is null. Cannot save profile.');
    }
  }

  // Handle file selection for changing profile picture
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.userId) {
      this.firebaseService.uploadProfilePicture(this.userId, file).then((downloadUrl) => {
        this.profilePicUrl = downloadUrl;
        this.profileForm.patchValue({ pic: downloadUrl });
        this.saveProfile();
      }).catch(error => {
        console.error('Error uploading profile picture:', error);
      });
    }
  }
}
