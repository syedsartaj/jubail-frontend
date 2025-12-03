
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER'
}

export enum BookingType {
  TICKET = 'TICKET',
  ACTIVITY = 'ACTIVITY'
}

export enum TicketCategory {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
  VIP = 'VIP'
}

// Staff & Scheduling Types
export interface WorkHours {
  start: string; // "09:00"
  end: string;   // "17:00"
  active: boolean;
}

export interface WeeklySchedule {
  [key: string]: WorkHours; // "Monday", "Tuesday", etc.
}

export interface Staff {
  id: string;
  name: string;
  role: string; // e.g., "Senior Guide", "Instructor"
  schedule: WeeklySchedule;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  capacityPerSlot: number;
  color: string; // For UI differentiation
  assignedStaffIds: string[]; // IDs of staff qualified for this
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string; // Mock only
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  price: number;
  category: TicketCategory;
}

export interface ActivitySlot {
  id: string;
  activityId: string;
  staffId: string; // The specific staff member assigned
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  price: number;
  capacity: number;
  bookedCount: number;
}

export interface CartItem {
  id: string; // unique cart item id
  type: BookingType;
  referenceId: string; // ticketId or slotId
  title: string;
  subtitle?: string; // e.g., time for kayak
  quantity: number;
  price: number;
  details?: any;
}

export interface Booking {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  scanned: boolean;
  createdAt: string;
  qrCodeData: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
