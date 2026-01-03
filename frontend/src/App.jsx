import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
    Download, Filter, Activity, CheckCircle, AlertCircle,
    Clock, Search, Menu, X, ChevronRight, LayoutDashboard
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Mock Data for demonstration
const MOCK_DATA = {
    stats: [
        { timestamp: '2026-01-03T00:00:00Z', statusGroup: '200', count: 450, name: 'GET /quotes' },
        { timestamp: '2026-01-03T00:00:00Z', statusGroup: '400', count: 45, name: 'POST /quotes' },
        { timestamp: '2026-01-03T00:00:00Z', statusGroup: '500', count: 12, name: 'GET /quotes' },
        { timestamp: '2026-01-03T01:00:00Z', statusGroup: '200', count: 320, name: 'PUT /quotes' },
        { timestamp: '2026-01-03T01:00:00Z', statusGroup: '400', count: 20, name: 'GET /quotes/status' },
    ],
    raw: Array.from({ length: 50 }).map((_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        name: ['GET /quotes', 'POST /quotes', 'PUT /quotes', 'GET /quotes/status'][Math.floor(Math.random() * 4)],
        resultCode: [200, 201, 400, 401, 500][Math.floor(Math.random() * 5)],
        success: Math.random() > 0.1 ? 'True' : 'False',
        duration: Math.floor(Math.random() * 500) + 50,
        url: '/api/v1/quotes'
    }))
};

const COLORS = {
    200: '#10b981',
    400: '#f59e0b',
    500: '#ef4444',
    Other: '#64748b'
};

export default function App() {
    const [data, setData] = useState(MOCK_DATA);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('24h');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/logs?range=${dateRange}`);
            if (!response.ok) throw new Error('API request failed');
            const result = await response.json();

            // If API returns empty data, we keep showing some mock for a better visual until logs propagate
            if (!result.raw || result.raw.length === 0) {
                console.log('No real logs found yet, showing mock data placeholders.');
                setData(MOCK_DATA);
            } else {
                setData(result);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
            setData(MOCK_DATA); // Fallback to mock on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [dateRange]);

    const handleDownload = () => {
        const ws = XLSX.utils.json_to_sheet(data.raw);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'APIM Logs');
        XLSX.writeFile(wb, 'apim_logs_export.xlsx');
    };

    const totalRequests = data.stats.reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
    const success200 = data.stats.filter(s => s.statusGroup === '200').reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
    const errors400 = data.stats.filter(s => s.statusGroup === '400').reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
    const faults500 = data.stats.filter(s => s.statusGroup === '500').reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);

    const apiUsageMap = data.raw.reduce((acc, curr) => {
        acc[curr.name] = (acc[curr.name] || 0) + 1;
        return acc;
    }, {});
    const apiUsageData = Object.entries(apiUsageMap).map(([name, count]) => ({ name, count }));

    const statusPieData = [
        { name: '200s', value: success200 },
        { name: '400s', value: errors400 },
        { name: '500s', value: faults500 },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className={`bg-white border-r border-[#e2e8f0] transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white">
                        <LayoutDashboard size={20} />
                    </div>
                    {isSidebarOpen && <span className="font-bold text-xl tracking-tight">APIM Dash</span>}
                </div>

                <nav className="mt-6 px-4 space-y-2">
                    {[
                        { icon: Activity, label: 'Overview' },
                        { icon: Search, label: 'Logs Explorer' },
                        { icon: Clock, label: 'History' },
                    ].map((item, i) => (
                        <button key={i} className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                            <item.icon size={20} />
                            {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-[#f8fafc] overflow-y-auto">
                <header className="bg-white border-b border-[#e2e8f0] p-6 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-bold">Quotes API Dashboard</h1>
                        <p className="text-slate-500 text-sm">Real-time log analytics and performance monitoring</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {['24h', '7d', '30d'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${dateRange === range ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        <button onClick={handleDownload} className="btn btn-outline">
                            <Download size={18} />
                            <span>Export Excel</span>
                        </button>
                    </div>
                </header>

                <div className="p-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Requests" value={totalRequests.toLocaleString()} change="+12%" icon={Activity} color="indigo" />
                        <StatCard title="Successful (200)" value={success200.toLocaleString()} change="+15%" icon={CheckCircle} color="emerald" />
                        <StatCard title="Errors (4xx)" value={errors400.toLocaleString()} change="-5%" icon={AlertCircle} color="amber" />
                        <StatCard title="Server Faults (5xx)" value={faults500.toLocaleString()} change="+2%" icon={AlertCircle} color="rose" />
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="card lg:col-span-2">
                            <h3 className="text-lg font-bold mb-6">Traffic Over Time</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.stats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="timestamp" hide />
                                        <YAxis />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" />
                                        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-lg font-bold mb-6">Status Distribution</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusPieData}
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill={COLORS[200]} />
                                            <Cell fill={COLORS[400]} />
                                            <Cell fill={COLORS[500]} />
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="card">
                            <h3 className="text-lg font-bold mb-6">Usage by Endpoint</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={apiUsageData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fontWeight: 500 }} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-lg font-bold mb-6">Performance Trends (ms)</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.raw.slice(0, 20).reverse()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="timestamp" hide />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="duration" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Recent Logs</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Filter logs..."
                                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Request</th>
                                        <th>Status</th>
                                        <th>Success</th>
                                        <th>Duration (ms)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.raw.slice(0, 10).map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="text-sm text-slate-500 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="font-medium">{log.name}</td>
                                            <td>
                                                <span className={`badge badge-${log.resultCode >= 500 ? '500' : log.resultCode >= 400 ? '400' : '200'}`}>
                                                    {log.resultCode}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`text-sm ${log.success === 'True' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {log.success}
                                                </span>
                                            </td>
                                            <td className="text-sm text-slate-600 font-mono">{log.duration}ms</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ title, value, change, icon: Icon, color }) {
    const bgColors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        rose: 'bg-rose-50 text-rose-600',
    };

    return (
        <div className="card flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h4 className="text-2xl font-bold">{value}</h4>
                <p className={`text-xs mt-2 font-semibold ${change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {change} <span className="text-slate-400 font-normal ml-1">vs last period</span>
                </p>
            </div>
            <div className={`p-3 rounded-xl ${bgColors[color]}`}>
                <Icon size={24} />
            </div>
        </div>
    );
}
