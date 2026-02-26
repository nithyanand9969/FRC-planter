import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {

  enteredPin: string = '';
  errorMessage: string = '';
  isAuthenticated: boolean = false;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    // ✅ If already logged in, skip PIN
    if (this.auth.isLoggedIn()) {
      this.isAuthenticated = true;
    }
  }

  verifyPin() {
    if (this.auth.verifyPin(this.enteredPin)) {
      this.isAuthenticated = true;   // show buttons
      this.errorMessage = '';
    } else {
      this.errorMessage = 'Invalid PIN';
    }
  }

  goToSquare() {
    this.router.navigate(['/square-planters']);
  }

  goToRound() {
    this.router.navigate(['/round-planters']);
  }

  logout() {
    this.auth.logout();
    this.isAuthenticated = false;
    this.enteredPin = '';
  }
}