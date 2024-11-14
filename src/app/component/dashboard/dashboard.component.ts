import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  videoList: Array<{ title: string; url: string }> = [];  // Array to hold video data
  selectedVideoUrl: string | null = null;  // Store URL of selected video
  selectedVideoTitle: string | null = null;  // Store title of selected video
  userId: string | null = null;  // Store the current user's ID

  constructor(
    private firebaseService: FirebaseService,
    private afAuth: AngularFireAuth,
    private cdRef: ChangeDetectorRef  // ChangeDetectorRef to manually trigger change detection
  ) {}

  ngOnInit(): void {
    // Subscribe to auth state to get the user ID when logged in
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;  // Get the current user's ID
        this.getUserVideos();  // Fetch the user's videos after login
      }
    });
  }

  // Fetch the user's uploaded videos from Firebase
  getUserVideos(): void {
    if (this.userId) {
      this.firebaseService.getUserVideos(this.userId).subscribe((videos) => {
        // Map each video to ensure url is properly set
        this.videoList = videos.map(video => {
          console.log("Video data from Firebase:", video); // Debugging each video object
          return {
            url: video.videoprocessedurl || video.rawvideourl || '',  // Fallback to rawvideourl if videoprocessedurl is empty
            title: video.title || 'Untitled Video'
          };
        });
        console.log("Videos fetched:", this.videoList);  // Log video list for verification
        // Trigger change detection to ensure updates are reflected in the view
        this.cdRef.detectChanges();
      }, (error) => {
        console.error("Error fetching videos:", error);  // Handle error
      });
    }
  }
  

  // Handle video selection from the dropdown
  onVideoSelected(): void {
    console.log('Dropdown changed, selected URL:', this.selectedVideoUrl); // Debugging dropdown selection
    const selectedVideo = this.videoList.find(video => video.url === this.selectedVideoUrl);
    this.selectedVideoTitle = selectedVideo ? selectedVideo.title : null;
    console.log('Selected video URL:', this.selectedVideoUrl, 'Title:', this.selectedVideoTitle); // Verify selection
  }
}
