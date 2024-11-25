import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Import AngularFireAuth
import { Observable, throwError } from 'rxjs';
import { finalize, last, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private afAuth: AngularFireAuth,
    private http: HttpClient
  ) {}

  generateId(): string {
    return this.firestore.createId();
  }

  // Uploads a video file to Firebase Storage
  uploadVideo(userId: string, file: File): Observable<string> {
    const filePath = `raw_videos/${userId}/${file.name}`; // Correct raw video path
    const fileRef = this.storage.ref(filePath);
    const uploadTask = fileRef.put(file);
  
    return new Observable((observer) => {
      uploadTask.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe({
            next: (downloadUrl: string) => {
              observer.next(downloadUrl); // Return the Firebase Storage URL
              observer.complete();
            },
            error: (err) => observer.error(err),
          });
        })
      ).subscribe({
        error: (err) => observer.error(err),
      });
    });
  }
  
  uploadProcessedVideo(userId: string, processedFile: File): Observable<string> {
    const filePath = `processed_videos/${userId}/${processedFile.name}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, processedFile);
  
    return uploadTask.snapshotChanges().pipe(
      finalize(() => fileRef.getDownloadURL()),
      switchMap(() => fileRef.getDownloadURL())
    );
  }
  
  getBlobFromFilePath(filePath: string): Observable<Blob> {
    return this.http.get(filePath, { responseType: 'blob' });
  }
  
  
  

  saveVideoMetadata(userId: string, videoId: string, videoData: any): Promise<void> {
    return this.firestore.collection(`users/${userId}/videos`).doc(videoId).set(videoData);
  }

  // Retrieves video metadata for a specific user, stores in collection
  getUserVideos(userId: string): Observable<any[]> {
    return this.firestore.collection(`users/${userId}/videos`).valueChanges();
  }

  updateProfile(userId: string, profileData: any): Promise<void> {
    return this.firestore
      .doc(`users/${userId}/profile/${userId}`)
      .set(profileData, { merge: true });
  }

  // retrieves profile for a specific user
  getProfile(userId: string): Observable<any> {
    return this.firestore
      .doc(`users/${userId}/profile/${userId}`)
      .valueChanges();
  }
  
  uploadProfilePicture(userId: string, file: File): Promise<string> {
    const filePath = `users/${userId}/profile-picture/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    return this.storage.upload(filePath, file).then(() => {
      return fileRef.getDownloadURL().toPromise();
    });
  }
  

  // fetch videos for a specific user based on userId
  getUserVideosByUserId(userId: string): Observable<any[]> {
    return this.firestore.collection('videos', ref => ref.where('userId', '==', userId)).valueChanges();
  }

}
