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
  }> = [];
  
  selectedVideoUrl: string | null = null;
  selectedVideoTitle: string | null = null;
  selectedClubType: string = '';
  notes: string = '';
  wtps: string = '';
  userId: string | null = null;

  prosOptions: string[] = [
    'Laid-Off', 'Across the Line', 'Off-Balance Swing', 'Short Swing', 'Over Swing',
    'Outside Takeaway', 'Inside Takeaway', 'Over the Top', 'Casting', 'All Arms Swing',
    'Swaying', 'Reverse Pivot', 'Blocking Shots', 'Scooping the Ball',
    'Locking Your Right/left Knee', 'Locking Your Right/Left Knee at Impact',
    'Standing Up at Impact', 'Decel', 'Failing to Maintain your Spine Angle', 'Yips'
  ];
  selectedProsOptions: boolean[] = new Array(this.prosOptions.length).fill(false);
  generatedSolutions: { text: string }[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private afAuth: AngularFireAuth,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.getUserVideos();
      }
    });
  }

  getUserVideos(): void {
    if (this.userId) {
      this.firebaseService.getUserVideos(this.userId).subscribe((videos) => {
        this.videoList = videos.map(video => {
          return {
            url: video.videoprocessedurl || video.rawvideourl || '',
            title: video.title || 'Untitled Video',
            notes: video.notes || '',
            prosText: video.prosText || '',
            clubType: video.clubtype || 'Uncertain'
          };
        });
        this.cdRef.detectChanges();
      }, (error) => {
        console.error("Error fetching videos:", error);
      });
    }
  }
  
  onVideoSelected(): void {
    const selectedVideo = this.videoList.find(video => video.url === this.selectedVideoUrl);
  
    if (selectedVideo) {
      this.wtps = '';
      this.generatedSolutions = [];
      this.selectedProsOptions = new Array(this.prosOptions.length).fill(false);
      this.selectedVideoTitle = selectedVideo.title;
      this.notes = selectedVideo.notes;
      this.selectedClubType = selectedVideo.clubType || '';
  
      const clubTypeDropdown = document.getElementById('clubTypeDropdown') as HTMLSelectElement;
      if (clubTypeDropdown) {
        clubTypeDropdown.value = selectedVideo.clubType && selectedVideo.clubType !== 'Uncertain' ? selectedVideo.clubType : '';
      }
    } else {
      this.selectedVideoTitle = null;
      this.notes = '';
      this.wtps = '';
      this.generatedSolutions = [];
      this.selectedProsOptions = new Array(this.prosOptions.length).fill(false);
      this.selectedClubType = '';
    }
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
        videoToUpdate.notes = this.notes;
  
        if (this.userId) {
          this.firebaseService.updateVideoNotesByUrl(this.userId, this.selectedVideoUrl, this.notes).subscribe({
            next: () => {
              console.log('Notes updated successfully!');
            },
            error: (err) => {
              console.error('Error updating notes:', err);
            }
          });
        }
      }
    }
  }

  generateSolutions(): void {
    const solutions = [
      { text: 'Laid-Off: "Alright, if you’re hitting a laid-off position, the club is too flat and across the line at the top of your backswing..."' },
      { text: 'Across the Line: "When your club gets across the line, it means your hands have gone too far, and the shaft is pointing too much to the right..."' },
      { text: 'Off-Balance Swing: "An off-balance swing usually happens when you’re leaning too much on one side..."' },
      { text: 'Short Swing: "A short swing typically means you\'re not completing your backswing..."' },
      { text: 'Over Swing: "An overswing is when your backswing goes too far..."' },
      { text: 'Outside Takeaway: "When you take the club too far outside on the takeaway..."' },
      { text: 'Inside Takeaway: "An inside takeaway can make you over-rotate your body..."' },
      { text: 'Over the Top: "When you come over the top, you’re swinging down on the ball..."' },
      { text: 'Casting: "Casting happens when your wrists unhinge too early during the downswing..."' },
      { text: 'All Arms Swing: "An all-arms swing means you\'re not using your body to generate power..."' },
      { text: 'Swaying: "Swaying occurs when your weight shifts too much to the back leg..."' },
      { text: 'Reverse Pivot: "A reverse pivot is when you shift your weight incorrectly during the backswing..."' },
      { text: 'Blocking Shots: "Blocking shots happen when you’re not turning your body properly..."' },
      { text: 'Scooping the Ball: "Scooping happens when you try to lift the ball in the air..."' },
      { text: 'Locking Your Right/Left Knee: "If you lock your right or left knee during your swing..."' },
      { text: 'Locking Your Right/Left Knee at Impact: "Locking the knee at impact can lead to a loss of power..."' },
      { text: 'Standing Up at Impact: "When you stand up during impact, you lose your posture..."' },
      { text: 'Decel: "Deceleration occurs when you slow down too much during the downswing..."' },
      { text: 'Failing to Maintain Your Spine Angle: "If you fail to maintain your spine angle during the swing..."' },
      { text: 'Yips: "The yips are often caused by mental stress or tension..."' }
    ];
  
    const selectedOptions = this.prosOptions.filter((_, index) => this.selectedProsOptions[index]);
    this.generatedSolutions = selectedOptions.map(option => {
      const solution = solutions.find(sol => sol.text.includes(option));
      return solution ? { text: solution.text } : { text: '' };
    });
  
    this.wtps = this.generatedSolutions.map(solution => solution.text).join('\n');

    const selectedVideo = this.videoList.find(video => video.url === this.selectedVideoUrl);
    if (selectedVideo && this.selectedVideoUrl) {
      if (this.userId) {
        this.firebaseService.updateVideoWtpsByUrl(this.userId, this.selectedVideoUrl, this.wtps)
          .subscribe({
            next: () => {
              console.log('wtps updated successfully!');
            },
            error: (err) => {
              console.error('Error updating wtps:', err);
            }
          });
      }
    }
  }

  savePros(): void {
    const selectedOptions = this.prosOptions.filter((_, index) => this.selectedProsOptions[index]);
    this.wtps = `Selected options: ${selectedOptions.join(', ')}`;
  }
}
