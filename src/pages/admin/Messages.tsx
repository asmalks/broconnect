import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare } from 'lucide-react';
import ComplaintChat from '@/components/ComplaintChat';

export default function AdminMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadConversations();
      loadUnreadCounts();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('id, title, status, profiles(full_name)')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      if (data && data.length > 0) {
        setSelectedComplaint(data[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('complaint_id')
        .eq('receiver_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((msg) => {
        counts[msg.complaint_id] = (counts[msg.complaint_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Chat with students about their complaints.
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No conversations available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4 h-[calc(100vh-12rem)]">
          <Card className="lg:col-span-1 bg-gradient-to-b from-card to-card/50">
            <CardContent className="p-2 space-y-1 h-full overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedComplaint(conv.id);
                    loadUnreadCounts();
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all relative ${
                    selectedComplaint === conv.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'hover:bg-muted'
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{conv.title}</p>
                  <p className={`text-xs mt-1 ${selectedComplaint === conv.id ? 'opacity-90' : 'text-muted-foreground'}`}>
                    {conv.profiles?.full_name}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`mt-1 text-xs ${selectedComplaint === conv.id ? 'border-primary-foreground/30' : ''}`}
                  >
                    {conv.status}
                  </Badge>
                  {unreadCounts[conv.id] > 0 && (
                    <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCounts[conv.id]}
                    </span>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            {selectedComplaint && <ComplaintChat complaintId={selectedComplaint} isAdmin />}
          </div>
        </div>
      )}
    </div>
  );
}
