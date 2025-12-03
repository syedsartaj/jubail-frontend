import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { MockDB } from '../../services/storage';
import { Booking } from '../../types';
import { Camera, CheckCircle, XCircle } from 'lucide-react';

const Scanner: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [scanResult, setScanResult] = useState<{status: 'success' | 'error' | 'idle', message: string}>({ status: 'idle', message: '' });
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setScanResult({ status: 'error', message: 'Could not access camera. Please allow permissions.' });
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Mock Scanning Functionality
  // In a real app, a library like jsQR would analyze the video frame canvas 60fps
  // Here we allow manual simulation for the demo.
  const handleSimulateScan = () => {
    // Find the most recent unpaid or unscanned booking for demo
    const bookings = MockDB.getBookings();
    // Prefer one that isn't scanned
    const target = bookings.find(b => !b.scanned && b.status === 'PAID') || bookings[0];
    
    if (target) {
        MockDB.markBookingScanned(target.id);
        setScanResult({
            status: 'success',
            message: `Verified: ${target.customerName} - ${target.items.length} items`
        });
    } else {
        setScanResult({
            status: 'error',
            message: 'No valid unscanned bookings found in mock DB.'
        });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-lg mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">Ticket Scanner</h1>
      
      <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl mb-8 border-4 border-white ring-4 ring-gray-100">
        {!hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
                <p>Requesting Camera...</p>
            </div>
        )}
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
        
        {/* Scanner Overlay UI */}
        <div className="absolute inset-0 border-[40px] border-black border-opacity-30">
            <div className="w-full h-full border-2 border-white border-opacity-50 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
            </div>
        </div>
      </div>

      <div className="w-full space-y-4">
        {scanResult.status === 'success' && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded flex items-center animate-bounce-short">
                <CheckCircle className="w-6 h-6 mr-3" />
                <div>
                    <p className="font-bold">Access Granted</p>
                    <p className="text-sm">{scanResult.message}</p>
                </div>
            </div>
        )}
        
        {scanResult.status === 'error' && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-center">
                <XCircle className="w-6 h-6 mr-3" />
                <div>
                    <p className="font-bold">Error</p>
                    <p className="text-sm">{scanResult.message}</p>
                </div>
            </div>
        )}

        <Button onClick={handleSimulateScan} className="w-full py-4 text-lg" size="lg">
            <Camera className="w-6 h-6 mr-2" /> Simulate Scan
        </Button>
        <p className="text-center text-xs text-gray-400 mt-2">
            *In a production environment, this would auto-trigger on QR recognition.
        </p>
      </div>
    </div>
  );
};

export default Scanner;