import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { invoiceAPI, customerAPI, settingsAPI, formatAPI } from '@/services/api';
import DashboardLayout from '@/layouts/DashboardLayout';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  calculateInvoiceTotals, emptyItem, INDIAN_STATES, STATE_OPTIONS,
  DEFAULT_COMPANY_STATE, DEFAULT_COMPANY_STATE_CODE, applyItemFieldChange,
  mergeLineItemSnapshot, normalizeStoredItem,
} from '@/utils/invoiceCalculations';
import { generatePdfFromElement, printInvoice } from '@/utils/pdfGenerator';
import { toPublicSlug, pickCustomization, formatCurrency } from '@/utils/helpers';
import SearchableSelect from '@/components/SearchableSelect';
import InvoiceLineItem from '@/components/InvoiceLineItem';
import InvoicePreviewFrame from '@/components/InvoicePreviewFrame';
import {
  Save, Plus, Download, Printer, Copy, Share2, MessageCircle, FileStack, RefreshCw, ChevronDown,
} from 'lucide-react';

const buildFormFromFormat = (format) => ({
  placeOfSupply: format.placeOfSupply || '',
  state: format.state || '',
  stateCode: format.stateCode || '',
  items: format.items?.length
    ? format.items.map((i) => ({ ...emptyItem(), ...normalizeStoredItem(i) }))
    : [emptyItem()],
  ...pickCustomization(format),
});

const buildCustomizationFromInvoice = (inv) => pickCustomization(inv);

const toApiItems = (items) =>
  items.map(({ _key, manualTotal, discountAmount, ...item }) => ({
    description: item.description ?? '',
    sacCode: item.sacCode ?? '',
    rate: parseFloat(item.rate) || 0,
    discount: parseFloat(item.discount) || 0,
    taxableValue: parseFloat(item.taxableValue) || 0,
    cgstRate: parseFloat(item.cgstRate) || 0,
    cgstAmount: parseFloat(item.cgstAmount) || 0,
    sgstRate: parseFloat(item.sgstRate) || 0,
    sgstAmount: parseFloat(item.sgstAmount) || 0,
    igstRate: parseFloat(item.igstRate) || 0,
    igstAmount: parseFloat(item.igstAmount) || 0,
    total: parseFloat(item.total) || 0,
  }));

const buildInvoicePayload = (form, totals) => {
  const { items: _items, ...formFields } = form;
  const { items: calculatedItems, ...totalFields } = totals;

  return {
    ...formFields,
    ...totalFields,
    customerId: form.customerId || null,
    items: toApiItems(calculatedItems),
  };
};

export default function InvoiceBuilder() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id) && location.pathname.includes('/edit');
  const isView = Boolean(id) && !isEdit;
  const isCreate = !id || Boolean(location.state?.duplicate);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [formats, setFormats] = useState([]);
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [formatName, setFormatName] = useState('');
  const [savingFormat, setSavingFormat] = useState(false);
  const userEditedRef = useRef(false);
  const [form, setForm] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    supplyDate: new Date().toISOString().slice(0, 16),
    placeOfSupply: '',
    state: '',
    stateCode: '',
    customerId: '',
    customerName: '',
    customerAddress: '',
    customerGst: '',
    customerState: '',
    customerStateCode: '',
    status: 'DRAFT',
    items: [emptyItem()],
    ...pickCustomization({}),
  });

  const totals = useMemo(() => calculateInvoiceTotals(form.items), [form.items]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const [settingsRes, customersRes, formatsRes] = await Promise.all([
          settingsAPI.get(),
          customerAPI.getAll(),
          formatAPI.getAll(),
        ]);
        if (cancelled || userEditedRef.current) return;

        setSettings(settingsRes.data);
        setCustomers(customersRes.data);
        setFormats(formatsRes.data);

        if (location.state?.duplicate) {
          const dup = location.state.duplicate;
          setForm({
            invoiceNumber: dup.invoiceNumber,
            invoiceDate: new Date().toISOString().split('T')[0],
            supplyDate: new Date().toISOString().slice(0, 16),
            placeOfSupply: dup.placeOfSupply || '',
            state: dup.state || '',
            stateCode: dup.stateCode || '',
            customerId: dup.customerId?.toString() || '',
            customerName: dup.customerName || '',
            customerAddress: dup.customerAddress || '',
            customerGst: dup.customerGst || '',
            customerState: dup.customerState || '',
            customerStateCode: dup.customerStateCode || '',
            status: 'DRAFT',
            items: dup.items?.length ? dup.items.map((i) => ({ ...emptyItem(), ...normalizeStoredItem(i) })) : [emptyItem()],
            ...buildCustomizationFromInvoice(dup),
          });
        } else if (id) {
          const { data } = await invoiceAPI.getById(id);
          if (cancelled || userEditedRef.current) return;
          const inv = data.invoice;
          setSettings(data.settings);
          setForm({
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate?.split('T')[0],
            supplyDate: inv.supplyDate ? new Date(inv.supplyDate).toISOString().slice(0, 16) : '',
            placeOfSupply: inv.placeOfSupply || '',
            state: inv.state || '',
            stateCode: inv.stateCode || '',
            customerId: inv.customerId?.toString() || '',
            customerName: inv.customerName || '',
            customerAddress: inv.customerAddress || '',
            customerGst: inv.customerGst || '',
            customerState: inv.customerState || inv.state || '',
            customerStateCode: inv.customerStateCode || inv.stateCode || '',
            status: inv.status,
            items: inv.items?.length
              ? inv.items.map((i) => ({ ...emptyItem(), ...normalizeStoredItem(i) }))
              : [emptyItem()],
            ...buildCustomizationFromInvoice(inv),
          });
        } else {
          const { data } = await invoiceAPI.getNextNumber();
          if (cancelled || userEditedRef.current) return;
          const applyFormat = location.state?.applyFormat;
          const companyState = settingsRes.data.state || DEFAULT_COMPANY_STATE;
          const companyStateCode = settingsRes.data.stateCode || DEFAULT_COMPANY_STATE_CODE;
          setForm((f) => ({
            ...f,
            invoiceNumber: data.invoiceNumber,
            state: companyState,
            stateCode: companyStateCode,
            placeOfSupply: companyState,
            ...(applyFormat
              ? buildFormFromFormat(applyFormat)
              : pickCustomization(settingsRes.data)),
          }));
          if (applyFormat) {
            toast({ title: 'Format loaded', description: 'Saved format applied to this invoice' });
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast({ title: 'Error', description: 'Failed to load invoice data', variant: 'destructive' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (searchParams.get('download') === '1' && !loading && settings) {
      setTimeout(async () => {
        try {
          await generatePdfFromElement('invoice-preview', `${form.invoiceNumber.replace(/\//g, '-')}.pdf`);
        } catch {
          toast({ title: 'PDF generation failed', variant: 'destructive' });
        }
      }, 1000);
    }
  }, [loading, settings, searchParams]);

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c.id === parseInt(customerId));
    if (customer) {
      setForm({
        ...form,
        customerId,
        customerName: customer.customerName,
        customerAddress: customer.address || '',
        customerGst: customer.gstNumber || '',
        customerState: customer.state || '',
        customerStateCode: customer.stateCode || '',
      });
    }
  };

  const handleCustomerStateChange = (stateName) => {
    const state = INDIAN_STATES.find((s) => s.name === stateName);
    setForm({
      ...form,
      customerState: stateName,
      customerStateCode: state?.code || '',
    });
  };

  const handleSupplyStateChange = (stateName) => {
    const state = INDIAN_STATES.find((s) => s.name === stateName);
    setForm({
      ...form,
      state: stateName,
      stateCode: state?.code || '',
      placeOfSupply: stateName,
    });
  };

  const updateItem = useCallback((index, field, value, fieldSnapshot) => {
    userEditedRef.current = true;
    setForm((prev) => {
      const items = [...prev.items];
      const merged = fieldSnapshot
        ? mergeLineItemSnapshot(items[index], fieldSnapshot)
        : items[index];
      items[index] = applyItemFieldChange(merged, field, value);
      return { ...prev, items };
    });
  }, []);

  const addItem = () => {
    userEditedRef.current = true;
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = useCallback((index) => {
    userEditedRef.current = true;
    setForm((prev) => {
      if (prev.items.length <= 1) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  }, []);

  const handleLoadFormat = (formatId) => {
    const format = formats.find((f) => f.id.toString() === formatId);
    if (!format) return;
    setForm({
      ...form,
      ...buildFormFromFormat(format),
    });
    toast({ title: 'Format applied', description: `"${format.name}" loaded with terms, bank & items` });
  };

  const loadCustomizationFromSettings = () => {
    if (!settings) return;
    setForm({ ...form, ...pickCustomization(settings) });
    toast({ title: 'Loaded', description: 'Terms & bank details reset from company settings' });
  };

  const handleSaveFormat = async (e) => {
    e.preventDefault();
    if (!formatName.trim()) return;
    setSavingFormat(true);
    try {
      const { data } = await formatAPI.create({
        name: formatName.trim(),
        placeOfSupply: form.placeOfSupply,
        state: form.state,
        stateCode: form.stateCode,
        items: form.items.map(({ _key, manualTotal, ...item }) => item),
        ...pickCustomization(form),
      });
      setFormats((prev) => [data, ...prev]);
      setFormatDialogOpen(false);
      setFormatName('');
      toast({ title: 'Format saved', description: 'You can reuse this format for future invoices' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Could not save format',
        variant: 'destructive',
      });
    } finally {
      setSavingFormat(false);
    }
  };

  const handleSave = async () => {
    if (isCreate && !form.invoiceNumber?.trim()) {
      toast({ title: 'Invoice number required', description: 'Please enter an invoice number', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = buildInvoicePayload(form, totals);

      if (isEdit || (id && !isView)) {
        const { data } = await invoiceAPI.update(id, payload);
        toast({ title: 'Invoice updated' });
        setForm((prev) => ({
          ...prev,
          items: data.items?.length
            ? data.items.map((i) => ({ ...emptyItem(), ...normalizeStoredItem(i) }))
            : prev.items,
        }));
      } else if (!id || location.state?.duplicate) {
        const { data } = await invoiceAPI.create(payload);
        toast({ title: 'Invoice created' });
        navigate(`/invoices/${data.id}/edit`, { replace: true });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save invoice',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await generatePdfFromElement('invoice-preview', `${form.invoiceNumber.replace(/\//g, '-')}.pdf`);
      toast({ title: 'PDF downloaded' });
    } catch {
      toast({ title: 'PDF generation failed', variant: 'destructive' });
    }
  };

  const publicUrl = `${window.location.origin}/invoice/${toPublicSlug(form.invoiceNumber)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: 'Link copied to clipboard' });
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Invoice ${form.invoiceNumber} - ${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-screen w-full" />
      </DashboardLayout>
    );
  }

  const readOnly = isView;

  const previewBlock = (
    <Card className="shadow-md overflow-hidden">
      {/* Preview header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">Live Preview</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">— updates as you type</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadPdf} title="Download PDF">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printInvoice('invoice-preview')} title="Print">
            <Printer className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable paper canvas */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 200px)', minHeight: 480 }}
      >
        <InvoicePreviewFrame>
          <InvoiceTemplate
            settings={settings}
            invoice={form}
            items={totals.items}
            totals={totals}
          />
        </InvoicePreviewFrame>
      </div>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className={`space-y-5 ${!readOnly ? 'pb-24 lg:pb-8' : ''}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isView ? 'View Invoice' : isEdit ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {form.invoiceNumber || 'New invoice'}
              {!readOnly && (
                <span className="ml-2 text-xs rounded-full bg-muted px-2 py-0.5">{form.status}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!readOnly && (
              <Button type="button" onClick={handleSave} disabled={saving} className="hidden sm:inline-flex">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Invoice'}
              </Button>
            )}
            {readOnly && (
              <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>Edit</Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => printInvoice('invoice-preview')}>
              <Printer className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Link</span>
            </Button>
            <Button variant="outline" size="sm" onClick={shareWhatsApp}>
              <MessageCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>

        {readOnly ? (
          <div className="w-full max-w-[840px] mx-auto">{previewBlock}</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,42%)] 2xl:grid-cols-[minmax(0,1fr)_794px] gap-6 items-start">
            <div className="space-y-5 min-w-0">
              <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex-1 space-y-1.5 min-w-0">
                  <Label className="text-xs text-muted-foreground">Load saved format (optional)</Label>
                  <SearchableSelect
                    value=""
                    onValueChange={handleLoadFormat}
                    options={formats.map((f) => ({
                      value: f.id.toString(),
                      label: f.name,
                      searchText: `${f.name} ${f.state || ''}`,
                    }))}
                    placeholder="Choose a template..."
                    emptyText="No saved formats"
                  />
                </div>
                <Button type="button" variant="outline" className="shrink-0 sm:self-end" onClick={() => setFormatDialogOpen(true)}>
                  <FileStack className="h-4 w-4 mr-2" />
                  Save as Format
                </Button>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">1. Customer</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">Who is this invoice for?</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select from saved customers</Label>
                    <SearchableSelect
                      value={form.customerId}
                      onValueChange={handleCustomerSelect}
                      options={customers.map((c) => ({
                        value: c.id.toString(),
                        label: c.customerName,
                        searchText: `${c.customerName} ${c.companyName || ''} ${c.phone || ''} ${c.gstNumber || ''}`,
                      }))}
                      placeholder="Search customer..."
                      emptyText="No customer found — enter details below"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Customer name</Label>
                      <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Client or company name" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Address</Label>
                      <textarea
                        value={form.customerAddress}
                        onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                        className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Billing address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>GSTIN</Label>
                      <Input value={form.customerGst} onChange={(e) => setForm({ ...form, customerGst: e.target.value })} placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <SearchableSelect value={form.customerState} onValueChange={handleCustomerStateChange} options={STATE_OPTIONS} placeholder="Customer state..." emptyText="No state found" />
                    </div>
                    <div className="space-y-2">
                      <Label>State code</Label>
                      <Input value={form.customerStateCode} readOnly className="bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">2. Invoice details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice number</Label>
                    <Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} readOnly={!isCreate} className={!isCreate ? 'bg-muted' : ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice date</Label>
                    <Input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Supply date & time</Label>
                    <Input type="datetime-local" value={form.supplyDate} onChange={(e) => setForm({ ...form, supplyDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Place of supply (state)</Label>
                    <SearchableSelect value={form.state} onValueChange={handleSupplyStateChange} options={STATE_OPTIONS} placeholder="Supply state..." emptyText="No state found" />
                    <p className="text-xs text-muted-foreground">Code: {form.stateCode || '—'} · Default: {settings?.state || DEFAULT_COMPANY_STATE}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base">3. Services & items</CardTitle>
                    <p className="text-sm text-muted-foreground font-normal mt-1">Enter rate — totals calculate automatically</p>
                  </div>
                  <Button type="button" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" /> Add item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.items.map((item, idx) => (
                    <InvoiceLineItem
                      key={item._key ?? idx}
                      item={item}
                      index={idx}
                      itemCount={form.items.length}
                      onFieldChange={updateItem}
                      onRemove={removeItem}
                    />
                  ))}
                  <div className="rounded-lg border bg-primary/5 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Taxable</p>
                      <p className="text-lg font-semibold tabular-nums">{formatCurrency(totals.subtotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CGST</p>
                      <p className="text-lg font-semibold tabular-nums">{formatCurrency(totals.cgst)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SGST</p>
                      <p className="text-lg font-semibold tabular-nums">{formatCurrency(totals.sgst)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Grand total</p>
                      <p className="text-xl font-bold text-primary tabular-nums">{formatCurrency(totals.grandTotal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <details className="group rounded-lg border bg-card shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium text-sm hover:bg-muted/30">
                  <span>4. Terms, bank & footer (optional)</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <CardContent className="space-y-4 border-t pt-4">
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={loadCustomizationFromSettings}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Load from company settings
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank name</Label>
                      <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Account number</Label>
                      <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC</Label>
                      <Input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Input value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Terms & conditions</Label>
                    <textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} placeholder="Payment due within 30 days..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Footer note</Label>
                    <Input value={form.footerNote} onChange={(e) => setForm({ ...form, footerNote: e.target.value })} placeholder="This is a computer generated invoice. E. & O.E." />
                  </div>
                </CardContent>
              </details>

              <div className="xl:hidden">{previewBlock}</div>
            </div>

            <div className="hidden xl:block sticky top-4 max-h-[calc(100vh-2rem)]">{previewBlock}</div>
          </div>
        )}

        {!readOnly && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur p-3 sm:hidden">
            <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
              <div>
                <p className="text-xs text-muted-foreground">Grand total</p>
                <p className="text-lg font-bold text-primary tabular-nums">{formatCurrency(totals.grandTotal)}</p>
              </div>
              <Button type="button" onClick={handleSave} disabled={saving} className="min-w-[120px]">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={formatDialogOpen} onOpenChange={setFormatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Invoice Format</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveFormat} className="space-y-4">
            <div className="space-y-2">
              <Label>Format Name</Label>
              <Input
                value={formatName}
                onChange={(e) => setFormatName(e.target.value)}
                placeholder="e.g. Monthly Retainer, Web Dev Package"
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Saves line items, tax rates, supply state, terms, bank details, and footer note.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormatDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={savingFormat}>
                {savingFormat ? 'Saving...' : 'Save Format'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
