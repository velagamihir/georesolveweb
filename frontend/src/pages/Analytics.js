import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, categoryRes] = await Promise.all([
        axios.get(`${API}/analytics/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/analytics/category-breakdown`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setStats(statsRes.data);
      setCategoryBreakdown(categoryRes.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const resolutionRate = stats?.total > 0
    ? ((stats.resolved / stats.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              data-testid="back-to-dashboard-btn"
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Analytics & Insights</h1>
                <p className="text-sm text-gray-600">Comprehensive complaint statistics</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              icon={<AlertCircle className="w-8 h-8" />}
              label="Total Complaints"
              value={stats?.total || 0}
              color="from-blue-500 to-blue-600"
              bgColor="bg-blue-100"
              textColor="text-blue-600"
            />
            <StatsCard
              icon={<Clock className="w-8 h-8" />}
              label="Pending"
              value={stats?.pending || 0}
              color="from-amber-500 to-amber-600"
              bgColor="bg-amber-100"
              textColor="text-amber-600"
            />
            <StatsCard
              icon={<TrendingUp className="w-8 h-8" />}
              label="In Progress"
              value={stats?.in_progress || 0}
              color="from-blue-600 to-blue-700"
              bgColor="bg-blue-100"
              textColor="text-blue-700"
            />
            <StatsCard
              icon={<CheckCircle className="w-8 h-8" />}
              label="Resolved"
              value={stats?.resolved || 0}
              color="from-green-500 to-green-600"
              bgColor="bg-green-100"
              textColor="text-green-600"
            />
          </div>

          {/* Resolution Rate */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Resolution Rate</h2>
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    stroke="#e0e7ff"
                    strokeWidth="20"
                    fill="none"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    stroke="url(#gradient)"
                    strokeWidth="20"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 100}`}
                    strokeDashoffset={`${2 * Math.PI * 100 * (1 - resolutionRate / 100)}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-5xl font-bold text-gray-900">{resolutionRate}%</span>
                  <span className="text-sm text-gray-600 mt-2">Resolution Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complaints by Category</h2>
            <div className="space-y-4">
              {categoryBreakdown.map((item, index) => {
                const percentage = stats?.total > 0
                  ? ((item.count / stats.total) * 100).toFixed(1)
                  : 0;
                
                return (
                  <div key={index} data-testid={`category-stat-${item.category}`} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">{item.category}</span>
                      <span className="text-sm text-gray-600">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights Card */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Key Insights</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h4 className="font-semibold mb-2">Most Reported Category</h4>
                <p className="text-2xl font-bold">
                  {categoryBreakdown[0]?.category || 'N/A'}
                </p>
                <p className="text-sm text-blue-100 mt-1">
                  {categoryBreakdown[0]?.count || 0} complaints
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h4 className="font-semibold mb-2">Active Complaints</h4>
                <p className="text-2xl font-bold">
                  {(stats?.pending || 0) + (stats?.in_progress || 0)}
                </p>
                <p className="text-sm text-blue-100 mt-1">
                  Pending + In Progress
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ icon, label, value, color, bgColor, textColor }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-blue-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${bgColor} p-4 rounded-xl ${textColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Analytics;