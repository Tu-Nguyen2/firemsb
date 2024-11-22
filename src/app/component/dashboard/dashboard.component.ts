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
  videoList: Array<{ 
    title: string; 
    url: string; 
    notes: string; 
    prosText: string; 
  }> = [];  // Array to hold video data with metadata
  
  selectedVideoUrl: string | null = null;  // Store URL of selected video
  selectedVideoTitle: string | null = null;  // Store title of selected video
  notes: string = '';  // Store current notes
  prosText: string = '';  // Store "What the Pros Say"
  userId: string | null = null;  // Store the current user's ID


  prosOptions: string[] = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6', 'Option 7', 'Option 8', 'Option 9', 'Option 10'];  
selectedProsOptions: boolean[] = Array(10).fill(false);  // Boolean array to track selected options
generatedSolutions: string[] = [];  // Placeholder for generated solutions

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
        // Map each video to ensure url, notes, and prosText are properly set
        this.videoList = videos.map(video => {
          console.log("Video data from Firebase:", video); // Debugging each video object
          return {
            url: video.videoprocessedurl || video.rawvideourl || '',  // Fallback to rawvideourl if videoprocessedurl is empty
            title: video.title || 'Untitled Video',
            notes: video.notes || '',  // Default to empty if not available
            prosText: video.prosText || ''  // Default to empty if not available
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
    if (selectedVideo) {
      this.selectedVideoTitle = selectedVideo.title;
      this.notes = selectedVideo.notes;  // Load notes from the selected video
      this.prosText = selectedVideo.prosText;  // Load "What the Pros Say" from the selected video
    } else {
      this.selectedVideoTitle = null;
      this.notes = '';
      this.prosText = '';
    }
    console.log('Selected video URL:', this.selectedVideoUrl, 'Title:', this.selectedVideoTitle); // Verify selection
  }

  // Save notes to the selected video
  saveNotes(): void {
    const selectedVideo = this.videoList.find(video => video.url === this.selectedVideoUrl);
    if (selectedVideo) {
      selectedVideo.notes = this.notes;
      console.log('Notes saved:', this.notes);
      // Add Firebase save logic here if needed
    }
  }

// Generate solutions based on selected options
generateSolutions(): void {
  const selectedOptions = this.prosOptions.filter((_, index) => this.selectedProsOptions[index]);
  console.log('Selected options:', selectedOptions); // Debugging

  // Example logic: Generate up to 5 placeholder solutions
  this.generatedSolutions = selectedOptions.map((option, index) => `Solution ${index + 1} for ${option}`).slice(0, 5);
}

// Save "What the Pros Say" data
savePros(): void {
  const selectedOptions = this.prosOptions.filter((_, index) => this.selectedProsOptions[index]);
  this.prosText = `Selected options: ${selectedOptions.join(', ')}`;
  console.log('"What the Pros Say" saved:', this.prosText);
}
}
