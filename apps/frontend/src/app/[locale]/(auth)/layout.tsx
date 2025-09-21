export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-yellow-100 to-orange-100">
      {children}
    </div>
  );
} 