import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { ICONS, ROUTES } from '../constants';
import { format, isToday, isWithinInterval, startOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { BillingStatus, TransactionType } from '../types';

// A standardized card component for dashboard sections
const DashboardCard: React.FC<{ title: string; children: React.ReactNode; className?: string; topRightContent?: React.ReactNode }> = ({ title, children, className, topRightContent }) => (
    <div className={`bg-white p-6 rounded-xl shadow-md flex flex-col ${className}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            {topRightContent}
        </div>
        <div className="flex-grow">{children}</div>
    </div>
);

// Enhanced StatCard with color theming
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; linkTo?: string; color: string; }> = ({ title, value, icon, linkTo, color }) => {
    const content = (
        <div className={`bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 h-full border-l-4 ${color}`}>
            <div className="flex items-center gap-4">
                <div className="text-3xl">{icon}</div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                </div>
            </div>
        </div>
    );
    return linkTo ? <Link to={linkTo}>{content}</Link> : content;
};

// Utility to handle potentially invalid date strings
const safeParseDate = (dateString: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}/.test(dateString)) return null; // Handle YYYY-MM-DD and ISO strings
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
};

const FinancialSummaryChart: React.FC = () => {
    const { state } = useAppContext();
    const chartData = useMemo(() => {
        const data: { name: string; income: number; expense: number }[] = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const targetMonthDate = subMonths(today, i);
            const monthStart = startOfMonth(targetMonthDate);
            const monthEnd = endOfMonth(targetMonthDate);
            
            const monthTransactions = state.transactions.filter(t => {
                const transDate = safeParseDate(t.date);
                return transDate && isWithinInterval(transDate, { start: monthStart, end: monthEnd });
            });
            
            const monthlySummary = monthTransactions.reduce((acc, t) => {
                if (t.type === TransactionType.Income) acc.income += t.amount;
                else acc.expense += t.amount;
                return acc;
            }, { income: 0, expense: 0 });
            
            data.push({
                name: format(monthStart, 'MMM'),
                income: monthlySummary.income,
                expense: monthlySummary.expense
            });
        }
        return data;
    }, [state.transactions]);
    
    const maxAmount = Math.max(...chartData.flatMap(d => [d.income, d.expense]), 1);

    return (
        <div className="h-64 flex justify-around items-end gap-4 pt-4">
            {chartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex justify-around items-end h-full relative group">
                        <div className="absolute -top-6 hidden group-hover:block bg-slate-700 text-white text-xs rounded py-1 px-2">
                           I: {data.income.toFixed(0)} | E: {data.expense.toFixed(0)}
                        </div>
                        <div className="w-1/2 bg-green-300 hover:bg-green-400 rounded-t-md transition-colors" style={{ height: `${(data.income / maxAmount) * 100}%` }}></div>
                        <div className="w-1/2 bg-red-300 hover:bg-red-400 rounded-t-md transition-colors" style={{ height: `${(data.expense / maxAmount) * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{data.name}</span>
                </div>
            ))}
        </div>
    );
};

const IncomeBreakdownDonutChart: React.FC = () => {
    const { state } = useAppContext();
    const COLORS = ['#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f472b6'];

    const chartData = useMemo(() => {
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        const currentMonthIncome = state.transactions.filter(t => {
            const transDate = safeParseDate(t.date);
            return transDate && isWithinInterval(transDate, { start: monthStart, end: monthEnd }) && t.type === TransactionType.Income;
        });
        
        const incomeByCategory = currentMonthIncome.reduce((acc, t) => {
            const category = t.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
        }, {} as { [key: string]: number });
        
        const totalIncome = Object.values(incomeByCategory).reduce((sum, amount) => sum + amount, 0);

        if (totalIncome === 0) return { segments: [], legend: [], total: 0, conicGradient: 'bg-slate-100' };

        let cumulativePercentage = 0;
        const segments = Object.entries(incomeByCategory).sort(([,a],[,b]) => b - a).map(([category, amount], index) => {
            const percentage = (amount / totalIncome) * 100;
            const segment = {
                color: COLORS[index % COLORS.length],
                start: cumulativePercentage,
                end: cumulativePercentage + percentage,
                category,
                percentage
            };
            cumulativePercentage += percentage;
            return segment;
        });

        const conicGradient = segments.map(s => `${s.color} ${s.start.toFixed(2)}% ${s.end.toFixed(2)}%`).join(', ');

        return {
            conicGradient,
            legend: segments,
            total: totalIncome,
        };
    }, [state.transactions]);
    
    if (chartData.total === 0) {
        return (
            <div className="h-full flex justify-center items-center text-slate-500">
                No income data for this month.
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col md:flex-row items-center gap-6 justify-center">
            <div className="relative w-40 h-40 flex-shrink-0">
                 <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${chartData.conicGradient})`}}></div>
                 <div className="absolute inset-5 bg-white rounded-full flex flex-col items-center justify-center text-center">
                     <span className="text-xs text-slate-500">Total</span>
                     <span className="font-bold text-slate-800 text-lg">₹{chartData.total.toFixed(0)}</span>
                 </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar max-h-48 w-full">
                <ul className="text-sm">
                {chartData.legend.map(item => (
                    <li key={item.category} className="flex items-center gap-2 py-1">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="flex-1 text-slate-600 truncate" title={item.category}>{item.category}</span>
                        <span className="font-semibold text-slate-800">{item.percentage.toFixed(1)}%</span>
                    </li>
                ))}
                </ul>
            </div>
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const { state } = useAppContext();

    const stats = useMemo(() => {
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        const totalPatients = state.patients.length;
        const appointmentsToday = state.appointments.filter(a => safeParseDate(a.date) && isToday(safeParseDate(a.date)!)).length;

        const totalOutstanding = state.patients
            .flatMap(p => p.billing)
            .filter(b => b.status === BillingStatus.Pending)
            .reduce((sum, b) => sum + b.amount, 0);

        const revenueThisMonth = state.transactions
            .filter(t => {
                const transDate = safeParseDate(t.date);
                return transDate && isWithinInterval(transDate, { start: monthStart, end: monthEnd }) && t.type === TransactionType.Income;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        return { totalPatients, appointmentsToday, totalOutstanding, revenueThisMonth };
    }, [state]);

    const todayAppointments = useMemo(() => {
         return state.appointments
            .filter(a => safeParseDate(a.date) && isToday(safeParseDate(a.date)!))
            .sort((a,b) => a.time.localeCompare(b.time));
    }, [state.appointments]);
    
    const recentTransactions = useMemo(() => {
        return [...state.transactions]
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [state.transactions]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Patients" value={stats.totalPatients} icon={<div className="text-blue-500">{ICONS.patients}</div>} linkTo={ROUTES.PATIENTS} color="border-blue-500" />
                <StatCard title="Appointments Today" value={stats.appointmentsToday} icon={<div className="text-purple-500">{ICONS.appointments}</div>} linkTo={ROUTES.APPOINTMENTS} color="border-purple-500" />
                <StatCard title="Revenue (This Month)" value={`₹${stats.revenueThisMonth.toFixed(0)}`} icon={<div className="text-green-500">{ICONS.financials}</div>} linkTo={ROUTES.FINANCIALS} color="border-green-500" />
                <StatCard title="Outstanding Balance" value={`₹${stats.totalOutstanding.toFixed(0)}`} icon={<div className="text-amber-500">{ICONS.wallet}</div>} linkTo={ROUTES.FINANCIALS} color="border-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardCard title="Today's Schedule" className="lg:col-span-2" topRightContent={
                    <Link to={ROUTES.APPOINTMENTS} className="text-sm font-medium text-primary-700 hover:underline">View All</Link>
                }>
                    {todayAppointments.length > 0 ? (
                        <ul className="space-y-3">
                            {todayAppointments.map(app => (
                                <li key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-slate-800 bg-slate-200 px-3 py-1 rounded-md text-sm">{app.time}</span>
                                        <div>
                                            <Link to={`${ROUTES.PATIENTS}/${app.patientId}`} className="font-medium text-primary-700 hover:underline">{app.patientName}</Link>
                                            <p className="text-sm text-slate-500">{app.procedure}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">Dr. {app.doctor}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                           <div className="text-4xl mb-2">{ICONS.check}</div>
                           <p className="font-semibold">All Clear!</p>
                           <p className="text-sm">No appointments scheduled for today.</p>
                        </div>
                    )}
                </DashboardCard>

                <DashboardCard title="Recent Activity">
                     {recentTransactions.length > 0 ? (
                         <ul className="space-y-3">
                             {recentTransactions.map(t => (
                                 <li key={t.id} className="flex items-center justify-between text-sm">
                                    <div className="flex-1 truncate pr-2">
                                       <p className="font-medium text-slate-700 truncate">{t.description || t.category}</p>
                                       <p className="text-xs text-slate-400">{format(safeParseDate(t.date)!, 'MMM dd')}</p>
                                    </div>
                                     <span className={`font-semibold ${t.type === TransactionType.Income ? 'text-green-600' : 'text-red-600'}`}>
                                       {t.type === TransactionType.Income ? '+' : '-'}₹{t.amount.toFixed(0)}
                                     </span>
                                 </li>
                             ))}
                         </ul>
                     ) : (
                        <div className="h-full flex items-center justify-center text-center text-slate-500">
                           <p className="text-sm">No recent transactions.</p>
                        </div>
                     )}
                </DashboardCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <DashboardCard title="Financial Summary (Last 6 Months)">
                    <FinancialSummaryChart />
                 </DashboardCard>
                 <DashboardCard title="Income Breakdown (This Month)">
                    <IncomeBreakdownDonutChart />
                 </DashboardCard>
            </div>
        </div>
    );
};

export default DashboardPage;
