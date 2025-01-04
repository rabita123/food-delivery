import { FC } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface OrderItem {
  id: string;
  dish_id: string;
  quantity: number;
  price_at_time: number;
  dish: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  contact_number: string;
  special_instructions: string | null;
  items: OrderItem[];
  payment_method?: 'cash' | 'card';
}

interface OrderInvoiceProps {
  order: Order;
}

const OrderInvoice: FC<OrderInvoiceProps> = ({ order }) => {
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add logo and header
    doc.setTextColor(249, 115, 22); // Orange color (#f97316)
    doc.setFontSize(24);
    doc.text('HomelyEats', 20, 30);
    
    // Reset text color to black
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Your Favorite Home-Cooked Meals, Delivered', 20, 40);

    // Add a decorative line
    doc.setDrawColor(249, 115, 22);
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    // Add invoice title and details
    doc.setFontSize(16);
    doc.text('Invoice', 20, 60);
    
    doc.setFontSize(11);
    doc.text(`Order #${order.id}`, 20, 70);
    doc.text(
      `Date: ${new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      20, 
      77
    );
    doc.text(`Status: ${order.status.toUpperCase()}`, 20, 84);
    doc.text(`Payment Method: ${order.payment_method?.toUpperCase() || 'N/A'}`, 20, 91);

    // Add items table
    const tableData = order.items.map(item => [
      item.dish.name,
      item.quantity.toString(),
      `$${item.price_at_time.toFixed(2)}`,
      `$${(item.price_at_time * item.quantity).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 100,
      head: [['Item', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      }
    });

    // Add total amount with a box
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setDrawColor(249, 115, 22);
    doc.setFillColor(255, 237, 213); // Light orange background
    doc.rect(130, finalY - 5, 60, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 135, finalY + 2);
    doc.text(`$${order.total_amount.toFixed(2)}`, 180, finalY + 2, { align: 'right' });

    // Add delivery information
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Delivery Information', 20, finalY + 20);
    doc.setFontSize(10);
    doc.text('Address:', 20, finalY + 30);
    doc.text(order.delivery_address, 50, finalY + 30);
    doc.text('Contact:', 20, finalY + 37);
    doc.text(order.contact_number, 50, finalY + 37);
    
    if (order.special_instructions) {
      doc.text('Special Instructions:', 20, finalY + 44);
      doc.text(order.special_instructions, 50, finalY + 44);
    }

    // Add a thank you message
    doc.setDrawColor(249, 115, 22);
    doc.setFillColor(255, 237, 213);
    doc.roundedRect(20, finalY + 55, 170, 25, 3, 3, 'F');
    doc.setTextColor(249, 115, 22);
    doc.setFontSize(11);
    doc.text('Thank you for choosing HomelyEats!', 105, finalY + 65, { align: 'center' });
    doc.setFontSize(9);
    doc.text('We hope you enjoy your home-cooked meal.', 105, finalY + 72, { align: 'center' });

    // Add footer
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.text('For any questions or support, contact us at support@homelyeats.com', 105, 285, { align: 'center' });

    // Save the PDF
    doc.save(`homelyeats-order-${order.id}-invoice.pdf`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="border-b pb-4 mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
          <p className="text-sm text-gray-500">Order #{order.id}</p>
          <p className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {order.status === 'pending' ? 'Payment Pending' : 'Paid'}
          </div>
        </div>
        {order.status === 'paid' && (
          <Button
            onClick={downloadPDF}
            variant="outline"
            className="flex items-center gap-2 hover:bg-orange-50"
          >
            <Download className="h-4 w-4" />
            Download Invoice
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.dish.name}</p>
              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
            </div>
            <p className="text-gray-900">${(item.price_at_time * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="border-t mt-6 pt-4">
        <div className="flex justify-between items-center font-semibold text-lg">
          <p>Total</p>
          <p>${order.total_amount.toFixed(2)}</p>
        </div>
        {order.payment_method === 'cash' && order.status === 'pending' && (
          <p className="mt-2 text-sm text-yellow-600">
            * Payment will be collected upon delivery. Please keep exact change ready.
          </p>
        )}
      </div>

      <div className="mt-6 space-y-2 text-sm text-gray-600">
        <div>
          <p className="font-medium">Delivery Address:</p>
          <p>{order.delivery_address}</p>
        </div>
        <div>
          <p className="font-medium">Contact Number:</p>
          <p>{order.contact_number}</p>
        </div>
        {order.special_instructions && (
          <div>
            <p className="font-medium">Special Instructions:</p>
            <p>{order.special_instructions}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderInvoice; 