import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Camera, CheckCircle, XCircle, Search, Calendar, User, CreditCard, Clock } from 'lucide-react';

interface BookingItem {
  title: string;
  quantity: number;
}

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  status: 'PAID' | 'UNPAID';
  scanned: boolean;
  items: BookingItem[];
}

const Scanner: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [scanResult, setScanResult] = useState<{status: 'success' | 'error' | 'idle', message: string}>({ status: 'idle', message: '' });
  const [scannedBooking, setScannedBooking] = useState<Booking | null>(null);
  const [manualInput, setManualInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setScanResult({ status: 'error', message: 'Could not access camera. Please use manual entry.' });
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Fetch booking from backend
  const fetchBookingById = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      if (!res.ok) throw new Error('Booking not found');
      const data: Booking = await res.json();
      setScannedBooking(data);
      setScanResult({ status: 'idle', message: '' });
    } catch (err) {
      console.error(err);
      setScannedBooking(null);
      setScanResult({ status: 'error', message: `Ticket not found: ${id}` });
    }
  };

  const handleProcessCode = (code: string) => {
    let bookingId = code;
    try {
      const parsed = JSON.parse(code);
      if (parsed.id) bookingId = parsed.id;
    } catch {}
    if (bookingId) fetchBookingById(bookingId);
  };

  const handleValidateCheckIn = async () => {
    if (!scannedBooking) return;

    if (scannedBooking.status !== 'PAID') {
      setScanResult({ status: 'error', message: 'Cannot check in: Unpaid Booking' });
      return;
    }

    if (scannedBooking.scanned) {
      setScanResult({ status: 'error', message: 'Ticket already used / scanned.' });
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${scannedBooking.id}/scan`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark as scanned');

      const updatedBooking: Booking = await res.json();
      setScannedBooking(updatedBooking);
      setScanResult({ status: 'success', message: 'Check-in Successful!' });
    } catch (err) {
      console.error(err);
      setScanResult({ status: 'error', message: 'Failed to validate booking' });
    }
  };

  const handleSimulateScan = async () => {
    try {
      const res = await fetch(`/api/bookings/random`);
      if (!res.ok) throw new Error('No bookings found');
      const data: Booking = await res.json();
      handleProcessCode(data.id);
    } catch (err) {
      console.error(err);
      setScanResult({ status: 'error', message: 'No valid bookings found.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Ticket Validator</h1>
        <p className="text-gray-500">Scan QR code or enter booking ID manually.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SCANNER */}
        <div className="space-y-4">
          <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden shadow-lg border-4 border-white ring-2 ring-gray-200">
            {!hasPermission && (
              <div className="absolute inset-0 flex items-center justify-center text-white p-4 text-center">
                <p>Camera inactive. <br /> Use manual entry or enable permissions.</p>
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
          </div>

          <div className="flex gap-2">
            <input 
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Enter Booking ID..."
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleProcessCode(manualInput)}
            />
            <Button onClick={() => handleProcessCode(manualInput)} size="sm"><Search size={18} /></Button>
          </div>

          <Button variant="outline" onClick={handleSimulateScan} className="w-full">
            <Camera className="w-4 h-4 mr-2" /> Simulate Random Scan
          </Button>
        </div>

        {/* RESULTS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Ticket Details</h2>
          {scannedBooking ? (
            <div className="flex-1 space-y-4">
              <div className={`p-3 rounded-lg flex items-center gap-3 ${scannedBooking.status === 'PAID' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <CreditCard size={20} />
                <div>
                  <p className="text-xs font-bold uppercase">Payment Status</p>
                  <p className="font-semibold">{scannedBooking.status}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-700">
                  <User size={16} className="text-gray-400"/>
                  <div>
                    <p className="font-bold">{scannedBooking.customerName}</p>
                    <p className="text-xs text-gray-500">{scannedBooking.customerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar size={16} className="text-gray-400"/>
                  <span>Booked: {new Date(scannedBooking.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock size={16} className="text-gray-400"/>
                  <span>ID: <span className="font-mono bg-gray-100 px-1 rounded">{scannedBooking.id}</span></span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Items</p>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {scannedBooking.items.map((item, i) => (
                    <li key={i} className="text-sm flex justify-between">
                      <span>{item.quantity}x {item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-4">
                {scannedBooking.scanned ? (
                  <div className="bg-orange-100 text-orange-800 p-4 rounded-lg text-center font-bold flex items-center justify-center gap-2">
                    <XCircle /> ALREADY USED
                  </div>
                ) : (
                  <Button onClick={handleValidateCheckIn} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2" /> Validate Entry
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p>Scan a ticket to view details.</p>
            </div>
          )}

          {/* Status Messages */}
          {scanResult.message && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${
                scanResult.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {scanResult.status === 'success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
              {scanResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner;
