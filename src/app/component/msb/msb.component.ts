import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';


@Component({
  selector: 'app-msb',
  templateUrl: './msb.component.html',
  styleUrls: ['./msb.component.css']
})
export class MsbComponent {
  videoTitle: string = '';
  selectedFile: File | null = null;
  notes: string = '';
  clubType: string = '';
  handedness: string = '';
  videoGallery: Array<{ title: string; url: string }> = [];
  userId: string | null = null;  // Store authenticated user's UID


  constructor(private firebaseService: FirebaseService, private afAuth: AngularFireAuth) {
    // Get the authenticated user's UID
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

// Upload video and metadata, display in gallery
uploadVideo(): void {
  if (this.selectedFile && this.videoTitle.trim() && this.notes.trim() && this.clubType && this.handedness && this.userId) {
    console.log("Attempting upload with user ID:", this.userId); // Log the user ID

    // Upload the original video
    this.firebaseService.uploadVideo(this.userId, this.selectedFile!, false).subscribe({
      next: (video1Url) => {
        console.log("Original video uploaded:", video1Url);
        
        // Upload the processed video
        this.firebaseService.uploadVideo(this.userId!, this.selectedFile!, true).subscribe({
          next: (videoProcessedUrl) => {
            console.log("Processed video uploaded:", videoProcessedUrl);

            const videoData = {
              video1Url,
              videoProcessedUrl,
              title: this.videoTitle,
              notes: this.notes,
              clubType: this.clubType,
              handedness: this.handedness
            };

            const videoId = this.firebaseService.generateId();
            this.firebaseService.saveVideoMetadata(this.userId!, videoId, videoData).then(() => {
              console.log("Video metadata saved successfully!");

              this.videoGallery.push({ title: this.videoTitle, url: video1Url });

              this.selectedFile = null;
              this.videoTitle = '';
              this.notes = '';
              this.clubType = '';
              this.handedness = '';
            });
          },
          error: (error) => {
            console.error("Error uploading processed video:", error);
          }
        });
      },
      error: (error) => {
        console.error("Error uploading original video:", error);
      }
    });
  } else {
    alert("Please complete all fields and select a video.");
  }
}



  // Retrieve and display user videos
  getUserVideos(userId: string) {
    this.firebaseService.getUserVideos(userId).subscribe(videos => {
      console.log(videos); // Replace with code to display videos in your template
    });
  }
}
