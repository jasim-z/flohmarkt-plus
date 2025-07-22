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
        router.replace(`/${params.locale}/buyer/home`);
      } else {
        router.replace(`/${params.locale}/login`);
      }
    }
    checkUser();
  }, [router, params.locale]);
  return null;
} 