import { db } from '$lib/server/db';
import { item } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, type RequestEvent } from '@sveltejs/kit';

// GET all items
export async function GET({}: RequestEvent) {
    try {
        const items = await db.select().from(item);
        return json(items);
    } catch (error) {
        console.error(error);
        return json({ error: 'Failed to fetch items.' }, { status: 500 });
    }
}

// POST create a new item
export async function POST({ request }: RequestEvent) {
    try {
        const data = await request.json();
        const { name, quantity, price, description } = data;

        if (!name || quantity == null || price == null) {
            return json({ error: 'Missing name, quantity, or price.' }, { status: 400 });
        }

        const now = Date.now();

        await db.insert(item).values({
            name,
            quantity,
            price,
            description,
            createdAt: now,
            updatedAt: now
        }).execute();

        return json({ success: true, message: 'Item added.' });
    } catch (error) {
        console.error(error);
        return json({ error: 'Failed to add item.' }, { status: 500 });
    }
}

// PUT update an item
export async function PUT({ request }: RequestEvent) {
    try {
        const data = await request.json();
        const { id, name, quantity, price, description } = data;

        if (!id || !name || quantity == null || price == null) {
            return json({ error: 'Missing id, name, quantity, or price.' }, { status: 400 });
        }

        const now = Date.now();

        await db.update(item)
            .set({
                name,
                quantity,
                price,
                description,
                updatedAt: now
            })
            .where(eq(item.id, id))
            .execute();

        return json({ success: true, message: 'Item updated.' });
    } catch (error) {
        console.error(error);
        return json({ error: 'Failed to update item.' }, { status: 500 });
    }
}

// DELETE remove an item
export async function DELETE({ request }: RequestEvent) {
    try {
        const data = await request.json();
        const { id } = data;

        if (!id) {
            return json({ error: 'Missing id.' }, { status: 400 });
        }

        await db.delete(item)
            .where(eq(item.id, id))
            .execute();

        return json({ success: true, message: 'Item deleted.' });
    } catch (error) {
        console.error(error);
        return json({ error: 'Failed to delete item.' }, { status: 500 });
    }
}
