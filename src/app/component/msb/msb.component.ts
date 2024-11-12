import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { SidebarComponent } from '../sidebar/sidebar.component';


@Component({
  selector: 'app-msb',
  templateUrl: './msb.component.html',
  styleUrl: './msb.component.css'
})
export class MsbComponent {
  constructor(private firebaseService: FirebaseService) {}
  // Upload video and metadata example function
  uploadVideo(file: File, userId: string, notes: string, clubType: string, handedness: string) {
    // Upload the original video
    this.firebaseService.uploadVideo(userId, file, false).subscribe(video1Url => {
      // Upload the processed video
      this.firebaseService.uploadVideo(userId, file, true).subscribe(videoProcessedUrl => {
        const videoData = {
          video1Url,
          videoProcessedUrl,
          notes,
          clubType,
          handedness
        };


        const videoId = this.firebaseService.generateId(); // Generate unique ID for video metadata
        this.firebaseService.saveVideoMetadata(userId, videoId, videoData).then(() => {
          console.log("Video metadata saved successfully!");
        });
      });
    });
  }


  // Example function to retrieve videos
  getUserVideos(userId: string) {
    this.firebaseService.getUserVideos(userId).subscribe(videos => {
      console.log(videos); // Replace with code to display videos in your template
    });
  }
}
