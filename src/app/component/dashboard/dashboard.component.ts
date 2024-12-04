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
    'Locking Your Right/Left Knee',
    'Locking Your Right/Left Knee at Impact', 
    'Standing Up at Impact', 'Decel', 'Failing to Maintain Your Spine Angle',
    'Yips'
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
            prosText: video.prosText || video.wtps ||'',
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
      this.wtps = selectedVideo.prosText || '';
      this.selectedProsOptions = new Array(this.prosOptions.length).fill(false);
      this.selectedVideoTitle = selectedVideo.title;
      this.notes = selectedVideo.notes;
      this.selectedClubType = selectedVideo.clubType || '';
      if (this.wtps) {
        this.generatedSolutions = this.wtps.split('\n').map(text => ({ text }));
      } else {
        this.generatedSolutions = [];
      }
  
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
      { text: 'Laid-Off: A laid-off position occurs when the club shaft becomes too flat at the top of your backswing. This can limit your ability to generate power and consistency. Focus on maintaining a more neutral shaft angle to optimize your swing path.' },
      { text: 'Across the Line: When the club moves across the line at the top of your backswing, it often indicates overextension or misalignment. Keep the clubhead pointing at your target to enhance precision and power.' },
      { text: 'Off-Balance Swing: Losing balance during your swing can lead to inconsistent strikes. Maintaining a stable stance and centered pivot throughout your swing ensures better ball-striking and control.' },
      { text: 'Short Swing: A shortened backswing may prevent you from fully leveraging your body rotation. Work on completing your backswing to maximize energy transfer through impact.' },
      { text: 'Over Swing: An overextended backswing can disrupt timing and control. Focus on a controlled, compact backswing that prioritizes accuracy over excessive movement.' },
      { text: 'Outside Takeaway: Taking the club too far outside during the takeaway can lead to an over-the-top motion. Ensure the club stays on plane to promote a smoother downswing.' },
      { text: 'Inside Takeaway: An inside takeaway often leads to over-rotation, which can compromise swing efficiency. Keep the clubhead outside your hands early in the takeaway for improved alignment.' },
      { text: 'Over the Top: Swinging over the top creates a steep downswing, often causing slices or pulls. Practice shallowing your swing path to create a more efficient impact position.' },
      { text: 'Casting: Casting occurs when the wrists unhinge prematurely in the downswing, reducing power. Focus on maintaining lag until just before impact to maximize clubhead speed.' },
      { text: 'All Arms Swing: A swing dominated by the arms lacks the power and stability generated by the body. Incorporate your torso and hips to produce a more balanced and powerful motion.' },
      { text: 'Swaying: Excessive lateral movement during the swing disrupts balance and timing. Maintain a steady lower body to create a solid foundation for your swing.' },
      { text: 'Reverse Pivot: A reverse pivot shifts weight incorrectly during the backswing, often causing weak shots. Focus on transferring weight properly to your trail leg for a stable turn.' },
      { text: 'Blocking Shots: Blocking occurs when your body stops rotating through impact, leaving the clubface open. Finish your swing with a full turn to prevent blocks.' },
      { text: 'Scooping the Ball: Attempting to lift the ball leads to poor contact and loss of distance. Strike down on the ball with a descending blow to achieve proper trajectory.' },
      { text: 'Locking Your Right/Left Knee: Locking the trail knee restricts movement during the backswing, while locking the lead knee at impact reduces power. Maintain slight flex in both knees throughout the swing for fluid motion.' },
      { text: 'Locking Your Right/Left Knee at Impact: A locked knee at impact hinders rotation and stability. Focus on rotating through the ball with soft, dynamic knees.' },
      { text: 'Standing Up at Impact: Standing up during impact reduces power and consistency. Maintain your posture and spine angle through impact for more solid strikes.' },
      { text: 'Decel: Deceleration occurs when the club slows down during the downswing, often causing weak shots. Commit to accelerating through the ball to improve power and consistency.' },
      { text: 'Failing to Maintain Your Spine Angle: Losing your spine angle compromises balance and ball-striking. Focus on staying connected to your posture throughout the swing for greater accuracy.' },
      { text: 'Yips: The yips are often caused by tension or mental stress, especially in pressure situations. Practice with a focus on relaxation and rhythm to regain confidence.' }
    ];
  
    const selectedOptions = this.prosOptions.filter((_, index) => this.selectedProsOptions[index]);
  
    this.generatedSolutions = selectedOptions.map(option => {
      const solution = solutions.find(sol => sol.text.includes(option));
      if (!solution) {
        console.warn(`No solution found for: ${option}`);
      }
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
