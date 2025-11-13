import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, Edit, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editCenter, setEditCenter] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = async () => {
    try {
      // Load profiles with their user roles via separate queries
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles for each profile
      const profilesWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .maybeSingle();
          
          return {
            ...profile,
            user_roles: roleData ? [{ role: roleData.role }] : []
          };
        })
      );

      setUsers(profilesWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      const { count: totalComplaints } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: resolvedComplaints } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'Resolved');

      setUserStats({
        totalComplaints: totalComplaints || 0,
        resolvedComplaints: resolvedComplaints || 0,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const filterUsers = () => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.center?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    loadUserStats(user.id);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditCenter(user.center);
    setUserRole(user.user_roles?.[0]?.role || 'student');
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setSubmitting(true);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName,
          center: editCenter,
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Update role
      const currentRole = editingUser.user_roles?.[0]?.role;
      if (currentRole !== userRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: userRole as 'admin' | 'student' })
          .eq('user_id', editingUser.id);

        if (roleError) throw roleError;
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all registered students.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or center..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Center</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.center}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.user_roles?.[0]?.role === 'admin' ? 'default' : 'secondary'}>
                        {user.user_roles?.[0]?.role || 'student'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => { setSelectedUser(null); setUserStats(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{selectedUser?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{selectedUser?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Center</p>
              <p className="font-medium">{selectedUser?.center}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant={selectedUser?.user_roles?.[0]?.role === 'admin' ? 'default' : 'secondary'}>
                {selectedUser?.user_roles?.[0]?.role || 'student'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {selectedUser && format(new Date(selectedUser.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
            {userStats && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Total Complaints</p>
                  <p className="font-medium">{userStats.totalComplaints}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolved Complaints</p>
                  <p className="font-medium">{userStats.resolvedComplaints}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="center">Center</Label>
              <Select value={editCenter} onValueChange={setEditCenter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kochi">Kochi</SelectItem>
                  <SelectItem value="Kozhikode">Kozhikode</SelectItem>
                  <SelectItem value="Trivandrum">Trivandrum</SelectItem>
                  <SelectItem value="Kannur">Kannur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">
                <Shield className="inline h-4 w-4 mr-1" />
                Role
              </Label>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleUpdateUser} disabled={submitting} className="flex-1">
                {submitting ? 'Updating...' : 'Update User'}
              </Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
