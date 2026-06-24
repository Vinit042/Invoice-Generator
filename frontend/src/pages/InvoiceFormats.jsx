import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatAPI, settingsAPI } from '@/services/api';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import FormatEditDialog from '@/components/FormatEditDialog';
import { emptyItem, normalizeStoredItem } from '@/utils/invoiceCalculations';
import { pickCustomization } from '@/utils/helpers';
import { FileStack, Plus, Trash2, Play, Pencil } from 'lucide-react';

export default function InvoiceFormats() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editFormat, setEditFormat] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState(null);

  const fetchFormats = async () => {
    try {
      const { data } = await formatAPI.getAll();
      setFormats(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load formats', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormats();
    settingsAPI.get().then(({ data }) => setCompanySettings(data)).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this saved format?')) return;
    try {
      await formatAPI.delete(id);
      toast({ title: 'Format deleted' });
      fetchFormats();
    } catch {
      toast({ title: 'Error', description: 'Could not delete format', variant: 'destructive' });
    }
  };

  const handleUse = (format) => {
    navigate('/invoices/new', {
      state: {
        applyFormat: {
          placeOfSupply: format.placeOfSupply || '',
          state: format.state || '',
          stateCode: format.stateCode || '',
          items: format.items?.length
            ? format.items.map((i) => normalizeStoredItem(i))
            : [emptyItem()],
          ...pickCustomization(format),
        },
      },
    });
  };

  const handleCreateBlank = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await formatAPI.create({
        name: name.trim(),
        items: [emptyItem()],
      });
      toast({ title: 'Format created', description: 'You can use it when creating invoices' });
      setDialogOpen(false);
      setName('');
      fetchFormats();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Could not create format',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Invoice Formats</h1>
            <p className="text-muted-foreground mt-1">
              Save and reuse invoice layouts with pre-filled line items and tax settings
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Format
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileStack className="h-5 w-5" />
              Saved Formats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : formats.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Format Name</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Line Items</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formats.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell>{f.state || '-'}</TableCell>
                        <TableCell>{Array.isArray(f.items) ? f.items.length : 0}</TableCell>
                        <TableCell>{new Date(f.updatedAt).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => { setEditFormat(f); setEditDialogOpen(true); }}>
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleUse(f)}>
                              <Play className="h-4 w-4 mr-1" />
                              Use
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)} title="Delete">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileStack className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No saved formats yet.</p>
                <p className="text-sm mt-1">Create an invoice and click &quot;Save as Format&quot; to reuse it later.</p>
                <Button className="mt-4" asChild>
                  <Link to="/invoices/new">Create Invoice</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Blank Format</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBlank} className="space-y-4">
            <div className="space-y-2">
              <Label>Format Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard GST Service"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FormatEditDialog
        format={editFormat}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSaved={fetchFormats}
        companySettings={companySettings}
      />
    </DashboardLayout>
  );
}
