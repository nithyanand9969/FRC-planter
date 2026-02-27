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
    topDia: 18,
    height: 0,
    quantity: 10
  };

  // ===============================
  // CALCULATED VALUES (Store raw values)
  // ===============================

  calculated = {
    topCircle: 0,
    totalSqft: 0,
    dieCost: 0,
    dieCostPerPcs: 0,
    // Raw values for accurate calculations
    rawTotalSqft: 0,
    rawDieCost: 0,
    rawDieCostPerPcs: 0
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
  // EXACT EXCEL FORMULAS WITH 22/7
  // ===============================

  calculateAll() {
    const D = this.convertToInches(Number(this.dimensions.topDia) || 0);
    const H = this.convertToInches(Number(this.dimensions.height) || 0);
    const Q = Number(this.dimensions.quantity) || 1;

    if (D <= 0 || H <= 0) {
      this.resetCalculations();
      return;
    }

    const circumference = (22/7) * D;
    this.calculated.topCircle = Math.round(circumference * 100) / 100;

    const area = (circumference * H) / 144;
    this.calculated.rawTotalSqft = area;
    this.calculated.totalSqft = Math.round(area * 100) / 100;

    const die = area * 2140;
    this.calculated.rawDieCost = die;
    this.calculated.dieCost = Math.round(die);

    const diePerPcs = die / Q;
    this.calculated.rawDieCostPerPcs = diePerPcs;
    this.calculated.dieCostPerPcs = Math.round(diePerPcs);
  }

  resetCalculations() {
    this.calculated.topCircle = 0;
    this.calculated.totalSqft = 0;
    this.calculated.dieCost = 0;
    this.calculated.dieCostPerPcs = 0;
    this.calculated.rawTotalSqft = 0;
    this.calculated.rawDieCost = 0;
    this.calculated.rawDieCostPerPcs = 0;
  }

  // ===============================
  // RATE CALCULATIONS
  // ===============================

  getFrpRate(): number {
    return (this.calculated.rawTotalSqft * 321) + this.calculated.rawDieCostPerPcs;
  }

  getRate25(): number {
    return this.getFrpRate() + (this.calculated.rawTotalSqft * 100);
  }

  getRate35(): number {
    return this.getFrpRate() + (this.calculated.rawTotalSqft * 150);
  }

  getRate5(): number {
    return this.getFrpRate() + (this.calculated.rawTotalSqft * 250);
  }

  // ===============================
  // GET RATE FOR DISPLAY
  // ===============================

  getDisplayRate(thickness: number): number {
    switch (thickness) {
      case 2.5: return Math.round(this.getRate25());
      case 3.5: return Math.round(this.getRate35());
      case 5.0: return Math.round(this.getRate5());
      default: return Math.round(this.getFrpRate());
    }
  }

  getRawRate(thickness: number): number {
    switch (thickness) {
      case 2.5: return this.getRate25();
      case 3.5: return this.getRate35();
      case 5.0: return this.getRate5();
      default: return this.getFrpRate();
    }
  }

  // ===============================
  // SELECTED RATE
  // ===============================

  getSelectedRate(): number {
    return this.getDisplayRate(this.selectedThickness);
  }

  getSelectedRawRate(): number {
    return this.getRawRate(this.selectedThickness);
  }

  // ===============================
  // GST CALCULATIONS
  // ===============================

  getSubtotal(): number {
    return this.getSelectedRawRate() * (this.dimensions.quantity || 1);
  }

  getGstAmount(): number {
    return (this.getSubtotal() * (this.gstPercent || 0)) / 100;
  }

  getGrandTotal(): number {
    return Math.round(this.getSubtotal() + this.getGstAmount());
  }

  // ===============================
  // MAIN PLANTER TOTAL
  // ===============================

  getMainPlanterTotal(): number {
    return Math.round(this.getSelectedRawRate() * (this.dimensions.quantity || 1));
  }

  // ===============================
  // CLEAR MAIN FORM
  // ===============================

  clearMainForm() {
    this.dimensions = {
      topDia: 0,
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
      topDia: 0,
      height: 0,
      qty: 1,
      selectedThickness: 1.5,
      topCircle: 0,
      totalSqft: 0,
      dieCost: 0,
      dieCostPerPcs: 0,
      rawTotalSqft: 0,
      rawDieCost: 0,
      rawDieCostPerPcs: 0
    });
  }

  removeCalculator(index: number) {
    this.extraCalculators.splice(index, 1);
  }

  calculateExtra(calc: any) {
    const D = calc.topDia || 0;
    const H = calc.height || 0;
    const Q = calc.qty || 1;

    if (D > 0 && H > 0) {
      const circumference = (22/7) * D;
      const area = (circumference * H) / 144;
      const die = area * 2140;

      calc.topCircle = Math.round(circumference * 100) / 100;
      calc.totalSqft = Math.round(area * 100) / 100;
      calc.rawTotalSqft = area;
      
      calc.rawDieCost = die;
      calc.dieCost = Math.round(die);
      
      calc.rawDieCostPerPcs = die / Q;
      calc.dieCostPerPcs = Math.round(die / Q);
    } else {
      calc.topCircle = 0;
      calc.totalSqft = 0;
      calc.dieCost = 0;
      calc.dieCostPerPcs = 0;
      calc.rawTotalSqft = 0;
      calc.rawDieCost = 0;
      calc.rawDieCostPerPcs = 0;
    }
  }

  getExtraRate(calc: any): number {
    if (!calc.rawTotalSqft) return 0;
    
    const base = (calc.rawTotalSqft * 321) + calc.rawDieCostPerPcs;
    let final = base;

    if (calc.selectedThickness === 2.5)
      final += calc.rawTotalSqft * 100;
    else if (calc.selectedThickness === 3.5)
      final += calc.rawTotalSqft * 150;
    else if (calc.selectedThickness === 5.0)
      final += calc.rawTotalSqft * 250;

    return Math.round(final);
  }

  getExtraRawRate(calc: any): number {
    if (!calc.rawTotalSqft) return 0;
    
    const base = (calc.rawTotalSqft * 321) + calc.rawDieCostPerPcs;
    let final = base;

    if (calc.selectedThickness === 2.5)
      final += calc.rawTotalSqft * 100;
    else if (calc.selectedThickness === 3.5)
      final += calc.rawTotalSqft * 150;
    else if (calc.selectedThickness === 5.0)
      final += calc.rawTotalSqft * 250;

    return final;
  }

  getExtraGrandTotal(calc: any): number {
    return Math.round(this.getExtraRawRate(calc) * (calc.qty || 1));
  }

  // ===============================
  // GET ALL ADDITIONAL PLANTERS TOTAL
  // ===============================

  getAllAdditionalTotal(): number {
    let total = 0;
    for (let calc of this.extraCalculators) {
      total += this.getExtraGrandTotal(calc);
    }
    return Math.round(total);
  }

  // ===============================
  // GET COMBINED GRAND TOTAL
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

  // ===============================
  // LOGOUT
  // ===============================

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
    doc.setFontSize(12);
    doc.text('MAIN PLANTER:', 10, y);
    
    y += 8;
    doc.setFontSize(10);
    doc.text(`Top Dia: ${this.dimensions.topDia} ${this.unit}`, 15, y);
    y += 6;
    doc.text(`Height: ${this.dimensions.height} ${this.unit}`, 15, y);
    y += 6;
    doc.text(`Quantity: ${this.dimensions.quantity}`, 15, y);
    y += 6;
    doc.text(`Top Circle: ${this.calculated.topCircle.toFixed(2)}`, 15, y);
    y += 6;
    doc.text(`Total Sqft: ${this.calculated.rawTotalSqft.toFixed(6)}`, 15, y);
    y += 6;
    doc.text(`Die Cost: ₹ ${this.calculated.rawDieCost.toFixed(2)}`, 15, y);
    y += 6;
    doc.text(`Die Cost/PCS: ₹ ${this.calculated.rawDieCostPerPcs.toFixed(6)}`, 15, y);
    y += 6;
    doc.text(`Selected Thickness: ${this.selectedThickness} mm`, 15, y);
    y += 6;
    doc.text(`FRP Rate (1.5mm): ₹ ${this.getFrpRate().toFixed(6)}`, 15, y);
    y += 6;
    doc.text(`2.5mm Rate: ₹ ${this.getRate25().toFixed(6)}`, 15, y);
    y += 6;
    doc.text(`3.5mm Rate: ₹ ${this.getRate35().toFixed(6)}`, 15, y);
    y += 6;
    doc.text(`5mm Rate: ₹ ${this.getRate5().toFixed(6)}`, 15, y);
    y += 6;
    doc.text(`Per Piece Rate (Rounded): ₹ ${this.getSelectedRate().toLocaleString('en-IN')}`, 15, y);
    y += 6;
    doc.text(`Main Planter Total: ₹ ${this.getMainPlanterTotal().toLocaleString('en-IN')}`, 15, y);
    
    if (this.extraCalculators.length > 0) {
      y += 10;
      doc.setFontSize(12);
      doc.text('ADDITIONAL PLANTERS:', 10, y);
      
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        y += 8;
        doc.setFontSize(10);
        doc.text(`Planter ${i + 1}: Dia ${calc.topDia}", Ht ${calc.height}", Qty ${calc.qty}`, 15, y);
        y += 6;
        doc.text(`Total Sqft: ${calc.rawTotalSqft.toFixed(6)}`, 20, y);
        y += 6;
        doc.text(`Die Cost: ₹ ${calc.rawDieCost.toFixed(2)}`, 20, y);
        y += 6;
        doc.text(`Die Cost/PCS: ₹ ${calc.rawDieCostPerPcs.toFixed(6)}`, 20, y);
        y += 6;
        doc.text(`Rate: ₹ ${this.getExtraRawRate(calc).toFixed(6)}`, 20, y);
        y += 6;
        doc.text(`Total (Rounded): ₹ ${this.getExtraGrandTotal(calc).toLocaleString('en-IN')}`, 20, y);
      }
    }

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

    doc.save('Round_Planter_Quotation.pdf');
  }

  // ===============================
  // WHATSAPP SHARE
  // ===============================

  shareOnWhatsApp() {
    const number = this.phoneNumber.replace(/\D/g, '');

    let message = `*${this.companyName}*

*ROUND PLANTER QUOTATION*

*Customer:* ${this.customerName}
*Project:* ${this.projectName}

*MAIN PLANTER:*
Top Dia: ${this.dimensions.topDia} ${this.unit}
Height: ${this.dimensions.height} ${this.unit}
Qty: ${this.dimensions.quantity}

*EXACT CALCULATIONS:*
Top Circle: ${this.calculated.topCircle.toFixed(2)}
Total Sqft: ${this.calculated.rawTotalSqft.toFixed(6)}
Die Cost: ₹ ${this.calculated.rawDieCost.toFixed(2)}
Die Cost/PCS: ₹ ${this.calculated.rawDieCostPerPcs.toFixed(6)}

*RATES (Exact):*
1.5mm (FRP): ₹ ${this.getFrpRate().toFixed(6)}
2.5mm: ₹ ${this.getRate25().toFixed(6)}
3.5mm: ₹ ${this.getRate35().toFixed(6)}
5mm: ₹ ${this.getRate5().toFixed(6)}

*RATES (Rounded):*
Selected Thickness: ${this.selectedThickness} mm
Per Piece Rate: ₹ ${this.getSelectedRate().toLocaleString('en-IN')}
Subtotal: ₹ ${this.getMainPlanterTotal().toLocaleString('en-IN')}
`;

    if (this.extraCalculators.length > 0) {
      message += `\n*ADDITIONAL PLANTERS:*\n`;
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        message += `Planter ${i + 1}: Dia ${calc.topDia}", Ht ${calc.height}", Qty ${calc.qty}\n`;
        message += `Total Sqft: ${calc.rawTotalSqft.toFixed(6)}\n`;
        message += `Die Cost: ₹ ${calc.rawDieCost.toFixed(2)}\n`;
        message += `Die Cost/PCS: ₹ ${calc.rawDieCostPerPcs.toFixed(6)}\n`;
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