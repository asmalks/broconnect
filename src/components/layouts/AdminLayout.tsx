import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ListOrdered, MessageSquare, Calendar, BarChart3, Megaphone, Users, LogOut, Menu, Building2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NotificationBadge from '@/components/NotificationBadge';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, badge: false },
  { name: 'Complaints', href: '/admin/complaints', icon: ListOrdered, badge: true, badgeKey: 'complaints' },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare, badge: true, badgeKey: 'messages' },
  { name: 'Meetings', href: '/admin/meetings', icon: Calendar, badge: true, badgeKey: 'meetings' },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, badge: false },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone, badge: false },
  { name: 'Centers', href: '/admin/centers', icon: Building2, badge: false },
  { name: 'Users', href: '/admin/users', icon: Users, badge: false },
];

export default function AdminLayout() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState({ complaints: 0, messages: 0, meetings: 0 });

  useEffect(() => {
    loadBadgeCounts();
    
    // Subscribe to real-time updates
    const complaintsChannel = supabase
      .channel('complaints-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => loadBadgeCounts())
      .subscribe();
      
    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadBadgeCounts())
      .subscribe();
      
    const meetingsChannel = supabase
      .channel('meetings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => loadBadgeCounts())
      .subscribe();

    return () => {
      supabase.removeChannel(complaintsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(meetingsChannel);
    };
  }, [user]);

  const loadBadgeCounts = async () => {
    try {
      // Count pending complaints
      const { count: complaintsCount } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      // Count unread messages received by admin
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user?.id)
        .eq('is_read', false);

      // Count pending meetings
      const { count: meetingsCount } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      setBadges({
        complaints: complaintsCount || 0,
        messages: messagesCount || 0,
        meetings: meetingsCount || 0,
      });
    } catch (error) {
      console.error('Error loading badge counts:', error);
    }
  };

  const NavItems = () => (
    <>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        const badgeCount = item.badge && item.badgeKey ? badges[item.badgeKey as keyof typeof badges] : 0;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-hover-accent ${
              isActive ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
            {item.badge && <NotificationBadge count={badgeCount} />}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavItems />
        </nav>
        <div className="border-t p-4">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex h-16 items-center gap-4 border-b bg-card px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center border-b px-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-foreground">B</span>
                  </div>
                  <span className="font-bold text-lg">Admin Panel</span>
                </div>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                <NavItems />
              </nav>
              <div className="border-t p-4">
                <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
