
import { User, Ticket, ActivitySlot, Booking, UserRole, TicketCategory, BookingType, Staff, Activity, WeeklySchedule } from '../types';

const STORAGE_KEYS = {
  USERS: 'riverrun_users',
  TICKETS: 'riverrun_tickets',
  SLOTS: 'riverrun_slots',
  BOOKINGS: 'riverrun_bookings',
  STAFF: 'riverrun_staff',
  ACTIVITIES: 'riverrun_activities'
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
  { id: 's2', name: 'Mike Ross', role: 'Hiking Instructor', schedule: { ...DEFAULT_SCHEDULE, Monday: { ...DEFAULT_SCHEDULE.Monday, active: false } } }, // Mike is off Mondays
];

const INITIAL_ACTIVITIES: Activity[] = [
  { 
    id: 'a1', 
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
    title: 'Guided Forest Hike', 
    description: 'Explore the ancient woods with an expert.', 
    price: 45, 
    durationMinutes: 120, 
    capacityPerSlot: 15, 
    color: 'bg-green-100 text-green-800', 
    assignedStaffIds: ['s2'] 
  }
];

export const MockDB = {
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
  findUserByEmail: (email: string): User | undefined => {
    return MockDB.getUsers().find(u => u.email === email);
  },

  // --- STAFF ---
  getStaff: (): Staff[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    return JSON.parse(stored);
  },
  saveStaff: (staff: Staff) => {
    const list = MockDB.getStaff();
    const index = list.findIndex(s => s.id === staff.id);
    if (index >= 0) list[index] = staff;
    else list.push(staff);
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
  },
  deleteStaff: (id: string) => {
    const list = MockDB.getStaff().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
  },

  // --- ACTIVITIES ---
  getActivities: (): Activity[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
      return INITIAL_ACTIVITIES;
    }
    return JSON.parse(stored);
  },
  saveActivity: (activity: Activity) => {
    const list = MockDB.getActivities();
    const index = list.findIndex(a => a.id === activity.id);
    if (index >= 0) list[index] = activity;
    else list.push(activity);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(list));
  },
  deleteActivity: (id: string) => {
    const list = MockDB.getActivities().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(list));
  },

  // --- TICKETS ---
  getTickets: (): Ticket[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    return JSON.parse(stored);
  },
  saveTicket: (ticket: Ticket) => {
    const tickets = MockDB.getTickets();
    const index = tickets.findIndex(t => t.id === ticket.id);
    if (index >= 0) {
      tickets[index] = ticket;
    } else {
      tickets.push(ticket);
    }
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },
  deleteTicket: (id: string) => {
    const tickets = MockDB.getTickets().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },

  // --- SLOTS (Updated for Activities) ---
  getSlots: (): ActivitySlot[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.SLOTS);
    if (!stored) return [];
    
    const slots = JSON.parse(stored);
    
    // Migration: ensure staffIds array exists if old data had single staffId
    return slots.map((s: any) => {
      if (!s.staffIds && s.staffId) {
        return { ...s, staffIds: [s.staffId] };
      }
      return s;
    });
  },
  saveSlot: (slot: ActivitySlot) => {
    const slots = MockDB.getSlots();
    const index = slots.findIndex(s => s.id === slot.id);
    if (index >= 0) {
      slots[index] = slot;
    } else {
      slots.push(slot);
    }
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  },
  deleteSlot: (id: string) => {
    const slots = MockDB.getSlots().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  },
  updateSlotBooking: (slotId: string, quantity: number) => {
    const slots = MockDB.getSlots();
    const index = slots.findIndex(s => s.id === slotId);
    if (index >= 0) {
      slots[index].bookedCount += quantity;
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
    }
  },

  // --- BOOKINGS ---
  getBookings: (): Booking[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return stored ? JSON.parse(stored) : [];
  },
  createBooking: (booking: Booking) => {
    const bookings = MockDB.getBookings();
    bookings.unshift(booking); // Add to top
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    
    // Update availability
    booking.items.forEach(item => {
      if (item.type === BookingType.ACTIVITY) {
        MockDB.updateSlotBooking(item.referenceId, item.quantity);
      }
    });
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

// Seed Users if not exists
if (!MockDB.findUserByEmail('admin@riverrun.com')) {
  MockDB.saveUser({
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@riverrun.com',
    role: UserRole.ADMIN,
    passwordHash: 'secret'
  });
}

if (!MockDB.findUserByEmail('customer@riverrun.com')) {
  MockDB.saveUser({
    id: 'cust-1',
    name: 'Jane Doe',
    email: 'customer@riverrun.com',
    role: UserRole.CUSTOMER,
    passwordHash: 'secret'
  });
}
