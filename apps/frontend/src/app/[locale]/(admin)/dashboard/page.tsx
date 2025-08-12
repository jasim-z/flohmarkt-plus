"use client";

import { getCurrentUser } from "@/app/api/auth";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaUsers, FaStore, FaUserShield, FaChartLine, FaPlus, FaChevronUp, FaChevronDown, FaCalendar, FaArrowRight } from "react-icons/fa";

export default function Dashboard() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

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

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="loader border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
            {t("dashboard.title")}
          </h1>
          <p className="text-gray-600">Welcome to your admin dashboard</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaUsers size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                <p className="text-gray-600 text-sm">Manage user accounts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <FaStore size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Markets</h3>
                <p className="text-gray-600 text-sm">Manage flea markets</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <FaUserShield size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
                <p className="text-gray-600 text-sm">Manage user roles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Income Tracker Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Income Tracker</h3>
                  <p className="text-gray-600 text-sm">Track changes in income over time</p>
                </div>
                <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Week</option>
                  <option>Month</option>
                  <option>Year</option>
                </select>
              </div>
              
              {/* Chart Placeholder */}
              <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-end justify-around p-4">
                <div className="w-8 bg-blue-500 rounded-t" style={{height: '20%'}}></div>
                <div className="w-8 bg-blue-500 rounded-t" style={{height: '40%'}}></div>
                <div className="w-8 bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                <div className="w-8 bg-blue-500 rounded-t" style={{height: '80%'}}></div>
                <div className="w-8 bg-blue-500 rounded-t" style={{height: '100%'}}></div>
                <div className="w-8 bg-blue-500 rounded-t" style={{height: '30%'}}></div>
                <div className="w-8 bg-blue-500 rounded-t" style={{height: '50%'}}></div>
              </div>
              
              <div className="text-center">
                <p className="text-green-600 text-sm font-medium">+20% This week&apos;s income is higher than last week&apos;s</p>
              </div>
            </div>

            {/* Let's Connect Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Let&apos;s Connect</h3>
                <a href="#" className="text-blue-600 text-sm hover:underline">See all</a>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">R</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">Randy Gouse</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Senior</span>
                    </div>
                    <p className="text-gray-600 text-sm">Cybersecurity specialist</p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200">
                    <FaPlus size={16} />
                  </button>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">G</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">Giana Schleifer</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Middle</span>
                    </div>
                    <p className="text-gray-600 text-sm">UX/UI Designer</p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200">
                    <FaPlus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Projects Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Recent Projects</h3>
                <a href="#" className="text-blue-600 text-sm hover:underline">See all Project</a>
              </div>
              
              <div className="space-y-3">
                {/* Project 1 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">W</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Web Development Project</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-medium">$10/hour</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Paid</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleProject('project1')}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {expandedProjects.has('project1') ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                    </button>
                  </div>
                  
                  {expandedProjects.has('project1') && (
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Remote</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">Part-time</span>
                      </div>
                      <p>Implementing frontend and backend functionalities with third-party APIs</p>
                      <div className="flex items-center justify-between">
                        <span>Germany</span>
                        <span className="text-gray-500">2h ago</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Project 2 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">C</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Copyright Project</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-medium">$10/hour</span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Not Paid</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleProject('project2')}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {expandedProjects.has('project2') ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                    </button>
                  </div>
                  
                  {expandedProjects.has('project2') && (
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Remote</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">Part-time</span>
                      </div>
                      <p>Copyright and legal documentation project</p>
                      <div className="flex items-center justify-between">
                        <span>United States</span>
                        <span className="text-gray-500">1d ago</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Project 3 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">D</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Web Design Project</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-medium">$10/hour</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Paid</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleProject('project3')}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {expandedProjects.has('project3') ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                    </button>
                  </div>
                  
                  {expandedProjects.has('project3') && (
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Remote</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">Full-time</span>
                      </div>
                      <p>Modern web design with responsive layouts</p>
                      <div className="flex items-center justify-between">
                        <span>Canada</span>
                        <span className="text-gray-500">3d ago</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Premium Features Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Unlock Premium Features</h3>
              <p className="text-blue-100 text-sm mb-4">Get access to exclusive benefits and expand your freelancing opportunities</p>
              <button className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
                <span>Upgrade now</span>
                <FaArrowRight size={14} />
              </button>
            </div>

            {/* Proposal Progress Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Proposal Progress</h3>
                <div className="flex items-center space-x-2">
                  <FaCalendar className="text-gray-400" size={16} />
                  <span className="text-sm text-gray-600">April 11, 2024</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Proposals sent</span>
                  <span className="font-semibold text-gray-900">64</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Interviews</span>
                  <span className="font-semibold text-gray-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hires</span>
                  <span className="font-semibold text-gray-900">10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}