import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service'; // Firebase service
import { AngularFireAuth } from '@angular/fire/compat/auth'; // To get current user ID
import { ChangeDetectorRef } from '@angular/core';  // Import ChangeDetectorRef

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
    private cdRef: ChangeDetectorRef  // Inject ChangeDetectorRef to manually trigger change detection
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
        this.videoList = videos;  // Store videos in the videoList
        console.log("Videos fetched:", this.videoList);  // Log videos to console for debugging
        // Manually trigger change detection to ensure the changes are reflected in the view
        this.cdRef.detectChanges(); 
      }, (error) => {
        console.error("Error fetching videos:", error);  // Handle error
      });
    }
  }

  // Handle video selection from the dropdown
  onVideoSelected(): void {
    // Ensure the selected video URL is correct and set the title
    const selectedVideo = this.videoList.find(video => video.url === this.selectedVideoUrl);
    
    if (selectedVideo) {
      this.selectedVideoTitle = selectedVideo.title;  // Set the title of the selected video
      console.log("Video Selected:", selectedVideo);  // Debugging log to ensure correct video selection
    }
  }

  
}
