import { useEffect, useState } from 'react';
import { settingsAPI, formatAPI } from '@/services/api';
import DashboardLayout from '@/layouts/DashboardLayout';
import FormatEditDialog from '@/components/FormatEditDialog';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getImageUrl } from '@/utils/helpers';
import SearchableSelect from '@/components/SearchableSelect';
import { STATE_OPTIONS, DEFAULT_COMPANY_STATE, DEFAULT_COMPANY_STATE_CODE, INDIAN_STATES } from '@/utils/invoiceCalculations';
import { Save, Upload, FileStack, Pencil, Trash2 } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    email: '',
    phone: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    invoicePrefix: 'BGS',
    financialYear: '26-27',
    state: DEFAULT_COMPANY_STATE,
    stateCode: DEFAULT_COMPANY_STATE_CODE,
    terms: '',
  });
  const [logo, setLogo] = useState(null);
  const [signature, setSignature] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [formats, setFormats] = useState([]);
  const [formatsLoading, setFormatsLoading] = useState(true);
  const [editFormat, setEditFormat] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchFormats = async () => {
    try {
      const { data } = await formatAPI.getAll();
      setFormats(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load invoice formats', variant: 'destructive' });
    } finally {
      setFormatsLoading(false);
    }
  };

  useEffect(() => {
    settingsAPI
      .get()
      .then(({ data }) => {
        setForm({
          companyName: data.companyName || '',
          gstNumber: data.gstNumber || '',
          panNumber: data.panNumber || '',
          address: data.address || '',
          email: data.email || '',
          phone: data.phone || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          branchName: data.branchName || '',
          invoicePrefix: data.invoicePrefix || 'BGS',
          financialYear: data.financialYear || '26-27',
          state: data.state || DEFAULT_COMPANY_STATE,
          stateCode: data.stateCode || DEFAULT_COMPANY_STATE_CODE,
          terms: data.terms || '',
        });
        if (data.logo) setLogoPreview(getImageUrl(data.logo));
        if (data.signature) setSignaturePreview(getImageUrl(data.signature));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetchFormats();
  }, []);

  const handleDeleteFormat = async (id) => {
    if (!confirm('Delete this saved format?')) return;
    try {
      await formatAPI.delete(id);
      toast({ title: 'Format deleted' });
      fetchFormats();
    } catch {
      toast({ title: 'Error', description: 'Could not delete format', variant: 'destructive' });
    }
  };

  const openEditFormat = (format) => {
    setEditFormat(format);
    setEditDialogOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCompanyStateChange = (stateName) => {
    const state = INDIAN_STATES.find((s) => s.name === stateName);
    setForm({
      ...form,
      state: stateName,
      stateCode: state?.code || '',
    });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === 'logo') {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setSignature(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (logo) formData.append('logo', logo);
      if (signature) formData.append('signature', signature);

      await settingsAPI.update(formData);
      toast({ title: 'Settings saved', description: 'Company settings updated successfully' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your company details for invoices</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input name="companyName" value={form.companyName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input name="gstNumber" value={form.gstNumber} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>PAN Number</Label>
                <Input name="panNumber" value={form.panNumber} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input name="email" type="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Office Address</Label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Company State</Label>
                <SearchableSelect
                  value={form.state}
                  onValueChange={handleCompanyStateChange}
                  options={STATE_OPTIONS}
                  placeholder="Search state..."
                  emptyText="No state found"
                />
              </div>
              <div className="space-y-2">
                <Label>Company State Code</Label>
                <Input value={form.stateCode} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview && <img src={logoPreview} alt="Logo" className="h-16 w-16 object-contain border rounded" />}
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-9 px-3">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input name="bankName" value={form.bankName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input name="accountNumber" value={form.accountNumber} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input name="ifscCode" value={form.ifscCode} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Branch Name</Label>
                <Input name="branchName" value={form.branchName} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Configuration</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Prefix</Label>
                <Input name="invoicePrefix" value={form.invoicePrefix} onChange={handleChange} placeholder="BGS" />
              </div>
              <div className="space-y-2">
                <Label>Financial Year</Label>
                <Input name="financialYear" value={form.financialYear} onChange={handleChange} placeholder="26-27" />
              </div>
              <p className="md:col-span-2 text-sm text-muted-foreground">
                Example format: {form.invoicePrefix}/0001/{form.financialYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Authorized Signatory</Label>
                <div className="flex items-center gap-4">
                  {signaturePreview && <img src={signaturePreview} alt="Signature" className="h-16 object-contain border rounded" />}
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-9 px-3">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Signature
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'signature')} />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <textarea
                  name="terms"
                  value={form.terms}
                  onChange={handleChange}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Payment terms, delivery conditions, etc."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileStack className="h-5 w-5" />
                Saved Invoice Formats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Edit your saved invoice formats — change name, state, supply details, and line items.
              </p>
              {formatsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : formats.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Format Name</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formats.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.name}</TableCell>
                          <TableCell>{f.state || '-'}</TableCell>
                          <TableCell>{Array.isArray(f.items) ? f.items.length : 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button type="button" variant="outline" size="sm" onClick={() => openEditFormat(f)}>
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteFormat(f.id)} title="Delete">
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
                <p className="text-sm text-muted-foreground text-center py-6">
                  No saved formats yet. Create an invoice and click &quot;Save Current as Format&quot;.
                </p>
              )}
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>

        <FormatEditDialog
          format={editFormat}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSaved={fetchFormats}
          companySettings={form}
        />
      </div>
    </DashboardLayout>
  );
}
