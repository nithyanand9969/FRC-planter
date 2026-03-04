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
  customerAddress: string = '';
customerCity: string = '';
customerState: string = '';
customerGST: string = '';

  // ===============================
  // INPUTS
  // ===============================

  dimensions = {
    topDia: 0,
    height: 0,
    quantity: 0
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
  // UNIT CONVERSION HELPERS
  // ===============================

  convertToInches(value: number, unit: string): number {
    if (!value) return 0;
    switch (unit) {
      case 'cm': return value / 2.54;
      case 'mm': return value / 25.4;
      default: return value;
    }
  }

  // ===============================
  // EXACT EXCEL FORMULAS WITH 22/7
  // ===============================

  calculateAll() {
    const D = this.convertToInches(Number(this.dimensions.topDia) || 0, this.unit);
    const H = this.convertToInches(Number(this.dimensions.height) || 0, this.unit);
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
      unit: 'inch',
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
    // Use calculator's own unit for conversion
    const unit = calc.unit || 'inch';
    
    // Convert values to inches based on calculator's unit
    const D = this.convertToInches(calc.topDia || 0, unit);
    const H = this.convertToInches(calc.height || 0, unit);
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

  // ===============================
  // EXTRA CALCULATOR RATE METHODS
  // ===============================

  getExtraFrpRate(calc: any): number {
    if (!calc.rawTotalSqft) return 0;
    return (calc.rawTotalSqft * 321) + calc.rawDieCostPerPcs;
  }

  getExtraRate25(calc: any): number {
    if (!calc.rawTotalSqft) return 0;
    return this.getExtraFrpRate(calc) + (calc.rawTotalSqft * 100);
  }

  getExtraRate35(calc: any): number {
    if (!calc.rawTotalSqft) return 0;
    return this.getExtraFrpRate(calc) + (calc.rawTotalSqft * 150);
  }

  getExtraRate5(calc: any): number {
    if (!calc.rawTotalSqft) return 0;
    return this.getExtraFrpRate(calc) + (calc.rawTotalSqft * 250);
  }

  getThicknessRateForCalculator(calc: any, thickness: number): number {
    if (!calc.rawTotalSqft) return 0;
    
    switch (thickness) {
      case 2.5:
        return Math.round(this.getExtraRate25(calc));
      case 3.5:
        return Math.round(this.getExtraRate35(calc));
      case 5.0:
        return Math.round(this.getExtraRate5(calc));
      default: // 1.5
        return Math.round(this.getExtraFrpRate(calc));
    }
  }

  getExtraRate(calc: any): number {
    return this.getThicknessRateForCalculator(calc, calc.selectedThickness);
  }

  getExtraRawRate(calc: any): number {
    if (!calc.rawTotalSqft) return 0;
    
    const base = this.getExtraFrpRate(calc);
    
    if (calc.selectedThickness === 2.5)
      return base + (calc.rawTotalSqft * 100);
    else if (calc.selectedThickness === 3.5)
      return base + (calc.rawTotalSqft * 150);
    else if (calc.selectedThickness === 5.0)
      return base + (calc.rawTotalSqft * 250);
    else
      return base;
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

 // ===============================
// PDF GENERATION - Professional Invoice Format
// ===============================

generatePDF() {

  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  }).replace(/ /g, '-');

  let y = 15;

  // ===============================
  // HEADER
  // ===============================

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SAIRAJ FRP GARDENS PRIVATE LIMITED', 105, y, { align: 'center' });

  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('H No 2699, Gala No. 8 & 9, Rajlaxmi Sulzer Park, Sonale, Bhiwandi - 421302', 105, y, { align: 'center' });

  y += 4;
  doc.text('GSTIN: 27ABMCS9351E1ZY | State: Maharashtra (27)', 105, y, { align: 'center' });

  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 105, y, { align: 'center' });

  y += 10;

  // ===============================
  // CUSTOMER DETAILS
  // ===============================

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');

  doc.text(this.customerName || '', 14, y); y += 5;
  doc.text(this.customerAddress || '', 14, y); y += 5;
  doc.text(this.customerCity || '', 14, y); y += 5;
  doc.text(this.customerState || '', 14, y); y += 5;

  if (this.customerGST) {
    doc.text(`GSTIN: ${this.customerGST}`, 14, y);
    y += 5;
  }

  y += 8;

  // ===============================
  // TABLE BORDER
  // ===============================

  const tableStartY = y;

  doc.rect(14, y, 186, 70); // outer box

  // column lines
  doc.line(25, y, 25, y + 70);
  doc.line(120, y, 120, y + 70);
  doc.line(145, y, 145, y + 70);
  doc.line(170, y, 170, y + 70);

  y += 6;

  // Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Sl', 16, y);
  doc.text('Description of Goods and Services', 28, y);
  doc.text('Qty', 125, y);
  doc.text('Rate', 150, y);
  doc.text('Amount', 175, y);

  y += 4;
  doc.line(14, y, 200, y);
  y += 6;

  doc.setFont('helvetica', 'normal');

  let itemNo = 1;

  // ===============================
  // MAIN PRODUCT
  // ===============================

  const ratePerPiece = this.getSelectedRate();
  const mainTotal = this.getMainPlanterTotal();

  doc.text(String(itemNo), 16, y);
  doc.text(
    `Customize Size (Dia ${this.dimensions.topDia} x H ${this.dimensions.height} ${this.unit})`,
    28,
    y
  );
  doc.text(`${this.dimensions.quantity} PCS`, 125, y);
  doc.text(ratePerPiece.toLocaleString('en-IN'), 150, y);
  doc.text(mainTotal.toLocaleString('en-IN'), 175, y);

  y += 6;
  itemNo++;

  // ===============================
  // MOULD CHARGE
  // ===============================

  const mouldCost = Math.round(this.calculated.rawDieCost);

  if (mouldCost > 0) {
    doc.text(String(itemNo), 16, y);
    doc.text('Mould Charge', 28, y);
    doc.text('1 Set', 125, y);
    doc.text(mouldCost.toLocaleString('en-IN'), 150, y);
    doc.text(mouldCost.toLocaleString('en-IN'), 175, y);
    y += 6;
  }

  // ===============================
  // TOTALS INSIDE TABLE
  // ===============================

  const subtotal = mainTotal + mouldCost;
  const gstAmount = Math.round(subtotal * this.gstPercent / 100);
  const cgst = Math.round(gstAmount / 2);
  const sgst = Math.round(gstAmount / 2);
  const grandTotal = subtotal + gstAmount;

  y += 5;

  doc.setFont('helvetica', 'bold');

  doc.text(`CGST OUTWARD @ ${this.gstPercent/2}%`, 28, y);
  doc.text(cgst.toLocaleString('en-IN'), 175, y);

  y += 6;

  doc.text(`SGST OUTWARD @ ${this.gstPercent/2}%`, 28, y);
  doc.text(sgst.toLocaleString('en-IN'), 175, y);

  y += 6;

  doc.line(14, y, 200, y);
  y += 6;

  doc.text('Total', 150, y);
  doc.text(`₹ ${grandTotal.toLocaleString('en-IN')}`, 175, y);

  // ===============================
  // AMOUNT IN WORDS
  // ===============================

  y = tableStartY + 75;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text('Amount Chargeable (in words)', 14, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text(`INR ${this.numberToWords(grandTotal)} Only`, 14, y);

  // ===============================
  // PAN + DECLARATION
  // ===============================

  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.text("Company's PAN :", 14, y);
  doc.setFont('helvetica', 'bold');
  doc.text("ABMCS9351E", 50, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text("Declaration:", 14, y);
  y += 4;
  doc.text("1- Transport Extra as Below Porter", 14, y);
  y += 4;
  doc.text("2- Advance 50% Confirm Order and 50% at Final Delivery", 14, y);
  y += 4;
  doc.text("3- Mould Life 40 pcs", 14, y);
y += 4;
doc.text("Note: This Quotation is valid for 30 days only.", 14, y);
  // ===============================
  // BANK DETAILS RIGHT SIDE
  // ===============================

  let rightY = tableStartY + 90;

  doc.setFont('helvetica', 'bold');
  doc.text("Company's Bank Details", 120, rightY);

  rightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text("Bank Name : Union Bank of India", 120, rightY);
  rightY += 4;
  doc.text("A/c No. : 307821318590006", 120, rightY);
  rightY += 4;
  doc.text("Branch & IFS Code : UBIN0390784", 120, rightY);

  // Signature box
  rightY += 10;
  doc.rect(120, rightY, 75, 18);
  doc.setFont('helvetica', 'bold');
  doc.text("for SAIRAJ FRP GARDENS PRIVATE LIMITED", 122, rightY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text("Authorised Signatory", 150, rightY + 14);

  // Footer
  doc.setFontSize(8);
  doc.text("This is a Computer Generated Document", 105, 285, { align: 'center' });

  doc.save('SAIRAJ_FRP_GARDENS_PRIVATE_LIMITED_Round_Planter_Quotation.pdf');
}

// ===============================
// HELPER FUNCTION - Convert Number to Words
// ===============================

numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const convert = (n: number): string => {
    if (n === 0) return '';
    
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;

    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim();
  };

  return convert(Math.round(num));
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
        message += `Planter ${i + 1}: Dia ${calc.topDia} ${calc.unit || 'inch'}, Ht ${calc.height} ${calc.unit || 'inch'}, Qty ${calc.qty}\n`;
        message += `Total Sqft: ${calc.rawTotalSqft.toFixed(6)}\n`;
        message += `Die Cost: ₹ ${calc.rawDieCost.toFixed(2)}\n`;
        message += `Die Cost/PCS: ₹ ${calc.rawDieCostPerPcs.toFixed(6)}\n`;
        message += `FRP Rate: ₹ ${this.getExtraFrpRate(calc).toFixed(6)}\n`;
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