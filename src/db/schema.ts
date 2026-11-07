import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "disponible",
  "loue",
  "maintenance",
]);
export const reservationStatusEnum = pgEnum("reservation_status", [
  "en_attente",
  "confirmee",
  "annulee",
  "terminee",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  brand: varchar("brand", { length: 80 }).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  year: integer("year").notNull(),
  licensePlate: varchar("license_plate", { length: 20 }).notNull().unique(),
  category: varchar("category", { length: 60 }).notNull().default("Berline"),
  seats: integer("seats").notNull().default(5),
  transmission: varchar("transmission", { length: 20 }).notNull().default("Automatique"),
  fuel: varchar("fuel", { length: 20 }).notNull().default("Diesel"),
  pricePerDay: numeric("price_per_day", { precision: 10, scale: 2 }).notNull(),
  status: vehicleStatusEnum("status").notNull().default("disponible"),
  imageUrl: text("image_url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: reservationStatusEnum("status").notNull().default("en_attente"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
