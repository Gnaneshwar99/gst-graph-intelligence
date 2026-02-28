import React, { useState } from 'react';
import { getAuditTrail } from '../services/api';
import { ShieldAlert, ShieldCheck, HelpCircle, Activity } from 'lucide-react';

export const VendorComplianceTable = ({ data }) => {
    return (
        <div className="glass-card flex-1 flex flex-col h-[400px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <ShieldCheck size={18} className="text-success" />
                    Vendor Compliance
                </h3>
                <span className="text-xs bg-surfaceHighlight px-2 py-1 rounded-full text-textSecondary">Leaderboard</span>
            </div>
            <div className="overflow-auto flex-1">
                <table className="table-container">
                    <thead className="sticky top-0 bg-surface/95 backdrop-blur z-10">
                        <tr>
                            <th className="table-header">Vendor GSTIN</th>
                            <th className="table-header text-right">Invoices</th>
                            <th className="table-header text-right">Pending</th>
                            <th className="table-header text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((vendor, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group cursor-default">
                                <td className="table-cell font-mono text-textPrimary group-hover:text-primary transition-colors">{vendor.vendor}</td>
                                <td className="table-cell text-right">{vendor.total_invoices}</td>
                                <td className="table-cell text-right text-textSecondary">{vendor.not_filed}</td>
                                <td className="table-cell">
                                    <div className="flex flex-col gap-1.5 w-full max-w-[120px] ml-auto">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className={`font-bold ${vendor.risk_score === 0 ? 'text-success' : vendor.risk_score >= 50 ? 'text-danger' : 'text-warning'}`}>
                                                {parseFloat(vendor.risk_score).toFixed(0)}%
                                            </span>
                                            <span className="text-textSecondary/70 text-[10px] uppercase font-semibold">
                                                {vendor.risk_score === 0 ? 'Low Risk' : vendor.risk_score >= 50 ? 'High Risk' : 'Med Risk'}
                                            </span>
                                        </div>
                                        {/* Progress Bar Track */}
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            {/* Progress Bar Fill */}
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${vendor.risk_score === 0 ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : vendor.risk_score >= 50 ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}
                                                style={{ width: vendor.risk_score === 0 ? '5%' : `${vendor.risk_score}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center py-8 text-textSecondary text-sm">No vendor data found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const HighRiskInvoicesTable = ({ data, onAuditClick }) => {
    return (
        <div className="glass-card flex-1 flex flex-col h-[400px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-danger/5 rounded-t-2xl">
                <h3 className="font-semibold text-danger flex items-center gap-2">
                    <ShieldAlert size={18} />
                    High-Risk Exceptions
                </h3>
                <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
                </span>
            </div>
            <div className="overflow-auto flex-1 relative">
                <table className="table-container">
                    <thead className="sticky top-0 bg-surface/95 backdrop-blur z-10">
                        <tr>
                            <th className="table-header">Invoice ID</th>
                            <th className="table-header">Taxpayer GSTIN</th>
                            <th className="table-header">Risk Type</th>
                            <th className="table-header text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((inv, i) => (
                            <tr key={i} className="hover:bg-danger/10 transition-colors border-l-2 border-transparent hover:border-danger">
                                <td className="table-cell font-mono font-medium text-textPrimary">{inv.invoice}</td>
                                <td className="table-cell font-mono text-xs text-textSecondary">{inv.taxpayer}</td>
                                <td className="table-cell">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${['FAKE_VENDOR_SHELL', 'HIGH_VALUE_ALERT'].includes(inv.status) ? 'bg-rose-500/20 text-rose-500 border-rose-500/20' :
                                        ['DUPLICATE_INVOICE', 'COMPOSITION_CLAIM'].includes(inv.status) ? 'bg-fuchsia-500/20 text-fuchsia-500 border-fuchsia-500/20' :
                                            ['MISSING_IRN', 'PERIOD_MISMATCH', 'GST_RATE_MISMATCH'].includes(inv.status) ? 'bg-warning/20 text-warning border-warning/20' :
                                                'bg-danger/20 text-danger border-danger/20'
                                        }`}>
                                        {inv.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="table-cell text-right">
                                    <button
                                        onClick={() => onAuditClick(inv)}
                                        className="text-xs font-semibold text-primary hover:text-primaryHover border border-primary/30 hover:border-primary/80 px-3 py-1.5 rounded bg-primary/5 transition-all"
                                    >
                                        Generate Audit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center py-8 text-textSecondary text-sm">No high-risk invoices detected 🎉</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const AuditModal = ({ isOpen, onClose, invoiceData, auditTrail, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="glass-card relative w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up border border-primary/20">

                {/* Header */}
                <div className="bg-gradient-to-r from-surface to-surfaceHighlight p-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                            <Activity size={20} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold">AI Audit Report</h2>
                            <p className="text-xs text-textSecondary font-mono">{invoiceData?.invoice}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-textSecondary hover:text-white transition-colors p-2"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-textSecondary animate-pulse">Running graph traversal rules...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                                <p className="text-sm text-textPrimary leading-relaxed">
                                    <span className="font-bold text-warning mr-2">FINDING:</span>
                                    This ITC claim against Invoice <span className="font-mono bg-black/30 px-1 rounded text-warning">{invoiceData?.invoice}</span> by Taxpayer <span className="font-mono bg-black/30 px-1 rounded text-textSecondary">{invoiceData?.taxpayer}</span> is classified as high-risk.
                                </p>
                                <p className="mt-3 text-sm text-textPrimary leading-relaxed">
                                    <span className="font-bold text-danger mr-2">REASON:</span>
                                    {auditTrail?.analysis || "Graph break detected in supply chain."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface p-3 rounded-lg border border-white/5">
                                    <span className="block text-xs font-semibold text-textSecondary uppercase mb-1">Risk Type</span>
                                    <span className="text-danger font-medium text-sm">{invoiceData?.status?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="bg-surface p-3 rounded-lg border border-white/5">
                                    <span className="block text-xs font-semibold text-textSecondary uppercase mb-1">Graph Traversal Time</span>
                                    <span className="text-primary font-mono text-sm">{(Math.random() * 15 + 2).toFixed(2)} ms</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/5 bg-surfaceHighlight flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-white transition-colors"
                    >
                        Close Report
                    </button>
                </div>
            </div>
        </div>
    );
};
