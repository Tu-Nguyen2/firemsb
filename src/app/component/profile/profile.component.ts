import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';

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
    private fb: FormBuilder,
    private storage: AngularFireStorage
  ) {
    this.profileForm = this.fb.group({
      driverBrand: [''],
      firstName: [''],
      height: [''],
      ironBrand: [''],
      lastName: [''],
      pic: [''], // Will hold the URL of the uploaded image
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
          }
        },
        error => {
          console.error('Error loading profile data:', error);
        }
      );
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.userId) {
      const filePath = `users/${this.userId}/profile-pic/${file.name}`;
      const fileRef = this.storage.ref(filePath);

      // Upload the file to Firebase Storage
      this.storage.upload(filePath, file).then(() => {
        // Retrieve the file's download URL
        fileRef.getDownloadURL().subscribe(url => {
          this.profileForm.patchValue({ pic: url }); // Set the URL in the form
          console.log('File uploaded successfully. URL:', url);
        });
      }).catch(error => {
        console.error('Error uploading file:', error);
      });
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
}
