# GeoResolve - Smart Rural Problem Reporting and Tracking System

A full-stack geospatial problem reporting platform designed for rural and semi-urban areas. Connects citizens and authorities through real-time geotagged problem reporting, visualization, and resolution tracking.

## 🌟 Features

### Citizen Portal
- **User Registration & Authentication**: JWT-based secure authentication
- **Problem Reporting**: Report issues with GPS location, images, and descriptions
- **Interactive Map**: View all complaints with color-coded status markers
- **Status Tracking**: Track complaint status in real-time (Pending, In Progress, Resolved)
- **Complaint History**: View personal complaint history and updates
- **Categories**: Report issues across Roads, Street Lighting, Sanitation, Water Supply, Drainage, Parks & Gardens, and more

### Authority Dashboard
- **Admin Login**: Secure admin authentication
- **Interactive Map View**: Display all reported issues with status-based pins
- **Complaint Management**: Review, assign, and update complaint status
- **Analytics & Insights**: 
  - Overall statistics (Total, Pending, In Progress, Resolved)
  - Category-wise breakdown with visual charts
  - Resolution rate tracking
  - Identify most reported categories
- **Resolution Notes**: Add notes when resolving complaints
- **Field Worker Assignment**: Assign complaints to field workers

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with geospatial indexing (2dsphere)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Geospatial Queries**: MongoDB geospatial features for location-based queries

### Frontend
- **Framework**: React.js
- **Routing**: React Router
- **UI Components**: Shadcn UI with Radix primitives
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js with OpenStreetMap
- **State Management**: React Hooks
- **Notifications**: Sonner toast notifications

## 👥 Demo Credentials

### Citizen Account
- **Email**: citizen@test.com
- **Password**: test123

### Admin Account
- **Email**: admin@georesolve.com
- **Password**: admin123

## 🗺️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Complaints
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints` - Get all complaints (with optional filters)
- `GET /api/complaints/nearby` - Get complaints within radius
- `GET /api/complaints/user/{user_id}` - Get user's complaints
- `GET /api/complaints/{complaint_id}` - Get single complaint
- `PUT /api/complaints/{complaint_id}` - Update complaint (Admin only)

### Categories
- `GET /api/categories` - Get all categories

### Analytics (Admin only)
- `GET /api/analytics/stats` - Get overall statistics
- `GET /api/analytics/category-breakdown` - Get category-wise breakdown

## 🎨 Design Features

- **Modern UI**: Clean, modern interface with glassmorphism effects
- **Responsive Design**: Mobile-first responsive design
- **Color Scheme**: Ocean blue and cyan accents for trust and civic duty
- **Typography**: Space Grotesk for headings, Inter for body text
- **Status Colors**:
  - 🟡 Pending: Amber
  - 🔵 In Progress: Blue
  - 🟢 Resolved: Green

## 🔒 Security Features

- JWT-based authentication with 30-day expiry
- Bcrypt password hashing
- Role-based access control (Citizen/Admin)
- Protected routes for authorized users only
- CORS configuration for secure cross-origin requests

## 🌍 Geospatial Features

- **MongoDB 2dsphere Index**: Enables efficient geospatial queries
- **Auto-location Detection**: Uses browser's geolocation API
- **Interactive Map Selection**: Click to select location on map
- **Nearby Complaints**: Find complaints within specified radius
- **Color-coded Markers**: Status-based marker colors on map

## 📱 Usage

### For Citizens:
1. Register/Login to your account
2. View dashboard with map showing all complaints
3. Click "Report New Issue" to submit a complaint
4. Fill in details, select location on map, upload images
5. Track your complaints in "My Complaints" section

### For Admins:
1. Login with admin credentials
2. View overview dashboard with statistics
3. Navigate to "Manage Complaints" to review and update
4. Update status, assign workers, add resolution notes
5. View analytics for insights and patterns

---

Built with ❤️ for rural communities | © 2025 GeoResolve
