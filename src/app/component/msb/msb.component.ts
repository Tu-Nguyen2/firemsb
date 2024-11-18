import { Component, ViewChild, ElementRef } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-msb',
  templateUrl: './msb.component.html',
  styleUrls: ['./msb.component.css']
})
export class MsbComponent {
  @ViewChild('fileInput') fileInput: ElementRef | null = null;

  videoTitle: string = '';
  selectedFile: File | null = null;
  handedness: string = '';
  clubType: string = '';
  notes: string = '';
  displayedVideo: { title: string; rawvideourl: string } | null = null;
  userId: string | null = null;

  constructor(private firebaseService: FirebaseService, private afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
      }
    });
  }
  private validateHandedness(handedness: string | undefined): string {
    const sanitizedHandedness = handedness?.trim().toLowerCase() || 'right';
    return sanitizedHandedness === 'right' || sanitizedHandedness === 'left' ? sanitizedHandedness : 'right';
  }

  // Handles file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // Upload video and set it as the currently displayed video
  uploadVideo(): void {
    if (this.selectedFile && this.videoTitle.trim() && this.userId) {
      // Step 1: Fetch handedness from the user's profile
      this.firebaseService.getProfile(this.userId).subscribe({
        next: (profile) => {
          const handedness = this.validateHandedness(profile?.handedness);

          // Step 2: Upload video to Firebase Storage
          this.firebaseService.uploadVideo(this.userId!, this.selectedFile!, false).subscribe({
            next: (rawVideoUrl) => {
              console.log("Raw video uploaded to Firebase Storage:", rawVideoUrl);

              // Step 3: Prepare metadata for Firestore
              const videoData = {
                title: this.videoTitle.trim(),
                handedness, // Always store as lowercase
                clubtype: '', // Removed as per request
                notes: '',   // Removed as per request
                rawvideourl: rawVideoUrl,
                videoprocessedurl: '', // Initialized empty
              };

              // Step 4: Save metadata to Firestore
              const videoId = this.firebaseService.generateId();
              this.firebaseService.saveVideoMetadata(this.userId!, videoId, videoData).then(() => {
                console.log("Video metadata saved to Firestore");

                // Step 5: Optionally update the user's handedness profile if necessary
                this.firebaseService.updateProfile(this.userId!, { handedness }).then(() => {
                  console.log('Handedness updated in profile (if needed)');
                }).catch((error) => {
                  console.error('Error updating handedness in profile:', error);
                });

                // Display the uploaded video
                this.displayedVideo = { title: this.videoTitle.trim(), rawvideourl: rawVideoUrl };

                // Reset form fields after upload
                this.resetForm();
              }).catch((error) => {
                console.error("Error saving video metadata to Firestore:", error);
              });
            },
            error: (error) => {
              console.error("Error uploading video:", error);
            }
          });
        },
        error: (error) => {
          console.error("Error fetching user profile for handedness:", error);
        }
      });
    } else {
      alert("Please complete all fields and select a video.");
    }
  }

  private resetForm(): void {
    this.selectedFile = null;
    this.videoTitle = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = ''; // Clear file input
    }
  }

}
