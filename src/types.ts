export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF'
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

export enum DiscountType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED'
}

export enum RecurrencePattern {
  DAILY = 'DAILY',
  WEEKDAYS = 'WEEKDAYS',
  WEEKENDS = 'WEEKENDS',
  CUSTOM = 'CUSTOM'
}

// Global Settings
export interface SystemSettings {
  taxPercentage: number;
}

export interface ActivityCategory {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // e.g., 10 for 10% or 10$
  isActive: boolean;
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
  _id?: string;        // <-- Add this
  id?: string;         // optional if you still want
  name: string;
  role: string; // e.g., "Senior Guide", "Instructor"
  schedule: WeeklySchedule;
}

export interface Activity {
  _id?: string;        // <-- Add this
  id?: string;
  categoryId: string; // Linked to ActivityCategory
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

// --- OPTIMIZED SCHEDULE LOGIC ---
export interface ScheduleRule {
  id?: string;
  _id?: string;
  activityId: string;
  staffIds: string[]; // Staff assigned to this rule
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string;   // ISO Date YYYY-MM-DD
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  pattern: RecurrencePattern;
  customDays?: string[]; // For CUSTOM pattern (['Monday', 'Wednesday'])
  price: number;
  capacity: number;
}

export interface ActivitySlot {
  _id?: string;
  id?: string;
  activityId: string;
  staffIds: string[]; 
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  price: number;
  capacity: number;
  bookedCount: number;
  isGenerated?: boolean; // Flag to identify rule-based slots vs manual
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
  id?: string;
  _id?: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  taxAmount: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  
  // New Fields for POS & Reporting
  paymentMethod?: 'CARD' | 'CASH' | 'ONLINE'; 
  manualTxnId?: string; // For POS Online payments
  createdByStaffId?: string; // To track which staff made the sale
  createdByStaffEmail?: string;
  scanned: boolean;
  createdAt: string;
  qrCodeData: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}