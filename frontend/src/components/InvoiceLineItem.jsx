import { memo, useState, useEffect, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  DECIMAL_INPUT,
  fmtMoney,
  getEffectiveItem,
  mergeLineItemSnapshot,
} from '@/utils/invoiceCalculations';

function fieldsFromItem(item) {
  return {
    description: item.description ?? '',
    sacCode: item.sacCode ?? '',
    manualTotal: item.manualTotal != null && item.manualTotal !== '' ? String(item.manualTotal) : '',
    rate: item.rate != null && item.rate !== '' ? String(item.rate) : '',
    discount: item.discount != null && item.discount !== '' ? String(item.discount) : '',
    cgstRate: String(item.cgstRate ?? 9),
    sgstRate: String(item.sgstRate ?? 9),
    igstRate: String(item.igstRate ?? 0),
  };
}

function InvoiceLineItem({
  item,
  index,
  itemCount,
  onFieldChange,
  onRemove,
}) {
  const [fields, setFields] = useState(() => fieldsFromItem(item));
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  useEffect(() => {
    setFields(fieldsFromItem(item));
  }, [item._key]);

  const mergedItem = useMemo(
    () => mergeLineItemSnapshot(item, fields),
    [item, fields]
  );

  const liveCalc = useMemo(
    () => getEffectiveItem(mergedItem),
    [mergedItem]
  );

  const preventEnter = (e) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const updateField = (localField, parentField, value) => {
    const next = { ...fieldsRef.current, [localField]: value };
    setFields(next);
    onFieldChange(index, parentField, value, next);
  };

  const handleText = (field) => (e) => {
    updateField(field, field, e.target.value);
  };

  const handleDecimal = (localField, parentField) => (e) => {
    const value = e.target.value;
    if (value !== '' && !DECIMAL_INPUT.test(value)) return;
    updateField(localField, parentField, value);
  };

  const hasManualTotal = fields.manualTotal !== '';
  const hasRate = (parseFloat(mergedItem.rate) || 0) > 0;
  const canRemove = itemCount > 1;
  const totalPlaceholder = hasRate && liveCalc.total > 0
    ? `Auto: ${fmtMoney(liveCalc.total)}`
    : 'Enter total — rate & tax auto-fill';

  return (
    <div className="p-4 border rounded-lg space-y-3 relative bg-card">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">Item #{index + 1}</span>
        {canRemove && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Description of Service</Label>
        <Input
          value={fields.description}
          onChange={handleText('description')}
          onKeyDown={preventEnter}
          placeholder="Service description"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">SAC Code</Label>
          <Input
            value={fields.sacCode}
            onChange={handleText('sacCode')}
            onKeyDown={preventEnter}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Total Amount</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={hasManualTotal ? fields.manualTotal : ''}
            onChange={handleDecimal('manualTotal', 'total')}
            onKeyDown={preventEnter}
            placeholder={totalPlaceholder}
            className="font-semibold border-primary/50"
          />
          <p className="text-[10px] text-muted-foreground">
            {hasManualTotal
              ? 'Gross total (before discount) — discount % reduces line total below'
              : 'Enter gross total here, or use Rate below'}
          </p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Rate</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={hasManualTotal ? fmtMoney(liveCalc.rate) : fields.rate}
            onChange={handleDecimal('rate', 'rate')}
            onKeyDown={preventEnter}
            readOnly={hasManualTotal}
            placeholder="Enter rate"
            className={hasManualTotal ? 'bg-muted' : ''}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Discount %</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={fields.discount}
            onChange={handleDecimal('discount', 'discount')}
            onKeyDown={preventEnter}
            placeholder="e.g. 10"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Discount Amt</Label>
          <Input value={fmtMoney(liveCalc.discountAmount)} readOnly tabIndex={-1} className="bg-muted" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Taxable Value</Label>
          <Input value={fmtMoney(liveCalc.taxableValue)} readOnly tabIndex={-1} className="bg-muted" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">CGST %</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={fields.cgstRate}
            onChange={handleDecimal('cgstRate', 'cgstRate')}
            onKeyDown={preventEnter}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">CGST Amt</Label>
          <Input value={fmtMoney(liveCalc.cgstAmount)} readOnly tabIndex={-1} className="bg-muted" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">SGST %</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={fields.sgstRate}
            onChange={handleDecimal('sgstRate', 'sgstRate')}
            onKeyDown={preventEnter}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">SGST Amt</Label>
          <Input value={fmtMoney(liveCalc.sgstAmount)} readOnly tabIndex={-1} className="bg-muted" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">IGST %</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={fields.igstRate}
            onChange={handleDecimal('igstRate', 'igstRate')}
            onKeyDown={preventEnter}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">IGST Amt</Label>
          <Input value={fmtMoney(liveCalc.igstAmount)} readOnly tabIndex={-1} className="bg-muted" />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Line Total</Label>
          <Input value={fmtMoney(liveCalc.total)} readOnly tabIndex={-1} className="bg-muted font-semibold" />
        </div>
      </div>
    </div>
  );
}

export default memo(InvoiceLineItem);
