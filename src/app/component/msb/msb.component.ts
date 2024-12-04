import { Component, ViewChild, ElementRef } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-msb',
  templateUrl: './msb.component.html',
  styleUrls: ['./msb.component.css']
})
export class MsbComponent {
  @ViewChild('fileInput') fileInput: ElementRef | null = null;

  videoTitle: string = '';
  selectedFile: File | null = null;
  handedness: string = '';
  clubType: string = '';
  notes: string = '';
  displayedVideo: { title: string; rawvideourl: string } | null = null;
  userId: string | null = null;
  flaskBaseUrl: string = 'http://127.0.0.1:5000';
  showTipsPopup: boolean = false;

  constructor(private firebaseService: FirebaseService, private afAuth: AngularFireAuth, private http: HttpClient) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
      }
    });
  }
  private validateHandedness(handedness: string | undefined): string {
    const sanitizedHandedness = handedness?.trim().toLowerCase() || 'right';
    return sanitizedHandedness === 'right' || sanitizedHandedness === 'left' ? sanitizedHandedness : 'right';
  }


  openTipsPopup(): void {
    this.showTipsPopup = true;
  }

  closeTipsPopup(): void {
    this.showTipsPopup = false;
  }


  // Handles file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log("File selected:", this.selectedFile.name);
    } else {
        console.log("No file selected.");
    }
  }

  // Upload video and set it as the currently displayed video
  uploadVideo(): void {
    if (this.selectedFile && this.videoTitle.trim() && this.userId) {
      this.firebaseService.getProfile(this.userId).subscribe({
        next: (profile) => {
          const handedness = this.validateHandedness(profile?.handedness);

          this.firebaseService.uploadVideo(this.userId!, this.selectedFile!).subscribe({
            next: (rawVideoUrl) => {
              console.log("Raw video uploaded to Firebase Storage:", rawVideoUrl);

              this.displayedVideo = { title: this.videoTitle.trim(), rawvideourl: rawVideoUrl };

              const formData = new FormData();
              formData.append("file", this.selectedFile!);

              this.http.post(`${this.flaskBaseUrl}/upload`, formData).subscribe({
                next: (response: any) => {
                  const convertedFilePath = response.file_path;

                  const processPayload = {
                    file_path: convertedFilePath,
                    handedness: handedness,
                    user_id: this.userId
                  };

                  console.log("Payload sent to Flask process API:", processPayload);

                  this.http.post(`${this.flaskBaseUrl}/process`, processPayload).subscribe({
                    next: (response: any) => {
                      const processedVideoUrl = response.videoprocessedurl;
                      console.log("Processed video URL:", processedVideoUrl);

                      const videoData = {
                        title: this.videoTitle.trim(),
                        handedness: handedness,
                        clubtype: response.clubtype,
                        notes: '',
                        rawvideourl: rawVideoUrl,
                        videoprocessedurl: processedVideoUrl,
                        wtps: '' // Assuming Flask returns this data
                      };

                      const videoId = this.firebaseService.generateId();
                      this.firebaseService.saveVideoMetadata(this.userId!, videoId, videoData).then(() => {
                        console.log("Video metadata saved to Firestore.");
                        this.resetForm();
                      }).catch((error) => {
                        console.error("Error saving video metadata:", error);
                      });
                    },
                    error: (err) => {
                      console.error("Error processing video:", err);
                    }
                  });
                },
                error: (error) => {
                  console.error("Error uploading video to Flask:", error);
                }
              });
            },
            error: (error) => {
              console.error("Error uploading raw video:", error);
            }
          });
        },
        error: (error) => {
          console.error("Error fetching user profile for handedness:", error);
        }
      });
    } else {
      alert("Please complete all fields and select a video.");
    }
  }
  

  private resetForm(): void {
    this.selectedFile = null;
    this.videoTitle = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = ''; // Clear file input
    }
  }

}
