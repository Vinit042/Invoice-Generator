import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '@/services/api';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { generatePdfFromElement } from '@/utils/pdfGenerator';
import { Plus, Search, Eye, Pencil, Copy, Download, Trash2 } from 'lucide-react';

export default function Invoices() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchInvoices = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (status && status !== 'ALL') params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await invoiceAPI.getAll(params);
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timer);
  }, [search, status, startDate, endDate]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoiceAPI.delete(id);
      toast({ title: 'Invoice deleted' });
      fetchInvoices();
    } catch {
      toast({ title: 'Error', description: 'Could not delete invoice', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await invoiceAPI.getById(id);
      const { invoice, settings } = data;
      const { data: nextNum } = await invoiceAPI.getNextNumber();
      navigate('/invoices/new', {
        state: {
          duplicate: {
            ...invoice,
            invoiceNumber: nextNum.invoiceNumber,
            status: 'DRAFT',
            id: undefined,
            items: invoice.items,
          },
          settings,
        },
      });
    } catch {
      toast({ title: 'Error', description: 'Could not duplicate invoice', variant: 'destructive' });
    }
  };

  const handleDownload = async (id, invoiceNumber) => {
    navigate(`/invoices/${id}?download=1`);
    toast({ title: 'Opening invoice for download...' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground mt-1">Manage all your GST invoices</p>
          </div>
          <Button asChild>
            <Link to="/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full lg:w-40" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full lg:w-40" />
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
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length ? (
                      invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                          <TableCell>{inv.customerName || inv.customer?.customerName || '-'}</TableCell>
                          <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                          <TableCell><Badge status={inv.status}>{inv.status}</Badge></TableCell>
                          <TableCell>{formatCurrency(inv.grandTotal)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild title="View">
                                <Link to={`/invoices/${inv.id}`}><Eye className="h-4 w-4" /></Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild title="Edit">
                                <Link to={`/invoices/${inv.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDuplicate(inv.id)} title="Duplicate">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDownload(inv.id, inv.invoiceNumber)} title="Download PDF">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)} title="Delete">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No invoices found
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
    </DashboardLayout>
  );
}
