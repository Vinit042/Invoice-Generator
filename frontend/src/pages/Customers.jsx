import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerAPI } from '@/services/api';
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
import { INDIAN_STATES, STATE_OPTIONS } from '@/utils/invoiceCalculations';
import SearchableSelect from '@/components/SearchableSelect';
import { Plus, Search, Pencil, Trash2, History } from 'lucide-react';

const emptyCustomer = {
  customerName: '',
  companyName: '',
  gstNumber: '',
  phone: '',
  email: '',
  address: '',
  state: '',
  stateCode: '',
};

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyCustomer);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      const { data } = await customerAPI.getAll({ search });
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyCustomer);
    setDialogOpen(true);
  };

  const openEdit = (customer) => {
    setEditingId(customer.id);
    setForm({
      customerName: customer.customerName || '',
      companyName: customer.companyName || '',
      gstNumber: customer.gstNumber || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      state: customer.state || '',
      stateCode: customer.stateCode || '',
    });
    setDialogOpen(true);
  };

  const openHistory = async (id) => {
    try {
      const { data } = await customerAPI.getById(id);
      setCustomerHistory(data);
      setHistoryOpen(true);
    } catch {
      toast({ title: 'Error', description: 'Could not load history', variant: 'destructive' });
    }
  };

  const handleStateChange = (stateName) => {
    const state = INDIAN_STATES.find((s) => s.name === stateName);
    setForm({ ...form, state: stateName, stateCode: state?.code || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await customerAPI.update(editingId, form);
        toast({ title: 'Customer updated' });
      } else {
        await customerAPI.create(form);
        toast({ title: 'Customer created' });
      }
      setDialogOpen(false);
      fetchCustomers();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Operation failed',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customerAPI.delete(id);
      toast({ title: 'Customer deleted' });
      fetchCustomers();
    } catch {
      toast({ title: 'Error', description: 'Could not delete customer', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage your customer database</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Invoices</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length ? (
                      customers.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.customerName}</TableCell>
                          <TableCell>{c.companyName || '-'}</TableCell>
                          <TableCell>{c.gstNumber || '-'}</TableCell>
                          <TableCell>{c.phone || '-'}</TableCell>
                          <TableCell>{c.state || '-'}</TableCell>
                          <TableCell>{c._count?.invoices || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openHistory(c.id)} title="History">
                                <History className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} title="Delete">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No customers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Customer State</Label>
                <SearchableSelect
                  value={form.state}
                  onValueChange={handleStateChange}
                  options={STATE_OPTIONS}
                  placeholder="Search customer state..."
                  emptyText="No state found"
                />
              </div>
              <div className="space-y-2">
                <Label>Customer State Code</Label>
                <Input value={form.stateCode} readOnly />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer History - {customerHistory?.customerName}</DialogTitle>
          </DialogHeader>
          {customerHistory?.invoices?.length ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customerHistory.invoices.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}`}
                  className="flex justify-between p-3 rounded-lg hover:bg-accent"
                  onClick={() => setHistoryOpen(false)}
                >
                  <span>{inv.invoiceNumber}</span>
                  <span className="text-muted-foreground">{inv.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No invoice history</p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
