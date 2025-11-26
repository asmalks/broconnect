import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ListOrdered, MessageSquare, Calendar, BarChart3, Megaphone, Users, LogOut, Menu, Building2, UserCircle, Sparkles } from 'lucide-react';
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
  { name: 'Profile', href: '/admin/profile', icon: UserCircle, badge: false },
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
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
              isActive 
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-medium shadow-sm' 
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary/10' : 'group-hover:bg-sidebar-accent'} transition-colors`}>
              <item.icon className="h-4 w-4" />
            </div>
            <span className="text-sm">{item.name}</span>
            {item.badge && badgeCount > 0 && <NotificationBadge count={badgeCount} />}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border/50 bg-sidebar/50 backdrop-blur-xl md:fixed md:inset-y-0 shadow-sm">
        <div className="flex h-16 items-center border-b border-border/50 px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">B</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg">Admin Panel</span>
              <p className="text-xs text-muted-foreground">Brototype Connect</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <NavItems />
        </nav>
        <div className="border-t border-border/50 p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm hover:bg-destructive/10 hover:text-destructive transition-colors" 
            onClick={signOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center gap-3 border-b border-border/50 bg-card/80 backdrop-blur-xl px-3 sticky top-0 z-10 shadow-sm">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar/95 backdrop-blur-xl">
              <div className="flex h-14 items-center border-b border-border/50 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-base font-bold text-white">B</span>
                  </div>
                  <div>
                    <span className="font-bold text-base">Admin Panel</span>
                    <p className="text-[10px] text-muted-foreground">Brototype</p>
                  </div>
                </div>
              </div>
              <nav className="flex-1 space-y-1 p-3">
                <NavItems />
              </nav>
              <div className="border-t border-border/50 p-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm hover:bg-destructive/10 hover:text-destructive" 
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">B</span>
            </div>
            <span className="font-bold text-base">Admin</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
