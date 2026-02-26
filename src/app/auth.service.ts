import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private correctPin = '1234';

  verifyPin(pin: string): boolean {
    if (pin === this.correctPin) {
      localStorage.setItem('auth', 'true');
      return true;
    }
    return false;
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('auth') === 'true';
  }

  logout() {
    localStorage.removeItem('auth');
  }
}