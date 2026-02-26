import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-squarelanters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './squarelanters.html',
  styleUrls: ['./squarelanters.css'],
})
export class SQUARELANTERS {

  constructor(private router: Router, private auth: AuthService) {
    this.calculateAll();
  }

  // ===============================
  // BASIC SETTINGS
  // ===============================

  unit: 'inch' | 'cm' | 'mm' = 'inch';
  selectedThickness: number = 1.5;

  companyName = 'Your Company Name';
  customerName = '';
  projectName = '';
  phoneNumber = '';
  gstPercent = 18;

  dimensions = {
    length: 0,
    width: 0,
    height: 0,
    quantity: 1
  };

  calculated = {
    fourSide: 0,
    bottom: 0,
    totalSqft: 0,
    dieCost: 0,
    dieCostPerPcs: 0
  };

  // ===============================
  // THICKNESS SELECT
  // ===============================

  selectThickness(value: number) {
    this.selectedThickness = value;
  }

  // ===============================
  // UNIT CONVERSION
  // ===============================

  convertToInches(value: number): number {
    if (!value) return 0;

    switch (this.unit) {
      case 'cm': return value / 2.54;
      case 'mm': return value / 25.4;
      default: return value;
    }
  }

  // ===============================
  // MAIN CALCULATION
  // ===============================

  calculateAll() {

    const { length, width, height, quantity } = this.dimensions;

    const L = this.convertToInches(length);
    const W = this.convertToInches(width);
    const H = this.convertToInches(height);

    if (L > 0 && W > 0 && H > 0) {
      const perimeter = 2 * (L + W);
      this.calculated.fourSide = (perimeter * H) / 144;
    } else {
      this.calculated.fourSide = 0;
    }

    this.calculated.bottom =
      (L > 0 && W > 0) ? (L * W) / 144 : 0;

    this.calculated.totalSqft =
      this.calculated.fourSide + this.calculated.bottom;

    const die = this.calculated.totalSqft * 1070;

    this.calculated.dieCost = die;
    this.calculated.dieCostPerPcs =
      quantity > 0 ? die / quantity : 0;
  }

  // ===============================
  // RATE CALCULATIONS
  // ===============================

  getFrp15Rate(): number {
    return (this.calculated.totalSqft * 321) +
           this.calculated.dieCostPerPcs;
  }

  getThickness25Rate(): number {
    return this.getFrp15Rate() +
           (this.calculated.totalSqft * 100);
  }

  getThickness35Rate(): number {
    return this.getFrp15Rate() +
           (this.calculated.totalSqft * 150);
  }

  getThickness5Rate(): number {
    return this.getFrp15Rate() +
           (this.calculated.totalSqft * 250);
  }

  // ===============================
  // DISPLAY RATE
  // ===============================

  getDisplayRate(thickness: number): number {
    switch (thickness) {
      case 2.5: return this.getThickness25Rate();
      case 3.5: return this.getThickness35Rate();
      case 5.0: return this.getThickness5Rate();
      default: return this.getFrp15Rate();
    }
  }

  getSelectedRate(): number {
    return this.getDisplayRate(this.selectedThickness);
  }

  // ===============================
  // GST CALCULATION
  // ===============================

  getSubtotal(): number {
    return this.getSelectedRate() *
           (this.dimensions.quantity || 1);
  }

  getGstAmount(): number {
    return (this.getSubtotal() *
           (this.gstPercent || 0)) / 100;
  }

  getGrandTotal(): number {
    return this.getSubtotal() + this.getGstAmount();
  }

  // ===============================
  // NAVIGATION
  // ===============================

  goToSquare() {
    this.router.navigate(['/square-planters']);
  }

  goToRound() {
    this.router.navigate(['/round-planters']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['']);
  }

  // ===============================
  // PDF GENERATION
  // ===============================

  generatePDF() {

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();
    let y = 15;

    doc.setFontSize(16);
    doc.text(this.companyName, 105, y, { align: 'center' });

    y += 10;
    doc.setFontSize(10);
    doc.text(`Date: ${today}`, 150, 10);

    y += 10;
    doc.text(`Customer: ${this.customerName}`, 10, y);
    y += 6;
    doc.text(`Project: ${this.projectName}`, 10, y);
    y += 6;
    doc.text(`Phone: ${this.phoneNumber}`, 10, y);

    y += 10;
    doc.text(`Selected Thickness: ${this.selectedThickness} mm`, 10, y);
    y += 6;
    doc.text(`Per Piece Rate: ₹ ${this.getSelectedRate().toFixed(2)}`, 10, y);
    y += 6;
    doc.text(`Grand Total (Incl GST): ₹ ${this.getGrandTotal().toFixed(2)}`, 10, y);

    doc.save('Square_Lantern_Quotation.pdf');
  }

  // ===============================
  // WHATSAPP SHARE
  // ===============================

  shareOnWhatsApp() {

    const number = this.phoneNumber.replace(/\D/g, '');

    const message = `
${this.companyName}

SQUARE LANTERN QUOTATION

Customer: ${this.customerName}
Project: ${this.projectName}

Selected Thickness: ${this.selectedThickness} mm
Grand Total (Incl GST): ₹ ${this.getGrandTotal().toFixed(2)}

Thank You
`;

    const encoded = encodeURIComponent(message);

    const url = number
      ? `https://wa.me/91${number}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  }
}