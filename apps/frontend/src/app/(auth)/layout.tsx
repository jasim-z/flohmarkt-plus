export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 px-4">
      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-3xl shadow-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
} 