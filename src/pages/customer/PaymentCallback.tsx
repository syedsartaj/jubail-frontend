
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MockDB } from '../../services/storage';
import { Booking } from '../../types';
import { Button } from '../../components/ui/Button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // APS returns parameters in the query string (e.g., ?response_code=14000&merchant_reference=bk_123...)
    const responseCode = searchParams.get('response_code'); // 14000 is usually success in APS (Standard)
    const merchantReference = searchParams.get('merchant_reference');
    const responseMessage = searchParams.get('response_message');

    if (merchantReference) {
      // Find the pending booking (from session/local storage syncing in real app)
      const allBookings = MockDB.getBookings();
      const foundBooking = allBookings.find(b => b.id === merchantReference);

      if (foundBooking) {
        // APS Success Code is typically '14000' for success
        if (responseCode === '14000') {
          // Update Booking Status
          foundBooking.status = 'PAID';
          foundBooking.qrCodeData = JSON.stringify({ 
            id: foundBooking.id, 
            valid: true, 
            txn: searchParams.get('fort_id') 
          });
          
          // Save back to MockDB (Simulating DB update)
          const updatedBookings = allBookings.map(b => b.id === merchantReference ? foundBooking : b);
          localStorage.setItem('riverrun_bookings', JSON.stringify(updatedBookings));

          setBooking(foundBooking);
          setStatus('success');
          sessionStorage.removeItem('cart'); // Clear cart
        } else {
          console.error('Payment Failed:', responseMessage);
          setStatus('failed');
        }
      } else {
        setStatus('failed');
      }
    } else {
      setStatus('failed');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Verifying Payment...</h2>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <XCircle size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          We couldn't process your payment. Please try again or contact support if the issue persists.
        </p>
        <div className="flex gap-4">
          <Link to="/checkout">
            <Button>Try Again</Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full text-center border border-gray-200">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your booking. Please save your QR code for entry.
        </p>

        {booking && (
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 inline-block">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
               <QRCodeSVG value={booking.qrCodeData} size={180} />
            </div>
            <p className="font-mono text-xs text-gray-500">ID: {booking.id}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              CONFIRMED
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/my-bookings">
            <Button className="w-full sm:w-auto">View My Bookings</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto">Return Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
