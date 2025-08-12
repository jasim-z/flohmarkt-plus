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
<<<<<<< Updated upstream
        router.replace(`/${params.locale}/buyer/home`);
=======
        router.replace(`/${locale}/buyer/home`);
      } else if (user && user.role === 'seller') {
        router.replace(`/${locale}/seller/home`);
      } else if (user && user.role === 'admin') {
        router.replace(`/${locale}/admin/home`);
>>>>>>> Stashed changes
      } else {
        router.replace(`/${params.locale}/login`);
      }
    }
    checkUser();
  }, [router, params.locale]);
  return null;
} 