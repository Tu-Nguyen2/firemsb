import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private afAuth: AngularFireAuth, private router: Router) { }

  // Register a new user
  async register(email: string, password: string) {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(email, password);
      this.router.navigate(['/']);
    } catch (error) {
      console.error("Error during registration: ", error);
    }
  }

  async reauthenticateUser(email: string, password: string) {
    const user = await this.afAuth.currentUser;
    if (user) {
      const credential = firebase.auth.EmailAuthProvider.credential(email, password);
      try {
        await user.reauthenticateWithCredential(credential);
        console.log('Reauthenticated successfully');
      } catch (error) {
        console.error('Reauthentication failed', error);
      }
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      // Attempt to sign in
      await this.afAuth.signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      // Throw the error back to the caller (login component)
      throw new Error(error.message);
    }
  }

  // Logout user
  async logout() {
    await this.afAuth.signOut();
    this.router.navigate(['/login']);
  }
}