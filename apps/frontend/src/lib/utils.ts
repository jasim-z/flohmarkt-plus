export function cn(...inputs: (string | undefined | null | false)[]): string {
  const classes = inputs.filter(Boolean).join(' ');
  
  // Basic deduplication for common Tailwind patterns
  const classMap = new Map<string, string>();
  const parts = classes.split(' ');
  
  for (const part of parts) {
    if (!part) continue;
    
    // Extract the base class (before variants like hover:, focus:, etc.)
    const baseClass = part.split(':')[0];
    
    // For conflicting classes, keep the last one
    if (classMap.has(baseClass)) {
      classMap.set(baseClass, part);
    } else {
      classMap.set(baseClass, part);
    }
  }
  
  return Array.from(classMap.values()).join(' ');
}

/**
 * Formats a price value safely, handling various input types and edge cases
 * @param price - The price value (can be string, number, undefined, or MongoDB Decimal128 object)
 * @param fallback - Text to show when price is invalid or zero
 * @returns Formatted price string or fallback text
 */
export function formatPrice(price: string | number | { $numberDecimal: string } | undefined | null, fallback: string = 'Contact for pricing'): string {
  if (!price) {
    return fallback;
  }

  let priceValue: string | number;

  // Handle MongoDB Decimal128 object format
  if (typeof price === 'object' && price.$numberDecimal) {
    priceValue = price.$numberDecimal;
  } else {
    priceValue = price;
  }

  // Handle string/number values
  if (priceValue === '0' || priceValue === 0) {
    return fallback;
  }
  
  const priceNum = parseFloat(priceValue.toString());
  if (isNaN(priceNum) || priceNum <= 0) {
    return fallback;
  }
  
  return `€${priceNum.toFixed(2)}`;
}
