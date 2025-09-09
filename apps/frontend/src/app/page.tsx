'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCurrentUser } from "./api/auth";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser();
      if (user && user.role === 'buyer') {
        router.replace('/en/user-markets');
      } else {
        router.replace('/en/login');
      }
    }
    checkUser();
  }, [router]);
  return null;
}
