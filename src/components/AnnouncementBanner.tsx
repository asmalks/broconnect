import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { X, Megaphone } from 'lucide-react';

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    loadAnnouncements();
    
    // Load dismissed announcements from sessionStorage (resets on login)
    const dismissedIds = sessionStorage.getItem('dismissedAnnouncements');
    if (dismissedIds) {
      setDismissed(JSON.parse(dismissedIds));
    }
  }, []);

  const loadAnnouncements = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Auto-deactivate expired announcements
      const expired = data?.filter(a => a.expires_at && new Date(a.expires_at) < new Date()) || [];
      if (expired.length > 0) {
        await supabase
          .from('announcements')
          .update({ is_active: false })
          .in('id', expired.map(a => a.id));
      }
      
      setAnnouncements(data?.filter(a => !a.expires_at || new Date(a.expires_at) >= new Date()) || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const activeAnnouncements = announcements.filter((a) => !dismissed.includes(a.id));

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {activeAnnouncements.map((announcement) => (
        <Card key={announcement.id} className="border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                    {announcement.title}
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                      New
                    </Badge>
                    {announcement.expires_at && (
                      <Badge variant="outline" className="text-xs">
                        Expires {new Date(announcement.expires_at).toLocaleDateString()}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDismiss(announcement.id)}
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {announcement.message}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
