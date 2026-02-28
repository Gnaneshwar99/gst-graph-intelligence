import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import SyncDashboard from './components/SyncDashboard'
import Metrics from './components/Metrics'
import KnowledgeGraph from './components/KnowledgeGraph'
import { VendorComplianceTable, HighRiskInvoicesTable, AuditModal } from './components/DataTables'
import AuditLogs from './components/AuditLogs'
import { getSummary, getReconciliation, getHighRisk, getVendorCompliance, getAuditTrail, loadMockData, resetDB } from './services/api'
import { RefreshCw, DatabaseBackup, FileText } from 'lucide-react'

function App() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [loading, setLoading] = useState(true)
    const [initialFetchDone, setInitialFetchDone] = useState(false)
    const [error, setError] = useState(null)

    // Data State
    const [summaryData, setSummaryData] = useState([])
    const [graphData, setGraphData] = useState([])
    const [highRiskData, setHighRiskData] = useState([])
    const [vendorData, setVendorData] = useState([])

    // Modal State
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [auditDetails, setAuditDetails] = useState(null)
    const [auditLoading, setAuditLoading] = useState(false)

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [summary, graph, risk, vendor] = await Promise.all([
                getSummary(),
                getReconciliation(),
                getHighRisk(),
                getVendorCompliance()
            ])

            setSummaryData(summary)
            setGraphData(graph)
            setHighRiskData(risk)
            setVendorData(vendor)
            setInitialFetchDone(true)

        } catch (err) {
            console.error(err)
            setError('Failed to fetch data from Graph Database. Is Neo4j and FastAPI running?')
        } finally {
            setLoading(false)
        }
    }

    const handleLoadMockData = async () => {
        try {
            setLoading(true)
            await loadMockData()
            await fetchData()
        } catch (err) {
            console.error(err)
            setError('Failed to load mock data.')
            setLoading(false)
        }
    }

    const handleClearDB = async () => {
        if (!window.confirm("Are you sure you want to clear all data from the engine?")) return;
        try {
            setLoading(true)
            await resetDB()
            await fetchData()
        } catch (err) {
            console.error(err)
            setError('Failed to clear database.')
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleAuditClick = async (invoiceData) => {
        setSelectedInvoice(invoiceData)
        setAuditLoading(true)
        try {
            // Small artificial delay to show cool loading state
            await new Promise(r => setTimeout(r, 600));
            const details = await getAuditTrail(invoiceData.invoice)
            setAuditDetails(details)
        } catch (err) {
            console.error('Audit failed', err)
        } finally {
            setAuditLoading(false)
        }
    }

    if (!initialFetchDone) {
        return (
            <div className="flex h-screen w-full bg-background items-center justify-center flex-col gap-4">
                <RefreshCw size={32} className="text-primary animate-spin" />
                <p className="text-textSecondary font-mono text-sm animate-pulse">Initializing Knowledge Graph...</p>
            </div>
        )
    }

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            <div className="p-8 max-w-[1600px] mx-auto min-h-full flex flex-col gap-8">

                {/* Header Ribbon */}
                <div className="flex justify-between items-end pb-4 border-b border-white/5">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">GST Reconciliation Engine</h1>
                        <p className="text-textSecondary text-sm max-w-2xl">
                            Real-time multi-hop graph traversal engine for identifying ITC fraud, supply chain breaks, and vendor compliance anomalies.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleClearDB}
                            disabled={loading}
                            className="glass-button flex items-center gap-2 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20"
                        >
                            <DatabaseBackup size={16} />
                            Clear Engine
                        </button>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="glass-button flex items-center gap-2"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            Force Sync
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-danger/10 border border-danger/30 text-danger px-6 py-4 rounded-xl flex items-center gap-3">
                        <span className="font-bold">CONNECTION ERROR:</span> {error}
                    </div>
                )}

                {/* Dashboard Content */}
                {!error && activeTab === 'dashboard' && (
                    <div className="animate-fade-in flex flex-col gap-8 flex-1">
                        <section>
                            <SyncDashboard onUploadComplete={fetchData} />
                        </section>
                        <section>
                            <Metrics summaryData={summaryData} />
                        </section>
                    </div>
                )}

                {/* Taxpayer Map Content */}
                {!error && activeTab === 'taxpayer_map' && (
                    <div className="animate-fade-in flex flex-col gap-8 flex-1">
                        <div className="bg-surfaceHighlight/30 p-4 rounded-xl border border-white/5 mb-[-20px]">
                            <h2 className="text-xl font-bold text-white">Full-Scale Knowledge Graph</h2>
                            <p className="text-sm text-textSecondary">Deep multi-hop traversal of supplier networks and ITC claims.</p>
                        </div>
                        <section className="flex-1 min-h-[600px]">
                            <KnowledgeGraph reconcileData={graphData} />
                        </section>
                    </div>
                )}

                {/* Risk Analysis Content */}
                {!error && activeTab === 'risk_analysis' && (
                    <div className="animate-fade-in flex flex-col gap-8 flex-1">
                        <div className="bg-surfaceHighlight/30 p-4 rounded-xl border border-white/5 mb-[-20px]">
                            <h2 className="text-xl font-bold text-white">Risk & Compliance Intelligence</h2>
                            <p className="text-sm text-textSecondary">Aggregated anomaly detection and vendor profiling.</p>
                        </div>
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <HighRiskInvoicesTable
                                data={highRiskData}
                                onAuditClick={handleAuditClick}
                            />
                            <VendorComplianceTable
                                data={vendorData}
                            />
                        </section>
                    </div>
                )}

                {/* Audit Logs Content */}
                {!error && activeTab === 'audit_logs' && (
                    <div className="flex-1 min-h-[500px]">
                        <AuditLogs />
                    </div>
                )}

                <AuditModal
                    isOpen={!!selectedInvoice}
                    onClose={() => { setSelectedInvoice(null); setAuditDetails(null) }}
                    invoiceData={selectedInvoice}
                    auditTrail={auditDetails}
                    isLoading={auditLoading}
                />

            </div>
        </Layout>
    )
}

export default App
