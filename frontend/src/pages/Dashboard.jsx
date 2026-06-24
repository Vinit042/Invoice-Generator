import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI } from '@/services/api';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { FileText, CheckCircle, Clock, Edit, IndianRupee } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoiceAPI
      .getDashboardStats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const revenueMonths = Object.entries(stats?.revenueByMonth || {});

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your invoicing activity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Invoices" value={stats?.totalInvoices || 0} icon={FileText} color="bg-blue-100 text-blue-600" />
          <StatCard title="Paid Invoices" value={stats?.paidInvoices || 0} icon={CheckCircle} color="bg-green-100 text-green-600" />
          <StatCard title="Pending Invoices" value={stats?.pendingInvoices || 0} icon={Clock} color="bg-yellow-100 text-yellow-600" />
          <StatCard title="Draft Invoices" value={stats?.draftInvoices || 0} icon={Edit} color="bg-gray-100 text-gray-600" />
          <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={IndianRupee} color="bg-purple-100 text-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentInvoices?.length ? (
                <div className="space-y-3">
                  {stats.recentInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      to={`/invoices/${inv.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">{inv.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{inv.customerName || 'No customer'}</p>
                      </div>
                      <div className="text-right">
                        <Badge status={inv.status}>{inv.status}</Badge>
                        <p className="text-sm font-medium mt-1">{formatCurrency(inv.grandTotal)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No invoices yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueMonths.length ? (
                <div className="space-y-4">
                  {revenueMonths.map(([month, amount]) => {
                    const maxRevenue = Math.max(...revenueMonths.map(([, a]) => a));
                    const percentage = maxRevenue ? (amount / maxRevenue) * 100 : 0;
                    return (
                      <div key={month}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{month}</span>
                          <span className="font-medium">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No revenue data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
