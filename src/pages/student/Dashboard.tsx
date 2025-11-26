import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      icon: '📋',
      bgColor: 'bg-stat-purple/10',
      iconBg: 'bg-stat-purple/20',
      borderColor: 'border-l-4 border-stat-purple',
      textColor: 'text-stat-purple',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: '⏰',
      bgColor: 'bg-stat-yellow/10',
      iconBg: 'bg-stat-yellow/20',
      borderColor: 'border-l-4 border-stat-yellow',
      textColor: 'text-stat-yellow',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: '🔄',
      bgColor: 'bg-stat-pink/10',
      iconBg: 'bg-stat-pink/20',
      borderColor: 'border-l-4 border-stat-pink',
      textColor: 'text-stat-pink',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground font-medium">
            Track your complaints and stay updated
          </p>
        </div>
        <Button 
          onClick={() => navigate('/student/raise-complaint')}
          className="btn-purple hidden md:flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Raise Complaint
        </Button>
      </div>

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

      <Card className="edu-card p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-warning/5">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="icon-box bg-warning/20 w-16 h-16">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-semibold mb-2">Need Help? 🤝</h3>
            <p className="text-muted-foreground mb-4">
              Have an issue or concern? Raise a complaint and our team will assist you promptly.
            </p>
            <Button onClick={() => navigate('/student/raise-complaint')} className="btn-purple">
              <Plus className="w-4 h-4 mr-2" />
              Raise New Complaint
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
