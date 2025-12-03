
import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { AuthService } from '../../services/auth';
import { Booking } from '../../types';
import { QRCodeSVG } from 'qrcode.react';

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    if (user) {
      const all = MockDB.getBookings();
      // Filter bookings for the logged-in user
      const userBookings = all.filter(b => b.userId === user.id);
      setBookings(userBookings);
    }
  }, [user]);

  if (!user) return null; // Should be handled by route protection, but safe guard

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500 mb-4">You haven't made any bookings yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${booking.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {booking.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{new Date(booking.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${booking.totalAmount}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  {booking.items.map((item, i) => (
                    <div key={i} className="text-sm text-gray-700 flex justify-between">
                      <span>{item.quantity}x {item.title}</span>
                      <span>${item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 flex flex-col items-center">
                  <p className="text-xs text-gray-500 mb-2 uppercase">Scan at entry</p>
                  <QRCodeSVG value={booking.qrCodeData} size={100} />
                  <p className="text-xs text-gray-300 mt-2 font-mono">{booking.id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
