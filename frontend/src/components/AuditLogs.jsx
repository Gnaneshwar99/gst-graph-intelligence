import React, { useState, useEffect } from 'react';
import { getGlobalAudit } from '../services/api';
import { ShieldAlert, AlertTriangle, Activity, Search, Clock, ShieldCheck } from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await getGlobalAudit();
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch global audit logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Activity className="text-primary" size={28} />
                        Global Audit Tracker
                    </h2>
                    <p className="text-sm text-textSecondary mt-1">Live chronological ledger of all high-risk graph anomalies.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary/50" size={16} />
                    <input
                        type="text"
                        placeholder="Search GSTIN, Invoice, or Risk Type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-textSecondary/50 focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Audit Ledger */}
            <div className="glass-card flex-1 overflow-hidden flex flex-col pt-1">
                <div className="p-4 border-b border-white/5 bg-surfaceHighlight/30 flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <span className="text-xs font-semibold text-white tracking-widest uppercase">Chronological Event Ledger</span>
                    <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{filteredLogs.length} Events</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            <span className="text-sm text-textSecondary animate-pulse">Scanning Neo4j Graph for Anomalies...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-60">
                            <ShieldCheck size={48} className="text-success mb-4" />
                            <p className="text-lg text-white font-medium">No Anomalies Detected</p>
                            <p className="text-sm text-textSecondary mt-1">The graph is completely compliant based on your search.</p>
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div key={index} className="flex gap-4 group">
                                {/* Timeline Line */}
                                <div className="flex flex-col items-center">
                                    <div className="w-px h-2 bg-white/10 group-first:bg-transparent"></div>
                                    <div className={`w-3 h-3 rounded-full mt-1 shrink-0 shadow-[0_0_10px] ${log.severity === 'CRITICAL' ? 'bg-danger shadow-danger' : 'bg-warning shadow-warning'}`}></div>
                                    <div className="w-px flex-1 bg-white/10 group-last:bg-transparent mt-1"></div>
                                </div>

                                {/* Event Card */}
                                <div className={`flex-1 p-5 rounded-xl border transition-all duration-300 ${log.severity === 'CRITICAL' ? 'bg-danger/5 border-danger/20 hover:border-danger/50' : 'bg-warning/5 border-warning/20 hover:border-warning/50'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {log.severity === 'CRITICAL' ? <ShieldAlert size={18} className="text-danger" /> : <AlertTriangle size={18} className="text-warning" />}
                                            <span className={`text-xs font-bold uppercase tracking-wider ${log.severity === 'CRITICAL' ? 'text-danger' : 'text-warning'}`}>
                                                {log.type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <span className="text-[10px] uppercase font-mono bg-white/5 px-2 py-1 rounded text-textSecondary border border-white/5">
                                            {log.timestamp}
                                        </span>
                                    </div>

                                    <p className="text-sm text-white/90 leading-relaxed mb-4">
                                        {log.message}
                                    </p>

                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-auto">
                                        <div className="bg-surface/50 rounded-lg p-2.5 border border-white/5">
                                            <span className="block text-[9px] uppercase tracking-wider text-textSecondary/70 mb-1">Target Vendor</span>
                                            <span className="text-xs font-mono text-white break-all">{log.target}</span>
                                        </div>
                                        <div className="bg-surface/50 rounded-lg p-2.5 border border-white/5">
                                            <span className="block text-[9px] uppercase tracking-wider text-textSecondary/70 mb-1">Invoice ID</span>
                                            <span className="text-xs font-mono text-white break-all">{log.id}</span>
                                        </div>
                                        <div className="bg-surface/50 rounded-lg p-2.5 border border-white/5 hidden lg:block">
                                            <span className="block text-[9px] uppercase tracking-wider text-textSecondary/70 mb-1">Risk Severity</span>
                                            <span className={`text-xs font-bold ${log.severity === 'CRITICAL' ? 'text-danger' : 'text-warning'}`}>{log.severity}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
