import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
}

export default function FeedbackDialog({ open, onOpenChange, complaintId }: FeedbackDialogProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);

      const { data: complaint } = await supabase
        .from('complaints')
        .select('assigned_admin_id')
        .eq('id', complaintId)
        .single();

      const { error } = await supabase.from('feedback').insert({
        complaint_id: complaintId,
        student_id: user?.id,
        admin_id: complaint?.assigned_admin_id,
        rating,
        comment: comment.trim() || null,
        is_anonymous: isAnonymous,
      });

      if (error) throw error;

      toast.success('Thank you for your feedback!');
      onOpenChange(false);
      setRating(0);
      setComment('');
      setIsAnonymous(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How satisfied are you with the resolution of your complaint?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Additional Comments (Optional)</Label>
            <Textarea
              placeholder="Share your thoughts..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous-feedback"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <Label htmlFor="anonymous-feedback" className="cursor-pointer">
              Submit anonymously
            </Label>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="flex-1">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
