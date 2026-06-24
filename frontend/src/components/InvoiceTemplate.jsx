import { formatDate, formatDateTime, getImageUrl, mergeInvoiceDisplaySettings } from '@/utils/helpers';
import { fmtMoney } from '@/utils/invoiceCalculations';
import { A4_CONTENT_HEIGHT_PX } from '@/utils/pdfGenerator';
import '@/styles/invoice-template.css';

const ROW_H      = 42;   // px — fixed comfortable row height
const SPARE_ROWS = 1;    // one blank row shown after actual items

function calcRows(itemCount) {
  return { emptyRows: SPARE_ROWS, rowH: ROW_H };
}

// Keep import used downstream
void A4_CONTENT_HEIGHT_PX;

const TB = { width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', margin: 0 };

export default function InvoiceTemplate({ settings, invoice, items, totals }) {
  const inv     = invoice || {};
  const company = mergeInvoiceDisplaySettings(settings, inv);

  const displayItems = items?.length ? items : [{
    description: '', sacCode: '', rate: 0, discount: 0, taxableValue: 0,
    cgstRate: 0, cgstAmount: 0, sgstRate: 0, sgstAmount: 0, igstRate: 0, igstAmount: 0, total: 0,
  }];

  const { emptyRows, rowH } = calcRows(displayItems.length);

  const summary = totals || {
    subtotal: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, grandTotal: 0,
    amountInWords: 'Rupees Zero Only',
  };

  return (
    <div
      id="invoice-preview"
      className="invoice-container"
      style={{ '--invoice-row-h': `${rowH}px` }}
    >
      <div className="invoice-sheet-main">

        {/* ── HEADER ──────────────────────────────────────── */}
        <table style={TB} className="inv-table">
          <tbody>
            <tr>
              {/* Logo */}
              <td
                className="invoice-cell invoice-text-center invoice-align-middle"
                style={{ width: '18%', padding: '10px 8px', borderRight: '1px solid #000' }}
                rowSpan={4}
              >
                {company.logo
                  ? <img src={getImageUrl(company.logo)} alt="Logo" className="invoice-logo" crossOrigin="anonymous" />
                  : <div className="invoice-logo-placeholder">LOGO</div>
                }
              </td>

              {/* Company name — large, bold */}
              <td
                className="invoice-cell invoice-font-bold"
                colSpan={2}
                style={{ fontSize: 17, padding: '10px 12px', borderBottom: '1px solid #ccc' }}
              >
                {company.companyName || 'Company Name'}
              </td>

              {/* TAX INVOICE box */}
              <td
                className="invoice-cell invoice-text-center invoice-align-middle"
                style={{ width: '22%', borderLeft: '1px solid #000' }}
                rowSpan={2}
              >
                <span className="invoice-tax-title">TAX INVOICE</span>
                <span className="invoice-tax-subtitle">(Original for Recipient)</span>
              </td>
            </tr>

            {/* Address row */}
            <tr>
              <td
                className="invoice-cell invoice-text-11"
                colSpan={2}
                style={{ padding: '5px 12px 8px', color: '#444' }}
              >
                {company.address || 'Office Address'}
              </td>
            </tr>

            {/* GSTIN | PAN | Invoice No */}
            <tr>
              <td className="invoice-cell invoice-text-11" style={{ width: '30%' }}>
                <strong>GSTIN:</strong>&nbsp;{company.gstNumber || '—'}
              </td>
              <td className="invoice-cell invoice-text-11" style={{ width: '30%' }}>
                <strong>PAN:</strong>&nbsp;{company.panNumber || '—'}
              </td>
              <td className="invoice-cell invoice-text-11">
                <strong>Invoice No:</strong>&nbsp;{inv.invoiceNumber || '—'}
              </td>
            </tr>

            {/* Email | Phone | Date */}
            <tr>
              <td className="invoice-cell invoice-text-11">
                <strong>Email:</strong>&nbsp;{company.email || '—'}
              </td>
              <td className="invoice-cell invoice-text-11">
                <strong>Phone:</strong>&nbsp;{company.phone || '—'}
              </td>
              <td className="invoice-cell invoice-text-11">
                <strong>Date:</strong>&nbsp;{formatDate(inv.invoiceDate)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── SUPPLIER & RECEIVER ─────────────────────────── */}
        <table style={TB} className="inv-table-no-top">
          <tbody>
            <tr>
              <td className="invoice-section-head" style={{ width: '50%' }}>Details of Supplier</td>
              <td className="invoice-section-head">Details of Receiver (Billed To)</td>
            </tr>
            <tr>
              <td className="invoice-cell invoice-align-top invoice-text-11" style={{ padding: '9px 10px' }}>
                <strong>{company.companyName}</strong><br />
                {company.address}<br />
                <strong>GSTIN:</strong>&nbsp;{company.gstNumber}<br />
                <strong>State:</strong>&nbsp;{company.state || '—'} ({company.stateCode || '—'})
              </td>
              <td className="invoice-cell invoice-align-top invoice-text-11" style={{ padding: '9px 10px' }}>
                <strong>{inv.customerName || '—'}</strong><br />
                {inv.customerAddress || '—'}<br />
                <strong>GSTIN:</strong>&nbsp;{inv.customerGst || '—'}<br />
                <strong>State:</strong>&nbsp;{inv.customerState || '—'} ({inv.customerStateCode || '—'})
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── SUPPLY DETAILS ──────────────────────────────── */}
        <table style={TB} className="inv-table-no-top">
          <tbody>
            <tr>
              <td className="invoice-cell invoice-text-11" style={{ width: '34%' }}>
                <strong>Place of Supply:</strong>&nbsp;{inv.placeOfSupply || '—'}
              </td>
              <td className="invoice-cell invoice-text-11" style={{ width: '22%' }}>
                <strong>State Code:</strong>&nbsp;{inv.stateCode || '—'}
              </td>
              <td className="invoice-cell invoice-text-11">
                <strong>Date &amp; Time of Supply:</strong>&nbsp;{formatDateTime(inv.supplyDate)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── ITEMS TABLE ─────────────────────────────────── */}
        <div className="invoice-items-section">
          <table style={TB} className="inv-table-no-top">
            <colgroup>
              <col style={{ width: '3%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '4.5%' }} />
              <col style={{ width: '6.5%' }} />
              <col style={{ width: '4.5%' }} />
              <col style={{ width: '6.5%' }} />
              <col style={{ width: '4.5%' }} />
              <col style={{ width: '6.5%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="invoice-head">Sr</th>
                <th className="invoice-head invoice-col-desc">Description</th>
                <th className="invoice-head">SAC</th>
                <th className="invoice-head">Rate (₹)</th>
                <th className="invoice-head">Disc%</th>
                <th className="invoice-head">Disc Amt</th>
                <th className="invoice-head">Taxable</th>
                <th className="invoice-head">CGST%</th>
                <th className="invoice-head">CGST (₹)</th>
                <th className="invoice-head">SGST%</th>
                <th className="invoice-head">SGST (₹)</th>
                <th className="invoice-head">IGST%</th>
                <th className="invoice-head">IGST (₹)</th>
                <th className="invoice-head">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item, idx) => (
                <tr key={idx} className="invoice-item-row">
                  <td className="invoice-cell-sm invoice-text-center">{idx + 1}</td>
                  <td className="invoice-cell-sm invoice-col-desc" style={{ padding: '0 7px' }}>{item.description}</td>
                  <td className="invoice-cell-sm invoice-text-center">{item.sacCode}</td>
                  <td className="invoice-cell-sm invoice-text-right">{fmtMoney(item.rate)}</td>
                  <td className="invoice-cell-sm invoice-text-center">{item.discount || 0}%</td>
                  <td className="invoice-cell-sm invoice-text-right">{fmtMoney(item.discountAmount)}</td>
                  <td className="invoice-cell-sm invoice-text-right">{fmtMoney(item.taxableValue)}</td>
                  <td className="invoice-cell-sm invoice-text-center">{item.cgstRate || 0}%</td>
                  <td className="invoice-cell-sm invoice-text-right">{fmtMoney(item.cgstAmount)}</td>
                  <td className="invoice-cell-sm invoice-text-center">{item.sgstRate || 0}%</td>
                  <td className="invoice-cell-sm invoice-text-right">{fmtMoney(item.sgstAmount)}</td>
                  <td className="invoice-cell-sm invoice-text-center">{item.igstRate || 0}%</td>
                  <td className="invoice-cell-sm invoice-text-right">{fmtMoney(item.igstAmount)}</td>
                  <td className="invoice-cell-sm invoice-text-right invoice-font-semibold">{fmtMoney(item.total)}</td>
                </tr>
              ))}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <tr key={`e-${i}`} className="invoice-item-row">
                  {Array.from({ length: 14 }).map((_, j) => (
                    <td key={j} className="invoice-cell-sm">&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <div className="invoice-sheet-footer">

        {/* Summary totals */}
        <table style={TB} className="inv-table-no-top">
          <colgroup>
            <col style={{ width: '55%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="invoice-cell invoice-align-top" rowSpan={6} style={{ padding: '10px 12px' }}>
                <strong>Amount Chargeable (in words):</strong>
                <br />
                <span className="invoice-amount-words">
                  {summary.amountInWords || inv.amountInWords}
                </span>
              </td>
              <td className="invoice-cell invoice-text-right invoice-text-11">
                <strong>Total Amount Before Tax</strong>
              </td>
              <td className="invoice-cell invoice-text-right invoice-text-11">
                {fmtMoney(summary.subtotal)}
              </td>
            </tr>
            <tr>
              <td className="invoice-cell invoice-text-right invoice-text-11">Add: CGST</td>
              <td className="invoice-cell invoice-text-right invoice-text-11">{fmtMoney(summary.cgst)}</td>
            </tr>
            <tr>
              <td className="invoice-cell invoice-text-right invoice-text-11">Add: SGST</td>
              <td className="invoice-cell invoice-text-right invoice-text-11">{fmtMoney(summary.sgst)}</td>
            </tr>
            <tr>
              <td className="invoice-cell invoice-text-right invoice-text-11">Add: IGST</td>
              <td className="invoice-cell invoice-text-right invoice-text-11">{fmtMoney(summary.igst)}</td>
            </tr>
            <tr>
              <td className="invoice-cell invoice-text-right invoice-text-11">
                <strong>Total Tax Amount</strong>
              </td>
              <td className="invoice-cell invoice-text-right invoice-text-11">
                {fmtMoney(summary.totalTax)}
              </td>
            </tr>
            <tr className="invoice-grand-total">
              <td className="invoice-cell invoice-text-right">
                <strong>Total Amount After Tax</strong>
              </td>
              <td className="invoice-cell invoice-text-right">
                <strong>{fmtMoney(summary.grandTotal)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bank | Terms | Signature */}
        <table style={TB} className="inv-table-no-top">
          <tbody>
            <tr>
              <td className="invoice-cell invoice-align-top invoice-text-11" style={{ width: '33%', padding: '9px 10px' }}>
                <strong>Bank Details:</strong><br />
                Bank: {company.bankName || '—'}<br />
                A/C No: {company.accountNumber || '—'}<br />
                IFSC: {company.ifscCode || '—'}<br />
                Branch: {company.branchName || '—'}
              </td>
              <td className="invoice-cell invoice-align-top invoice-text-11" style={{ width: '34%', padding: '9px 10px' }}>
                <strong>Terms &amp; Conditions:</strong><br />
                <span className="invoice-text-10 invoice-whitespace-pre">
                  {company.terms || 'Payment due within 30 days.'}
                </span>
              </td>
              <td className="invoice-cell invoice-text-center invoice-align-bottom invoice-text-11" style={{ width: '33%', padding: '9px 10px' }}>
                <div className="invoice-sig-box">
                  {company.signature
                    ? <img src={getImageUrl(company.signature)} alt="Signature" className="invoice-signature" crossOrigin="anonymous" />
                    : null
                  }
                </div>
                <strong>Authorized Signatory</strong><br />
                <span className="invoice-text-10">For {company.companyName}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <p className="invoice-footer-note">
          {company.footerNote || 'This is a computer generated invoice. E. & O.E.'}
        </p>
      </div>
    </div>
  );
}
