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
  // Build a more open-ended, data-driven prompt
  const prompt = `
You are an AI specialized in inventory analytics and warehouse management. Use Philippine pesos (₱) for all monetary values.

Here is the current inventory data:
${items.map(i => `- ${i.name}: quantity=${i.quantity}, price=₱${(i.price / 100).toFixed(2)}`).join('\n')}

Based only on this data, provide a short analytical summary highlighting any relevant patterns, risks, opportunities, or anomalies. Avoid generic advice. Base everything directly on the numbers.
`;

  // Call your local DeepSeek-R1 endpoint
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

  // Clean the response
  return responseText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\*\*/g, '')
    .replace(/\$/g, '₱')
    .trim();
}
