import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ListOrdered, MessageSquare, Calendar, BarChart3, Megaphone, Users, LogOut, Menu, Building2, UserCircle, School, Bell, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NotificationBadge from '@/components/NotificationBadge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    loadBadgeCounts();
    loadProfile();
    
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

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfileData(data);
  };

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
        const isAnnouncement = item.name === 'Announcements';
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
              isActive 
                ? isAnnouncement 
                  ? 'bg-stat-yellow/30 text-white font-medium shadow-sm backdrop-blur-sm border-l-4 border-stat-yellow' 
                  : 'bg-white/20 text-white font-medium shadow-sm backdrop-blur-sm'
                : isAnnouncement
                  ? 'text-white/80 hover:bg-stat-yellow/20 hover:text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{item.name}</span>
            {item.badge && badgeCount > 0 && (
              <span className="ml-auto bg-warning text-foreground px-2 py-0.5 rounded-full text-xs font-semibold">
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-background">
      {/* Desktop Sidebar - Purple Gradient */}
      <aside className="hidden md:flex md:w-64 flex-col sidebar-gradient md:fixed md:inset-y-0">
        <div className="flex flex-col h-full">
          {/* Logo & Brand */}
          <div className="flex items-center justify-center gap-3 p-6">
            <img src="/src/assets/logo-dark.webp" alt="Brototype" className="h-10" />
          </div>

          {/* Profile Section */}
          <div className="px-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-white/50">
                <AvatarImage src={profileData?.avatar_url || ''} />
                <AvatarFallback className="bg-white/20 text-white font-semibold">
                  {profileData?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
                </AvatarFallback>
              </Avatar>
              <p className="text-white font-semibold text-sm">{profileData?.full_name || 'Admin'}</p>
              <p className="text-white/70 text-xs">{profileData?.center || 'Admin Panel'}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto scrollbar-hide">
            <NavItems />
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-white hover:bg-white/10 rounded-2xl font-medium" 
              onClick={signOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Top Header Bar */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-white border-b border-border/50 sticky top-0 z-10 shadow-sm">
          {/* Mobile Menu & Welcome */}
          <div className="flex items-center gap-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 sidebar-gradient">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-center gap-3 p-6">
                    <img src="/src/assets/logo-dark.webp" alt="Brototype" className="h-10" />
                  </div>
                  <div className="px-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-white/50">
                        <AvatarImage src={profileData?.avatar_url || ''} />
                        <AvatarFallback className="bg-white/20 text-white font-semibold">
                          {profileData?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-white font-semibold text-sm">{profileData?.full_name || 'Admin'}</p>
                      <p className="text-white/70 text-xs">{profileData?.center || 'Admin Panel'}</p>
                    </div>
                  </div>
                  <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto scrollbar-hide">
                    <NavItems />
                  </nav>
                  <div className="p-4 border-t border-white/10">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-white hover:bg-white/10 rounded-2xl font-medium" 
                      onClick={signOut}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="hidden md:block">
              <h2 className="text-xl font-semibold text-foreground">Welcome to Smart</h2>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="search-bar pl-11 w-64"
                />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="relative rounded-xl h-10 w-10">
              <Bell className="w-5 h-5" />
              {(badges.complaints + badges.messages + badges.meetings) > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-foreground text-xs font-semibold rounded-full flex items-center justify-center">
                  {badges.complaints + badges.messages + badges.meetings}
                </span>
              )}
            </Button>
            <Avatar className="w-10 h-10 border-2 border-border cursor-pointer">
              <AvatarImage src={profileData?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-white font-semibold">
                {profileData?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
              </AvatarFallback>
            </Avatar>
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
