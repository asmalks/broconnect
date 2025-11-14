import { useEffect, useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-3">
      {activeAnnouncements.map((announcement) => (
        <Card key={announcement.id} className="relative border-l-4 border-warning bg-warning/5">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Megaphone className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base">{announcement.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {announcement.message}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => handleDismiss(announcement.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
