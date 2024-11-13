import { Component, ViewChild, ElementRef } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-msb',
  templateUrl: './msb.component.html',
  styleUrls: ['./msb.component.css']
})
export class MsbComponent {
  @ViewChild('fileInput') fileInput: ElementRef | null = null; // Reference to file input

  videoTitle: string = '';
  selectedFile: File | null = null;
  handedness: string = '';
  displayedVideo: { title: string; url: string } | null = null;
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
      this.firebaseService.uploadVideo(this.userId, this.selectedFile, false).subscribe({
        next: (videoUrl) => {
          const videoData = {
            title: this.videoTitle,
            url: videoUrl,
          };

          // Display this video as the currently displayed video
          this.displayedVideo = videoData;

          // Reset file input and other fields for the next upload
          this.selectedFile = null;
          this.videoTitle = '';
          this.handedness = '';
          if (this.fileInput) {
            this.fileInput.nativeElement.value = ''; // Clear file input
          }
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
