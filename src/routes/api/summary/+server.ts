// src/routes/api/summary/+server.ts
import { db } from '$lib/server/db';
import { item } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';

export async function GET() {
  // Fetch all items from the database
  const items = await db.select().from(item);

  // Generate the AI summary
  const inventorySummary = await generateInsights(items);

  // Return the cleaned summary
  return json({ summary: inventorySummary });
}

async function generateInsights(items: any[]) {
  // Build a prompt that uses pesos (₱)
  const prompt = `
You are an AI specialized in inventory analytics. Use Philippine pesos (₱) in your calculations and output.
Given the following items (with their quantity and price), provide:
- Total number of items
- Total inventory value (sum of quantity * price), formatted with ₱
- Items that are low in stock (quantity < 10) or "None"
- One brief general recommendation

Respond ONLY with the final summary paragraph (no reasoning steps, no extra commentary).

Inventory Data:
${items.map(i => `- ${i.name}: quantity=${i.quantity}, price=₱${i.price}`).join('\n')}
`;

  // Call the local DeepSeek-R1 endpoint
  let responseText: string;
  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1:1.5b',
        prompt,
        stream: false
      })
    });
    if (!res.ok) throw new Error('AI service error');
    const data = await res.json();
    responseText = data.response;
  } catch (err) {
    console.error('AI summary error:', err);
    return 'Unable to generate insights at this time.';
  }

  // Clean the AI response:
  // 1. Remove any <think>…</think> blocks  
  // 2. Strip out all ** markers  
  // 3. Replace any stray $ with ₱  
  // 4. Trim whitespace
  return responseText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\*\*/g, '')
    .replace(/\$/g, '₱')
    .trim();
}
