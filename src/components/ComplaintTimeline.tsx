import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, FileText, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEntry {
  id: string;
  action_type: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
  created_at: string;
  profiles?: { full_name: string };
}

interface ComplaintTimelineProps {
  timeline: TimelineEntry[];
}

export default function ComplaintTimeline({ timeline }: ComplaintTimelineProps) {
  const getIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Circle className="h-4 w-4" />;
      case 'status_changed':
        return <AlertCircle className="h-4 w-4" />;
      case 'assigned':
        return <User className="h-4 w-4" />;
      case 'priority_changed':
        return <AlertCircle className="h-4 w-4" />;
      case 'admin_note':
        return <FileText className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getTitle = (entry: TimelineEntry) => {
    switch (entry.action_type) {
      case 'created':
        return 'Complaint Created';
      case 'status_changed':
        return `Status: ${entry.old_value} → ${entry.new_value}`;
      case 'assigned':
        return 'Assigned to Admin';
      case 'priority_changed':
        return `Priority: ${entry.old_value} → ${entry.new_value}`;
      case 'admin_note':
        return 'Admin Note';
      default:
        return 'Update';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              <div className="relative flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {getIcon(entry.action_type)}
                </div>
                {index < timeline.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">{getTitle(entry)}</p>
                {entry.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                  {entry.profiles?.full_name && ` • ${entry.profiles.full_name}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
