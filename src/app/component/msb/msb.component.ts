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

  // Handles file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // Upload video and set it as the currently displayed video
  uploadVideo(): void {
    if (this.selectedFile && this.videoTitle.trim() && this.handedness && this.userId) {
      // Step 1: Upload video to Firebase Storage
      this.firebaseService.uploadVideo(this.userId, this.selectedFile, false).subscribe({
        next: (rawVideoUrl) => {
          console.log("Raw video uploaded to Firebase Storage:", rawVideoUrl);

          // Step 2: Prepare metadata to save to Firestore
          const videoData = {
            title: this.videoTitle,
            handedness: this.handedness,
            clubtype: "",
            notes: "",
            rawvideourl: rawVideoUrl,     // URL of the raw video in Firebase Storage
            videoprocessedurl: '',        // Initialize as an empty string, to be updated after processing
          };

          // Step 3: Save metadata to Firestore
          const videoId = this.firebaseService.generateId();
          this.firebaseService.saveVideoMetadata(this.userId!, videoId, videoData).then(() => {
            console.log("Video metadata saved to Firestore");

            // Display the raw video as the currently displayed video
            this.displayedVideo = { title: this.videoTitle, rawvideourl: rawVideoUrl };

            // Reset file input and other fields for the next upload
            this.selectedFile = null;
            this.videoTitle = '';
            this.handedness = '';
            this.clubType = '';
            this.notes = '';
            if (this.fileInput) {
              this.fileInput.nativeElement.value = ''; // Clear file input
            }
          }).catch((error) => {
            console.error("Error saving video metadata to Firestore:", error);
          });
        },
        error: (error) => {
          console.error("Error uploading video:", error);
        }
      });
    } else {
      alert("Please complete all fields and select a video.");
    }
  }
}
