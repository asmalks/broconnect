import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ComplaintChatProps {
  complaintId: string;
  isAdmin?: boolean;
}

export default function ComplaintChat({ complaintId, isAdmin = false }: ComplaintChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (complaintId && user) {
      loadMessages();
      markMessagesAsRead();
      subscribeToMessages();
    }
  }, [complaintId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('complaint_id', complaintId)
        .eq('receiver_id', user?.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const loadMessages = async () => {
    try {
      // Fetch messages first
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch sender profiles separately
      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds);

        if (profilesError) throw profilesError;

        // Merge profiles into messages
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const enrichedMessages = messagesData.map(msg => ({
          ...msg,
          sender: profilesMap.get(msg.sender_id)
        }));

        setMessages(enrichedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${complaintId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `complaint_id=eq.${complaintId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      setSending(true);

      // Get receiver ID (admin or student)
      const { data: complaint } = await supabase
        .from('complaints')
        .select('user_id, assigned_admin_id')
        .eq('id', complaintId)
        .single();

      const receiverId = isAdmin ? complaint?.user_id : complaint?.assigned_admin_id;

      if (!receiverId) {
        toast.error('Cannot send message: No recipient assigned');
        return;
      }

      const { error } = await supabase.from('messages').insert({
        complaint_id: complaintId,
        sender_id: user.id,
        receiver_id: receiverId,
        message_text: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-b from-card to-muted/20">
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <CardTitle className="text-lg">Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[500px] overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>
                      {message.sender?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {!isOwnMessage && (
                      <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
                        {message.sender?.full_name}
                      </span>
                    )}
                    <div className={`rounded-2xl px-4 py-2 shadow-sm ${
                      isOwnMessage 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-card border rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.message_text}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1 rounded-full bg-muted/50 border-muted-foreground/20"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="rounded-full h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
