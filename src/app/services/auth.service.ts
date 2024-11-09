import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

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

  // Login an existing user
  async login(email: string, password: string) {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(email, password);
      this.router.navigate(['/']);
    } catch (error) {
      console.error("Error during login: ", error);
    }
  }

  // Logout user
  async logout() {
    await this.afAuth.signOut();
    this.router.navigate(['/login']);
  }
}