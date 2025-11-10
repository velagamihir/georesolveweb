import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ComplaintHistory = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchUserComplaints(userData.id);
    }
  }, []);

  const fetchUserComplaints = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/complaints/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <div className="flex items-center space-x-4">
            <Button
              data-testid="back-to-dashboard-btn"
              variant="ghost"
              onClick={() => navigate('/citizen/dashboard')}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Complaints</h1>
                <p className="text-sm text-gray-600">Track your reported issues</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {complaints.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Complaints Yet</h3>
              <p className="text-gray-600 mb-6">You haven't reported any issues yet.</p>
              <Button
                data-testid="report-first-issue-btn"
                onClick={() => navigate('/citizen/report')}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
              >
                Report Your First Issue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} formatDate={formatDate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ComplaintCard = ({ complaint, formatDate }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      data-testid={`complaint-card-${complaint.id}`}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">{complaint.title}</h3>
              <StatusBadge status={complaint.status} />
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(complaint.created_at)}</span>
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                {complaint.category}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-4">{complaint.description}</p>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Location:</span> {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
          </div>
          {(complaint.images?.length > 0 || complaint.resolution_notes) && (
            <Button
              data-testid={`toggle-details-btn-${complaint.id}`}
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 hover:bg-blue-50"
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </Button>
          )}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in">
            {complaint.images?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Images:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {complaint.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Complaint ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}
            {complaint.resolution_notes && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Resolution Notes:</h4>
                <p className="text-green-800 text-sm">{complaint.resolution_notes}</p>
              </div>
            )}
            {complaint.assigned_to && (
              <div className="mt-3 flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span>Assigned to: {complaint.assigned_to}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintHistory;