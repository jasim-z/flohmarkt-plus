'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCurrentUser } from "../api/auth";

type PageProps = {
  params: Promise<{ locale: string }>
}

export default function Home({ params }: PageProps) {
  const router = useRouter();
  
  useEffect(() => {
    async function checkUser() {
      const { locale } = await params;
      const user = await getCurrentUser();
      if (user && user.role === 'buyer') {
        router.replace(`/${locale}/home`);
      } else if (user && user.role === 'seller') {
        router.replace(`/${locale}/seller/overview`);
      } else if (user && user.role === 'admin') {
        router.replace(`/${locale}/dashboard`);
      } else {
        router.replace(`/${locale}/login`);
      }
    }
    checkUser();
  }, [router, params]);
  
  return null;
} 