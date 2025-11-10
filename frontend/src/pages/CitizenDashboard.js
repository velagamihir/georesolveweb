import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, History, LogOut, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers
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

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([16.5062, 80.6480]); // Takkellapadu, Andhra Pradesh

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchComplaints();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
    } catch (error) {
      toast.error('Failed to fetch complaints');
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
                <p className="text-sm text-gray-600">Citizen Dashboard</p>
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
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                  data-testid="report-issue-btn"
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white justify-start text-base shadow-lg"
                  onClick={() => navigate('/citizen/report')}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Report New Issue
                </Button>
                <Button
                  data-testid="view-history-btn"
                  variant="outline"
                  className="w-full h-14 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 justify-start text-base"
                  onClick={() => navigate('/citizen/history')}
                >
                  <History className="w-5 h-5 mr-3" />
                  View My Reports
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <StatCard
                  label="Total Complaints"
                  value={complaints.length}
                  color="bg-blue-500"
                />
                <StatCard
                  label="Pending"
                  value={complaints.filter(c => c.status === 'pending').length}
                  color="bg-amber-500"
                />
                <StatCard
                  label="In Progress"
                  value={complaints.filter(c => c.status === 'in_progress').length}
                  color="bg-blue-600"
                />
                <StatCard
                  label="Resolved"
                  value={complaints.filter(c => c.status === 'resolved').length}
                  color="bg-green-500"
                />
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Need Help?</h4>
                  <p className="text-sm text-blue-50">
                    Report issues with accurate location and images for faster resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className={`${color} text-white px-4 py-2 rounded-lg font-bold`}>
        {value}
      </div>
    </div>
  );
};

export default CitizenDashboard;