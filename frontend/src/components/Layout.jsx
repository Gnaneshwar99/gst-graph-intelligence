import React from 'react';
import { LayoutDashboard, Users, AlertTriangle, FileText, Settings, Database } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-primary/20 text-primary shadow-[inset_2px_0_0_0_#10b981]' : 'text-textSecondary hover:bg-white/5 hover:text-textPrimary'
            }`}>
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
    </div>
);

const Layout = ({ children, activeTab, setActiveTab }) => {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">

            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-white/5 bg-surface/30 backdrop-blur flex flex-col pt-6 z-10">
                <div className="px-6 mb-8 flex flex-col gap-1">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primaryHover bg-clip-text text-transparent flex items-center gap-2">
                        <Database size={24} className="text-primary" />
                        GST Graph
                    </h1>
                    <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold ml-8">Intelligence</p>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard Setup" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={Users} label="Taxpayer Map" active={activeTab === 'taxpayer_map'} onClick={() => setActiveTab('taxpayer_map')} />
                    <SidebarItem icon={AlertTriangle} label="Risk Analysis" active={activeTab === 'risk_analysis'} onClick={() => setActiveTab('risk_analysis')} />
                    <SidebarItem icon={FileText} label="Audit Logs" active={activeTab === 'audit_logs'} onClick={() => setActiveTab('audit_logs')} />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <SidebarItem icon={Settings} label="System Config" />
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                {children}
            </main>

        </div>
    );
};

export default Layout;
