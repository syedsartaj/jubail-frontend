
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MockDB } from '../../services/storage';
import { AuthService } from '../../services/auth';
import { PaymentService, CardDetails } from '../../services/payment';
import { CartItem, Booking } from '../../types';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Lock, CreditCard, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Checkout: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<'REVIEW' | 'PAYMENT' | 'SUCCESS'>('REVIEW');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '' });
  const [generatedBooking, setGeneratedBooking] = useState<Booking | null>(null);
  
  // Payment State
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expiry: '',
    cvc: '',
    zip: '',
    name: ''
  });
  const [cardType, setCardType] = useState('UNKNOWN');
  const [paymentError, setPaymentError] = useState('');

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    const storedCart = sessionStorage.getItem('cart');
    if (storedCart) setCart(JSON.parse(storedCart));

    // Auto-fill if user is logged in
    if (currentUser) {
      setCustomerDetails({
        name: currentUser.name,
        email: currentUser.email
      });
      setCardDetails(prev => ({ ...prev, name: currentUser.name }));
    }
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  // Input Handlers with Formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = PaymentService.formatCardNumber(val);
    setCardDetails({ ...cardDetails, number: formatted });
    setCardType(PaymentService.getCardType(val));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Limit length to 5 chars (MM/YY)
    if (val.length > 5) return;
    setCardDetails({ ...cardDetails, expiry: PaymentService.formatExpiry(val) });
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) return;
    setCardDetails({ ...cardDetails, cvc: val });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError('');
    
    // 1. Process Payment
    const result = await PaymentService.processPayment(total, cardDetails);

    if (!result.success) {
      setPaymentError(result.error || 'Payment failed. Please try again.');
      setIsProcessing(false);
      return;
    }
    
    // 2. Create Booking on Success
    const bookingId = `bk_${Date.now()}`;
    const newBooking: Booking = {
      id: bookingId,
      userId: currentUser ? currentUser.id : 'guest_user',
      customerName: customerDetails.name,
      customerEmail: customerDetails.email,
      items: cart,
      totalAmount: total,
      status: 'PAID',
      scanned: false,
      createdAt: new Date().toISOString(),
      qrCodeData: JSON.stringify({ id: bookingId, valid: true, txn: result.transactionId })
    };

    MockDB.createBooking(newBooking);
    setGeneratedBooking(newBooking);
    setStep('SUCCESS');
    setIsProcessing(false);
    sessionStorage.removeItem('cart');
    setCart([]);
  };

  if (cart.length === 0 && step !== 'SUCCESS') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <Link to="/shop">
          <Button>Go to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {step === 'REVIEW' && (
        <div className="space-y-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                <span>{item.title} {item.subtitle && <span className="text-gray-500 text-sm">({item.subtitle})</span>}</span>
                <span className="font-medium">${item.price}</span>
              </div>
            ))}
            <div className="flex justify-between pt-4 mt-2 text-lg font-bold">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 items-center">
            {!currentUser && (
               <span className="text-sm text-gray-500">
                 Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Log in</Link>
               </span>
            )}
            <Button onClick={() => setStep('PAYMENT')}>
              Continue to Payment
            </Button>
          </div>
        </div>
      )}

      {step === 'PAYMENT' && (
        <div className="space-y-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900">Secure Payment</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
             <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
             <div className="text-sm text-blue-800">
               <p className="font-semibold">Encryption Enabled</p>
               <p>Your transaction is secured with 256-bit SSL encryption. We do not store your full card details.</p>
             </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Billing Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={customerDetails.name}
                    onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input 
                    required
                    type="email" 
                    className="mt-1 block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={customerDetails.email}
                    onChange={e => setCustomerDetails({...customerDetails, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold text-gray-800">Card Details</h2>
                 <div className="flex gap-2">
                    <div className={`w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[10px] font-bold text-gray-500 ${cardType === 'VISA' ? 'bg-blue-600 text-white' : ''}`}>VISA</div>
                    <div className={`w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[10px] font-bold text-gray-500 ${cardType === 'MASTERCARD' ? 'bg-orange-600 text-white' : ''}`}>MC</div>
                 </div>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {paymentError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Number</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      required
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      className="block w-full pl-10 rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
                      value={cardDetails.number}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                    <input 
                      required
                      type="text" 
                      placeholder="MM/YY" 
                      className="mt-1 block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-center"
                      value={cardDetails.expiry}
                      onChange={handleExpiryChange}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CVC</label>
                    <div className="relative mt-1">
                      <input 
                        required
                        type="password" 
                        placeholder="123" 
                        className="block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-center"
                        value={cardDetails.cvc}
                        onChange={handleCVCChange}
                        maxLength={4}
                      />
                       <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                         <Lock className="h-4 w-4 text-gray-400" />
                       </div>
                    </div>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700">Name on Card</label>
                   <input 
                      required
                      type="text" 
                      placeholder="J S DOE"
                      className="mt-1 block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                      value={cardDetails.name}
                      onChange={e => setCardDetails({...cardDetails, name: e.target.value.toUpperCase()})}
                   />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                   <input 
                      required
                      type="text" 
                      placeholder="12345"
                      className="mt-1 block w-full rounded-md border-gray-300 border p-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={cardDetails.zip}
                      onChange={e => setCardDetails({...cardDetails, zip: e.target.value})}
                      maxLength={10}
                   />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
               <button type="button" onClick={() => setStep('REVIEW')} className="text-gray-600 hover:underline">Back to Review</button>
               <Button type="submit" isLoading={isProcessing} disabled={isProcessing} className="w-1/2 md:w-auto text-lg py-3">
                 Pay ${total}
               </Button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-4">
              By clicking "Pay", you agree to our Terms of Service. <br/>
              (Demo: Use 4242... for Success, or any number ending in 0000 for Decline)
            </p>
          </form>
        </div>
      )}

      {step === 'SUCCESS' && generatedBooking && (
        <div className="text-center py-12 space-y-6 animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Payment Successful!</h1>
          <p className="text-gray-600 text-lg">Thank you, {generatedBooking.customerName}. Your booking is confirmed.</p>
          
          <div className="bg-white p-8 rounded-xl shadow-lg inline-block border border-gray-200 mt-6 transform transition hover:scale-105 duration-300">
            <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Your Entry Pass</p>
            <div className="flex justify-center mb-4 p-4 bg-white rounded-lg">
              <QRCodeSVG value={generatedBooking.qrCodeData} size={200} />
            </div>
            <p className="text-xs text-gray-400 font-mono mb-2">Ref: {generatedBooking.id}</p>
            <p className="text-sm font-bold text-green-600">PAID</p>
          </div>

          <div className="mt-8">
             <Link to="/my-bookings">
              <Button variant="outline" size="lg">View All My Bookings</Button>
             </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
