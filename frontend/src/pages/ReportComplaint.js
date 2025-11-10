import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, ArrowLeft, Camera, X, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Map click handler component
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

const ReportComplaint = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([16.5062, 80.6480]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(coords);
          setPosition(coords);
          toast.success('Location detected automatically');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please select manually on map.');
        }
      );
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
      toast.error('Failed to fetch categories');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 3) {
      toast.error('You can upload maximum 3 images');
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!position) {
      toast.error('Please select a location on the map');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/complaints`,
        {
          title,
          description,
          category,
          latitude: position[0],
          longitude: position[1],
          images
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Complaint reported successfully!');
      navigate('/citizen/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to report complaint');
    } finally {
      setLoading(false);
    }
  };

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
                <h1 className="text-xl font-bold text-gray-900">Report New Issue</h1>
                <p className="text-sm text-gray-600">Help improve your community</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-gray-900 font-semibold">Issue Title *</Label>
                <Input
                  data-testid="complaint-title-input"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Pothole on Main Road"
                  className="mt-2 h-12 border-gray-300"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-gray-900 font-semibold">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="complaint-category-select" className="mt-2 h-12 border-gray-300">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name} data-testid={`category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-gray-900 font-semibold">Description *</Label>
                <Textarea
                  data-testid="complaint-description-input"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="mt-2 min-h-[120px] border-gray-300"
                  required
                />
              </div>

              {/* Location Map */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-gray-900 font-semibold">Location *</Label>
                  <Button
                    data-testid="detect-location-btn"
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Detect Location
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">Click on the map to select location</p>
                <div className="h-[300px] rounded-xl overflow-hidden border-2 border-blue-100">
                  <MapContainer
                    center={mapCenter}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
                {position && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-gray-900 font-semibold">Upload Images (Max 3)</Label>
                <div className="mt-2">
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-center">
                      <Camera className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload images</span>
                    </div>
                    <input
                      data-testid="image-upload-input"
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-blue-100"
                        />
                        <button
                          data-testid={`remove-image-${index}-btn`}
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4">
                <Button
                  data-testid="submit-complaint-btn"
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-base shadow-lg"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </Button>
                <Button
                  data-testid="cancel-btn"
                  type="button"
                  variant="outline"
                  className="px-8 h-12 border-2 border-gray-300 hover:bg-gray-50"
                  onClick={() => navigate('/citizen/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportComplaint;