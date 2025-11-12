import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Meetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [complaintId, setComplaintId] = useState('');
  const [requestedDateTime, setRequestedDateTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      loadMeetings();
      loadComplaints();
    }
  }, [user]);

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('student_id', user?.id)
        .order('requested_date_time', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('id, title')
        .eq('user_id', user?.id);

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestedDateTime) {
      toast.error('Please select a date and time');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('meetings').insert({
        student_id: user?.id,
        complaint_id: complaintId || null,
        requested_date_time: requestedDateTime,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast.success('Meeting request submitted successfully!');
      setOpen(false);
      setComplaintId('');
      setRequestedDateTime('');
      setNotes('');
      loadMeetings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit meeting request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Accepted':
        return 'bg-success/10 text-success border-success/20';
      case 'Rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Rescheduled':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Requests</h1>
          <p className="text-muted-foreground">
            Request meetings with administrators to discuss your concerns.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Related Complaint (Optional)</Label>
                <Select value={complaintId} onValueChange={setComplaintId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a complaint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {complaints.map((complaint) => (
                      <SelectItem key={complaint.id} value={complaint.id}>
                        {complaint.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="datetime">Preferred Date & Time *</Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={requestedDateTime}
                  onChange={(e) => setRequestedDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {meetings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No meeting requests yet</p>
              <p className="text-sm text-muted-foreground">
                Click "Request Meeting" to schedule one
              </p>
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Meeting Request #{meeting.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(meeting.requested_date_time), 'MMMM d, yyyy h:mm a')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {meeting.notes && (
                  <p className="text-sm text-muted-foreground mb-4">{meeting.notes}</p>
                )}
                {meeting.scheduled_date_time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                      Scheduled: {format(new Date(meeting.scheduled_date_time), 'MMMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
