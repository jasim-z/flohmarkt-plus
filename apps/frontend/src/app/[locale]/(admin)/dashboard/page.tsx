"use client";

import { getCurrentUser } from "@/app/api/auth";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace(`/${params.locale}/login`);
          return;
        }
        
        if (user.role !== "admin") {
          router.replace(`/${params.locale}/home`);
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking user:", error);
        router.replace(`/${params.locale}/login`);
      }
    }
    
    checkUser();
  }, [router, params.locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loader border-4 border-orange-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t("dashboard.title")}
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Welcome to the admin dashboard. This page is under construction.
          </p>
        </div>
      </div>
    </div>
  );
}