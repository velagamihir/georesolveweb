import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin, ArrowLeft, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/StatusBadge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ComplaintManagement = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    assigned_to: '',
    resolution_notes: ''
  });

  useEffect(() => {
    fetchComplaints();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter, categoryFilter]);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const filterComplaints = () => {
    let filtered = complaints;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    setFilteredComplaints(filtered);
  };

  const handleUpdateComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateData({
      status: complaint.status,
      assigned_to: complaint.assigned_to || '',
      resolution_notes: complaint.resolution_notes || ''
    });
    setUpdateDialogOpen(true);
  };

  const submitUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/complaints/${selectedComplaint.id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Complaint updated successfully');
      setUpdateDialogOpen(false);
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update complaint');
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
                <h1 className="text-xl font-bold text-gray-900">Complaint Management</h1>
                <p className="text-sm text-gray-600">Review and update complaints</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label className="text-gray-700 mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  data-testid="search-complaints-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or description..."
                  className="pl-11 h-11"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-700 mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="status-filter-select" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 mb-2 block">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="category-filter-select" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredComplaints.length} of {complaints.length} complaints
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Complaints Found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                data-testid={`complaint-item-${complaint.id}`}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-blue-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{complaint.title}</h3>
                      <StatusBadge status={complaint.status} />
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {complaint.category}
                      </span>
                      <span>Reported by: {complaint.user_name}</span>
                      <span>{formatDate(complaint.created_at)}</span>
                    </div>
                    <p className="text-gray-700 mb-3">{complaint.description}</p>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Location:</span> {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                    </div>
                    {complaint.assigned_to && (
                      <div className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Assigned to:</span> {complaint.assigned_to}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    data-testid={`update-complaint-btn-${complaint.id}`}
                    onClick={() => handleUpdateComplaint(complaint)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Complaint</DialogTitle>
            <DialogDescription>
              Update the status and details of this complaint
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={updateData.status}
                onValueChange={(value) => setUpdateData({ ...updateData, status: value })}
              >
                <SelectTrigger data-testid="update-status-select" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assigned_to">Assign To</Label>
              <Input
                data-testid="update-assigned-to-input"
                id="assigned_to"
                value={updateData.assigned_to}
                onChange={(e) => setUpdateData({ ...updateData, assigned_to: e.target.value })}
                placeholder="Field worker name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="resolution_notes">Resolution Notes</Label>
              <Textarea
                data-testid="update-resolution-notes-input"
                id="resolution_notes"
                value={updateData.resolution_notes}
                onChange={(e) => setUpdateData({ ...updateData, resolution_notes: e.target.value })}
                placeholder="Add notes about the resolution..."
                className="mt-1.5 min-h-[100px]"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                data-testid="save-update-btn"
                onClick={submitUpdate}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                Save Changes
              </Button>
              <Button
                data-testid="cancel-update-btn"
                variant="outline"
                onClick={() => setUpdateDialogOpen(false)}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintManagement;