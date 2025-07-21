'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home({ params }: { params: { locale: string } }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/${params.locale}/login`);
  }, [router, params.locale]);
  return null;
} 