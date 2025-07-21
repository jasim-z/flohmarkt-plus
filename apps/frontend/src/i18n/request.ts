import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async () => {
  // You can later detect the locale from cookies, headers, etc.
  const locale = 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
}); 