import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import StudentLayout from "./components/layouts/StudentLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import StudentDashboard from "./pages/student/Dashboard";
import RaiseComplaint from "./pages/student/RaiseComplaint";
import StudentComplaints from "./pages/student/Complaints";
import StudentComplaintDetail from "./pages/student/ComplaintDetail";
import StudentMessages from "./pages/student/Messages";
import StudentMeetings from "./pages/student/Meetings";
import StudentProfile from "./pages/student/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminComplaints from "./pages/admin/Complaints";
import AdminComplaintDetail from "./pages/admin/ComplaintDetail";
import AdminMessages from "./pages/admin/Messages";
import AdminMeetings from "./pages/admin/Meetings";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminUsers from "./pages/admin/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute requiredRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="raise-complaint" element={<RaiseComplaint />} />
              <Route path="complaints" element={<StudentComplaints />} />
              <Route path="complaints/:id" element={<StudentComplaintDetail />} />
              <Route path="messages" element={<StudentMessages />} />
              <Route path="meetings" element={<StudentMeetings />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="complaints/:id" element={<AdminComplaintDetail />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="meetings" element={<AdminMeetings />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
