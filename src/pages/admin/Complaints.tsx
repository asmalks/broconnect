import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, Search, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [editingComplaint, setEditingComplaint] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchQuery, statusFilter]);

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = complaints;

    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredComplaints(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'In Progress':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Resolved':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Low':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted';
    }
  };

  const handleEditComplaint = (complaint: any) => {
    setEditingComplaint(complaint);
    setEditStatus(complaint.status);
    setEditPriority(complaint.priority);
    setEditCategory(complaint.category);
    setAdminNotes('');
  };

  const handleUpdateComplaint = async () => {
    if (!editingComplaint) return;

    try {
      setUpdating(true);

      const { error: updateError } = await supabase
        .from('complaints')
        .update({
          status: editStatus as 'Pending' | 'In Progress' | 'Resolved',
          priority: editPriority as 'Low' | 'Medium' | 'High',
          category: editCategory as 'Technical' | 'Mentor' | 'Facility' | 'Other',
          assigned_admin_id: user?.id,
        })
        .eq('id', editingComplaint.id);

      if (updateError) throw updateError;

      await supabase.from('complaint_timeline').insert({
        complaint_id: editingComplaint.id,
        action_by: user?.id,
        action_type: 'status_updated',
        old_value: editingComplaint.status,
        new_value: editStatus,
        notes: adminNotes || null,
      });

      toast.success('Complaint updated successfully');
      setEditingComplaint(null);
      loadComplaints();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-0">
      <div className="px-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Complaints</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage student complaints
        </p>
      </div>

      <Card className="bg-gradient-to-br from-card to-card/50">
        <CardContent className="pt-4 md:pt-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-xs md:text-sm">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label className="text-xs md:text-sm">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No complaints found</TableCell>
                </TableRow>
              ) : (
                filteredComplaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.is_anonymous ? 'Anonymous' : c.profiles?.full_name}</TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={getPriorityColor(c.priority)}>{c.priority}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={getStatusColor(c.status)}>{c.status}</Badge></TableCell>
                    <TableCell>{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedComplaint(c)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditComplaint(c)}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="md:hidden space-y-3">
        {filteredComplaints.length === 0 ? (
          <Card className="p-4 text-center text-sm">No complaints found</Card>
        ) : (
          filteredComplaints.map((c) => (
            <Card key={c.id} className="bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-3 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">{c.is_anonymous ? 'Anonymous' : c.profiles?.full_name}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(c.status)}`}>{c.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">{c.category}</Badge>
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(c.priority)}`}>{c.priority}</Badge>
                  <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'MMM d')}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setSelectedComplaint(c)}><Eye className="h-3 w-3 mr-1" />View</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleEditComplaint(c)}><Edit className="h-3 w-3 mr-1" />Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl mx-3 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="pr-8">{selectedComplaint?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">Student</p><p className="text-sm font-medium">{selectedComplaint?.is_anonymous ? 'Anonymous' : selectedComplaint?.profiles?.full_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium break-all">{selectedComplaint?.is_anonymous ? 'Hidden' : selectedComplaint?.profiles?.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm font-medium">{selectedComplaint?.category}</p></div>
              <div><p className="text-xs text-muted-foreground">Priority</p><p className="text-sm font-medium">{selectedComplaint?.priority}</p></div>
            </div>
            <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm mt-1">{selectedComplaint?.description}</p></div>
            {selectedComplaint?.attachment_url && <div><p className="text-xs text-muted-foreground">Attachment</p><a href={selectedComplaint.attachment_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">View</a></div>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingComplaint} onOpenChange={() => setEditingComplaint(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl mx-3 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="pr-8">Edit Complaint</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-xs">Status</Label><Select value={editStatus} onValueChange={setEditStatus}><SelectTrigger className="text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Resolved">Resolved</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-xs">Priority</Label><Select value={editPriority} onValueChange={setEditPriority}><SelectTrigger className="text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label className="text-xs">Category</Label><Select value={editCategory} onValueChange={setEditCategory}><SelectTrigger className="text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Technical">Technical</SelectItem><SelectItem value="Mentor">Mentor</SelectItem><SelectItem value="Facility">Facility</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-xs">Notes</Label><Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Notes..." className="min-h-[80px] text-sm" /></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleUpdateComplaint} disabled={updating} className="w-full sm:flex-1 text-sm">{updating ? 'Updating...' : 'Update'}</Button>
              <Button variant="outline" onClick={() => setEditingComplaint(null)} className="w-full sm:flex-1 text-sm">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
