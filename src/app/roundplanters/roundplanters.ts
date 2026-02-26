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
  }

  // ===============================
  // UNIT CONVERSION (if needed)
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
  // EXACT EXCEL FORMULAS
  // ===============================

  calculateAll() {
    // Get values and convert to inches if needed
    const D = this.convertToInches(Number(this.dimensions.topDia) || 0);
    const H = this.convertToInches(Number(this.dimensions.height) || 0);
    const Q = Number(this.dimensions.quantity) || 1;

    if (D <= 0 || H <= 0) {
      this.resetCalculations();
      return;
    }

    // FORMULA 1: TOP CIRCLE = π × Diameter
    // Excel: =PI()*[Top Dia]
    const circumference = Math.PI * D;
    this.calculated.topCircle = parseFloat(circumference.toFixed(2));

    // FORMULA 2: TOTAL SQFT = (π × Diameter × Height) ÷ 144
    // Excel: =(PI()*[Top Dia]*[Height])/144
    const area = (Math.PI * D * H) / 144;
    this.calculated.totalSqft = parseFloat(area.toFixed(2));

    // FORMULA 3: DIE COST = Total Sqft × 2140
    // Excel: =[Total Sqft]*2140
    const die = area * 2140;
    this.calculated.dieCost = Math.round(die);

    // FORMULA 4: DIE COST PER PIECE = Die Cost ÷ Quantity
    // Excel: =[Die Cost]/[Quantity]
    this.calculated.dieCostPerPcs = Q > 0 ? Math.round(die / Q) : 0;
  }

  resetCalculations() {
    this.calculated.topCircle = 0;
    this.calculated.totalSqft = 0;
    this.calculated.dieCost = 0;
    this.calculated.dieCostPerPcs = 0;
  }

  // ===============================
  // RATE CALCULATIONS
  // ===============================

  // FORMULA 5: BASE FRP RATE = (Total Sqft × 321) + Die Cost Per Piece
  // Excel: =([Total Sqft]*321)+[Die Cost Per Piece]
  getFrpRate(): number {
    return (this.calculated.totalSqft * 321) + this.calculated.dieCostPerPcs;
  }

  // FORMULA 6: 2.5mm RATE = FRP Rate + (Total Sqft × 100)
  // Excel: =[FRP Rate]+([Total Sqft]*100)
  getRate25(): number {
    return this.getFrpRate() + (this.calculated.totalSqft * 100);
  }

  // FORMULA 7: 3.5mm RATE = FRP Rate + (Total Sqft × 150)
  // Excel: =[FRP Rate]+([Total Sqft]*150)
  getRate35(): number {
    return this.getFrpRate() + (this.calculated.totalSqft * 150);
  }

  // FORMULA 8: 5mm RATE = FRP Rate + (Total Sqft × 250)
  // Excel: =[FRP Rate]+([Total Sqft]*250)
  getRate5(): number {
    return this.getFrpRate() + (this.calculated.totalSqft * 250);
  }

  // ===============================
  // GET RATE FOR DISPLAY
  // ===============================

  getDisplayRate(thickness: number): number {
    // Round to nearest whole number for display
    switch (thickness) {
      case 2.5: return Math.round(this.getRate25());
      case 3.5: return Math.round(this.getRate35());
      case 5.0: return Math.round(this.getRate5());
      default: return Math.round(this.getFrpRate());
    }
  }

  // ===============================
  // SELECTED RATE
  // ===============================

  getSelectedRate(): number {
    return this.getDisplayRate(this.selectedThickness);
  }

  // ===============================
  // GST CALCULATIONS
  // ===============================

  // FORMULA 9: SUBTOTAL = Selected Rate × Quantity
  // Excel: =[Selected Rate]*[Quantity]
  getSubtotal(): number {
    return this.getSelectedRate() * (this.dimensions.quantity || 1);
  }

  // FORMULA 10: GST AMOUNT = Subtotal × (GST% ÷ 100)
  // Excel: =[Subtotal]*([GST%]/100)
  getGstAmount(): number {
    return (this.getSubtotal() * (this.gstPercent || 0)) / 100;
  }

  // FORMULA 11: GRAND TOTAL = Subtotal + GST Amount
  // Excel: =[Subtotal]+[GST Amount]
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
      topDia: 0,
      height: 0,
      quantity: 1
    };
    this.selectedThickness = 1.5;
    this.gstPercent = 18;
    this.calculateAll();
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
  // ADDITIONAL CALCULATORS
  // ===============================

  extraCalculators: any[] = [];

  addNewCalculator() {
    this.extraCalculators.push({
      topDia: 0,
      height: 0,
      qty: 1,
      selectedThickness: 1.5,
      totalSqft: 0,
      dieCostPerPcs: 0,
      topCircle: 0
    });
  }

  removeCalculator(index: number) {
    this.extraCalculators.splice(index, 1);
  }

  // ===============================
  // CALCULATE EXTRA (Same Excel formulas)
  // ===============================

  calculateExtra(calc: any) {
    const D = calc.topDia || 0;
    const H = calc.height || 0;
    const Q = calc.qty || 1;

    if (D > 0 && H > 0) {
      // Same Excel formulas as main calculator
      const circumference = Math.PI * D;
      const area = (Math.PI * D * H) / 144;
      const die = area * 2140;

      calc.topCircle = parseFloat(circumference.toFixed(2));
      calc.totalSqft = parseFloat(area.toFixed(2));
      calc.dieCostPerPcs = Q > 0 ? Math.round(die / Q) : 0;
    } else {
      calc.topCircle = 0;
      calc.totalSqft = 0;
      calc.dieCostPerPcs = 0;
    }
  }

  // ===============================
  // GET EXTRA RATE (Same Excel formulas)
  // ===============================

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

  // ===============================
  // GET EXTRA GRAND TOTAL
  // ===============================

  getExtraGrandTotal(calc: any): number {
    return this.getExtraRate(calc) * (calc.qty || 1);
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
    doc.text(`Top Dia: ${this.dimensions.topDia} ${this.unit}`, 10, y);
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
    doc.text(`Main Planter Total: ₹ ${this.getMainPlanterTotal()}`, 10, y);
    
    if (this.extraCalculators.length > 0) {
      y += 10;
      doc.text('Additional Planters:', 10, y);
      
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        y += 8;
        doc.text(`Planter ${i + 1}: Dia ${calc.topDia}", Ht ${calc.height}", Qty ${calc.qty}`, 15, y);
        y += 6;
        doc.text(`Total: ₹ ${this.getExtraGrandTotal(calc)}`, 20, y);
      }
    }

    y += 10;
    doc.text(`Grand Total (Incl GST): ₹ ${Math.round(this.getGrandTotal())}`, 10, y);

    doc.save('Round_Planter_Quotation.pdf');
  }

  // ===============================
  // WHATSAPP SHARE
  // ===============================

  shareOnWhatsApp() {
    const number = this.phoneNumber.replace(/\D/g, '');

    let message = `
${this.companyName}

ROUND PLANTER QUOTATION

Customer: ${this.customerName}
Project: ${this.projectName}

MAIN PLANTER:
Top Dia: ${this.dimensions.topDia} ${this.unit}
Height: ${this.dimensions.height} ${this.unit}
Qty: ${this.dimensions.quantity}
Total Sqft: ${this.calculated.totalSqft.toFixed(2)}
Selected Thickness: ${this.selectedThickness} mm
Per Piece Rate: ₹ ${this.getSelectedRate()}
Subtotal: ₹ ${this.getMainPlanterTotal()}
`;

    if (this.extraCalculators.length > 0) {
      message += `\nADDITIONAL PLANTERS:\n`;
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        message += `Planter ${i + 1}: Dia ${calc.topDia}", Ht ${calc.height}", Qty ${calc.qty} - ₹ ${this.getExtraGrandTotal(calc)}\n`;
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