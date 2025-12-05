
import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api'; // ✅ USE API SERVICE
import { AuthService } from '../../services/auth';
import { Booking } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../../components/ui/Button';
import { Download, FileText, Tag } from 'lucide-react';

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const user = AuthService.getCurrentUser();

useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        const userBookings = await ApiService.getBookingsforuser(user.id);
        setBookings(userBookings);
      } catch (err) {
        console.error('Failed to load my bookings', err);
      }
    };

    fetchBookings();
  }, [user]);

  const generateInvoice = (booking: Booking) => {
    // 1. Calculate / Retrieve Breakdown values
    // Fallback for legacy bookings which might not have new fields saved
    const subtotal = booking.subtotal !== undefined ? booking.subtotal : booking.totalAmount; 
    const taxAmount = booking.taxAmount || 0;
    const discountAmount = booking.discountAmount || 0;
    
    // Create HTML for items
    const itemsHtml = booking.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <div style="font-weight:bold;">${item.title}</div>
          <small style="color:#666;">${item.subtitle || ''}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align:center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align:right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // Discount Row HTML
    const discountHtml = discountAmount > 0 ? `
      <tr>
        <td colspan="3" style="text-align:right; padding: 5px 10px; color: #16a34a;">Discount (${booking.couponCode || 'APPLIED'}):</td>
        <td style="text-align:right; padding: 5px 10px; color: #16a34a;">-$${discountAmount.toFixed(2)}</td>
      </tr>
    ` : '';

    // Tax Row HTML
    const taxHtml = taxAmount > 0 ? `
      <tr>
        <td colspan="3" style="text-align:right; padding: 5px 10px; color: #666;">Tax:</td>
        <td style="text-align:right; padding: 5px 10px;">$${taxAmount.toFixed(2)}</td>
      </tr>
    ` : '';

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${booking.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #4f46e5; }
            .invoice-details { text-align: right; }
            h1 { margin: 0; font-size: 28px; color: #4f46e5; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; margin-top: 20px; }
            th { text-align: left; padding: 12px 10px; background-color: #f9fafb; color: #555; text-transform: uppercase; font-size: 12px; font-weight: 600; }
            td { vertical-align: top; }
            .summary { float: right; width: 300px; }
            .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; clear: both;}
            .status-badge { display: inline-block; padding: 5px 10px; border: 2px solid #059669; color: #059669; font-weight: bold; transform: rotate(-3deg); border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">RiverRun Adventures</div>
              <p>123 Nature Trail Way<br>Wilderness, CA 90210<br>support@riverrun.com</p>
            </div>
            <div class="invoice-details">
              <h1>INVOICE</h1>
              <p><strong>Ref:</strong> #${booking.id}</p>
              <p><strong>Date:</strong> ${new Date(booking.createdAt).toLocaleDateString()}</p>
              <div class="status-badge">PAID</div>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <p style="text-transform: uppercase; font-size: 12px; color: #888; margin-bottom: 5px; font-weight: bold;">Bill To:</p>
            <p style="margin: 0; font-weight: bold; font-size: 16px;">${booking.customerName}</p>
            <p style="margin: 0;">${booking.customerEmail}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Unit Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <table style="margin: 0;">
              <tr>
                <td colspan="3" style="text-align:right; padding: 5px 10px; font-weight:bold;">Subtotal:</td>
                <td style="text-align:right; padding: 5px 10px;">$${subtotal.toFixed(2)}</td>
              </tr>
              ${discountHtml}
              ${taxHtml}
              <tr>
                <td colspan="3" style="text-align:right; padding: 15px 10px 0 0;">
                   <div style="font-size: 18px; font-weight: bold;">Total Paid:</div>
                </td>
                <td style="text-align:right; padding: 15px 10px 0 0;">
                   <div style="font-size: 18px; font-weight: bold; color: #4f46e5;">$${booking.totalAmount.toFixed(2)}</div>
                </td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for choosing RiverRun Adventures!</p>
            <p>This is a computer generated receipt.</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500 mb-4">You haven't made any bookings yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map(booking => {
            // Values for card display
            const subtotal = booking.subtotal !== undefined ? booking.subtotal : booking.totalAmount;
            const taxAmount = booking.taxAmount || 0;
            const discountAmount = booking.discountAmount || 0;

            return (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${booking.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {booking.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-slate-900">${booking.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6 border-b border-gray-100 pb-4">
                    {booking.items.map((item, i) => (
                      <div key={i} className="text-sm text-gray-700 flex justify-between">
                        <span>{item.quantity}x {item.title}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Booking Financial Breakdown */}
                  <div className="space-y-1 text-sm text-gray-500 mb-4">
                    <div className="flex justify-between">
                       <span>Subtotal</span>
                       <span>${subtotal.toFixed(2)}</span>
                    </div>
                    
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <div className="flex items-center gap-1">
                          <Tag size={12} />
                          <span>Discount {booking.couponCode ? `(${booking.couponCode})` : ''}</span>
                        </div>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                       <span>Total</span>
                       <span>${booking.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center pt-2">
                    <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">Entry Pass</p>
                    <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <QRCodeSVG value={booking.qrCodeData} size={100} />
                    </div>
                    <p className="text-[10px] text-gray-300 mt-2 font-mono">{booking.id}</p>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                    onClick={() => generateInvoice(booking)}
                  >
                    <FileText size={16} />
                    Download Invoice
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
