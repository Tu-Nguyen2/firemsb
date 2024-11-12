import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';

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

  constructor(private firebaseService: FirebaseService) {}

  // Handles file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // Upload video and metadata, display in gallery
uploadVideo(userId: string): void {
  if (this.selectedFile && this.videoTitle.trim() && this.notes.trim() && this.clubType && this.handedness) {
    // Upload the original video
    this.firebaseService.uploadVideo(userId, this.selectedFile!, false).subscribe(video1Url => {
      // Upload the processed video
      this.firebaseService.uploadVideo(userId, this.selectedFile!, true).subscribe(videoProcessedUrl => {
        // Prepare video metadata
        const videoData = {
          video1Url,
          videoProcessedUrl,
          title: this.videoTitle,
          notes: this.notes,
          clubType: this.clubType,
          handedness: this.handedness
        };

        const videoId = this.firebaseService.generateId(); // Generate unique ID for video metadata
        this.firebaseService.saveVideoMetadata(userId, videoId, videoData).then(() => {
          console.log("Video metadata saved successfully!");

          // Add video to the gallery
          this.videoGallery.push({ title: this.videoTitle, url: video1Url });

          // Clear input fields
          this.selectedFile = null;
          this.videoTitle = '';
          this.notes = '';
          this.clubType = '';
          this.handedness = '';
        });
      });
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
