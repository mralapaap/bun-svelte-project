// src/lib/server/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: integer('id').primaryKey(),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	createdAt: integer('created_at').notNull()
});

// New inventory table
export const item = sqliteTable('item', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	quantity: integer('quantity').notNull(),
	price: integer('price').notNull(), // price in cents for better precision
	createdAt: integer('created_at').notNull(), // Unix timestamp
	updatedAt: integer('updated_at').notNull()
});
