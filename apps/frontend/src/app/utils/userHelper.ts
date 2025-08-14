import { getCurrentUser } from "@/app/api/auth";

export const checkUserRole = async (locale: string, pageName: string, router: any, setLoading: (loading: boolean) => void) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace(`/${locale}/login`);
          return;
        }
        
        // Check if user has the correct role for the current page
        if (user.role === "admin" && pageName === "markets") {
          // User is admin and on markets page, no need to redirect
          setLoading(false);
          return;
        } else if (user.role === "buyer") {
          router.replace(`/${locale}/home`);
        } else if (user.role === "seller") {
          router.replace(`/${locale}/seller/home`);
        } else if (user.role !== "admin") {
          // User is not admin, redirect to appropriate page
          router.replace(`/${locale}/unauthorized`);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error checking user:", error);
        router.replace(`/${locale}/login`);
      }
}

