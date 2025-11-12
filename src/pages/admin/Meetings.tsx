import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  useEffect(() => {
    if (selectedMeeting) {
      setStatus(selectedMeeting.status);
      setScheduledDateTime(selectedMeeting.scheduled_date_time || '');
    }
  }, [selectedMeeting]);

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*, profiles!meetings_student_id_fkey(full_name, email)')
        .order('requested_date_time', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);

      const updates: any = {
        status,
        admin_id: user?.id,
      };

      if (scheduledDateTime) {
        updates.scheduled_date_time = scheduledDateTime;
      }

      const { error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', selectedMeeting.id);

      if (error) throw error;

      toast.success('Meeting updated successfully');
      setSelectedMeeting(null);
      loadMeetings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update meeting');
    } finally {
      setUpdating(false);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meeting Requests</h1>
        <p className="text-muted-foreground">
          Manage student meeting requests and schedule appointments.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Requested Time</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No meeting requests found.
                  </TableCell>
                </TableRow>
              ) : (
                meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">
                      {meeting.profiles?.full_name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(meeting.requested_date_time), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      {meeting.scheduled_date_time
                        ? format(new Date(meeting.scheduled_date_time), 'MMM d, yyyy h:mm a')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(meeting.status)}>
                        {meeting.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMeeting(meeting)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Meeting Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-medium">{selectedMeeting?.profiles?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested Time</p>
              <p className="font-medium">
                {selectedMeeting && format(new Date(selectedMeeting.requested_date_time), 'MMMM d, yyyy h:mm a')}
              </p>
            </div>
            {selectedMeeting?.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{selectedMeeting.notes}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(status === 'Accepted' || status === 'Rescheduled') && (
              <div className="space-y-2">
                <Label>Scheduled Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleUpdate} disabled={updating} className="flex-1">
                {updating ? 'Updating...' : 'Update Meeting'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedMeeting(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
