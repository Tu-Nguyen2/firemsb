import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFireModule } from '@angular/fire/compat'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { LoginComponent } from './component/login/login.component';
import { RegisterComponent } from './component/register/register.component';
import { environment } from '../environments/environment.development';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { MsbComponent } from './component/msb/msb.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { ProfileComponent } from './component/profile/profile.component';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './component/home/home.component'; // Import your Auth Guard

const routes: Routes = [
  { path: 'login', component: LoginComponent },   // Login page does not need AuthGuard
  { path: 'register', component: RegisterComponent },  // Register page does not need AuthGuard
  { path: 'home', component: HomeComponent },  // Home page does not need AuthGuard
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },  // Protected route
  { path: 'msb', component: MsbComponent, canActivate: [AuthGuard] },  // Protected route
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },  // Protected route
  { path: '', redirectTo: '/home', pathMatch: 'full' },  // Default redirect to home page
];


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    MsbComponent,
    SidebarComponent,
    DashboardComponent,
    ProfileComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    RouterModule.forRoot(routes),
    AngularFireModule.initializeApp(environment.firebase),
    FormsModule,
    
    AngularFireModule.initializeApp({
      apiKey: "AIzaSyAzfK9Tj06Xzya3RhGJec4pf7Nf24hqreo",
      authDomain: "msbuddy-69e38.firebaseapp.com",
      projectId: "msbuddy-69e38",
      storageBucket: "msbuddy-69e38.firebasestorage.app",
      messagingSenderId: "785873142250",
      appId: "1:785873142250:web:792393c11df6efb398b293",
      measurementId: "G-9TVEGSZPPF"
    }),
    AngularFireAuthModule,
  ],
  exports: [RouterModule],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }



//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);