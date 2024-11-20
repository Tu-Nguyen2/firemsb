import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'firemsb';
  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  ngOnInit(): void {
    // this.afAuth.authState.subscribe(user => {
    //   if (!user) {
    //     this.router.navigate(['/login']); // Redirect unauthenticated users
    //   }
    // });
  }
}
