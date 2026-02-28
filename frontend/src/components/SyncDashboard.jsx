import React, { useState } from 'react';
import { Activity, Database, CheckCircle, RefreshCw } from 'lucide-react';
import { triggerSyncAndEvaluate } from '../services/api';

const SyncDashboard = ({ onUploadComplete }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [lastEvent, setLastEvent] = useState(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncProgress(10);

        try {
            // Simulate enterprise API pulling delay
            await new Promise(r => setTimeout(r, 800));
            setSyncProgress(40);

            // Trigger backend integration that writes straight to the Neo4j graph & evaluates fraud
            const data = await triggerSyncAndEvaluate();
            setLastEvent(data.event);

            setSyncProgress(80);
            await new Promise(r => setTimeout(r, 500));
            setSyncProgress(100);

            if (onUploadComplete) {
                onUploadComplete();
            }
        } catch (error) {
            console.error("Sync Failed", error);
        } finally {
            setTimeout(() => {
                setIsSyncing(false);
                setSyncProgress(0);
            }, 1000);
        }
    };

    return (
        <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                <Database className="text-primary" /> Live Graph Integration
            </h2>

            <div className="flex flex-col items-center justify-center py-8 relative z-10">
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`relative group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${isSyncing
                        ? 'bg-primary/20 text-primary cursor-wait'
                        : 'bg-primary hover:bg-primaryHover text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]'
                        }`}
                >
                    {isSyncing ? (
                        <>
                            <RefreshCw className="animate-spin" size={20} />
                            Syncing ERP Events...
                        </>
                    ) : (
                        <>
                            <Activity size={20} className="group-hover:animate-pulse" />
                            Sync Live ERP Data
                        </>
                    )}
                </button>

                {/* Progress Bar */}
                {isSyncing && (
                    <div className="w-full max-w-sm mt-8">
                        <div className="flex justify-between text-xs text-textSecondary mb-2">
                            <span>Ingesting massive graph dataset...</span>
                            <span>{syncProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${syncProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Last Sync Status */}
                {!isSyncing && lastEvent && (
                    <div className="mt-8 p-4 bg-success/10 border border-success/20 rounded-lg w-full max-w-sm animate-fade-in">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="text-success mt-0.5 shrink-0" size={16} />
                            <div>
                                <p className="text-xs text-success font-medium mb-1">Live Sync Completed Successfully</p>
                                <p className="text-[10px] text-textSecondary font-mono break-all">
                                    Latest Entity: {lastEvent.invoice_id}<br />
                                    Value: ₹{lastEvent.taxable_value.toLocaleString()}<br />
                                    Graph Eval: Complete
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!isSyncing && !lastEvent && (
                    <div className="mt-8 text-center max-w-xs">
                        <p className="text-xs text-textSecondary">
                            Pulls immediate invoices, GSTR-1 filings, and e-Way bills to build a real-time Risk Traversal Graph.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SyncDashboard;
