export default function UnAuthourized() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h1>
        <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
      </div>
    </div>
  );
}