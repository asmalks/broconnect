import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ComplaintTimeline from '@/components/ComplaintTimeline';
import ComplaintChat from '@/components/ComplaintChat';

export default function AdminComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadComplaint();
      loadTimeline();
    }
  }, [id]);

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status);
      setPriority(complaint.priority);
    }
  }, [complaint]);

  const loadComplaint = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, profiles!complaints_user_id_fkey(full_name, email, center)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setComplaint(data);
    } catch (error) {
      console.error('Error loading complaint:', error);
      toast.error('Failed to load complaint details');
      navigate('/admin/complaints');
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

  const handleUpdate = async () => {
    try {
      setUpdating(true);

      const updates: any = {};
      const timelineEntries = [];

      if (status !== complaint.status) {
        updates.status = status;
        timelineEntries.push({
          complaint_id: id,
          action_by: user?.id,
          action_type: 'status_changed',
          old_value: complaint.status,
          new_value: status,
        });
      }

      if (priority !== complaint.priority) {
        updates.priority = priority;
        timelineEntries.push({
          complaint_id: id,
          action_by: user?.id,
          action_type: 'priority_changed',
          old_value: complaint.priority,
          new_value: priority,
        });
      }

      if (!complaint.assigned_admin_id) {
        updates.assigned_admin_id = user?.id;
        timelineEntries.push({
          complaint_id: id,
          action_by: user?.id,
          action_type: 'assigned',
          new_value: user?.id,
        });
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('complaints')
          .update(updates)
          .eq('id', id);

        if (error) throw error;

        for (const entry of timelineEntries) {
          await supabase.from('complaint_timeline').insert(entry);
        }
      }

      if (notes.trim()) {
        await supabase.from('complaint_timeline').insert({
          complaint_id: id,
          action_by: user?.id,
          action_type: 'admin_note',
          notes: notes,
        });
        setNotes('');
      }

      toast.success('Complaint updated successfully');
      loadComplaint();
      loadTimeline();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update complaint');
    } finally {
      setUpdating(false);
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
        <Link to="/admin/complaints">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">
                    {complaint.is_anonymous ? 'Anonymous' : complaint.profiles?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {complaint.is_anonymous ? 'Hidden' : complaint.profiles?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Center</p>
                  <p className="font-medium">{complaint.center}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{complaint.category}</p>
                </div>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Complaint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea
                  placeholder="Add notes visible only to admins..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleUpdate} disabled={updating} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <ComplaintChat complaintId={id!} isAdmin />
        </div>

        <div>
          <ComplaintTimeline timeline={timeline} />
        </div>
      </div>
    </div>
  );
}
