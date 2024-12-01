import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ChangeDetectorRef } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

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
    clubType: string;
  }> = [];  // Array to hold video data with metadata
  
  selectedVideoUrl: string | null = null;  // Store URL of selected video
  selectedVideoTitle: string | null = null;  // Store title of selected video
  selectedClubType: string = '';  

  notes: string = '';  // Store current notes
  wtps: string = '';  // Store "What the Pros Say"
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
            prosText: video.prosText || '',  // Default to empty if not available
            clubType: video.clubType || 'Uncertain'
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
      this.wtps = selectedVideo.prosText;  // Load "What the Pros Say" from the selected video
      this.selectedClubType = selectedVideo.clubType || '';

      const clubTypeDropdown = document.getElementById('clubTypeDropdown') as HTMLSelectElement;
      if (clubTypeDropdown) {
        if (selectedVideo.clubType && selectedVideo.clubType !== 'Uncertain'){
          clubTypeDropdown.value = selectedVideo.clubType;
        } else {
          clubTypeDropdown.value = '';
        }
      }

    } else {
      this.selectedVideoTitle = null;
      this.notes = '';
      this.wtps = '';
      this.selectedClubType = '';
    }
    console.log('Selected video URL:', this.selectedVideoUrl, 'Title:', this.selectedVideoTitle); // Verify selection
  }

  onClubTypeChange(): void {
    if (this.selectedVideoUrl && this.userId) {
      this.firebaseService.updateVideoClubType(this.userId, this.selectedVideoUrl, this.selectedClubType).subscribe({
        next: () => {
          console.log('Club type updated successfully!');
        },
        error: (err) => {
          console.error('Error updating club type:', err);
        }
      });
    }
  }

  
  saveNotes(): void {
    if (this.selectedVideoUrl && this.notes !== '') {
      const videoToUpdate = this.videoList.find(video => video.url === this.selectedVideoUrl);
  
      if (videoToUpdate) {
        videoToUpdate.notes = this.notes;  // Update the local video object
  
        // Pass the userId, selected video URL, and notes to the Firebase service method
        if (this.userId) {
          this.firebaseService.updateVideoNotesByUrl(this.userId, this.selectedVideoUrl, this.notes).subscribe({
            next: () => {
              console.log('Notes updated successfully!');
            },
            error: (err) => {
              console.error('Error updating notes:', err);
            }
          });
        } else {
          console.log('User ID is not available');
        }
      } else {
        console.log('Selected video not found!');
      }
    } else {
      console.log('No video selected or notes are empty!');
    }
  }
  
  
  
  //save notes will update this.notes

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
  this.wtps = `Selected options: ${selectedOptions.join(', ')}`;
  console.log('"What the Pros Say" saved:', this.wtps);
}
}
//generate will reset the field