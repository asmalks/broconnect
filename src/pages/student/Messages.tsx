import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare } from 'lucide-react';
import ComplaintChat from '@/components/ComplaintChat';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('id, title, status')
        .eq('user_id', user?.id)
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

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Chat with administrators about your complaints.
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground">
              Raise a complaint to start chatting with admins
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-1">
            <CardContent className="p-4 space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedComplaint(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedComplaint === conv.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <p className="font-medium text-sm truncate">{conv.title}</p>
                  <p className="text-xs opacity-70">{conv.status}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            {selectedComplaint && <ComplaintChat complaintId={selectedComplaint} />}
          </div>
        </div>
      )}
    </div>
  );
}
