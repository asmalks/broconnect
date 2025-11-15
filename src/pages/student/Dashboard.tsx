import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('status')
        .eq('user_id', user?.id);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: data?.filter((c) => c.status === 'Pending').length || 0,
        inProgress: data?.filter((c) => c.status === 'In Progress').length || 0,
        resolved: data?.filter((c) => c.status === 'Resolved').length || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Complaints',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-warning',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: AlertCircle,
      color: 'text-primary',
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle2,
      color: 'text-success',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your complaints.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-gradient-to-br from-card to-card/50 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
