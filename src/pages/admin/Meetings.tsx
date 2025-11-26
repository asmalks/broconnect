import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Clock, ExternalLink } from 'lucide-react';

export default function AdminMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  useEffect(() => {
    if (selectedMeeting) {
      setStatus(selectedMeeting.status);
      // Convert ISO string to local datetime-local format
      const scheduledTime = selectedMeeting.scheduled_date_time 
        ? new Date(selectedMeeting.scheduled_date_time).toISOString().slice(0, 16)
        : '';
      setScheduledDateTime(scheduledTime);
      setNotes(selectedMeeting.notes || '');
      setMeetingLink(selectedMeeting.meeting_link || '');
    }
  }, [selectedMeeting]);

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*, profiles(full_name, email)')
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
        notes: notes || null,
        meeting_link: meetingLink || null,
      };

      if (scheduledDateTime) {
        // Convert local datetime to ISO string for database storage
        updates.scheduled_date_time = new Date(scheduledDateTime).toISOString();
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

  const getTimeRemaining = (scheduledTime: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMs = scheduled.getTime() - now.getTime();

    if (diffMs < 0) return 'Meeting time has passed';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }

    return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
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

      {/* Desktop Table View */}
      <Card className="hidden md:block">
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
                      <div className="space-y-1">
                        <div>{meeting.profiles?.full_name}</div>
                        {meeting.status === 'Accepted' && meeting.scheduled_date_time && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {getTimeRemaining(meeting.scheduled_date_time)}
                          </div>
                        )}
                      </div>
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
                      <div className="flex items-center justify-end gap-2">
                        {meeting.meeting_link && meeting.status === 'Accepted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(meeting.meeting_link, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMeeting(meeting)}
                        >
                          Manage
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {meetings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No meeting requests found.
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{meeting.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(meeting.requested_date_time), 'MMM d, h:mm a')}
                      </p>
                      {meeting.status === 'Accepted' && meeting.scheduled_date_time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {getTimeRemaining(meeting.scheduled_date_time)}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className={getStatusColor(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </div>
                  {meeting.meeting_link && meeting.status === 'Accepted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(meeting.meeting_link, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Join Google Meet
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
              <>
                <div className="space-y-2">
                  <Label>Scheduled Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledDateTime || ''}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Google Meet Link (Optional)</Label>
                  <Input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    Share a Google Meet link for the virtual meeting
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this meeting..."
                rows={3}
              />
            </div>

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
