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

  convertToInches(value: number, unit: string): number {
    if (!value || isNaN(value)) return 0;

    switch (unit) {
      case 'cm': 
        return Number((value / 2.54).toFixed(4));
      case 'mm': 
        return Number((value / 25.4).toFixed(4));
      default: // 'inch'
        return Number(value.toFixed(4));
    }
  }

  // ===============================
  // MAIN CALCULATION
  // ===============================

  calculateAll() {
    const { length, width, height, quantity } = this.dimensions;

    const L = this.convertToInches(length || 0, this.unit);
    const W = this.convertToInches(width || 0, this.unit);
    const H = this.convertToInches(height || 0, this.unit);

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
      unit: 'inch',
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

  // ===============================
// HELPER FUNCTION - NUMBER TO WORDS
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
  calculateExtra(calc: any) {
    // Use calc.unit for conversion with proper decimal handling
    const L = this.convertToInches(calc.length || 0, calc.unit || 'inch');
    const W = this.convertToInches(calc.width || 0, calc.unit || 'inch');
    const H = this.convertToInches(calc.height || 0, calc.unit || 'inch');
    const Q = calc.qty || 1;

    if (L > 0 && W > 0 && H > 0) {
      const perimeter = 2 * (L + W);
      const fourSide = (perimeter * H) / 144;
      const bottom = (L * W) / 144;
      const totalSqft = fourSide + bottom;
      
      // Calculate die cost per piece (total die cost divided by quantity)
      const dieCostPerPcs = (totalSqft * 1070) / Q;
      
      // Calculate base material cost per piece (without die)
      const baseMaterialPerPcs = (totalSqft * 321);
      
      // Calculate thickness premium based on selected thickness
      let thicknessPremium = 0;
      if (calc.selectedThickness === 2.5) {
        thicknessPremium = totalSqft * 100;
      } else if (calc.selectedThickness === 3.5) {
        thicknessPremium = totalSqft * 150;
      } else if (calc.selectedThickness === 5.0) {
        thicknessPremium = totalSqft * 250;
      }
      // For 1.5mm, thicknessPremium remains 0
      
      // Total material cost per piece (base material + thickness premium + die cost per piece)
      const totalMaterialPerPcs = baseMaterialPerPcs + thicknessPremium + dieCostPerPcs;

      calc.fourSide = parseFloat(fourSide.toFixed(2));
      calc.bottom = parseFloat(bottom.toFixed(2));
      calc.totalSqft = parseFloat(totalSqft.toFixed(2));
      calc.dieCostPerPcs = Math.round(dieCostPerPcs);
      calc.materialCost = Math.round(totalMaterialPerPcs);
      
    } else {
      calc.fourSide = 0;
      calc.bottom = 0;
      calc.totalSqft = 0;
      calc.dieCostPerPcs = 0;
      calc.materialCost = 0;
    }
  }

  getExtraRate(calc: any): number {
    if (!calc.totalSqft || calc.totalSqft === 0) return 0;
    
    // Base material cost (without die)
    const baseMaterial = calc.totalSqft * 321;
    
    // Thickness premium based on selected thickness
    let thicknessPremium = 0;
    if (calc.selectedThickness === 2.5) {
      thicknessPremium = calc.totalSqft * 100;
    } else if (calc.selectedThickness === 3.5) {
      thicknessPremium = calc.totalSqft * 150;
    } else if (calc.selectedThickness === 5.0) {
      thicknessPremium = calc.totalSqft * 250;
    }
    // For 1.5mm, thicknessPremium remains 0
    
    // Total = base material + thickness premium + die cost per piece
    const total = baseMaterial + thicknessPremium + (calc.dieCostPerPcs || 0);
    
    return Math.round(total);
  }

  // NEW METHOD: Get rate for a specific thickness option in additional calculators
  getThicknessRateForCalculator(calc: any, thickness: number): number {
    if (!calc.totalSqft || calc.totalSqft === 0) return 0;
    
    // Base material cost (without die)
    const baseMaterial = calc.totalSqft * 321;
    
    // Thickness premium based on the thickness parameter, not calc.selectedThickness
    let thicknessPremium = 0;
    if (thickness === 2.5) {
      thicknessPremium = calc.totalSqft * 100;
    } else if (thickness === 3.5) {
      thicknessPremium = calc.totalSqft * 150;
    } else if (thickness === 5.0) {
      thicknessPremium = calc.totalSqft * 250;
    }
    // For 1.5mm, thicknessPremium remains 0
    
    // Total = base material + thickness premium + die cost per piece
    const total = baseMaterial + thicknessPremium + (calc.dieCostPerPcs || 0);
    
    return Math.round(total);
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

  doc.text(this.customerName || '', 14, y);
  y += 5;
  doc.text(`Project: ${this.projectName}`, 14, y);
  y += 5;
  doc.text(`Phone: ${this.phoneNumber}`, 14, y);

  y += 10;

  // ===============================
  // TABLE STRUCTURE
  // ===============================

  const tableStartY = y;

  doc.rect(14, y, 186, 70);

  doc.line(25, y, 25, y + 70);
  doc.line(120, y, 120, y + 70);
  doc.line(145, y, 145, y + 70);
  doc.line(170, y, 170, y + 70);

  y += 6;

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
    `Customize Size (L ${this.dimensions.length} x W ${this.dimensions.width} x H ${this.dimensions.height} ${this.unit})`,
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

  const mouldCost = Math.round(this.calculated.totalSqft * 1070);

  if (mouldCost > 0) {

    doc.text(String(itemNo), 16, y);
    doc.text('Mould Charge', 28, y);
    doc.text('1 Set', 125, y);
    doc.text(mouldCost.toLocaleString('en-IN'), 150, y);
    doc.text(mouldCost.toLocaleString('en-IN'), 175, y);

    y += 6;
  }

  // ===============================
  // TOTALS
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
  // DECLARATION
  // ===============================

  y = tableStartY + 75;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text('Amount Chargeable (in words)', 14, y);

  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text(`INR ${this.numberToWords(grandTotal)} Only`, 14, y);

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
  // BANK DETAILS
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

  rightY += 10;

  doc.rect(120, rightY, 75, 18);

  doc.setFont('helvetica', 'bold');
  doc.text("for SAIRAJ FRP GARDENS PRIVATE LIMITED", 122, rightY + 6);

  doc.setFont('helvetica', 'normal');
  doc.text("Authorised Signatory", 150, rightY + 14);

  doc.setFontSize(8);
  doc.text("This is a Computer Generated Document", 105, 285, { align: 'center' });

  doc.save('SAIRAJ_FRP_Square_Planter_Quotation.pdf');
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
        message += `Planter ${i + 1}: L ${calc.length} ${calc.unit}, W ${calc.width} ${calc.unit}, H ${calc.height} ${calc.unit}, Qty ${calc.qty}\n`;
        message += `Selected Thickness: ${calc.selectedThickness} mm\n`;
        message += `Die Cost/Pc: ₹ ${calc.dieCostPerPcs?.toLocaleString('en-IN') || 0}\n`;
        message += `Material Cost/Pc: ₹ ${calc.materialCost?.toLocaleString('en-IN') || 0}\n`;
        message += `Total: ₹ ${this.getExtraGrandTotal(calc).toLocaleString('en-IN')}\n\n`;
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