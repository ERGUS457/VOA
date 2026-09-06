import { pgTable, text, timestamp, serial, numeric, date, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'ADMIN' or 'PETUGAS'
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' or 'INACTIVE'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tariffSettings = pgTable('tariff_settings', {
  id: serial('id').primaryKey(),
  voaPrice: numeric('voa_price', { precision: 12, scale: 2 }).default('500000').notNull(),
  serviceFee: numeric('service_fee', { precision: 12, scale: 2 }).default('13500').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const voaMaster = pgTable('voa_master', {
  id: uuid('id').defaultRandom().primaryKey(),
  voaNumber: text('voa_number').unique().notNull(),
  status: text('status').default('AVAILABLE').notNull(), // 'AVAILABLE', 'USED', 'CANCELLED'
  usedAt: timestamp('used_at'),
  usedById: uuid('used_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const voaTransactions = pgTable('voa_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  voaMasterId: uuid('voa_master_id').references(() => voaMaster.id).unique().notNull(),
  voaNumber: text('voa_number').unique().notNull(),
  visaReceiptNumber: text('visa_receipt_number').unique().notNull(), // Format: VR-YYYYMMDD-XXXXXX
  passportNumber: text('passport_number').notNull(),
  fullName: text('full_name').notNull(),
  nationality: text('nationality').notNull(),
  dateOfBirth: date('date_of_birth'),
  gender: text('gender'), // 'Male', 'Female', 'Other'
  photoData: text('photo_data'), // Base64 data URI string
  purchaseDate: date('purchase_date').notNull(),
  purchaseTimeStr: text('purchase_time_str').notNull(), // contoh: "08:35:21 WIB"
  voaPrice: numeric('voa_price').notNull(),
  serviceFee: numeric('service_fee').notNull(),
  totalAmount: numeric('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  qrToken: text('qr_token').unique().notNull(),
  status: text('status').default('VALID').notNull(), // 'VALID', 'CANCELLED'
  officerId: uuid('officer_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  voaId: text('voa_id'),
  description: text('description').notNull(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
