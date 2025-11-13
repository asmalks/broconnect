import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Center {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export default function Centers() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [centerToDelete, setCenterToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCenters(data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (editingCenter) {
        const { error } = await supabase
          .from('centers')
          .update({ name, location })
          .eq('id', editingCenter.id);

        if (error) throw error;
        toast.success('Center updated successfully');
      } else {
        const { error } = await supabase
          .from('centers')
          .insert({ name, location });

        if (error) throw error;
        toast.success('Center added successfully');
      }

      setDialogOpen(false);
      resetForm();
      loadCenters();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save center');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (center: Center) => {
    setEditingCenter(center);
    setName(center.name);
    setLocation(center.location);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!centerToDelete) return;

    try {
      const { error } = await supabase
        .from('centers')
        .delete()
        .eq('id', centerToDelete);

      if (error) throw error;

      toast.success('Center deleted successfully');
      loadCenters();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete center');
    } finally {
      setDeleteDialogOpen(false);
      setCenterToDelete(null);
    }
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setEditingCenter(null);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centers</h1>
          <p className="text-muted-foreground">
            Manage center locations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Center
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCenter ? 'Edit Center' : 'Add New Center'}</DialogTitle>
              <DialogDescription>
                {editingCenter ? 'Update the center details below.' : 'Enter the details for the new center.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Center Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter center name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCenter ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Centers</CardTitle>
        </CardHeader>
        <CardContent>
          {centers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No centers added yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Center Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centers.map((center) => (
                  <TableRow key={center.id} className="hover:bg-hover-accent transition-colors">
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>{center.location}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(center)}
                          className="hover:bg-hover-accent transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCenterToDelete(center.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the center.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
