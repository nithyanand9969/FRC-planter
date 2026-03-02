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
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  
  let y = 15;

  // ====================================
  // HEADER - Company Name (SAIRAJ FRP - Fixed)
  // ====================================
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SAIRAJ FRP GARDENS PRIVATE LIMITED', 105, y, { align: 'center' });
  
  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('H No 2699, Gala No. 8 & 9, Rajlaxmi Sulzer Park, Bldg No O, Sonale Bhiwandi-421302', 105, y, { align: 'center' });
  
  y += 4;
  doc.text(`GSTIN/UIN: 27ABMCS9351E12Y      State Name : Maharashtra, Code : 27      CIN: U23102MH2024PTC420821`, 105, y, { align: 'center' });
  
  y += 4;
  doc.text(`E-Mail : info@sairajfrp.com`, 105, y, { align: 'center' });
  
  y += 8;
  
  // ====================================
  // QUOTATION HEADER
  // ====================================
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 105, y, { align: 'center' });
  
  y += 8;
  
  // ====================================
  // QUOTATION NUMBER AND DATE
  // ====================================
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Draw boxes for Quotation No. and Date
  doc.rect(14, y - 4, 90, 8);
  doc.rect(105, y - 4, 90, 8);
  
  doc.text('Quotation No.', 16, y);
  doc.text('Dated', 107, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('1', 50, y);
  doc.text(today, 130, y);
  
  y += 10;
  
  // Buyer's Ref and Other References
  doc.setFont('helvetica', 'normal');
  doc.rect(14, y - 4, 90, 8);
  doc.rect(105, y - 4, 90, 8);
  
  doc.text(`Buyer's Ref./Order No.`, 16, y);
  doc.text('Other References', 107, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('1', 50, y);
  
  y += 12;
  
  // ====================================
  // CONSIGNEE AND BUYER (取自表单)
  // ====================================
  doc.setFont('helvetica', 'bold');
  doc.text('Consignee (Ship to)', 14, y);
  doc.text('Buyer (Bill to)', 105, y);
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  
  // 使用表单中的客户名称，如果没有则显示默认值
  const buyerName = this.customerName || 'Medley Pharmaceuticals Ltd';
  const buyerAddress = this.projectName || 'Medley House D2, Road No-16, M.I.D.C';
  const buyerCity = 'Area Andheri East Mumbai-400093'; // 可以添加城市字段到表单
  
  doc.text(buyerName, 14, y);
  doc.text(buyerName, 105, y);
  
  y += 5;
  doc.text(buyerAddress, 14, y);
  doc.text(buyerAddress, 105, y);
  
  y += 5;
  doc.text(buyerCity, 14, y);
  doc.text(buyerCity, 105, y);
  
  y += 5;
  doc.text('State Name : Maharashtra, Code : 27', 14, y);
  doc.text('State Name : Maharashtra, Code : 27', 105, y);
  
  y += 12;
  
  // ====================================
  // TABLE HEADER
  // ====================================
  const tableTop = y;
  const col1 = 14;  // Description
  const col2 = 90;  // HSN/SAC
  const col3 = 110; // Due on
  const col4 = 125; // Quantity
  const col5 = 145; // Rate
  const col6 = 165; // per
  const col7 = 180; // Disc. %
  const col8 = 195; // Amount
  
  // Draw table header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Description of Goods and Services', col1, y);
  doc.text('HSN/SAC', col2, y);
  doc.text('Due on', col3, y);
  doc.text('Quantity', col4, y);
  doc.text('Rate', col5, y);
  doc.text('per', col6, y);
  doc.text('Disc. %', col7, y);
  doc.text('Amount', col8, y);
  
  y += 5;
  
  // Draw horizontal line
  doc.line(14, y, 205, y);
  y += 3;
  
  // ====================================
  // TABLE ROWS - MAIN PLANTER (取自计算器)
  // ====================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  let itemNumber = 1;
  
  // Main Planter Row
  const mainDesc = `${itemNumber} Customize Size (⌀${this.dimensions.topDia}×${this.dimensions.height} ${this.unit})`;
  doc.text(mainDesc.substring(0, 30), col1, y);
  doc.text('7019', col2, y);
  doc.text(today, col3, y);
  doc.text(`${this.dimensions.quantity} PCS`, col4, y);
  doc.text(`${this.getSelectedRate().toLocaleString('en-IN')}`, col5, y);
  doc.text('PCS', col6, y);
  doc.text('-', col7, y);
  doc.text(`${this.getMainPlanterTotal().toLocaleString('en-IN')}`, col8, y);
  
  y += 6;
  itemNumber++;
  
  // Mould Charge Row (if die cost exists)
  if (this.calculated.dieCost > 0) {
    doc.text(`${itemNumber} Mould Charge`, col1, y);
    doc.text('7019', col2, y);
    doc.text(today, col3, y);
    doc.text('1 set', col4, y);
    doc.text(`${Math.round(this.calculated.rawDieCost).toLocaleString('en-IN')}`, col5, y);
    doc.text('set', col6, y);
    doc.text('-', col7, y);
    doc.text(`${Math.round(this.calculated.rawDieCost).toLocaleString('en-IN')}`, col8, y);
    
    y += 6;
    itemNumber++;
  }
  
  // Additional Planters (取自额外计算器)
  for (let i = 0; i < this.extraCalculators.length; i++) {
    const calc = this.extraCalculators[i];
    if (calc.qty > 0 && calc.topDia > 0 && calc.height > 0) {
      const extraDesc = `${itemNumber} Customize Size (⌀${calc.topDia}×${calc.height} ${calc.unit || 'inch'})`;
      doc.text(extraDesc.substring(0, 30), col1, y);
      doc.text('7019', col2, y);
      doc.text(today, col3, y);
      doc.text(`${calc.qty} PCS`, col4, y);
      doc.text(`${this.getThicknessRateForCalculator(calc, calc.selectedThickness).toLocaleString('en-IN')}`, col5, y);
      doc.text('PCS', col6, y);
      doc.text('-', col7, y);
      doc.text(`${this.getExtraGrandTotal(calc).toLocaleString('en-IN')}`, col8, y);
      
      y += 6;
      itemNumber++;
    }
  }
  
  // Draw horizontal line before totals
  doc.line(14, y, 205, y);
  y += 5;
  
  // ====================================
  // TOTALS SECTION (使用计算器的值)
  // ====================================
  const mainTotal = this.getMainPlanterTotal();
  const dieCost = Math.round(this.calculated.rawDieCost);
  const additionalTotal = this.getAllAdditionalTotal();
  const subtotal = mainTotal + additionalTotal;
  const gstAmount = Math.round((subtotal) * this.gstPercent / 100);
  const cgst = Math.round(gstAmount / 2);
  const sgst = Math.round(gstAmount / 2);
  const grandTotal = subtotal + gstAmount;
  
  // Subtotal
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal', col5 - 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${subtotal.toLocaleString('en-IN')}`, col8, y);
  
  y += 6;
  
  // CGST
  doc.setFont('helvetica', 'bold');
  doc.text(`CGST @ ${this.gstPercent/2}%`, col5 - 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${cgst.toLocaleString('en-IN')}`, col8, y);
  
  y += 6;
  
  // SGST
  doc.setFont('helvetica', 'bold');
  doc.text(`SGST @ ${this.gstPercent/2}%`, col5 - 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sgst.toLocaleString('en-IN')}`, col8, y);
  
  y += 6;
  
  // Other Charges (if any)
  if (additionalTotal > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Other Charges', col5 - 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text('-', col8, y);
    y += 6;
  }
  
  // Draw line before total
  doc.line(14, y, 205, y);
  y += 5;
  
  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total', col5 - 10, y);
  doc.text(`₹ ${grandTotal.toLocaleString('en-IN')}`, col8, y);
  
  y += 10;
  
  // ====================================
  // AMOUNT IN WORDS
  // ====================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Chargeable (in words)', 14, y);
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`INR ${this.numberToWords(grandTotal)} Only`, 14, y);
  
  y += 10;
  
  // ====================================
  // DECLARATION AND BANK DETAILS
  // ====================================
  doc.setFont('helvetica', 'bold');
  doc.text("Company's PAN : ABMCS9351E", 14, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Declaration', 14, y);
  y += 4;
  doc.text('1-Transport Extra as Below Porter, 2- Advance 50% Conform Order and 50% at Finel Delevery Time, Mould life 50-70 pcs', 14, y);
  
  // 添加电话号码到声明中
  if (this.phoneNumber) {
    y += 4;
    doc.text(`Contact: ${this.phoneNumber}`, 14, y);
  }
  
  y += 8;
  
  // Bank Details (固定)
  doc.setFont('helvetica', 'bold');
  doc.text("Company's Bank Details", 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Bank Name : Union Bank of India', 14, y);
  y += 4;
  doc.text('A/c No. : 307821318590006', 14, y);
  y += 4;
  doc.text('Branch & IFS Code : Bhivandi (Kalyan Bhavandi Road) & UBIN0390784', 14, y);
  
  // ====================================
  // AUTHORIZED SIGNATORY
  // ====================================
  doc.setFont('helvetica', 'bold');
  doc.text('for SAIRAJ FRP GARDENS PRIVATE LIMITED', 140, y - 8);
  y += 8;
  doc.text('Authorised Signatory', 155, y);
  
  // ====================================
  // FOOTER (固定)
  // ====================================
  y = 280;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Regd Off : H.No. 2699, Gala - 8 & 9, Bldg - O, Thale Compound, Near Rajlaxmi Sulzer Park, Sonale Village, Bhiwandi, Thane - 421 302, Maharashtra, India.', 105, y, { align: 'center' });
  y += 3;
  doc.text('GST IN : 27ABMCS9351E1ZY    CIN : U23102MH2024PTC420821', 105, y, { align: 'center' });

  doc.save('Round_Planter_Quotation.pdf');
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