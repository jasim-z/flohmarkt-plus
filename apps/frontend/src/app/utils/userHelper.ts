import { getCurrentUser } from "@/app/api/auth";

export const checkUserRole = async (locale: string, pageName: string, router: any, setLoading: (loading: boolean) => void) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace(`/${locale}/login`);
          return;
        }
        if (user.role === "admin") {
          router.replace(`/${locale}/${pageName}`);
        } else if (user.role === "buyer") {
          router.replace(`/${locale}/home`);
        } else if (user.role === "seller") {
          router.replace(`/${locale}/seller/home`);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error checking user:", error);
        router.replace(`/${locale}/login`);
      }
}

