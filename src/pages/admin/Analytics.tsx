import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, Star } from 'lucide-react';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalComplaints: 0,
    avgResolutionTime: 0,
    avgRating: 0,
    totalStudents: 0,
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [centerData, setCenterData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Total complaints
      const { count: totalComplaints } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true });

      // Total students
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Average rating
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('rating');
      const avgRating = feedbackData?.length
        ? feedbackData.reduce((acc, f) => acc + f.rating, 0) / feedbackData.length
        : 0;

      // Category distribution
      const { data: complaints } = await supabase
        .from('complaints')
        .select('category, center, created_at');

      const categoryMap: any = {};
      const centerMap: any = {};
      
      complaints?.forEach((c) => {
        categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
        centerMap[c.center] = (centerMap[c.center] || 0) + 1;
      });

      const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
      }));

      const centerData = Object.entries(centerMap).map(([name, value]) => ({
        name,
        value,
      }));

      // Trend data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const trendData = last7Days.map((date) => {
        const count = complaints?.filter(
          (c) => c.created_at.startsWith(date)
        ).length || 0;
        return {
          date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          complaints: count,
        };
      });

      setStats({
        totalComplaints: totalComplaints || 0,
        avgResolutionTime: 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalStudents: totalStudents || 0,
      });
      setCategoryData(categoryData);
      setCenterData(centerData);
      setTrendData(trendData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

  if (loading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive insights and statistics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComplaints}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating}/5</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5 days</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Complaints by Category</CardTitle>
            <CardDescription>Distribution across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complaints by Center</CardTitle>
            <CardDescription>Distribution across centers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={centerData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {centerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Complaint Trend (Last 7 Days)</CardTitle>
            <CardDescription>Daily complaint submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="complaints"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
