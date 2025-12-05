import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Ticket, ActivitySlot, BookingType, CartItem, Activity, Coupon, DiscountType, Booking } from '../../types';
import { Button } from '../../components/ui/Button';
import { Ticket as TicketIcon, Clock, Trash2, User, CreditCard, ShoppingBag, Search, CheckCircle, DollarSign, Globe, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StaffPOS: React.FC = () => {
  // Data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [slots, setSlots] = useState<ActivitySlot[]>([]); // Consolidated to use 'slots'
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Checkout & Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Payment Mode
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE'>('CASH');
  const [onlineTxnId, setOnlineTxnId] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false); // Separate loading for slots

  const navigate = useNavigate();

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedTickets, fetchedActivities, settings] = await Promise.all([
          ApiService.getTickets(),
          ApiService.getActivities(),
          ApiService.getSettings()
        ]);
        setTickets(fetchedTickets);
        setActivities(fetchedActivities);
        setTaxPercentage(settings.taxPercentage);
      } catch (err) {
        console.error("Failed to load POS data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load Slots when Date Changes
  useEffect(() => {
    const refreshSlots = async () => {
      try {
        setSlotsLoading(true);
        const daySlots = await ApiService.getSlots(selectedDate);
        const sorted = daySlots.sort((a: ActivitySlot, b: ActivitySlot) => 
          a.startTime.localeCompare(b.startTime)
        );
        setSlots(sorted); // Correctly updating 'slots' state
      } catch (err) {
        console.error("Failed to load slots", err);
      } finally {
        setSlotsLoading(false);
      }
    };
    refreshSlots();
  }, [selectedDate]);

  // Cart Actions
  const addToCart = (item: CartItem) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === DiscountType.PERCENT) {
      discountAmount = subtotal * (appliedCoupon.value / 100);
    } else {
      discountAmount = appliedCoupon.value;
    }
  }
  discountAmount = Math.min(discountAmount, subtotal);
  
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercentage) / 100;
  const total = taxableAmount + taxAmount;

  const handleApplyCoupon = async () => {
    try {
      const allCoupons = await ApiService.getCoupons();
      const coupon = allCoupons.find(c => c.code === couponCode.toUpperCase() && c.isActive);

      if (coupon) {
        setAppliedCoupon(coupon);
        setCouponCode('');
      } else {
        alert('Invalid or expired Coupon');
      }
    } catch (err) {
      console.error(err);
      alert('Error validating coupon');
    }
  };

  const handleProcessBooking = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    if (!customerName || !customerEmail) return alert("Enter customer details");
    if (paymentMode === 'ONLINE' && !onlineTxnId) return alert("Please enter the Transaction ID for Online Payment");

    const stored = localStorage.getItem('riverrun_auth');
    const staffUser = stored ? JSON.parse(stored) : null;

    // Check if customer exists (Optional)
    // const existingCustomer = MockDB.findUserByEmail(customerEmail.trim());

    const bookingId = `pos_${Date.now()}`;
    const targetUserId = 'guest_pos'; // Let backend resolve or link

    const newBooking: Booking = {
      id: bookingId,
      userId: targetUserId,
      customerName: customerName,
      customerEmail: customerEmail,
      items: cart,
      subtotal,
      discountAmount,
      couponCode: appliedCoupon?.code,
      taxAmount,
      totalAmount: total,
      status: 'PAID',
      
      // Payment Details
      paymentMethod: paymentMode,
      manualTxnId: paymentMode === 'ONLINE' ? onlineTxnId : undefined,
      createdByStaffId: staffUser?.id, 

      scanned: false,
      createdAt: new Date().toISOString(),
      qrCodeData: JSON.stringify({ id: bookingId, valid: true, type: 'POS' })
    };

    try {
      setLoading(true);
      await ApiService.createBooking(newBooking);
      setSuccessMsg(`Booking Created!`);
      
      // Reset
      setCart([]);
      setCustomerName('');
      setCustomerEmail('');
      setAppliedCoupon(null);
      setOnlineTxnId('');
      setPaymentMode('CASH');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert("Failed to create booking.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* LEFT: Catalog */}
      <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden">
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10 shrink-0">
           <h2 className="font-bold text-lg text-slate-800">Product Catalog</h2>
           <input 
             type="date"
             value={selectedDate}
             min={new Date().toISOString().split('T')[0]}
             onChange={e => setSelectedDate(e.target.value)}
             className="border border-slate-300 rounded px-2 py-1 text-sm"
           />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>}
           
           {/* Tickets */}
           <section>
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Entry Tickets</h3>
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
               {tickets.map(ticket => (
                 <button 
                   key={ticket.id}
                   onClick={() => addToCart({
                     id: Date.now().toString(),
                     type: BookingType.TICKET,
                     referenceId: ticket.id,
                     title: ticket.title,
                     quantity: 1,
                     price: ticket.price
                   })}
                   className="flex flex-col items-start p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition text-left"
                 >
                   <span className="font-bold text-slate-900 text-sm">{ticket.title}</span>
                   <span className="text-xs text-gray-500 mb-2">{ticket.category}</span>
                   <span className="font-bold text-indigo-600">${ticket.price}</span>
                 </button>
               ))}
             </div>
           </section>

           {/* Activities */}
           <section>
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Activity Slots ({selectedDate})</h3>
             {slotsLoading ? (
               <div className="flex justify-center p-4 text-sm text-gray-500"><Loader2 className="animate-spin mr-2 w-4 h-4"/> Loading slots...</div>
             ) : (
               <div className="space-y-4">
                 {activities.map(act => {
                   // Ensure we filter correctly using 'slots' state
                   const actSlots = slots.filter(s => (s.activityId === act.id || s.activityId === (act as any)._id));
                   if (actSlots.length === 0) return null;

                   return (
                     <div key={act.id}>
                       <h4 className="font-bold text-slate-700 mb-2 text-sm">{act.title}</h4>
                       <div className="grid grid-cols-3 gap-2">
                         {actSlots.map(slot => {
                           const available = slot.capacity - slot.bookedCount;
                           const isFull = available <= 0;
                           return (
                             <button
                               key={slot.id}
                               disabled={isFull}
                               onClick={() => addToCart({
                                 id: Date.now().toString(),
                                 type: BookingType.ACTIVITY,
                                 referenceId: slot.id,
                                 title: act.title,
                                 subtitle: `${slot.startTime}`,
                                 quantity: 1,
                                 price: slot.price
                               })}
                               className={`p-2 rounded border text-center text-xs ${isFull ? 'bg-gray-100 text-gray-400' : 'bg-white hover:border-teal-500'}`}
                             >
                               <div className="font-bold">{slot.startTime}</div>
                               <div>${slot.price}</div>
                               <div className={`${available < 3 ? 'text-orange-500' : 'text-gray-400'}`}>{available} left</div>
                             </button>
                           )
                         })}
                       </div>
                     </div>
                   )
                 })}
                 {slots.length === 0 && <p className="text-sm text-gray-400 italic">No slots scheduled for this date.</p>}
               </div>
             )}
           </section>
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="w-full lg:w-96 bg-white flex flex-col shadow-xl z-20 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 h-1/2 lg:h-auto overflow-y-auto">
         <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <h2 className="font-bold flex items-center gap-2"><ShoppingBag size={18}/> Current Order</h2>
            <span className="bg-slate-700 text-xs px-2 py-1 rounded">{cart.length} items</span>
         </div>

         {/* Customer Info */}
         <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-2 shrink-0">
            <div className="flex items-center gap-2 text-slate-700 text-sm font-bold mb-1">
               <User size={14} /> Customer Details
            </div>
            <input 
              className="w-full text-sm p-2 border border-gray-300 rounded" 
              placeholder="Customer Name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            <input 
              className="w-full text-sm p-2 border border-gray-300 rounded" 
              placeholder="Customer Email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
            />
         </div>

         {/* Cart Items */}
         <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[150px]">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm">
                 Cart is empty.
              </div>
            ) : (
              cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 border border-gray-100 rounded bg-white shadow-sm">
                   <div>
                      <div className="font-bold text-sm text-slate-800">{item.title}</div>
                      {item.subtitle && <div className="text-xs text-gray-500">{item.subtitle}</div>}
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="font-bold text-sm">${item.price}</span>
                      <button onClick={() => removeFromCart(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                   </div>
                </div>
              ))
            )}
         </div>

         {/* Totals & Actions */}
         <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
            {/* Coupon */}
            <div className="flex gap-2 mb-4">
               {appliedCoupon ? (
                 <div className="flex-1 bg-green-100 text-green-800 text-xs px-2 py-1.5 rounded flex justify-between items-center">
                    <span>Coupon: <b>{appliedCoupon.code}</b></span>
                    <button onClick={() => setAppliedCoupon(null)}><Trash2 size={12}/></button>
                 </div>
               ) : (
                 <>
                   <input 
                      className="flex-1 text-sm border border-gray-300 rounded px-2"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                   />
                   <Button size="sm" variant="secondary" onClick={handleApplyCoupon}>Apply</Button>
                 </>
               )}
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-4">
               <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
               {discountAmount > 0 && (
                 <div className="flex justify-between text-green-600"><span>Discount</span><span>-${discountAmount.toFixed(2)}</span></div>
               )}
               <div className="flex justify-between"><span>Tax ({taxPercentage}%)</span><span>${taxAmount.toFixed(2)}</span></div>
               <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
               </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="mb-4">
               <div className="grid grid-cols-2 gap-2 mb-2">
                  <button 
                    onClick={() => setPaymentMode('CASH')}
                    className={`flex items-center justify-center py-2 rounded border text-sm font-bold ${paymentMode === 'CASH' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                  >
                    <DollarSign size={16} className="mr-1"/> CASH
                  </button>
                  <button 
                    onClick={() => setPaymentMode('ONLINE')}
                    className={`flex items-center justify-center py-2 rounded border text-sm font-bold ${paymentMode === 'ONLINE' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                  >
                    <Globe size={16} className="mr-1"/> ONLINE
                  </button>
               </div>
               
               {paymentMode === 'ONLINE' && (
                 <input 
                   className="w-full border border-blue-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500"
                   placeholder="Enter Transaction ID (Required)"
                   value={onlineTxnId}
                   onChange={e => setOnlineTxnId(e.target.value)}
                 />
               )}
            </div>

            {successMsg ? (
              <div className="bg-green-100 text-green-700 p-3 rounded text-center font-bold mb-2 flex items-center justify-center gap-2">
                 <CheckCircle size={16} /> {successMsg}
              </div>
            ) : (
              <Button onClick={handleProcessBooking} className="w-full h-12 text-lg" disabled={loading}>
                 {loading ? <Loader2 className="animate-spin" /> : <><CreditCard className="w-5 h-5 mr-2" /> Complete Sale</>}
              </Button>
            )}
         </div>
      </div>
    </div>
  );
};

export default StaffPOS;