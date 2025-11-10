import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, List, BarChart3, LogOut, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const createCustomIcon = (status) => {
  const colors = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    resolved: '#10b981'
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${colors[status] || colors.pending}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([16.5062, 80.6480]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [complaintsRes, statsRes] = await Promise.all([
        axios.get(`${API}/complaints`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/analytics/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setComplaints(complaintsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GeoResolve</h1>
                <p className="text-sm text-gray-600">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block text-right mr-3">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
              <Button
                data-testid="logout-btn"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="Total Complaints"
            value={stats?.total || 0}
            color="from-blue-500 to-blue-600"
            bgColor="bg-blue-100"
            textColor="text-blue-600"
          />
          <StatsCard
            icon={<Clock className="w-6 h-6" />}
            label="Pending"
            value={stats?.pending || 0}
            color="from-amber-500 to-amber-600"
            bgColor="bg-amber-100"
            textColor="text-amber-600"
          />
          <StatsCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="In Progress"
            value={stats?.in_progress || 0}
            color="from-blue-600 to-blue-700"
            bgColor="bg-blue-100"
            textColor="text-blue-700"
          />
          <StatsCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Resolved"
            value={stats?.resolved || 0}
            color="from-green-500 to-green-600"
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Complaints Map</h2>
              <div className="h-[500px] rounded-xl overflow-hidden border-2 border-blue-100">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {complaints.map((complaint) => (
                    <Marker
                      key={complaint.id}
                      position={[complaint.latitude, complaint.longitude]}
                      icon={createCustomIcon(complaint.status)}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-gray-900 mb-1">{complaint.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{complaint.category}</p>
                          <p className="text-xs text-gray-500 mb-2">By: {complaint.user_name}</p>
                          <StatusBadge status={complaint.status} />
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                  <span className="text-gray-700">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700">In Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-gray-700">Resolved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  data-testid="manage-complaints-btn"
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white justify-start text-base shadow-lg"
                  onClick={() => navigate('/admin/complaints')}
                >
                  <List className="w-5 h-5 mr-3" />
                  Manage Complaints
                </Button>
                <Button
                  data-testid="view-analytics-btn"
                  variant="outline"
                  className="w-full h-14 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 justify-start text-base"
                  onClick={() => navigate('/admin/analytics')}
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  View Analytics
                </Button>
              </div>
            </div>

            {/* Recent Complaints */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Complaints</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {complaints.slice(0, 5).map((complaint) => (
                  <div
                    key={complaint.id}
                    className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{complaint.title}</h4>
                      <StatusBadge status={complaint.status} size="sm" />
                    </div>
                    <p className="text-xs text-gray-600">{complaint.category}</p>
                    <p className="text-xs text-gray-500 mt-1">By: {complaint.user_name}</p>
                  </div>
                ))}
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
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-blue-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${bgColor} p-4 rounded-xl ${textColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;