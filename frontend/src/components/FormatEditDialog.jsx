import { useState, useEffect, useCallback } from 'react';
import { formatAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import SearchableSelect from '@/components/SearchableSelect';
import { emptyItem, INDIAN_STATES, STATE_OPTIONS, applyItemFieldChange, normalizeStoredItem } from '@/utils/invoiceCalculations';
import { pickCustomization } from '@/utils/helpers';
import InvoiceLineItem from '@/components/InvoiceLineItem';
import { Plus, Building2, FileText, List } from 'lucide-react';

const stripInternalItemFields = (items) =>
  items.map(({ _key, manualTotal, ...item }) => item);

const emptyForm = () => ({
  name: '',
  placeOfSupply: '',
  state: '',
  stateCode: '',
  items: [emptyItem()],
  ...pickCustomization({}),
});

export default function FormatEditDialog({ format, open, onOpenChange, onSaved, companySettings }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (format && open) {
      setForm({
        name: format.name || '',
        placeOfSupply: format.placeOfSupply || '',
        state: format.state || '',
        stateCode: format.stateCode || '',
        items: format.items?.length
          ? format.items.map((i) => ({ ...emptyItem(), ...normalizeStoredItem(i) }))
          : [emptyItem()],
        ...pickCustomization(format),
      });
      setActiveTab('general');
    }
  }, [format, open]);

  const handleStateChange = (stateName) => {
    const state = INDIAN_STATES.find((s) => s.name === stateName);
    setForm({
      ...form,
      state: stateName,
      stateCode: state?.code || '',
      placeOfSupply: stateName,
    });
  };

  const loadFromCompanySettings = () => {
    if (!companySettings) return;
    setForm({
      ...form,
      ...pickCustomization(companySettings),
    });
    toast({ title: 'Loaded', description: 'Bank details & terms copied from company settings' });
  };

  const updateItem = useCallback((index, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = applyItemFieldChange(items[index], field, value);
      return { ...prev, items };
    });
  }, []);

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = useCallback((index) => {
    setForm((prev) => {
      if (prev.items.length <= 1) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await formatAPI.update(format.id, {
        ...form,
        items: stripInternalItemFields(form.items),
      });
      toast({ title: 'Format updated', description: `"${form.name}" saved successfully` });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Could not update format',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!format) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'items', label: 'Line Items', icon: List },
    { id: 'terms', label: 'Terms & Bank', icon: FileText },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice Format — Full Customization</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSave}
          className="space-y-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && activeTab === 'items') {
              e.preventDefault();
            }
          }}
        >
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4 mr-1" />
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === 'general' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Format Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Place of Supply</Label>
                <Input value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <SearchableSelect
                  value={form.state}
                  onValueChange={handleStateChange}
                  options={STATE_OPTIONS}
                  placeholder="Search state..."
                  emptyText="No state found"
                />
              </div>
              <div className="space-y-2">
                <Label>State Code</Label>
                <Input value={form.stateCode} readOnly className="bg-muted" />
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
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
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={loadFromCompanySettings}>
                  Copy from Company Settings
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Branch Name</Label>
                  <Input value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <textarea
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  placeholder="Payment terms, delivery conditions, warranty, etc."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Note (optional)</Label>
                <Input
                  value={form.footerNote}
                  onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
                  placeholder="e.g. This is a computer generated invoice. E. & O.E."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Format'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
