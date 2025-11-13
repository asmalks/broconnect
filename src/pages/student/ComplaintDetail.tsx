import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ComplaintTimeline from '@/components/ComplaintTimeline';
import ComplaintChat from '@/components/ComplaintChat';
import FeedbackDialog from '@/components/FeedbackDialog';

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadComplaint();
      loadTimeline();
    }
  }, [id, user]);

  const loadComplaint = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, profiles(full_name, email, center)')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setComplaint(data);
    } catch (error) {
      console.error('Error loading complaint:', error);
      toast.error('Failed to load complaint details');
      navigate('/student/complaints');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from('complaint_timeline')
        .select('*, profiles!complaint_timeline_action_by_fkey(full_name)')
        .eq('complaint_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTimeline(data || []);
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'In Progress':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Resolved':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Low':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!complaint) {
    return <div className="text-center p-8">Complaint not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/student/complaints">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{complaint.title}</h1>
          <p className="text-muted-foreground">Complaint ID: #{complaint.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={getStatusColor(complaint.status)}>
                  {complaint.status}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(complaint.priority)}>
                  {complaint.priority}
                </Badge>
                <Badge variant="outline">{complaint.category}</Badge>
                <Badge variant="outline">{complaint.center}</Badge>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
              </div>

              {complaint.attachment_url && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Attachment</h3>
                    <a
                      href={complaint.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Attachment
                    </a>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(complaint.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(new Date(complaint.updated_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              {complaint.status === 'Resolved' && (
                <Button onClick={() => setShowFeedback(true)} className="w-full">
                  Give Feedback
                </Button>
              )}
            </CardContent>
          </Card>

          <ComplaintChat complaintId={id!} />
        </div>

        <div>
          <ComplaintTimeline timeline={timeline} />
        </div>
      </div>

      <FeedbackDialog
        open={showFeedback}
        onOpenChange={setShowFeedback}
        complaintId={id!}
      />
    </div>
  );
}
