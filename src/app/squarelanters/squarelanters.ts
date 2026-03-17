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
  customerAddress: string = '';
  customerCity: string = '';
  customerState: string = '';
  customerGST: string = '';
  
  // Single GST for all planters
  gstPercent = 18;
  
  // Commission for main planter
  commission: number = 0;

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
    const Q = quantity || 1;

    if (L > 0 && W > 0 && H > 0) {
      const perimeter = 2 * (L + W);
      const fourSide = (perimeter * H) / 144;
      const bottom = (L * W) / 144;
      const totalSqft = fourSide + bottom;
      
      // Store raw values
      this.calculated.rawTotalSqft = totalSqft;
      
      const die = totalSqft * 1070;
      this.calculated.rawDieCost = die;
      this.calculated.rawDieCostPerPcs = die / Q;
      
      // Rounded values for display
      this.calculated.fourSide = parseFloat(fourSide.toFixed(2));
      this.calculated.bottom = parseFloat(bottom.toFixed(2));
      this.calculated.totalSqft = parseFloat(totalSqft.toFixed(2));
      this.calculated.dieCost = Math.round(die);
      this.calculated.dieCostPerPcs = Q > 0 ? Math.round(die / Q) : 0;
    } else {
      this.resetCalculations();
    }
  }

  resetCalculations() {
    this.calculated.fourSide = 0;
    this.calculated.bottom = 0;
    this.calculated.totalSqft = 0;
    this.calculated.dieCost = 0;
    this.calculated.dieCostPerPcs = 0;
    this.calculated.rawTotalSqft = 0;
    this.calculated.rawDieCost = 0;
    this.calculated.rawDieCostPerPcs = 0;
  }

  // ===============================
  // RATE CALCULATIONS (ALL IN INR ₹)
  // ===============================

  getFrp15Rate(): number {
    return (this.calculated.rawTotalSqft * 321) + this.calculated.rawDieCostPerPcs;
  }

  getThickness25Rate(): number {
    return this.getFrp15Rate() + (this.calculated.rawTotalSqft * 100);
  }

  getThickness35Rate(): number {
    return this.getFrp15Rate() + (this.calculated.rawTotalSqft * 150);
  }

  getThickness5Rate(): number {
    return this.getFrp15Rate() + (this.calculated.rawTotalSqft * 250);
  }

  // ===============================
  // DISPLAY RATE
  // ===============================

  getDisplayRate(thickness: number): number {
    switch (thickness) {
      case 2.5: return Math.round(this.getThickness25Rate());
      case 3.5: return Math.round(this.getThickness35Rate());
      case 5.0: return Math.round(this.getThickness5Rate());
      default: return Math.round(this.getFrp15Rate());
    }
  }

  getRawRate(thickness: number): number {
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

  getSelectedRawRate(): number {
    return this.getRawRate(this.selectedThickness);
  }

  // ===============================
  // MAIN PLANTER TOTALS WITH COMMISSION
  // ===============================

  getMainPlanterSubtotal(): number {
    return Math.round(this.getSelectedRawRate() * (this.dimensions.quantity || 1));
  }

  getMainPlanterCommission(): number {
    return (this.getMainPlanterSubtotal() * (this.commission || 0)) / 100;
  }

  getMainPlanterTotal(): number {
    return Math.round(this.getMainPlanterSubtotal() + this.getMainPlanterCommission());
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
    this.commission = 0;
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
      commission: 0,
      fourSide: 0,
      bottom: 0,
      totalSqft: 0,
      dieCost: 0,
      dieCostPerPcs: 0,
      materialCost: 0,
      rawTotalSqft: 0,
      rawDieCost: 0,
      rawDieCostPerPcs: 0
    });
  }

  removeCalculator(index: number) {
    this.extraCalculators.splice(index, 1);
  }

  // ===============================
  // NUMBER TO WORDS
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
      
      // Store raw total sqft
      calc.rawTotalSqft = totalSqft;
      
      // Calculate die cost
      const die = totalSqft * 1070;
      calc.rawDieCost = die;
      calc.rawDieCostPerPcs = die / Q;
      
      // Rounded values for display
      calc.fourSide = parseFloat(fourSide.toFixed(2));
      calc.bottom = parseFloat(bottom.toFixed(2));
      calc.totalSqft = parseFloat(totalSqft.toFixed(2));
      calc.dieCost = Math.round(die);
      calc.dieCostPerPcs = Math.round(die / Q);
      
      // Calculate material cost
      const baseMaterial = totalSqft * 321;
      
      // Thickness premium based on selected thickness
      let thicknessPremium = 0;
      if (calc.selectedThickness === 2.5) {
        thicknessPremium = totalSqft * 100;
      } else if (calc.selectedThickness === 3.5) {
        thicknessPremium = totalSqft * 150;
      } else if (calc.selectedThickness === 5.0) {
        thicknessPremium = totalSqft * 250;
      }
      
      // Total material cost per piece (base material + thickness premium + die cost per piece)
      const totalMaterialPerPcs = baseMaterial + thicknessPremium + (die / Q);
      calc.materialCost = Math.round(totalMaterialPerPcs);
      
    } else {
      calc.fourSide = 0;
      calc.bottom = 0;
      calc.totalSqft = 0;
      calc.dieCost = 0;
      calc.dieCostPerPcs = 0;
      calc.materialCost = 0;
      calc.rawTotalSqft = 0;
      calc.rawDieCost = 0;
      calc.rawDieCostPerPcs = 0;
    }
  }

  getExtraRawRate(calc: any): number {
    if (!calc.rawTotalSqft || calc.rawTotalSqft === 0) return 0;
    
    // Base material cost (without die)
    const baseMaterial = calc.rawTotalSqft * 321;
    
    // Thickness premium based on selected thickness
    let thicknessPremium = 0;
    if (calc.selectedThickness === 2.5) {
      thicknessPremium = calc.rawTotalSqft * 100;
    } else if (calc.selectedThickness === 3.5) {
      thicknessPremium = calc.rawTotalSqft * 150;
    } else if (calc.selectedThickness === 5.0) {
      thicknessPremium = calc.rawTotalSqft * 250;
    }
    
    // Total = base material + thickness premium + die cost per piece
    const total = baseMaterial + thicknessPremium + (calc.rawDieCostPerPcs || 0);
    
    return total;
  }

  getExtraRate(calc: any): number {
    return Math.round(this.getExtraRawRate(calc));
  }

  // Get rate for a specific thickness option in additional calculators
  getThicknessRateForCalculator(calc: any, thickness: number): number {
    if (!calc.rawTotalSqft || calc.rawTotalSqft === 0) return 0;
    
    // Base material cost (without die)
    const baseMaterial = calc.rawTotalSqft * 321;
    
    // Thickness premium based on the thickness parameter
    let thicknessPremium = 0;
    if (thickness === 2.5) {
      thicknessPremium = calc.rawTotalSqft * 100;
    } else if (thickness === 3.5) {
      thicknessPremium = calc.rawTotalSqft * 150;
    } else if (thickness === 5.0) {
      thicknessPremium = calc.rawTotalSqft * 250;
    }
    
    // Total = base material + thickness premium + die cost per piece
    const total = baseMaterial + thicknessPremium + (calc.rawDieCostPerPcs || 0);
    
    return Math.round(total);
  }

  getExtraSubtotal(calc: any): number {
    return Math.round(this.getExtraRawRate(calc) * (calc.qty || 1));
  }

  getExtraCommissionAmount(calc: any): number {
    return (this.getExtraSubtotal(calc) * (calc.commission || 0)) / 100;
  }

  getExtraGrandTotal(calc: any): number {
    return Math.round(this.getExtraSubtotal(calc) + this.getExtraCommissionAmount(calc));
  }

  // ===============================
  // GET ALL ADDITIONAL PLANTERS TOTALS
  // ===============================

  getAllAdditionalSubtotal(): number {
    let total = 0;
    for (let calc of this.extraCalculators) {
      total += this.getExtraSubtotal(calc);
    }
    return Math.round(total);
  }

  getAllAdditionalCommission(): number {
    let total = 0;
    for (let calc of this.extraCalculators) {
      total += this.getExtraCommissionAmount(calc);
    }
    return Math.round(total);
  }

  getAllAdditionalTotal(): number {
    let total = 0;
    for (let calc of this.extraCalculators) {
      total += this.getExtraGrandTotal(calc);
    }
    return Math.round(total);
  }

  // ===============================
  // COMBINED TOTALS
  // ===============================

  getCombinedSubtotal(): number {
    return this.getMainPlanterSubtotal() + this.getAllAdditionalSubtotal();
  }

  getCombinedCommission(): number {
    return this.getMainPlanterCommission() + this.getAllAdditionalCommission();
  }

  getCombinedGST(): number {
    return (this.getCombinedSubtotal() * (this.gstPercent || 0)) / 100;
  }

  getCombinedGrandTotal(): number {
    const subtotal = this.getCombinedSubtotal();
    const commission = this.getCombinedCommission();
    const gst = this.getCombinedGST();
    return Math.round(subtotal + commission + gst);
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

    // HEADER
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SAIRAJ FRP GARDENS PRIVATE LIMITED', 105, y, { align: 'center' });

    y += 7;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'H No 2699, Gala No. 8 & 9, Rajlaxmi Sulzer Park, Sonale, Bhiwandi - 421302',
      105,
      y,
      { align: 'center' }
    );

    y += 4;
    doc.text(
      'GSTIN: 27ABMCS9351E1ZY | State: Maharashtra (27)',
      105,
      y,
      { align: 'center' }
    );

    y += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', 105, y, { align: 'center' });

    y += 10;

    // CUSTOMER DETAILS
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, y);

    y += 6;
    doc.setFont('helvetica', 'normal');

    doc.text(this.customerName || '', 14, y);
    y += 5;
    doc.text(this.customerAddress || '', 14, y);
    y += 5;
    doc.text(this.customerCity || '', 14, y);
    y += 5;
    doc.text(this.customerState || '', 14, y);
    y += 5;
    
    if (this.customerGST) {
      doc.text(`GSTIN: ${this.customerGST}`, 14, y);
      y += 5;
    }

    y += 5;

    // TABLE
    const tableStartY = y;

    let totalItems = 1;
    totalItems += this.extraCalculators.length;

    const tableHeight = 45 + (totalItems * 8) + 50;

    doc.rect(14, y, 186, tableHeight);

    doc.line(25, y, 25, y + tableHeight);
    doc.line(120, y, 120, y + tableHeight);
    doc.line(145, y, 145, y + tableHeight);
    doc.line(170, y, 170, y + tableHeight);

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
    let subtotal = 0;

    // MAIN PRODUCT
    const ratePerPiece = this.getSelectedRate();
    const mainSubtotal = this.getMainPlanterSubtotal();
    const mainCommission = this.getMainPlanterCommission();
    subtotal += mainSubtotal;

    doc.text(String(itemNo), 16, y);
    doc.text(
      `Square Planter (L ${this.dimensions.length} x W ${this.dimensions.width} x H ${this.dimensions.height} ${this.unit}) - ${this.selectedThickness}mm`,
      28,
      y
    );

    doc.text(`${this.dimensions.quantity} PCS`, 125, y);
    doc.text(`Rs. ${ratePerPiece.toLocaleString('en-IN')}`, 150, y);
    doc.text(`Rs. ${mainSubtotal.toLocaleString('en-IN')}`, 175, y);

    y += 6;
    
    if (this.commission > 0) {
      doc.text(`Commission @ ${this.commission}%`, 28, y);
      doc.text(`Rs. ${Math.round(mainCommission).toLocaleString('en-IN')}`, 175, y);
      y += 6;
    }
    
    itemNo++;

    // EXTRA ITEMS
    if (this.extraCalculators.length > 0) {
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        const extraRate = this.getExtraRate(calc);
        const extraSubtotal = this.getExtraSubtotal(calc);
        const extraCommission = this.getExtraCommissionAmount(calc);

        subtotal += extraSubtotal;

        doc.text(String(itemNo), 16, y);
        doc.text(
          `Square Planter (L ${calc.length} x W ${calc.width} x H ${calc.height} ${calc.unit || 'inch'}) - ${calc.selectedThickness}mm`,
          28,
          y
        );

        doc.text(`${calc.qty} PCS`, 125, y);
        doc.text(`Rs. ${extraRate.toLocaleString('en-IN')}`, 150, y);
        doc.text(`Rs. ${extraSubtotal.toLocaleString('en-IN')}`, 175, y);

        y += 6;
        
        if (calc.commission > 0) {
          doc.text(`Commission @ ${calc.commission}%`, 28, y);
          doc.text(`Rs. ${Math.round(extraCommission).toLocaleString('en-IN')}`, 175, y);
          y += 6;
        }
        
        itemNo++;
      }
    }

    y += 5;

    const totalCommission = this.getCombinedCommission();
    const gstAmount = this.getCombinedGST();
    const cgst = Math.round(gstAmount / 2);
    const sgst = Math.round(gstAmount / 2);
    const grandTotal = this.getCombinedGrandTotal();

    doc.line(14, y, 200, y);
    y += 6;

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal', 120, y);
    doc.text(`Rs. ${subtotal.toLocaleString('en-IN')}`, 175, y);

    y += 6;

    // Total Commission
    if (totalCommission > 0) {
      doc.text('Total Commission', 120, y);
      doc.text(`Rs. ${Math.round(totalCommission).toLocaleString('en-IN')}`, 175, y);
      y += 6;
    }

    // CGST
    doc.text(`CGST @ ${this.gstPercent/2}%`, 120, y);
    doc.text(`Rs. ${cgst.toLocaleString('en-IN')}`, 175, y);

    y += 6;

    // SGST
    doc.text(`SGST @ ${this.gstPercent/2}%`, 120, y);
    doc.text(`Rs. ${sgst.toLocaleString('en-IN')}`, 175, y);

    y += 6;

    doc.line(14, y, 200, y);
    y += 6;

    // GRAND TOTAL
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('GRAND TOTAL', 120, y);
    doc.text(`Rs. ${grandTotal.toLocaleString('en-IN')}`, 175, y);

    // AMOUNT WORDS
    y = tableStartY + tableHeight + 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    doc.text('Amount Chargeable (in words):', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.text(`INR ${this.numberToWords(grandTotal)} Only`, 14, y);

    // PAN + DECLARATION
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.text("Company's PAN :", 14, y);
    doc.text("ABMCS9351E", 50, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text("Terms and Conditions:", 14, y);

    y += 4;
    doc.text("1.Transport Extra as Availability", 14, y);
    y += 4;
    doc.text("2.Advance 50% to Confirm Order and 50% at Final Delivery", 14, y);
    y += 4;
    doc.text("3.This Quotation is valid for 30 days only.", 14, y);

    doc.setFontSize(8);
    doc.setTextColor(100,100,100);
    doc.text("This is a Computer Generated Document", 105, 283, { align: 'center' });

    doc.save(`SAIRAJ_FRP_Square_Planter_Quotation_${today}.pdf`);
  }

  // ===============================
  // SHARE ON WHATSAPP
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
Commission: ${this.commission}%

*CALCULATIONS:*
Four Side: ${this.calculated.fourSide} sq ft
Bottom: ${this.calculated.bottom} sq ft
Total Sqft: ${this.calculated.totalSqft} sq ft
Die Cost/PCS: ₹ ${this.calculated.dieCostPerPcs.toLocaleString('en-IN')}

*RATES:*
Selected Thickness: ${this.selectedThickness} mm
Per Piece Rate: ₹ ${this.getSelectedRate().toLocaleString('en-IN')}
Subtotal: ₹ ${this.getMainPlanterSubtotal().toLocaleString('en-IN')}
Commission: ₹ ${Math.round(this.getMainPlanterCommission()).toLocaleString('en-IN')}
Total: ₹ ${this.getMainPlanterTotal().toLocaleString('en-IN')}
`;

    if (this.extraCalculators.length > 0) {
      message += `\n*ADDITIONAL PLANTERS:*\n`;
      for (let i = 0; i < this.extraCalculators.length; i++) {
        const calc = this.extraCalculators[i];
        message += `\nPlanter ${i + 1}:\n`;
        message += `L ${calc.length} ${calc.unit}, W ${calc.width} ${calc.unit}, H ${calc.height} ${calc.unit}\n`;
        message += `Qty: ${calc.qty}, Commission: ${calc.commission || 0}%\n`;
        message += `Total Sqft: ${calc.totalSqft} sq ft\n`;
        message += `Die Cost/Pc: ₹ ${calc.dieCostPerPcs?.toLocaleString('en-IN') || 0}\n`;
        message += `Material Cost/Pc: ₹ ${calc.materialCost?.toLocaleString('en-IN') || 0}\n`;
        message += `Subtotal: ₹ ${this.getExtraSubtotal(calc).toLocaleString('en-IN')}\n`;
        message += `Commission: ₹ ${Math.round(this.getExtraCommissionAmount(calc)).toLocaleString('en-IN')}\n`;
        message += `Total: ₹ ${this.getExtraGrandTotal(calc).toLocaleString('en-IN')}\n`;
      }
    }

    message += `\n*SUMMARY:*
Main Planter Subtotal: ₹ ${this.getMainPlanterSubtotal().toLocaleString('en-IN')}
Main Planter Commission: ₹ ${Math.round(this.getMainPlanterCommission()).toLocaleString('en-IN')}
Main Planter Total: ₹ ${this.getMainPlanterTotal().toLocaleString('en-IN')}

${this.extraCalculators.length > 0 ? 
  `Additional Planters Subtotal: ₹ ${this.getAllAdditionalSubtotal().toLocaleString('en-IN')}
Additional Planters Commission: ₹ ${Math.round(this.getAllAdditionalCommission()).toLocaleString('en-IN')}
Additional Planters Total: ₹ ${this.getAllAdditionalTotal().toLocaleString('en-IN')}

` : ''}
Combined Subtotal: ₹ ${this.getCombinedSubtotal().toLocaleString('en-IN')}
Total Commission: ₹ ${Math.round(this.getCombinedCommission()).toLocaleString('en-IN')}
GST (${this.gstPercent}%): ₹ ${Math.round(this.getCombinedGST()).toLocaleString('en-IN')}

*GRAND TOTAL (Incl GST & Commission): ₹ ${this.getCombinedGrandTotal().toLocaleString('en-IN')}*

Thank you for your business!`;

    const encoded = encodeURIComponent(message);
    const url = number
      ? `https://wa.me/91${number}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  }
}