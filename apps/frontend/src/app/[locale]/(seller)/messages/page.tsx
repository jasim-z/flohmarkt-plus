"use client";

import { useTranslations } from "next-intl";
import { FaEnvelope } from "react-icons/fa";
import UnAuthourized from "@/app/components/UnAuthourized";
import { useUser } from "@/contexts/UserContext";

export default function SellerMessages() {
  const t = useTranslations();
  const { role, isLoaded } = useUser();

  if (role !== 'seller' && isLoaded) return <UnAuthourized />;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="loader border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Messages
          </h1>
          <p className="text-gray-600">View and manage your messages</p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FaEnvelope size={64} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Messages Coming Soon</h3>
          <p className="text-gray-600">This page will display your messages and communications.</p>
        </div>
      </div>
    </div>
  );
} 