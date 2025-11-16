import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Plus, ListOrdered, MessageSquare, Calendar, User, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import AnnouncementBanner from '@/components/AnnouncementBanner';

const navigation = [
  { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { name: 'Raise Complaint', href: '/student/raise-complaint', icon: Plus },
  { name: 'My Complaints', href: '/student/complaints', icon: ListOrdered },
  { name: 'Messages', href: '/student/messages', icon: MessageSquare },
  { name: 'Meetings', href: '/student/meetings', icon: Calendar },
  { name: 'Profile', href: '/student/profile', icon: User },
];

export default function StudentLayout() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const NavItems = () => (
    <>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
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
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r bg-card md:fixed md:inset-y-0">
        <div className="flex h-14 md:h-16 items-center border-b px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-base md:text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="font-bold text-base md:text-lg">Brototype</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3 md:p-4 overflow-y-auto">
          <NavItems />
        </nav>
        <div className="border-t p-3 md:p-4">
          <Button variant="ghost" className="w-full justify-start text-sm" onClick={signOut}>
            <LogOut className="mr-2 md:mr-3 h-4 md:h-5 w-4 md:w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center gap-3 border-b bg-card px-3 sticky top-0 z-10">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b px-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-base font-bold text-primary-foreground">B</span>
                  </div>
                  <span className="font-bold text-base">Brototype</span>
                </div>
              </div>
              <nav className="flex-1 space-y-1 p-3">
                <NavItems />
              </nav>
              <div className="border-t p-3">
                <Button variant="ghost" className="w-full justify-start text-sm" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-base font-bold text-primary-foreground">B</span>
            </div>
            <span className="font-bold text-base">Brototype</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <AnnouncementBanner />
          <div className="mt-3 md:mt-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
