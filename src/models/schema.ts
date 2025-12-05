import mongoose, { Schema, Document } from 'mongoose';

// --- ENUMS (Matching Frontend) ---
export const UserRole = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF'
};

export const BookingType = {
  TICKET: 'TICKET',
  ACTIVITY: 'ACTIVITY'
};

export const TicketCategory = {
  ADULT: 'ADULT',
  CHILD: 'CHILD',
  VIP: 'VIP'
};

export const DiscountType = {
  PERCENT: 'PERCENT',
  FIXED: 'FIXED'
};

export const RecurrencePattern = {
  DAILY: 'DAILY',
  WEEKDAYS: 'WEEKDAYS',
  WEEKENDS: 'WEEKENDS',
  CUSTOM: 'CUSTOM'
};

// --- SCHEMAS ---

// 1. USER
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true }, // Should be hashed
  role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER },
}, { timestamps: true });

// 2. ACTIVITY CATEGORY
const CategorySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

// 3. ACTIVITY
const ActivitySchema = new Schema({
  categoryId: { type: String, required: true, index: true }, // References Category ID (or Object ID if strict)
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  capacityPerSlot: { type: Number, required: true },
  color: { type: String, default: 'bg-blue-100 text-blue-800' },
  assignedStaffIds: [{ type: String }] // Array of Staff IDs
}, { timestamps: true });

// 4. TICKET
const TicketSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, enum: Object.values(TicketCategory), required: true }
}, { timestamps: true });

// 5. STAFF
const WorkHoursSchema = new Schema({
  start: { type: String, required: true }, // "09:00"
  end: { type: String, required: true },   // "17:00"
  active: { type: Boolean, default: true }
}, { _id: false });

const WeeklyScheduleSchema = new Schema({
  Monday: WorkHoursSchema,
  Tuesday: WorkHoursSchema,
  Wednesday: WorkHoursSchema,
  Thursday: WorkHoursSchema,
  Friday: WorkHoursSchema,
  Saturday: WorkHoursSchema,
  Sunday: WorkHoursSchema,
}, { _id: false });

const StaffSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  schedule: { type: WeeklyScheduleSchema, required: true }
}, { timestamps: true });

// 6. SLOT (Schedule)
const SlotSchema = new Schema({
  activityId: { type: String, required: true, index: true },
  staffIds: [{ type: String }],
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true },   // HH:mm
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  bookedCount: { type: Number, default: 0 },
  isGenerated: { type: Boolean, default: false }
}, { timestamps: true });

// 7. COUPON
const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: Object.values(DiscountType), required: true },
  value: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 8. BOOKING
const CartItemSchema = new Schema({
  type: { type: String, enum: Object.values(BookingType), required: true },
  referenceId: { type: String, required: true }, // Slot ID or Ticket ID
  title: { type: String, required: true },
  subtitle: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  details: { type: Schema.Types.Mixed }
}, { _id: false });

const BookingSchema = new Schema({
  userId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  items: [CartItemSchema],
  
  // Financials
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  status: { type: String, enum: ['PAID', 'PENDING', 'CANCELLED'], default: 'PENDING' },
  
  // POS & Payment Tracking
  paymentMethod: { type: String, enum: ['CARD', 'CASH', 'ONLINE'], default: 'CARD' },
  manualTxnId: { type: String },
  createdByStaffId: { type: String },

  // Access Control
  scanned: { type: Boolean, default: false },
  qrCodeData: { type: String }, // JSON string
}, { timestamps: true });

// --- MODELS EXPORT ---
// Using helper to prevent overwrite error during hot-reload in dev
const getModel = (name: string, schema: Schema) => {
  return mongoose.models[name] || mongoose.model(name, schema);
};

export const User = getModel('User', UserSchema);
export const Category = getModel('Category', CategorySchema);
export const Activity = getModel('Activity', ActivitySchema);
export const Ticket = getModel('Ticket', TicketSchema);
export const Staff = getModel('Staff', StaffSchema);
export const Slot = getModel('Slot', SlotSchema);
export const Coupon = getModel('Coupon', CouponSchema);
export const Booking = getModel('Booking', BookingSchema);