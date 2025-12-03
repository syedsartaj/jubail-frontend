
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MockDB } from '../../services/storage';
import { AuthService } from '../../services/auth';
import { Ticket, ActivitySlot, BookingType, CartItem, Activity } from '../../types';
import { Button } from '../../components/ui/Button';
import { Clock, Calendar, Ticket as TicketIcon, AlertCircle, UserX, Check } from 'lucide-react';

const Shop: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [slots, setSlots] = useState<ActivitySlot[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for button feedback animation
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);

  useEffect(() => {
    setTickets(MockDB.getTickets());
    setActivities(MockDB.getActivities());
    
    // Refresh slots whenever date changes
    const allSlots = MockDB.getSlots();
    // Filter slots for selected date
    const daySlots = allSlots.filter(s => s.date === selectedDate).sort((a,b) => a.startTime.localeCompare(b.startTime));
    setSlots(daySlots);

    const storedCart = sessionStorage.getItem('cart');
    if (storedCart) setCart(JSON.parse(storedCart));
  }, [selectedDate]);

  const addToCart = (item: CartItem) => {
    // Check Authentication
    const user = AuthService.getCurrentUser();
    if (!user) {
      // Redirect to login, passing the current location to return to
      navigate('/login', { state: { from: location } });
      return;
    }

    const newCart = [...cart, item];
    setCart(newCart);
    sessionStorage.setItem('cart', JSON.stringify(newCart));

    // Show feedback
    setAddedItemIds(prev => [...prev, item.referenceId]);
    setTimeout(() => {
      setAddedItemIds(prev => prev.filter(id => id !== item.referenceId));
    }, 1500);
  };

  const getCartQuantityForSlot = (slotId: string) => {
    return cart.filter(item => item.type === BookingType.ACTIVITY && item.referenceId === slotId).length;
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900">Plan Your Visit</h1>
          <p className="mt-4 text-gray-600">Choose your entry tickets and adventure slots below.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Tickets */}
          <div className="lg:col-span-2 space-y-12">
            {/* Park Tickets */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center text-indigo-700">
                <TicketIcon className="mr-2" /> Park Entry Tickets
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.map(ticket => {
                  const isAdded = addedItemIds.includes(ticket.id);
                  return (
                    <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{ticket.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-bold text-indigo-500">{ticket.category}</p>
                        <p className="text-gray-600 mt-4">{ticket.description}</p>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-2xl font-bold text-slate-900">${ticket.price}</span>
                        <Button 
                          variant={isAdded ? 'secondary' : 'primary'}
                          onClick={() => addToCart({
                            id: Date.now().toString(),
                            type: BookingType.TICKET,
                            referenceId: ticket.id,
                            title: ticket.title,
                            quantity: 1,
                            price: ticket.price
                          })}
                        >
                          {isAdded ? (
                            <span className="flex items-center"><Check className="w-4 h-4 mr-2" /> Added!</span>
                          ) : 'Add to Cart'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Dynamic Activities */}
            <section>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold flex items-center text-teal-700">
                  <Clock className="mr-2" /> Adventures & Activities
                </h2>
                <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-gray-300 shadow-sm">
                  <div className="px-3 text-slate-700 font-bold">Date:</div>
                  <input 
                    type="date" 
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border-slate-400 bg-white border rounded-md px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-bold"
                  />
                </div>
              </div>
              
              <div className="space-y-8">
                {activities.map(activity => {
                  const activitySlots = slots.filter(s => s.activityId === activity.id);
                  // Check availability: Do slots exist? And do they have staff assigned?
                  const hasStaffScheduled = activitySlots.some(s => s.staffIds && s.staffIds.length > 0);

                  return (
                    <div key={activity.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      {/* Activity Header */}
                      <div className={`p-4 ${activity.color}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold">{activity.title}</h3>
                            <p className="text-sm opacity-90">{activity.description}</p>
                          </div>
                          <div className="text-right">
                             <div className="flex gap-4 mt-2 text-xs font-bold uppercase tracking-wider justify-end">
                              <span>{activity.durationMinutes} Mins</span>
                              <span>${activity.price} / person</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Slots Grid or Unavailable Message */}
                      <div className="p-4">
                        {hasStaffScheduled ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {activitySlots.map(slot => {
                              const inCartCount = getCartQuantityForSlot(slot.id);
                              // Actual available is db capacity - already booked - currently in cart
                              const available = slot.capacity - slot.bookedCount - inCartCount;
                              const isSoldOut = available <= 0;
                              const isAdded = addedItemIds.includes(slot.id);
                              
                              return (
                                <div key={slot.id} className={`border rounded-lg p-3 transition-colors ${isSoldOut ? 'bg-gray-50 border-gray-200 opacity-70' : 'hover:border-teal-500 border-gray-200 bg-white'}`}>
                                  <div className="flex justify-between font-medium mb-1 items-center">
                                    <span className="text-lg text-slate-800">{slot.startTime}</span>
                                    {available <= 2 && !isSoldOut && <span className="text-orange-600 text-xs font-bold">{available} left</span>}
                                    {isSoldOut && <span className="text-red-500 text-xs font-bold">FULL</span>}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant={isAdded ? 'secondary' : (isSoldOut ? 'outline' : 'secondary')} 
                                    className={`w-full mt-2 ${isSoldOut ? 'cursor-not-allowed text-gray-400' : ''}`}
                                    disabled={isSoldOut}
                                    onClick={() => addToCart({
                                      id: Date.now().toString(),
                                      type: BookingType.ACTIVITY,
                                      referenceId: slot.id,
                                      title: `${activity.title}`,
                                      subtitle: `${slot.date} @ ${slot.startTime}`,
                                      quantity: 1,
                                      price: slot.price
                                    })}
                                  >
                                    {isAdded ? (
                                      <span className="flex items-center justify-center"><Check className="w-3 h-3 mr-1" /> Added</span>
                                    ) : (isSoldOut ? 'Sold Out' : 'Book Now')}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                             <div className="bg-gray-200 p-3 rounded-full mb-3">
                               <UserX className="w-6 h-6 text-gray-500" />
                             </div>
                             <p className="font-bold text-gray-700 text-lg">Service Not Available</p>
                             <p className="text-sm text-gray-500">No staff members are scheduled for this activity on {selectedDate}.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Your Cart</h3>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{item.title}</p>
                        {item.subtitle && <p className="text-xs text-gray-500">{item.subtitle}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-slate-900">${item.price}</p>
                        <button 
                          onClick={() => {
                            const newCart = [...cart];
                            newCart.splice(idx, 1);
                            setCart(newCart);
                            sessionStorage.setItem('cart', JSON.stringify(newCart));
                          }}
                          className="text-xs text-red-500 hover:text-red-700 mt-1 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-bold text-slate-800">Total</span>
                      <span className="text-xl font-bold text-indigo-600">
                        ${cart.reduce((sum, item) => sum + item.price, 0)}
                      </span>
                    </div>
                    <Button 
                      className="w-full shadow-md" 
                      onClick={() => navigate('/checkout')}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
