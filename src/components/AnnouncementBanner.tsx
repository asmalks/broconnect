import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, X } from 'lucide-react';

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    loadAnnouncements();
    const dismissedIds = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    setDismissed(dismissedIds);
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const activeAnnouncements = announcements.filter((a) => !dismissed.includes(a.id));

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeAnnouncements.map((announcement) => (
        <Alert key={announcement.id} className="relative">
          <Megaphone className="h-4 w-4" />
          <AlertTitle>{announcement.title}</AlertTitle>
          <AlertDescription>{announcement.message}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => handleDismiss(announcement.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
