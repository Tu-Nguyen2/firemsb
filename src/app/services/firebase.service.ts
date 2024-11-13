import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Import AngularFireAuth
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private afAuth: AngularFireAuth // Inject AngularFireAuth for authentication
  ) {}

  // Method to generate a unique Firestore ID
  generateId(): string {
    return this.firestore.createId();
  }

  // Uploads a video file to Firebase Storage
  uploadVideo(userId: string, file: File, processed: boolean): Observable<string> {
    const filePath = `users/${userId}/videos/${processed ? 'processed_' : ''}${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    return new Observable((observer) => {
      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(url => {
            observer.next(url);
            observer.complete();
          });
        })
      ).subscribe();
    });
  }

  // Stores metadata in Firestore
  saveVideoMetadata(userId: string, videoId: string, videoData: any): Promise<void> {
    return this.firestore.collection(`users/${userId}/videos`).doc(videoId).set(videoData);
  }

  // Retrieves video metadata for a specific user
  getUserVideos(userId: string): Observable<any[]> {
    // Assuming videos are stored under a user collection
    return this.firestore.collection(`users/${userId}/videos`).valueChanges();
  }

  updateProfile(userId: string, profileData: any): Promise<void> {
    return this.firestore.collection(`users/${userId}/profile`).doc('profileData').set(profileData, { merge: true });
  }

  // Retrieves profile data for a specific user
  getProfile(userId: string): Observable<any> {
    return this.firestore.collection(`users/${userId}/profile`).doc('profileData').valueChanges();
  }

  // Fetch videos for a specific user based on userId
  getUserVideosByUserId(userId: string): Observable<any[]> {
    return this.firestore.collection('videos', ref => ref.where('userId', '==', userId)).valueChanges();
  }

}
