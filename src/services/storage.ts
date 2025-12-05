import { User, Ticket, ActivitySlot, Booking, UserRole, TicketCategory, BookingType, Staff, Activity, WeeklySchedule, SystemSettings, Coupon, DiscountType, ActivityCategory, ScheduleRule, RecurrencePattern } from '../types';

const STORAGE_KEYS = {
  USERS: 'riverrun_users',
  TICKETS: 'riverrun_tickets',
  SLOTS: 'riverrun_slots', // Stores MANUAL slots only
  SCHEDULE_RULES: 'riverrun_schedule_rules', // Stores OPTIMIZED rules
  BOOKINGS: 'riverrun_bookings',
  STAFF: 'riverrun_staff',
  ACTIVITIES: 'riverrun_activities',
  CATEGORIES: 'riverrun_categories',
  SETTINGS: 'riverrun_settings',
  COUPONS: 'riverrun_coupons'
};

// Initial Seed Data
const INITIAL_TICKETS: Ticket[] = [
  { id: 't1', title: 'General Admission (Adult)', description: 'Full access to the park grounds.', price: 25, category: TicketCategory.ADULT },
  { id: 't2', title: 'Child Pass (Under 12)', description: 'Access for children. Must be accompanied by an adult.', price: 15, category: TicketCategory.CHILD },
  { id: 't3', title: 'VIP All-Access', description: 'Priority entry, lounge access, and free drink.', price: 60, category: TicketCategory.VIP },
];

const DEFAULT_SCHEDULE: WeeklySchedule = {
  Monday: { start: '09:00', end: '17:00', active: true },
  Tuesday: { start: '09:00', end: '17:00', active: true },
  Wednesday: { start: '09:00', end: '17:00', active: true },
  Thursday: { start: '09:00', end: '17:00', active: true },
  Friday: { start: '09:00', end: '17:00', active: true },
  Saturday: { start: '08:00', end: '18:00', active: true },
  Sunday: { start: '08:00', end: '18:00', active: true },
};

const INITIAL_STAFF: Staff[] = [
  { id: 's1', name: 'Sarah Jenkins', role: 'Senior Kayak Guide', schedule: { ...DEFAULT_SCHEDULE } },
  { id: 's2', name: 'Mike Ross', role: 'Hiking Instructor', schedule: { ...DEFAULT_SCHEDULE, Monday: { ...DEFAULT_SCHEDULE.Monday, active: false } } }, 
];

const INITIAL_CATEGORIES: ActivityCategory[] = [
  { id: 'cat_water', name: 'Water Sports', description: 'Kayaking, rafting, and swimming activities.' },
  { id: 'cat_land', name: 'Land Adventures', description: 'Hiking, trekking, and nature walks.' }
];

const INITIAL_ACTIVITIES: Activity[] = [
  { 
    id: 'a1', 
    categoryId: 'cat_water',
    title: 'Kayaking Adventure', 
    description: 'Paddle through the scenic river route.', 
    price: 30, 
    durationMinutes: 60, 
    capacityPerSlot: 10, 
    color: 'bg-teal-100 text-teal-800', 
    assignedStaffIds: ['s1'] 
  },
  { 
    id: 'a2', 
    categoryId: 'cat_land',
    title: 'Guided Forest Hike', 
    description: 'Explore the ancient woods with an expert.', 
    price: 45, 
    durationMinutes: 120, 
    capacityPerSlot: 15, 
    color: 'bg-green-100 text-green-800', 
    assignedStaffIds: ['s2'] 
  }
];

const INITIAL_SETTINGS: SystemSettings = { taxPercentage: 5.0 };
const INITIAL_COUPONS: Coupon[] = [
  { id: 'c1', code: 'WELCOME10', type: DiscountType.PERCENT, value: 10, isActive: true },
  { id: 'c2', code: 'SAVE5', type: DiscountType.FIXED, value: 5, isActive: true }
];

// --- HELPER: Time Manipulation ---
const addMinutes = (time: string, mins: number) => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + mins);
  return date.toTimeString().slice(0, 5);
};

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  const dayIndex = new Date(date.getTime() + date.getTimezoneOffset() * 60000).getDay(); 
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};

const isWeekend = (dateStr: string) => {
  const day = getDayName(dateStr);
  return day === 'Saturday' || day === 'Sunday';
};

export const MockDB = {
  // --- SETTINGS ---
  getSettings: (): SystemSettings => {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS)); return INITIAL_SETTINGS; }
    return JSON.parse(stored);
  },
  saveSettings: (settings: SystemSettings) => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)),

  // --- COUPONS ---
  getCoupons: (): Coupon[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.COUPONS);
    if (!stored) { localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(INITIAL_COUPONS)); return INITIAL_COUPONS; }
    return JSON.parse(stored);
  },
  saveCoupon: (coupon: Coupon) => {
    const list = MockDB.getCoupons();
    const index = list.findIndex(c => c.id === coupon.id);
    if (index >= 0) list[index] = coupon; else list.push(coupon);
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(list));
  },
  deleteCoupon: (id: string) => {
    const list = MockDB.getCoupons().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(list));
  },
  findCouponByCode: (code: string) => MockDB.getCoupons().find(c => c.code === code && c.isActive),

  // --- USERS ---
  getUsers: (): User[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    return stored ? JSON.parse(stored) : [];
  },
  saveUser: (user: User) => {
    const users = MockDB.getUsers();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  findUserByEmail: (email: string) => MockDB.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()),

  // --- CATEGORIES ---
  getCategories: (): ActivityCategory[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!stored) { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES)); return INITIAL_CATEGORIES; }
    return JSON.parse(stored);
  },
  saveCategory: (category: ActivityCategory) => {
    const list = MockDB.getCategories();
    const index = list.findIndex(c => c.id === category.id);
    if (index >= 0) list[index] = category; else list.push(category);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
  },
  deleteCategory: (id: string) => {
    const list = MockDB.getCategories().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
  },

  // --- STAFF ---
  getStaff: (): Staff[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!stored) { localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF)); return INITIAL_STAFF; }
    return JSON.parse(stored);
  },
  saveStaff: (staff: Staff) => {
    const list = MockDB.getStaff();
    const index = list.findIndex(s => s.id === staff.id);
    if (index >= 0) list[index] = staff; else list.push(staff);
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
  },
  deleteStaff: (id: string) => {
    const list = MockDB.getStaff().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
  },

  // --- ACTIVITIES ---
  getActivities: (): Activity[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!stored) { localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES)); return INITIAL_ACTIVITIES; }
    return JSON.parse(stored);
  },
  saveActivity: (activity: Activity) => {
    const list = MockDB.getActivities();
    const index = list.findIndex(a => a.id === activity.id);
    if (index >= 0) list[index] = activity; else list.push(activity);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(list));
  },
  deleteActivity: (id: string) => {
    const list = MockDB.getActivities().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(list));
  },

  // --- TICKETS ---
  getTickets: (): Ticket[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!stored) { localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS)); return INITIAL_TICKETS; }
    return JSON.parse(stored);
  },
  saveTicket: (ticket: Ticket) => {
    const tickets = MockDB.getTickets();
    const index = tickets.findIndex(t => t.id === ticket.id);
    if (index >= 0) tickets[index] = ticket; else tickets.push(ticket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },
  deleteTicket: (id: string) => {
    const tickets = MockDB.getTickets().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },

  // --- SCHEDULE RULES ---
  getScheduleRules: (): ScheduleRule[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.SCHEDULE_RULES);
    return stored ? JSON.parse(stored) : [];
  },
  saveScheduleRule: (rule: ScheduleRule) => {
    const list = MockDB.getScheduleRules();
    list.push(rule);
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_RULES, JSON.stringify(list));
  },
  deleteScheduleRule: (id: string) => {
    const list = MockDB.getScheduleRules().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_RULES, JSON.stringify(list));
  },

  // --- DYNAMIC SLOT GENERATION ---
  getSlotsForDate: (date: string): ActivitySlot[] => {
    const generatedSlots: ActivitySlot[] = [];
    const rules = MockDB.getScheduleRules();
    const activities = MockDB.getActivities();
    const bookings = MockDB.getBookings(); 

    const targetDate = new Date(date);
    const dayName = getDayName(date);
    const isDayWeekend = isWeekend(date);

    rules.forEach(rule => {
      if (date < rule.startDate || date > rule.endDate) return;
      if (rule.pattern === RecurrencePattern.WEEKDAYS && isDayWeekend) return;
      if (rule.pattern === RecurrencePattern.WEEKENDS && !isDayWeekend) return;
      if (rule.pattern === RecurrencePattern.CUSTOM && !rule.customDays?.includes(dayName)) return;

      const activity = activities.find(a => a.id === rule.activityId);
      if (!activity) return;

      let currentTime = rule.startTime;
      while (true) {
        const nextTime = addMinutes(currentTime, activity.durationMinutes);
        if (nextTime > rule.endTime || nextTime < currentTime) break;

        const slotId = `gen_${date}_${rule.activityId}_${currentTime.replace(':','')}`;
        
        const bookedCount = bookings.reduce((count, booking) => {
            const items = booking.items.filter(item => item.type === BookingType.ACTIVITY && item.referenceId === slotId);
            return count + items.reduce((sum, i) => sum + i.quantity, 0);
        }, 0);

        generatedSlots.push({
          id: slotId,
          activityId: rule.activityId,
          staffIds: rule.staffIds,
          date: date,
          startTime: currentTime,
          endTime: nextTime,
          price: rule.price,
          capacity: rule.capacity,
          bookedCount: bookedCount,
          isGenerated: true
        });

        currentTime = nextTime; 
      }
    });

    // Merge Manual
    const storedManualSlots = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLOTS) || '[]');
    const manualForDate = storedManualSlots.filter((s: ActivitySlot) => s.date === date);
    
    const finalManualSlots = manualForDate.map((slot: ActivitySlot) => {
        const bookedCount = bookings.reduce((count, booking) => {
            const items = booking.items.filter(item => item.type === BookingType.ACTIVITY && item.referenceId === slot.id);
            return count + items.reduce((sum, i) => sum + i.quantity, 0);
        }, 0);
        return { ...slot, bookedCount };
    });

    return [...generatedSlots, ...finalManualSlots];
  },

  getSlots: (): ActivitySlot[] => {
    const today = new Date().toISOString().split('T')[0];
    return MockDB.getSlotsForDate(today);
  },

  saveSlot: (slot: ActivitySlot) => {
    const slots = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLOTS) || '[]');
    const index = slots.findIndex((s: ActivitySlot) => s.id === slot.id);
    if (index >= 0) slots[index] = slot; else slots.push(slot);
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  },
  
  deleteSlot: (id: string) => {
    const slots = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLOTS) || '[]');
    const filtered = slots.filter((s: ActivitySlot) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(filtered));
  },

  updateSlotBooking: (slotId: string, quantity: number) => {
    return; // Dynamic calculation handles this
  },

  // --- BOOKINGS ---
  getBookings: (): Booking[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return stored ? JSON.parse(stored) : [];
  },
  createBooking: (booking: Booking) => {
    const bookings = MockDB.getBookings();
    bookings.unshift(booking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  },
  markBookingScanned: (bookingId: string) => {
    const bookings = MockDB.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index >= 0) {
      bookings[index].scanned = true;
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return bookings[index];
    }
    return null;
  }
};

// ... Seed logic ...
if (!MockDB.findUserByEmail('admin@riverrun.com')) {
  MockDB.saveUser({ id: 'admin-1', name: 'Admin User', email: 'admin@riverrun.com', role: UserRole.ADMIN, passwordHash: 'secret' });
}
if (!MockDB.findUserByEmail('staff@riverrun.com')) {
  MockDB.saveUser({ id: 'staff-1', name: 'Staff Member', email: 'staff@riverrun.com', role: UserRole.STAFF, passwordHash: 'secret' });
}
if (!MockDB.findUserByEmail('customer@riverrun.com')) {
  MockDB.saveUser({ id: 'cust-1', name: 'Jane Doe', email: 'customer@riverrun.com', role: UserRole.CUSTOMER, passwordHash: 'secret' });
}