
import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, TicketCategory, BookingType } from '../types';

// --- USER SCHEMA ---
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // In prod, select: false to hide by default
  role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER },
  createdAt: { type: Date, default: Date.now }
});

// --- STAFF SCHEMA ---
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
});

// --- ACTIVITY SCHEMA ---
const ActivitySchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  capacityPerSlot: { type: Number, required: true },
  color: { type: String, default: 'bg-blue-100 text-blue-800' },
  assignedStaffIds: [{ type: String }] // References Staff._id or custom string IDs
});

// --- TICKET SCHEMA ---
const TicketSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, enum: Object.values(TicketCategory), required: true }
});

// --- SLOT SCHEMA ---
const ActivitySlotSchema = new Schema({
  activityId: { type: String, required: true, index: true },
  staffIds: [{ type: String, required: true }],
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true },   // HH:mm
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  bookedCount: { type: Number, default: 0 }
});

// --- BOOKING SCHEMA ---
const CartItemSchema = new Schema({
  type: { type: String, enum: Object.values(BookingType), required: true },
  referenceId: { type: String, required: true }, // ticketId or slotId
  title: { type: String, required: true },
  subtitle: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  details: { type: Schema.Types.Mixed }
}, { _id: false });

const BookingSchema = new Schema({
  userId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  items: [CartItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['PAID', 'PENDING', 'CANCELLED'], default: 'PENDING' },
  scanned: { type: Boolean, default: false },
  qrCodeData: { type: String }, // JSON string
  createdAt: { type: Date, default: Date.now }
});

// --- EXPORTS ---
// Helper to prevent overwriting models during hot reload
const getModel = (name: string, schema: Schema) => {
  return mongoose.models[name] || mongoose.model(name, schema);
};

export const UserModel = getModel('User', UserSchema);
export const StaffModel = getModel('Staff', StaffSchema);
export const ActivityModel = getModel('Activity', ActivitySchema);
export const TicketModel = getModel('Ticket', TicketSchema);
export const SlotModel = getModel('ActivitySlot', ActivitySlotSchema);
export const BookingModel = getModel('Booking', BookingSchema);
