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
  
  // Single GST for all planters
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
    this.calculateAll();
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
  // RATE CALCULATIONS (ALL IN INR ₹)
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
  // MAIN PLANTER TOTAL (Without GST)
  // ===============================

  getMainPlanterTotal(): number {
    return Math.round(this.getSelectedRate() * (this.dimensions.quantity || 1));
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
    return Math.round(this.getExtraRate(calc) * (calc.qty || 1));
  }

  // ===============================
  // GET ALL ADDITIONAL PLANTERS TOTAL (IN INR)
  // ===============================

  getAllAdditionalTotal(): number {
    let total = 0;
    for (let calc of this.extraCalculators) {
      total += this.getExtraGrandTotal(calc);
    }
    return Math.round(total);
  }

  // ===============================
  // GET COMBINED GRAND TOTAL (WITH SINGLE GST)
  // ===============================

  getCombinedGrandTotal(): number {
    const mainTotal = this.getMainPlanterTotal();
    const additionalTotal = this.getAllAdditionalTotal();
    const subtotal = mainTotal + additionalTotal;
    const gstAmount = (subtotal * (this.gstPercent || 0)) / 100;
    return Math.round(subtotal + gstAmount);
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

    // Header
    doc.setFontSize(16);
    doc.text(this.companyName, 105, y, { align: 'center' });

    y += 10;
    doc.setFontSize(10);
    doc.text(`Date: ${today}`, 150, 10);

    // Client Details
    y += 10;
    doc.text(`Customer: ${this.customerName}`, 10, y);
    y += 6;
    doc.text(`Project: ${this.projectName}`, 10, y);
    y += 6;
    doc.text(`Phone: ${this.phoneNumber}`, 10, y);

    // Main Planter Details
    y += 10;
    doc.setFontSize(12);
    doc.text('MAIN PLANTER:', 10, y);
    
    y += 8;
    doc.setFontSize(10);
    doc.text(`Length: ${this.dimensions.length} ${this.unit}`, 15, y);
    y += 6;
    doc.text(`Width: ${this.dimensions.width} ${this.unit}`, 15, y);
    y += 6;
    doc.text(`Height: ${this.dimensions.height} ${this.unit}`, 15, y);
    y += 6;
    doc.text(`Quantity: ${this.dimensions.quantity}`, 15, y);
    y += 6;
    doc.text(`Total Sqft: ${this.calculated.totalSqft.toFixed(2)}`, 15, y);
    y += 6;
    doc.text(`Selected Thickness: ${this.selectedThickness} mm`, 15, y);
    y += 6;
    doc.text(`Per Piece Rate: ₹ ${this.getSelectedRate().toLocaleString('en-IN')}`, 15, y);
    y += 6;
    doc.text(`Main Planter Total: ₹ ${this.getMainPlanterTotal().toLocaleString('en-IN')}`, 15, y);
    
    // Additional Planters
    if (this.extraCalculators.length > 0) {
      y += 10;
      doc.setFontSize(12);
      doc.text('ADDITIONAL PLANTERS:', 10, y);
      
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        y += 8;
        doc.setFontSize(10);
        doc.text(`Planter ${i + 1}: L ${calc.length}", W ${calc.width}", H ${calc.height}", Qty ${calc.qty}`, 15, y);
        y += 6;
        doc.text(`Rate: ₹ ${this.getExtraRate(calc).toLocaleString('en-IN')}`, 20, y);
        y += 6;
        doc.text(`Total: ₹ ${this.getExtraGrandTotal(calc).toLocaleString('en-IN')}`, 20, y);
      }
    }

    // Totals
    y += 10;
    doc.setFontSize(12);
    doc.text('SUMMARY:', 10, y);
    
    y += 8;
    doc.setFontSize(10);
    doc.text(`Main Planter Total: ₹ ${this.getMainPlanterTotal().toLocaleString('en-IN')}`, 15, y);
    
    if (this.extraCalculators.length > 0) {
      y += 6;
      doc.text(`Additional Planters Total: ₹ ${this.getAllAdditionalTotal().toLocaleString('en-IN')}`, 15, y);
    }
    
    y += 6;
    doc.text(`GST (${this.gstPercent}%): ₹ ${Math.round((this.getMainPlanterTotal() + this.getAllAdditionalTotal()) * this.gstPercent / 100).toLocaleString('en-IN')}`, 15, y);
    
    y += 8;
    doc.setFontSize(12);
    doc.text(`GRAND TOTAL (Incl GST): ₹ ${this.getCombinedGrandTotal().toLocaleString('en-IN')}`, 15, y);

    doc.save('Square_Planter_Quotation.pdf');
  }

  // ===============================
  // WHATSAPP SHARE
  // ===============================

  shareOnWhatsApp() {
    const number = this.phoneNumber.replace(/\D/g, '');

    let message = `*${this.companyName}*

*SQUARE PLANTER QUOTATION*

*Customer:* ${this.customerName}
*Project:* ${this.projectName}

*MAIN PLANTER:*
Length: ${this.dimensions.length} ${this.unit}
Width: ${this.dimensions.width} ${this.unit}
Height: ${this.dimensions.height} ${this.unit}
Qty: ${this.dimensions.quantity}
Total Sqft: ${this.calculated.totalSqft.toFixed(2)}
Selected Thickness: ${this.selectedThickness} mm
Per Piece Rate: ₹ ${this.getSelectedRate().toLocaleString('en-IN')}
Subtotal: ₹ ${this.getMainPlanterTotal().toLocaleString('en-IN')}
`;

    if (this.extraCalculators.length > 0) {
      message += `\n*ADDITIONAL PLANTERS:*\n`;
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        message += `Planter ${i + 1}: L ${calc.length}", W ${calc.width}", H ${calc.height}", Qty ${calc.qty}\n`;
        message += `Amount: ₹ ${this.getExtraGrandTotal(calc).toLocaleString('en-IN')}\n\n`;
      }
    }

    const mainTotal = this.getMainPlanterTotal();
    const additionalTotal = this.getAllAdditionalTotal();
    const subtotal = mainTotal + additionalTotal;
    const gstAmount = (subtotal * this.gstPercent) / 100;

    message += `*SUMMARY:*
Main Planter: ₹ ${mainTotal.toLocaleString('en-IN')}
${additionalTotal > 0 ? `Additional: ₹ ${additionalTotal.toLocaleString('en-IN')}\n` : ''}
Subtotal: ₹ ${Math.round(subtotal).toLocaleString('en-IN')}
GST (${this.gstPercent}%): ₹ ${Math.round(gstAmount).toLocaleString('en-IN')}

*GRAND TOTAL (Incl GST): ₹ ${this.getCombinedGrandTotal().toLocaleString('en-IN')}*

Thank you for your business!`;

    const encoded = encodeURIComponent(message);
    const url = number
      ? `https://wa.me/91${number}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  }
}