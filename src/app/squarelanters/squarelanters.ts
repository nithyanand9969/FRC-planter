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
  // ADDITIONAL CALCULATORS
  // ===============================

  extraCalculators: any[] = [];

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

    const L = this.convertToInches(length || 0);
    const W = this.convertToInches(width || 0);
    const H = this.convertToInches(height || 0);

    if (L > 0 && W > 0 && H > 0) {
      const perimeter = 2 * (L + W);
      this.calculated.fourSide = parseFloat(((perimeter * H) / 144).toFixed(2));
    } else {
      this.calculated.fourSide = 0;
    }

    this.calculated.bottom = (L > 0 && W > 0) ? parseFloat(((L * W) / 144).toFixed(2)) : 0;

    this.calculated.totalSqft = parseFloat((this.calculated.fourSide + this.calculated.bottom).toFixed(2));

    const die = this.calculated.totalSqft * 1070;
    this.calculated.dieCost = Math.round(die);
    this.calculated.dieCostPerPcs = quantity > 0 ? Math.round(die / quantity) : 0;
  }

  // ===============================
  // RATE CALCULATIONS
  // ===============================

  getFrp15Rate(): number {
    return Math.round((this.calculated.totalSqft * 321) + this.calculated.dieCostPerPcs);
  }

  getThickness25Rate(): number {
    return Math.round(this.getFrp15Rate() + (this.calculated.totalSqft * 100));
  }

  getThickness35Rate(): number {
    return Math.round(this.getFrp15Rate() + (this.calculated.totalSqft * 150));
  }

  getThickness5Rate(): number {
    return Math.round(this.getFrp15Rate() + (this.calculated.totalSqft * 250));
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
    return this.getSelectedRate() * (this.dimensions.quantity || 1);
  }

  getGstAmount(): number {
    return Math.round((this.getSubtotal() * (this.gstPercent || 0)) / 100);
  }

  getGrandTotal(): number {
    return this.getSubtotal() + this.getGstAmount();
  }

  // ===============================
  // MAIN PLANTER TOTAL (Without GST)
  // ===============================

  getMainPlanterTotal(): number {
    return this.getSelectedRate() * (this.dimensions.quantity || 1);
  }

  // ===============================
  // CLEAR MAIN FORM
  // ===============================

  clearMainForm() {
    this.dimensions = {
      length: 0,
      width: 0,
      height: 0,
      quantity: 1
    };
    this.selectedThickness = 1.5;
    this.gstPercent = 18;
    this.calculateAll();
  }

  // ===============================
  // ADDITIONAL CALCULATORS METHODS
  // ===============================

  addNewCalculator() {
    this.extraCalculators.push({
      length: 0,
      width: 0,
      height: 0,
      qty: 1,
      selectedThickness: 1.5,
      fourSide: 0,
      bottom: 0,
      totalSqft: 0,
      dieCostPerPcs: 0,
      materialCost: 0
    });
  }

  removeCalculator(index: number) {
    this.extraCalculators.splice(index, 1);
  }

  calculateExtra(calc: any) {
    const L = this.convertToInches(calc.length || 0);
    const W = this.convertToInches(calc.width || 0);
    const H = this.convertToInches(calc.height || 0);
    const Q = calc.qty || 1;

    if (L > 0 && W > 0 && H > 0) {
      const perimeter = 2 * (L + W);
      const fourSide = (perimeter * H) / 144;
      const bottom = (L * W) / 144;
      const totalSqft = fourSide + bottom;
      
      const dieCostPerPcs = (totalSqft * 1070) / Q;

      calc.fourSide = parseFloat(fourSide.toFixed(2));
      calc.bottom = parseFloat(bottom.toFixed(2));
      calc.totalSqft = parseFloat(totalSqft.toFixed(2));
      calc.dieCostPerPcs = Math.round(dieCostPerPcs);
      
      // Calculate material cost based on selected thickness
      const baseRate = (totalSqft * 321) + dieCostPerPcs;
      let finalRate = baseRate;
      
      if (calc.selectedThickness === 2.5)
        finalRate += totalSqft * 100;
      else if (calc.selectedThickness === 3.5)
        finalRate += totalSqft * 150;
      else if (calc.selectedThickness === 5.0)
        finalRate += totalSqft * 250;
        
      calc.materialCost = Math.round(finalRate);
    } else {
      calc.fourSide = 0;
      calc.bottom = 0;
      calc.totalSqft = 0;
      calc.dieCostPerPcs = 0;
      calc.materialCost = 0;
    }
  }

  getExtraRate(calc: any): number {
    if (!calc.totalSqft) return 0;
    
    const base = (calc.totalSqft * 321) + calc.dieCostPerPcs;
    let final = base;

    if (calc.selectedThickness === 2.5)
      final += calc.totalSqft * 100;
    else if (calc.selectedThickness === 3.5)
      final += calc.totalSqft * 150;
    else if (calc.selectedThickness === 5.0)
      final += calc.totalSqft * 250;

    return Math.round(final);
  }

  getExtraGrandTotal(calc: any): number {
    return this.getExtraRate(calc) * (calc.qty || 1);
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
    doc.text(`Length: ${this.dimensions.length} ${this.unit}`, 10, y);
    y += 6;
    doc.text(`Width: ${this.dimensions.width} ${this.unit}`, 10, y);
    y += 6;
    doc.text(`Height: ${this.dimensions.height} ${this.unit}`, 10, y);
    y += 6;
    doc.text(`Quantity: ${this.dimensions.quantity}`, 10, y);

    y += 10;
    doc.text(`Total Sqft: ${this.calculated.totalSqft.toFixed(2)}`, 10, y);
    y += 6;
    doc.text(`Selected Thickness: ${this.selectedThickness} mm`, 10, y);
    y += 6;
    doc.text(`Per Piece Rate: ₹ ${this.getSelectedRate()}`, 10, y);
    y += 6;
    doc.text(`Main Lantern Total: ₹ ${this.getMainPlanterTotal()}`, 10, y);
    
    if (this.extraCalculators.length > 0) {
      y += 10;
      doc.text('Additional Lanterns:', 10, y);
      
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        y += 8;
        doc.text(`Lantern ${i + 1}: L ${calc.length}", W ${calc.width}", H ${calc.height}", Qty ${calc.qty}`, 15, y);
        y += 6;
        doc.text(`Total: ₹ ${this.getExtraGrandTotal(calc)}`, 20, y);
      }
    }

    y += 10;
    doc.text(`Grand Total (Incl GST): ₹ ${Math.round(this.getGrandTotal())}`, 10, y);

    doc.save('Square_Lantern_Quotation.pdf');
  }

  // ===============================
  // WHATSAPP SHARE
  // ===============================

  shareOnWhatsApp() {
    const number = this.phoneNumber.replace(/\D/g, '');

    let message = `
${this.companyName}

SQUARE LANTERN QUOTATION

Customer: ${this.customerName}
Project: ${this.projectName}

MAIN LANTERN:
Length: ${this.dimensions.length} ${this.unit}
Width: ${this.dimensions.width} ${this.unit}
Height: ${this.dimensions.height} ${this.unit}
Qty: ${this.dimensions.quantity}
Total Sqft: ${this.calculated.totalSqft.toFixed(2)}
Selected Thickness: ${this.selectedThickness} mm
Per Piece Rate: ₹ ${this.getSelectedRate()}
Subtotal: ₹ ${this.getMainPlanterTotal()}
`;

    if (this.extraCalculators.length > 0) {
      message += `\nADDITIONAL LANTERNS:\n`;
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        message += `Lantern ${i + 1}: L ${calc.length}", W ${calc.width}", H ${calc.height}", Qty ${calc.qty} - ₹ ${this.getExtraGrandTotal(calc)}\n`;
      }
    }

    message += `
Grand Total (Incl GST): ₹ ${Math.round(this.getGrandTotal())}

Thank you.
`;

    const encoded = encodeURIComponent(message);
    const url = number
      ? `https://wa.me/91${number}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  }
}