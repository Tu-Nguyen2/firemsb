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

    //check authentication
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
      }
    });
  }

  ngOnInit(): void {
    //load profile from THIS user
    if (this.userId) {
      this.loadProfileData();
    }
  }

  //load data from user collection
  loadProfileData(): void {
    if (this.userId) {
      this.firebaseService.getProfile(this.userId).subscribe((profileData: any) => {
        if (profileData) {
          this.profileForm.patchValue(profileData); // Populate form with existing data
        }
      });
    }
  }

  //save the profile data under user collection
  saveProfile(): void {
    if (this.userId) {
      const profileData = this.profileForm.value;
      this.firebaseService.updateProfile(this.userId, profileData)
        .then(() => console.log('Profile updated successfully'))
        .catch((error) => console.error('Error updating profile:', error));
    }
  }
}
