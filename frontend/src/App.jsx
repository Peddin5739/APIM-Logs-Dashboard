import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import {
    Download, Filter, Activity, CheckCircle, AlertCircle,
    Clock, Search, Menu, X, ChevronRight, LayoutDashboard,
    Database, Zap, Send, FileText, BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = {
    200: '#10b981',
    400: '#f59e0b',
    500: '#ef4444',
    Other: '#64748b'
};

const FAMILY_COLORS = {
    'Erebor': '#6366f1',
    'Elevate': '#10b981',
    'Elevate Kafka': '#f59e0b',
    'Other': '#94a3b8'
};

const FAMILY_ICONS = {
    'Erebor': Database,
    'Elevate': Zap,
    'Elevate Kafka': Send,
    'Other': Activity
};

export default function App() {
    const [data, setData] = useState({ stats: [], raw: [] });
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('24h');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState('Overview');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = `/api/logs?range=${dateRange}`;
            if (dateRange === 'custom') {
                url = `/api/logs?startTime=${new Date(customStart).toISOString()}&endTime=${new Date(customEnd).toISOString()}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error('API request failed');
            const result = await response.json();
            setData(result || { stats: [], raw: [] });
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dateRange !== 'custom' || (customStart && customEnd)) {
            fetchLogs();
        }
    }, [dateRange, customStart, customEnd]);

    const handleDownload = (family) => {
        const logsToExport = family === 'All' ? data.raw : data.raw.filter(l => l.apiFamily === family);
        const ws = XLSX.utils.json_to_sheet(logsToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'APIM Logs');
        XLSX.writeFile(wb, `apim_logs_${family.toLowerCase()}.xlsx`);
    };

    const getFamilyLogs = (family) => data.raw.filter(l => l.apiFamily === family);

    const getStatsForFamily = (family) => {
        const logs = family === 'All' ? data.raw : getFamilyLogs(family);
        const total = logs.length;
        const success = logs.filter(l => l.resultCode < 400).length;
        const error = logs.filter(l => l.resultCode >= 400).length;
        const avgDuration = total > 0
            ? Math.round(logs.reduce((acc, curr) => acc + curr.duration, 0) / total)
            : 0;

        return { total, success, error, avgDuration };
    };

    if (loading && data.raw.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <Activity className="mx-auto h-12 w-12 text-indigo-600 animate-pulse mb-4" />
                    <h2 className="text-xl font-bold text-slate-900">Loading Analytics...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            {/* Sidebar */}
            <aside className={`bg-white border-r border-slate-200 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
                        <BarChart3 size={20} />
                    </div>
                    {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-slate-800">API Insights</span>}
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    <NavItem
                        icon={LayoutDashboard}
                        label="Overview"
                        active={activeSection === 'Overview'}
                        onClick={() => setActiveSection('Overview')}
                        isOpen={isSidebarOpen}
                    />
                    <div className="pt-4 pb-2">
                        {isSidebarOpen && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">API Families</span>}
                    </div>
                    {['Erebor', 'Elevate', 'Elevate Kafka'].map((family) => (
                        <NavItem
                            key={family}
                            icon={FAMILY_ICONS[family]}
                            label={family}
                            active={activeSection === family}
                            onClick={() => setActiveSection(family)}
                            isOpen={isSidebarOpen}
                            color={FAMILY_COLORS[family]}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-6 sticky top-0 z-20">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                {activeSection} Analytics
                                <span className="text-xs font-normal bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">Live Telemetry</span>
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {activeSection === 'Overview'
                                    ? 'Consolidated view of all API families'
                                    : `Performance monitoring for ${activeSection} endpoints`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 shadow-sm transition-all">
                                <Filter size={14} className="ml-3 text-slate-400" />
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="bg-transparent pl-2 pr-8 py-2 text-sm font-semibold text-slate-700 outline-none cursor-pointer appearance-none"
                                >
                                    <option value="1h">Last Hour</option>
                                    <option value="24h">Last 24 Hours</option>
                                    <option value="7d">Last 7 Days</option>
                                    <option value="custom">📅 Custom Range</option>
                                </select>
                                {dateRange === 'custom' && (
                                    <div className="flex items-center border-l border-slate-100 bg-slate-50/50">
                                        <input
                                            type="datetime-local"
                                            value={customStart}
                                            onChange={(e) => setCustomStart(e.target.value)}
                                            className="bg-transparent px-3 py-2 text-[11px] font-bold text-slate-600 outline-none hover:bg-white transition-colors"
                                        />
                                        <div className="text-slate-300 font-bold px-1">→</div>
                                        <input
                                            type="datetime-local"
                                            value={customEnd}
                                            onChange={(e) => setCustomEnd(e.target.value)}
                                            className="bg-transparent px-3 py-2 text-[11px] font-bold text-slate-600 outline-none hover:bg-white transition-colors"
                                        />
                                    </div>
                                )}
                            </div>
                            <button onClick={() => handleDownload(activeSection === 'Overview' ? 'All' : activeSection)} className="btn btn-indigo flex items-center gap-2">
                                <Download size={18} />
                                <span>Export XLSX</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-8">
                    {activeSection === 'Overview' ? (
                        <OverviewDashboard data={data} onNavigate={setActiveSection} />
                    ) : (
                        <FamilyDetailDashboard family={activeSection} logs={getFamilyLogs(activeSection)} />
                    )}
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon: Icon, label, active, onClick, isOpen, color }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 ${active
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
        >
            <Icon size={20} style={active ? { color: color || '#4f46e5' } : {}} />
            {isOpen && <span className="text-sm">{label}</span>}
            {active && isOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
        </button>
    );
}

function EndpointStatusTable({ logs }) {
    const endpointAnalytics = logs.reduce((acc, log) => {
        const path = log.url.split('?')[0];
        const method = log.method;
        const key = `${method} ${path}`;
        if (!acc[key]) {
            acc[key] = { path, method, total: 0, status200: 0, status400: 0, status500: 0 };
        }
        acc[key].total++;
        if (log.resultCode >= 200 && log.resultCode < 400) acc[key].status200++;
        else if (log.resultCode >= 400 && log.resultCode < 500) acc[key].status400++;
        else if (log.resultCode >= 500) acc[key].status500++;
        return acc;
    }, {});

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.1em]">
                        <th className="px-6 py-4">Method</th>
                        <th className="px-6 py-4">Endpoint</th>
                        <th className="px-6 py-4 text-center">200 OK</th>
                        <th className="px-6 py-4 text-center">4xx Errors</th>
                        <th className="px-6 py-4 text-center">5xx Errors</th>
                        <th className="px-6 py-4 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {Object.values(endpointAnalytics).map((stat, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stat.method === 'POST' ? 'bg-indigo-50 text-indigo-600' :
                                    stat.method === 'GET' ? 'bg-emerald-50 text-emerald-600' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                    {stat.method}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-sm font-medium text-slate-700 truncate max-w-xs" title={stat.path}>
                                {stat.path}
                            </td>
                            <td className="px-6 py-3 text-center text-sm font-bold text-emerald-600 bg-emerald-50/20">
                                {stat.status200}
                            </td>
                            <td className="px-6 py-3 text-center text-sm font-bold text-amber-600 bg-amber-50/20">
                                {stat.status400}
                            </td>
                            <td className="px-6 py-3 text-center text-sm font-bold text-rose-600 bg-rose-50/20">
                                {stat.status500}
                            </td>
                            <td className="px-6 py-3 text-right text-sm font-black text-slate-400">
                                {stat.total}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function FamilySection({ family, logs }) {
    const successCount = logs.filter(l => l.resultCode < 400).length;
    const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl shadow-sm border border-slate-100 bg-white" style={{ color: FAMILY_COLORS[family] }}>
                        {React.createElement(FAMILY_ICONS[family], { size: 28 })}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{family}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{logs.length} Requests</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className={`text-xs font-bold ${successRate > 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {successRate}% Healthy
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Success" value={successCount} icon={CheckCircle} color="#10b981" />
                <KPICard title="Errors" value={logs.length - successCount} icon={AlertCircle} color="#ef4444" />
                <KPICard title="Avg Latency" value={`${logs.length > 0 ? Math.round(logs.reduce((a, b) => a + b.duration, 0) / logs.length) : 0}ms`} icon={Clock} color="#6366f1" />
                <KPICard title="Availability" value={`${successRate}%`} icon={Zap} color="#f59e0b" />
            </div>

            <EndpointStatusTable logs={logs} />
        </section>
    );
}

function OverviewDashboard({ data }) {
    const families = ['Erebor', 'Elevate', 'Elevate Kafka'];

    return (
        <div className="space-y-16 pb-20">
            {/* Global High-Level Trend */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -mr-32 -mt-32" />
                <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-500" />
                    Global Traffic Distribution
                </h3>
                <div className="w-full relative" style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={Object.values((data.raw || []).reduce((acc, log) => {
                            const d = new Date(log.timestamp);
                            d.setMinutes(0, 0, 0);
                            const hour = d.toISOString();
                            if (!acc[hour]) acc[hour] = { timestamp: hour, Erebor: 0, Elevate: 0, 'Elevate Kafka': 0 };
                            if (acc[hour].hasOwnProperty(log.apiFamily)) acc[hour][log.apiFamily]++;
                            return acc;
                        }, {})).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit' })} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            {families.map(f => (
                                <Area key={f} type="monotone" dataKey={f} stackId="1" stroke={FAMILY_COLORS[f]} fill={FAMILY_COLORS[f]} fillOpacity={0.4} strokeWidth={2} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Split Sections */}
            {families.map(family => (
                <div key={family} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <FamilySection
                        family={family}
                        logs={data.raw.filter(l => l.apiFamily === family)}
                    />
                    {family !== 'Elevate Kafka' && <div className="mt-16 border-b border-slate-100" />}
                </div>
            ))}
        </div>
    );
}

function FamilyDetailDashboard({ family, logs }) {
    const successCount = logs.filter(l => l.resultCode < 400).length;
    const errorCount = logs.filter(l => l.resultCode >= 400).length;
    const avgDuration = logs.length > 0
        ? Math.round(logs.reduce((acc, curr) => acc + curr.duration, 0) / logs.length)
        : 0;
    const endpointAnalytics = logs.reduce((acc, log) => {
        const path = log.url.split('?')[0];
        const method = log.method;
        const key = `${method} ${path}`;
        if (!acc[key]) {
            acc[key] = { path, method, total: 0, status200: 0, status400: 0, status500: 0 };
        }
        acc[key].total++;
        if (log.resultCode >= 200 && log.resultCode < 400) acc[key].status200++;
        else if (log.resultCode >= 400 && log.resultCode < 500) acc[key].status400++;
        else if (log.resultCode >= 500) acc[key].status500++;
        return acc;
    }, {});
    const familyStats = React.useMemo(() => {
        const buckets = {};
        const now = new Date();
        now.setMinutes(0, 0, 0);

        for (let i = 0; i < 24; i++) {
            const d = new Date(now - i * 60 * 60 * 1000);
            const hour = d.toISOString();
            buckets[hour] = { timestamp: hour, count: 0 };
        }

        logs.forEach(log => {
            const d = new Date(log.timestamp);
            d.setMinutes(0, 0, 0);
            const hour = d.toISOString();
            if (buckets[hour]) {
                buckets[hour].count++;
            }
        });

        return Object.values(buckets).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }, [logs]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard title="Total Transactions" value={logs.length} icon={Activity} color={FAMILY_COLORS[family]} />
                <KPICard title="Success Rate" value={`${Math.round((successCount / logs.length) * 100 || 0)}%`} icon={CheckCircle} color="#10b981" />
                <KPICard title="Error Count" value={errorCount} icon={AlertCircle} color="#ef4444" />
                <KPICard title="Avg Latency" value={`${avgDuration}ms`} icon={Clock} color="#6366f1" />
            </div>

            {/* Traffic Trends */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm min-h-[350px]">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-500" />
                    Traffic Trends
                </h3>
                <div className="w-full relative" style={{ height: '300px', minHeight: '300px' }}>
                    {familyStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={familyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit' })}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    labelFormatter={(t) => new Date(t).toLocaleString()}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke={FAMILY_COLORS[family]}
                                    fillOpacity={1}
                                    fill={`url(#colorFamily_${family.replace(/\s+/g, '')})`}
                                    strokeWidth={2}
                                />
                                <defs>
                                    <linearGradient id={`colorFamily_${family.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={FAMILY_COLORS[family]} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={FAMILY_COLORS[family]} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                            No telemetry data for this family in chosen period
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Breakdown */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Status Breakdown</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Success', value: successCount },
                                        { name: 'Errors', value: errorCount }
                                    ]}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Endpoint Breakdown */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Endpoint Analytics</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-50">
                                    <th className="pb-3">Endpoint</th>
                                    <th className="pb-3 text-center">200s</th>
                                    <th className="pb-3 text-center">400s</th>
                                    <th className="pb-3 text-center">500s</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {Object.values(endpointAnalytics).map((stat, idx) => (
                                    <tr key={idx} className="group transition-colors hover:bg-slate-50/50">
                                        <td className="py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-indigo-500 mb-0.5">{stat.method}</span>
                                                <span className="font-medium text-slate-700 truncate max-w-[200px]" title={stat.path}>
                                                    {stat.path.split('/').slice(-2).join('/')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">{stat.status200}</span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px]">{stat.status400}</span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px]">{stat.status500}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">{family} Transaction Logs</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Endpoint Path</th>
                                <th className="px-6 py-4">Result</th>
                                <th className="px-6 py-4">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.slice(0, 20).map((log, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.method === 'POST' ? 'bg-indigo-50 text-indigo-600' :
                                            log.method === 'PUT' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                                            }`}>
                                            {log.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700 truncate max-w-[400px]">
                                        {log.url}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {log.resultCode < 400 ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-rose-500" />}
                                            <span className={`text-sm font-bold ${log.resultCode < 400 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {log.resultCode}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                        {log.duration}ms
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-3">
                <div className="p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300" style={{ backgroundColor: `${color}10`, color: color }}>
                    <Icon size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{title}</span>
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">{value}</div>
        </div>
    );
}
