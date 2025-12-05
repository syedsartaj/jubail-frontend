import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AuthService } from '../../services/auth';
import { PaymentService } from '../../services/payment';
import { CartItem, Booking, Coupon, DiscountType } from '../../types';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Lock, AlertCircle, Tag, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { ApiService } from '../../services/api';

// --- APS CONFIGURATION (SANDBOX) ---
const APS_CONFIG = {
  MERCHANT_IDENTIFIER: 'cfacb2ae',
  ACCESS_CODE: 'KuzaJdFwhSPxqopalIFN',
  SHA_REQUEST_PHRASE: '38veYkjInTbH3AdnA9v1B*g',
  SANDBOX_URL: 'https://sbcheckout.payfort.com/FortAPI/paymentPage',
};

const Checkout: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<'REVIEW' | 'PAYMENT' | 'SUCCESS'>('REVIEW');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '' });
  const [generatedBooking, setGeneratedBooking] = useState<Booking | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const navigate = useNavigate();

  const [taxRate, setTaxRate] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', zip: '', name: '' });
  const [cardType, setCardType] = useState('UNKNOWN');

  const currentUser = AuthService.getCurrentUser();

  // Fetch system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/system-settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setTaxRate(data.data.taxPercentage);
      } catch (err) {
        console.error(err);
        alert('Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

  // Enforce login and load cart
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const storedCart = sessionStorage.getItem('cart');
    if (storedCart) setCart(JSON.parse(storedCart));

    setCustomerDetails({ name: currentUser.name, email: currentUser.email });
    setCardDetails(prev => ({ ...prev, name: currentUser.name }));
  }, [currentUser?.id, navigate]);

  // Handle return from APS
  useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search);
  const apsResponse: any = {
    response_message: searchParams.get('response_message'),
    response_code: searchParams.get('response_code'),
    merchant_reference: searchParams.get('merchant_reference'),
    fort_id: searchParams.get('fort_id'),
  };

  if (apsResponse.response_code) {
    handlePaymentResponse(apsResponse);
  }
  }, []);

  // After APS redirects back with response
const handlePaymentResponse = async (apsResponse: any) => {
  // Example APS response fields
  const { response_message, response_code, merchant_reference, fort_id } = apsResponse;

  // Retrieve the pending booking stored before redirect
  const pendingBookingStr = sessionStorage.getItem('pendingBooking');
  if (!pendingBookingStr) return;

  const pendingBooking: Booking = JSON.parse(pendingBookingStr);

  if (response_code === '00000') { // success
    const generatedBooking: Booking = {
      ...pendingBooking,
      status: 'PAID',
      qrCodeData: `BOOKING-${pendingBooking.id}`, // can be your QR logic
      manualTxnId: fort_id, // store APS transaction id
      createdAt: new Date(pendingBooking.createdAt).toISOString(), // ensure Date type
    };

    // Save to backend
    try {
      await ApiService.createBooking(generatedBooking); // your backend API
      setGeneratedBooking(generatedBooking);

      // Clear cart and pendingBooking
      sessionStorage.removeItem('cart');
      sessionStorage.removeItem('pendingBooking');
      setCart([]);

      // Show success popup
      alert('Payment Successful! Booking confirmed.');

      setStep('SUCCESS');
    } catch (err: any) {
      console.error(err);
      alert('Booking saved failed. Please contact support.');
    }
  } else { // failure
    // Clear cart and pendingBooking
    sessionStorage.removeItem('pendingBooking');
    alert(`Payment Failed: ${response_message || 'Try again'}`);
    setStep('REVIEW');
  }
};

  // --- Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  let discountAmount = appliedCoupon ? (appliedCoupon.type === DiscountType.PERCENT ? subtotal * (appliedCoupon.value / 100) : appliedCoupon.value) : 0;
  discountAmount = Math.min(discountAmount, subtotal);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  // --- Coupon Handlers ---
  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    try {
      const coupon: Coupon = await ApiService.getCouponByCode(couponCode.trim().toUpperCase());
      if (!coupon || !coupon.isActive) {
        setCouponError('Invalid or expired coupon code.');
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(coupon);
      setCouponCode('');
    } catch (err: any) {
      console.error(err);
      setCouponError(err.message || 'Failed to redeem coupon.');
      setAppliedCoupon(null);
    }
  };
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // --- APS Signature ---
  const generateSignature = (params: Record<string, string>) => {
    const keys = Object.keys(params).sort();
    let stringToSign = '';
    keys.forEach(key => stringToSign += `${key}=${params[key]}`);
    const rawString = `${APS_CONFIG.SHA_REQUEST_PHRASE}${stringToSign}${APS_CONFIG.SHA_REQUEST_PHRASE}`;
    return CryptoJS.SHA512(rawString).toString(CryptoJS.enc.Hex);
  };

  // --- Payment Handler ---
  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const orderId = `bk_${Date.now()}`;
      const pendingBooking: Booking = {
        id: orderId,
        userId: currentUser?.id || 'guest_user',
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        items: cart,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon?.code,
        taxAmount,
        totalAmount: total,
        status: 'PENDING',
        scanned: false,
        createdAt: new Date().toISOString(),
        qrCodeData: '',
        paymentMethod: 'ONLINE',
      };
      sessionStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));

      const params: Record<string, string> = {
        access_code: APS_CONFIG.ACCESS_CODE,
        amount: String(Math.round(total * 100)),
        command: 'PURCHASE',
        currency: 'AED',
        customer_email: customerDetails.email,
        language: 'en',
        merchant_identifier: APS_CONFIG.MERCHANT_IDENTIFIER,
        merchant_reference: orderId,
        return_url: window.location.href,
      };
      params.signature = generateSignature(params);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = APS_CONFIG.SANDBOX_URL;
      form.style.display = 'none';
      Object.entries(params).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.message || 'Unable to start payment');
      setIsProcessing(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {step === 'REVIEW' && (
        <div className="space-y-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Order Summary</h2>

            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                  <span>
                    {item.title} {item.subtitle && <span className="text-gray-500 text-sm">({item.subtitle})</span>}
                  </span>
                  <span className="font-medium text-slate-900">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">Have a coupon?</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg text-green-800">
                  <div className="flex items-center gap-2">
                    <Tag size={16} />
                    <span className="font-bold">{appliedCoupon.code}</span>
                    <span className="text-sm">({appliedCoupon.type === DiscountType.PERCENT ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`} off)</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Enter code"
                        className={`w-full border bg-white rounded-lg p-2 text-slate-900 uppercase ${couponError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'}`}
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      />
                    </div>
                    <Button variant="secondary" onClick={handleApplyCoupon} disabled={!couponCode}>Apply</Button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 font-medium ml-1">{couponError}</p>}
                </div>
              )}
            </div>

            <div className="flex justify-between py-3 border-b border-gray-100 last:border-0 mt-4">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between py-3 border-b border-gray-100 last:border-0 text-green-600">
                <span>Discount ({appliedCoupon.code})</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-3 border-b border-gray-100 last:border-0">
              <span>Tax <span className="text-gray-500 text-sm">{taxRate}%</span></span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-4 mt-2 text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-4 items-center">
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
              <p className="font-semibold">Amazon Payment Services</p>
              <p>You will be redirected to Amazon Payment Services to complete your secure transaction.</p>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Billing Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    className="mt-1 block w-full rounded-md border-slate-400 bg-white border p-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={customerDetails.name}
                    onChange={e => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    className="mt-1 block w-full rounded-md border-slate-400 bg-white border p-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={customerDetails.email}
                    onChange={e => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {paymentError}
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <button type="button" onClick={() => setStep('REVIEW')} className="text-gray-600 hover:underline">Back to Review</button>
              <Button type="submit" isLoading={isProcessing} disabled={isProcessing} className="w-full md:w-auto text-lg py-3 px-8">
                Pay ${total.toFixed(2)}
              </Button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-4">
              By clicking "Pay", you agree to be redirected to Amazon Payment Services.
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
