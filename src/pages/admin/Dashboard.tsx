import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { School, Users, CheckCircle2, AlertTriangle, Building2, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    students: 0,
    centers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load complaints
      const { data: complaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('status');

      if (complaintsError) throw complaintsError;

      // Load students count
      const { count: studentsCount, error: studentsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Load centers count
      const { count: centersCount, error: centersError } = await supabase
        .from('centers')
        .select('*', { count: 'exact', head: true });

      const complaintsStats = {
        total: complaints?.length || 0,
        pending: complaints?.filter((c) => c.status === 'Pending').length || 0,
        inProgress: complaints?.filter((c) => c.status === 'In Progress').length || 0,
        resolved: complaints?.filter((c) => c.status === 'Resolved').length || 0,
        students: studentsCount || 0,
        centers: centersCount || 0,
      };

      setStats(complaintsStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.students,
      icon: '👥',
      bgColor: 'bg-stat-purple/10',
      iconBg: 'bg-stat-purple/20',
      borderColor: 'border-l-4 border-stat-purple',
      textColor: 'text-stat-purple',
    },
    {
      title: 'Total Complaints',
      value: stats.total,
      icon: '📋',
      bgColor: 'bg-stat-pink/10',
      iconBg: 'bg-stat-pink/20',
      borderColor: 'border-l-4 border-stat-pink',
      textColor: 'text-stat-pink',
    },
    {
      title: 'Pending Review',
      value: stats.pending,
      icon: '⏰',
      bgColor: 'bg-stat-yellow/10',
      iconBg: 'bg-stat-yellow/20',
      borderColor: 'border-l-4 border-stat-yellow',
      textColor: 'text-stat-yellow',
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: '✅',
      bgColor: 'bg-stat-green/10',
      iconBg: 'bg-stat-green/20',
      borderColor: 'border-l-4 border-stat-green',
      textColor: 'text-stat-green',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - matching reference style */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground font-medium">
          Monitor complaints and performance across all centers
        </p>
      </div>

      {/* Stats Cards Grid - Educational Style */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`stat-card ${stat.borderColor} ${stat.bgColor} hover-lift`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`stat-icon-box ${stat.iconBg}`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm font-medium mb-1">{stat.title}</p>
              <p className={`text-3xl font-bold ${stat.textColor}`}>
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-muted/50 rounded animate-pulse"></span>
                ) : (
                  stat.value
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Information Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {/* Quick Stats Card */}
        <Card className="edu-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-box bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Quick Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">In Progress</span>
              <span className="font-semibold text-primary">{stats.inProgress}</span>
            </div>
            <div className="soft-divider"></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Resolution Rate</span>
              <span className="font-semibold text-success">
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="soft-divider"></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Active Centers</span>
              <span className="font-semibold">{stats.centers}</span>
            </div>
          </div>
        </Card>

        {/* Status Distribution Card */}
        <Card className="edu-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-box bg-warning/10">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <h3 className="text-lg font-semibold">Status Breakdown</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-warning rounded-full h-2 transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-medium">{stats.inProgress}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resolved</span>
                <span className="font-medium">{stats.resolved}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-success rounded-full h-2 transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Centers Overview Card */}
        <Card className="edu-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-box bg-success/10">
              <Building2 className="w-5 h-5 text-success" />
            </div>
            <h3 className="text-lg font-semibold">Centers Overview</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm text-muted-foreground">Active Centers</span>
              </div>
              <span className="font-semibold">{stats.centers}</span>
            </div>
            <div className="soft-divider"></div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="text-sm text-muted-foreground">Total Students</span>
              </div>
              <span className="font-semibold">{stats.students}</span>
            </div>
            <div className="soft-divider"></div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning"></div>
                <span className="text-sm text-muted-foreground">Avg per Center</span>
              </div>
              <span className="font-semibold">
                {stats.centers > 0 ? Math.round(stats.students / stats.centers) : 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Welcome Message - Educational Style */}
      <Card className="edu-card p-6 md:p-8 bg-gradient-to-br from-primary/5 via-accent/5 to-warning/5">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-lg">
            <School className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-semibold mb-2">Welcome to Brototype Connect! 🎉</h2>
            <p className="text-muted-foreground">
              Your smart platform for managing complaints, communication, and student engagement. 
              Monitor all activities and ensure prompt resolution of issues across all centers.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
