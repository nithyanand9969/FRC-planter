import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-roundplanters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roundplanters.html',
  styleUrl: './roundplanters.css',
})
export class RoundPlanters {

  constructor(private router: Router, private auth: AuthService) {}

  // ===============================
  // BASIC SETTINGS
  // ===============================

  unit: 'inch' | 'cm' | 'mm' = 'inch';
  selectedThickness: number = 1.5;

  // ===============================
  // CLIENT DETAILS
  // ===============================

  companyName: string = 'Your Company Name';
  customerName: string = '';
  projectName: string = '';
  phoneNumber: string = '';
  gstPercent: number = 18;

  // ===============================
  // INPUTS
  // ===============================

  dimensions = {
    topDia: 0,
    height: 0,
    quantity: 1
  };

  // ===============================
  // CALCULATED VALUES
  // ===============================

  calculated = {
    topCircle: 0,
    totalSqft: 0,
    dieCost: 0,
    dieCostPerPcs: 0
  };

  // ===============================
  // THICKNESS SELECT
  // ===============================

  selectThickness(value: number) {
    this.selectedThickness = value;
    this.calculateAll(); // force refresh
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

    const D = this.convertToInches(Number(this.dimensions.topDia) || 0);
    const H = this.convertToInches(Number(this.dimensions.height) || 0);
    const Q = Number(this.dimensions.quantity) || 1;

    if (D <= 0 || H <= 0) {
      this.calculated.topCircle = 0;
      this.calculated.totalSqft = 0;
      this.calculated.dieCost = 0;
      this.calculated.dieCostPerPcs = 0;
      return;
    }

    // Circumference
    const circumference = Math.PI * D;
    this.calculated.topCircle = parseFloat(circumference.toFixed(4));

    // Lateral Area
    const area = (circumference * H) / 144;
    this.calculated.totalSqft = parseFloat(area.toFixed(4));

    // Die Cost
    const die = area * 2140;
    this.calculated.dieCost = parseFloat(die.toFixed(2));

    // Die Cost Per Piece
    this.calculated.dieCostPerPcs =
      Q > 0 ? parseFloat((die / Q).toFixed(2)) : 0;
  }

  // ===============================
  // RATE CALCULATIONS
  // ===============================

  getFrpRate(): number {
    return (this.calculated.totalSqft * 321) +
           this.calculated.dieCostPerPcs;
  }

  getRate25(): number {
    return this.getFrpRate() +
           (this.calculated.totalSqft * 100);
  }

  getRate35(): number {
    return this.getFrpRate() +
           (this.calculated.totalSqft * 150);
  }

  getRate5(): number {
    return this.getFrpRate() +
           (this.calculated.totalSqft * 250);
  }

  // ===============================
  // SELECTED RATE
  // ===============================

  getSelectedRate(): number {
    return this.getDisplayRate(this.selectedThickness);
  }

// ===============================
// DISPLAY RATE FOR UI
// ===============================

getDisplayRate(thickness: number): number {
  switch (thickness) {
    case 2.5: return this.getRate25();
    case 3.5: return this.getRate35();
    case 5.0: return this.getRate5();
    default: return this.getFrpRate();
  }
}

  // ===============================
  // GST
  // ===============================

  getSubtotal(): number {
    return this.getSelectedRate() * (this.dimensions.quantity || 1);
  }

  getGstAmount(): number {
    return (this.getSubtotal() * (this.gstPercent || 0)) / 100;
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

  // ARRAY FOR MULTIPLE CALCULATORS
extraCalculators: any[] = [];

addNewCalculator() {
  this.extraCalculators.push({
    topDia: 0,
    height: 0,
    qty: 1,
    selectedThickness: 1.5,
    totalSqft: 0,
    dieCostPerPcs: 0
  });
}

// CALCULATE EXTRA
calculateExtra(calc: any) {

  const D = calc.topDia || 0;
  const H = calc.height || 0;
  const Q = calc.qty || 1;

  if (D > 0 && H > 0) {
    const circumference = Math.PI * D;
    const area = (circumference * H) / 144;
    const die = area * 2140;

    calc.totalSqft = area;
    calc.dieCostPerPcs = die / Q;
  }
}

// GET TOTAL
getExtraGrandTotal(calc: any): number {

  const base =
    (calc.totalSqft * 321) + calc.dieCostPerPcs;

  let final = base;

  if (calc.selectedThickness === 2.5)
    final += calc.totalSqft * 100;

  if (calc.selectedThickness === 3.5)
    final += calc.totalSqft * 150;

  if (calc.selectedThickness === 5.0)
    final += calc.totalSqft * 250;

  return final * calc.qty;
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
    doc.text(`Top Dia: ${this.dimensions.topDia} ${this.unit}`, 10, y);
    y += 6;
    doc.text(`Height: ${this.dimensions.height} ${this.unit}`, 10, y);
    y += 6;
    doc.text(`Quantity: ${this.dimensions.quantity}`, 10, y);

    y += 10;
    doc.text(`Total Sqft: ${this.calculated.totalSqft.toFixed(4)}`, 10, y);
    y += 6;
    doc.text(`Selected Thickness: ${this.selectedThickness} mm`, 10, y);
    y += 6;
    doc.text(`Per Piece Rate: ₹ ${this.getSelectedRate().toFixed(2)}`, 10, y);
    y += 6;
    doc.text(`Grand Total (Incl GST): ₹ ${this.getGrandTotal().toFixed(2)}`, 10, y);

    doc.save('Round_Planter_Quotation.pdf');
  }

  // ===============================
  // WHATSAPP SHARE
  // ===============================

  shareOnWhatsApp() {

    const number = this.phoneNumber.replace(/\D/g, '');

    const message = `
${this.companyName}

ROUND PLANTER QUOTATION

Customer: ${this.customerName}
Project: ${this.projectName}

Top Dia: ${this.dimensions.topDia} ${this.unit}
Height: ${this.dimensions.height} ${this.unit}
Qty: ${this.dimensions.quantity}

Total Sqft: ${this.calculated.totalSqft.toFixed(4)}

Selected Thickness: ${this.selectedThickness} mm
Grand Total (Incl GST): ₹ ${this.getGrandTotal().toFixed(2)}

Thank you.
`;

    const encoded = encodeURIComponent(message);

    const url = number
      ? `https://wa.me/91${number}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  }
}