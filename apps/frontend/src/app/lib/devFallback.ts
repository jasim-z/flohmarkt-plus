// Development fallback for when backend services are not running
export const isDevelopment = process.env.NODE_ENV === 'development';

export const checkServiceAvailability = async (serviceUrl: string): Promise<boolean> => {
  if (!isDevelopment) return true;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(serviceUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

export const getServiceStatus = async () => {
  const services = [
    { name: 'Auth', url: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3950' },
    { name: 'Markets', url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3953' },
    { name: 'Messages', url: process.env.NEXT_PUBLIC_MESSAGES_API_URL || 'http://localhost:3954' },
    { name: 'Listings', url: process.env.NEXT_PUBLIC_LISTINGS_API_URL || 'http://localhost:3951' },
    { name: 'Orders', url: process.env.NEXT_PUBLIC_ORDERS_API_URL || 'http://localhost:3955' },
  ];

  const status = await Promise.all(
    services.map(async (service) => ({
      ...service,
      available: await checkServiceAvailability(service.url)
    }))
  );

  return status;
};

export const logServiceStatus = async () => {
  if (!isDevelopment) return;
  
  const status = await getServiceStatus();
  console.group('🔧 Backend Services Status');
  status.forEach(service => {
    const icon = service.available ? '✅' : '❌';
    console.log(`${icon} ${service.name}: ${service.available ? 'Running' : 'Not Available'}`);
  });
  console.groupEnd();
};
