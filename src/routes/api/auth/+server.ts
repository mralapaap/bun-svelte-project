// src/routes/api/auth/+server.ts
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt-ts';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    const { email, password, mode } = await request.json();
    const now = Math.floor(Date.now() / 1000);

    if (mode === 'signup') {
      try {
        const existing = await db.select().from(user).where(eq(user.email, email)).get();
        if (existing) return json({ error: 'User already exists.' }, { status: 400 });

        const hashed = await bcrypt.hash(password, 10);

        await db.insert(user).values({
          email,
          password: hashed,
          createdAt: now
        }).run();

        return json({ success: true, message: 'User created.' });
      } catch (signupError) {
        console.error('Signup error:', signupError);
        return json({ error: 'Failed to create user account.' }, { status: 500 });
      }
    }

    // In the login section
    if (mode === 'login') {
        try {
        console.log('Login attempt for email:', email);
        
        // Log the query we're about to execute
        console.log('Executing database query for user lookup');
        const foundUser = await db.select().from(user).where(eq(user.email, email)).get();
        console.log('Database response:', foundUser);
        
        if (!foundUser) {
            console.log('No user found with email:', email);
            return json({ error: 'Invalid credentials.' }, { status: 401 });
        }
        
        // Check if the password field exists in the user object
        if (!foundUser.password) {
            console.log('User found but password field is missing or null');
            return json({ error: 'Account error. Please contact support.' }, { status: 500 });
        }
        
        console.log('Comparing password with stored hash');
        try {
            const valid = await bcrypt.compare(password, foundUser.password);
            console.log('Password comparison result:', valid);
            
            if (!valid) {
            console.log('Password validation failed');
            return json({ error: 'Invalid credentials.' }, { status: 401 });
            }
            
            console.log('Login successful');
            return json({ success: true, message: 'Logged in.' });
        } catch (bcryptError) {
            console.error('bcrypt comparison error:', bcryptError);
            return json({ error: 'Authentication error.' }, { status: 500 });
        }
        } catch (loginError) {
        console.error('Detailed login error:', loginError);
        return json({ error: 'Login process failed.' }, { status: 500 });
        }
    }
    return json({ error: 'Invalid mode.' }, { status: 400 });
  } catch (error) {
    console.error('Auth endpoint error:', error);
    return json({ error: 'Server error occurred. Please try again later.' }, { status: 500 });
  }
}