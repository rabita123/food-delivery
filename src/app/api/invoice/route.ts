import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function POST(req: Request) {
  try {
    const { order } = await req.json();
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add header with tagline
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Homely Eats', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Favorite Home-Cooked Meals, Delivered', 105, 30, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(242, 113, 33); // Orange color
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Add Invoice title
    doc.setFontSize(20);
    doc.text('Invoice', 20, 50);
    
    // Add order details
    doc.setFontSize(11);
    doc.text(`Order #${order.id}`, 20, 65);
    doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 20, 72);
    doc.text(`Status: ${order.status.toUpperCase()}`, 20, 79);
    doc.text(`Payment Method: ${order.payment_method?.toUpperCase()}`, 20, 86);
    
    // Add table header with orange background
    doc.setFillColor(242, 113, 33);
    doc.rect(20, 95, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 25, 102);
    doc.text('Quantity', 95, 102);
    doc.text('Unit Price', 130, 102);
    doc.text('Total', 170, 102);
    
    // Reset text color for items
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Add items with alternating background
    let yPos = 110;
    order.items.forEach((item: any, index: number) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPos - 5, 170, 10, 'F');
      }
      doc.text(item.dish.name, 25, yPos);
      doc.text(item.quantity.toString(), 95, yPos);
      doc.text(`$${item.price_at_time.toFixed(2)}`, 130, yPos);
      doc.text(`$${(item.quantity * item.price_at_time).toFixed(2)}`, 170, yPos);
      yPos += 10;
    });
    
    // Add total with light orange background
    doc.setFillColor(255, 240, 230);
    doc.rect(120, yPos, 70, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 125, yPos + 8);
    doc.text(`$${order.total_amount.toFixed(2)}`, 170, yPos + 8);
    
    // Add delivery information section
    yPos += 30;
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Information', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`Address:`, 20, yPos + 10);
    doc.text(order.delivery_address, 60, yPos + 10);
    doc.text(`Contact:`, 20, yPos + 17);
    doc.text(order.contact_number, 60, yPos + 17);
    if (order.special_instructions) {
      doc.text(`Special Instructions:`, 20, yPos + 24);
      doc.text(order.special_instructions, 60, yPos + 24);
    }
    
    // Add footer with orange line and message
    const footerY = 270;
    doc.setDrawColor(242, 113, 33);
    doc.line(20, footerY - 5, 190, footerY - 5);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing Homely Eats!', 105, footerY + 5, { align: 'center' });
    doc.text('For any questions about your order, please contact our support.', 105, footerY + 12, { align: 'center' });
    
    // Generate PDF as base64
    const pdfBase64 = doc.output('datauristring');
    
    return NextResponse.json({ pdfUrl: pdfBase64 });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
} 