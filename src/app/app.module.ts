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
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { MsbComponent } from './component/msb/msb.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { ProfileComponent } from './component/profile/profile.component';


const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'msb', component: MsbComponent},
  { path: '', redirectTo: '/login', pathMatch: 'full' },
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
  ],
  imports: [
    BrowserModule,
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