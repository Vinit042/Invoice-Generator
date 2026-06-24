import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI } from '@/services/api';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import InvoicePreviewFrame from '@/components/InvoicePreviewFrame';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { generatePdfFromElement, printInvoice } from '@/utils/pdfGenerator';
import { Download, Printer, MessageCircle } from 'lucide-react';

export default function PublicInvoice() {
  const { invoiceNumber } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    publicAPI
      .getInvoice(invoiceNumber)
      .then(({ data: res }) => setData(res))
      .catch(() => setError('Invoice not found'))
      .finally(() => setLoading(false));
  }, [invoiceNumber]);

  const shareWhatsApp = () => {
    const url = window.location.href;
    const text = encodeURIComponent(`Invoice ${data?.invoice?.invoiceNumber} - ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="h-96 w-full max-w-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-muted-foreground">The invoice you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const { invoice, settings } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-bold text-lg">{settings?.companyName}</h1>
            <p className="text-sm text-muted-foreground">Invoice: {invoice.invoiceNumber}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => generatePdfFromElement('invoice-preview', `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`)}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => printInvoice('invoice-preview')}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={shareWhatsApp}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[840px] mx-auto p-4 py-8">
        <InvoicePreviewFrame className="min-h-[75vh]">
          <InvoiceTemplate
            settings={settings}
            invoice={invoice}
            items={invoice.items}
            totals={{
              subtotal: invoice.subtotal,
              cgst: invoice.cgst,
              sgst: invoice.sgst,
              igst: invoice.igst,
              totalTax: invoice.totalTax,
              grandTotal: invoice.grandTotal,
              amountInWords: invoice.amountInWords,
            }}
          />
        </InvoicePreviewFrame>
      </main>
    </div>
  );
}
