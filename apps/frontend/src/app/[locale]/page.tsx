'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCurrentUser } from "../api/auth";

export default function Home({ params }: { params: { locale: string } }) {
  const router = useRouter();
  
  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser();
      console.log('user =====>', user);
      if (user && user.role === 'buyer') {
        router.replace(`/${params.locale}/home`);
      } else if (user && user.role === 'seller') {
        router.replace(`/${params.locale}/home`);
      } else if (user && user.role === 'admin') {
        router.replace(`/${params.locale}/dashboard`);
      } else {
        router.replace(`/${params.locale}/login`);
      }
    }
    checkUser();
  }, [router, params.locale]);
  
  return null;
} 