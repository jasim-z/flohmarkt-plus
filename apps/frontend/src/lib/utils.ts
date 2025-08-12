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
