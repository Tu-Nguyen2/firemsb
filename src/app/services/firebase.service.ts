import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
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
    return this.firestore.collection(`users/${userId}/videos`).valueChanges();
  }
}
