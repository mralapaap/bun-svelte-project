// src/lib/index.ts

// Function to format price
export function formatPrice(price: number): string {
    return `₱${(price / 100).toFixed(2)}`; // Example formatting (assuming price is in cents)
  }
  