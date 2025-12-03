
import React, { useState, useEffect } from 'react';
import { MockDB } from '../../services/storage';
import { Ticket, ActivitySlot, BookingType, CartItem, Activity } from '../../types';
import { Button } from '../../components/ui/Button';
import { Clock, Calendar, Ticket as TicketIcon, User } from 'lucide-react';

const Shop: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [slots, setSlots] = useState<ActivitySlot[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setTickets(MockDB.getTickets());
    setActivities(MockDB.getActivities());
    
    const allSlots = MockDB.getSlots();
    // Filter slots for selected date
    const daySlots = allSlots.filter(s => s.date === selectedDate).sort((a,b) => a.startTime.localeCompare(b.startTime));
    setSlots(daySlots);

    // Load cart from session if exists (simplified to local state for now)
    const storedCart = sessionStorage.getItem('cart');
    if (storedCart) setCart(JSON.parse(storedCart));
  }, [selectedDate]);

  const addToCart = (item: CartItem) => {
    const newCart = [...cart, item];
    setCart(newCart);
    sessionStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getActivity = (id: string) => activities.find(a => a.id === id);

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
                {tickets.map(ticket => (
                  <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{ticket.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-bold text-indigo-500">{ticket.category}</p>
                      <p className="text-gray-600 mt-4">{ticket.description}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-2xl font-bold text-slate-900">${ticket.price}</span>
                      <Button 
                        onClick={() => addToCart({
                          id: Date.now().toString(),
                          type: BookingType.TICKET,
                          referenceId: ticket.id,
                          title: ticket.title,
                          quantity: 1,
                          price: ticket.price
                        })}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Dynamic Activities */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center text-teal-700">
                  <Clock className="mr-2" /> Adventures & Activities
                </h2>
                <div className="flex items-center space-x-2">
                  <Calendar className="text-gray-500" size={20} />
                  <input 
                    type="date" 
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border rounded-md px-3 py-1.5 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
              
              {slots.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500">No activity slots available for this date.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Group slots by Activity Type */}
                  {activities.map(activity => {
                    const activitySlots = slots.filter(s => s.activityId === activity.id);
                    if (activitySlots.length === 0) return null;

                    return (
                      <div key={activity.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className={`p-4 ${activity.color}`}>
                          <h3 className="text-lg font-bold">{activity.title}</h3>
                          <p className="text-sm opacity-80">{activity.description}</p>
                          <div className="flex gap-4 mt-2 text-xs font-semibold uppercase tracking-wider">
                            <span>{activity.durationMinutes} Mins</span>
                            <span>${activity.price} / person</span>
                          </div>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {activitySlots.map(slot => {
                            const available = slot.capacity - slot.bookedCount;
                            const isSoldOut = available <= 0;
                            
                            return (
                              <div key={slot.id} className={`border rounded-lg p-3 ${isSoldOut ? 'opacity-50 bg-gray-50' : 'hover:border-teal-500'}`}>
                                <div className="flex justify-between font-medium mb-1">
                                  <span>{slot.startTime}</span>
                                  {available <= 5 && !isSoldOut && <span className="text-orange-500 text-xs">{available} left</span>}
                                  {isSoldOut && <span className="text-red-500 text-xs">Full</span>}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant={isSoldOut ? 'outline' : 'secondary'} 
                                  className="w-full mt-2"
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
                                  Book
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Your Cart</h3>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm">Your cart is empty.</p>
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
                          className="text-xs text-red-500 hover:text-red-700 mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-xl font-bold text-indigo-600">
                        ${cart.reduce((sum, item) => sum + item.price, 0)}
                      </span>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => window.location.hash = '#/checkout'}
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
