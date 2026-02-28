import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
    MATCHED: '#10b981', // green
    NO_VENDOR: '#ef4444', // red
    VENDOR_NOT_FILED_GSTR1: '#f59e0b', // yellow
    MISSING_IRN: '#6366f1', // indigo
    FAKE_VENDOR_SHELL: '#e11d48', // rose
    HIGH_VALUE_ALERT: '#d946ef', // fuchsia
    DUPLICATE_INVOICE: '#8b5cf6', // violet
    COMPOSITION_CLAIM: '#ec4899', // pink
    PERIOD_MISMATCH: '#14b8a6', // teal
    GST_RATE_MISMATCH: '#f97316', // orange
    MICRO_INVOICE_BURST: '#84cc16', // lime
};

const METRIC_LABELS = {
    MATCHED: 'Matched Compliant',
    NO_VENDOR: 'Vendor Missing',
    VENDOR_NOT_FILED_GSTR1: 'GSTR-1 Pending',
    MISSING_IRN: 'Missing IRN',
    FAKE_VENDOR_SHELL: 'Fake Shell Entity',
    HIGH_VALUE_ALERT: 'High Value Alert',
    DUPLICATE_INVOICE: 'Duplicate Claim',
    COMPOSITION_CLAIM: 'Composition Claim',
    PERIOD_MISMATCH: 'Period Mismatch',
    GST_RATE_MISMATCH: 'GST Rate Error',
    MICRO_INVOICE_BURST: 'Micro Invoice Burst',
};

const MetricCard = ({ title, value, subtitle, trendClass = "text-textSecondary" }) => (
    <div className="glass-card p-6 flex flex-col justify-between">
        <h3 className="text-textSecondary text-sm font-medium">{title}</h3>
        <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-white">{value}</span>
        </div>
        {subtitle && <p className={`text-xs mt-2 ${trendClass}`}>{subtitle}</p>}
    </div>
);

const Metrics = ({ summaryData }) => {
    // Process data from /summary endpoint
    const totalInvoices = summaryData.reduce((acc, curr) => acc + curr.total, 0);

    const matchedData = summaryData.find(d => d.status === 'MATCHED');
    const matchedCount = matchedData ? matchedData.total : 0;

    const mismatchCount = totalInvoices - matchedCount;

    // Format for pie chart
    const pieData = summaryData.map(d => ({
        name: METRIC_LABELS[d.status] || d.status,
        value: d.total,
        color: COLORS[d.status] || '#9ca3af'
    }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

            {/* KPI Cards */}
            <MetricCard
                title="Total Invoices Scanned"
                value={totalInvoices}
                subtitle="Across multi-hop graph"
            />
            <MetricCard
                title="Fully Compliant"
                value={matchedCount}
                subtitle={`${((matchedCount / totalInvoices) * 100 || 0).toFixed(1)}% safe`}
                trendClass="text-success"
            />
            <MetricCard
                title="Mismatch Detected"
                value={mismatchCount}
                subtitle={`${((mismatchCount / totalInvoices) * 100 || 0).toFixed(1)}% at risk`}
                trendClass="text-danger"
            />

            {/* Risk Distribution Chart */}
            <div className="glass-card p-4 min-h-[200px] flex flex-col">
                <h3 className="text-textSecondary text-sm font-medium mb-2 pl-2">Risk Distribution</h3>
                <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '8px' }}
                                itemStyle={{ color: '#f3f4f6' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default Metrics;
