"use client";
import { getCurrentUser } from "@/app/api/auth";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser();
      if (user && user.role !== "admin") {
        router.replace(`/${params.locale}/home`);
      }
    }
    checkUser();
  }, [router, params.locale]);
  return <div>{t("dashboard.title")}</div>;
}