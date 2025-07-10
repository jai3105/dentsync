import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ICONS } from '../constants';
import { FinancialTransaction, TransactionType, ActionType, BillingStatus } from '../types';
import { exportFinancialsToCSV, exportFinancialsToPDF } from '../services/exportService';
import Modal from '../components/Modal';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`p-6 rounded-xl shadow-lg flex items-center gap-6 ${color}`}>
        <div className="text-4xl">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const TransactionForm: React.FC<{
  onSuccess: () => void;
  initialData?: FinancialTransaction;
}> = ({ onSuccess, initialData }) => {
    const { dispatch } = useAppContext();
    const [formData, setFormData] = useState({
        type: initialData?.type || TransactionType.Income,
        category: initialData?.category || '',
        description: initialData?.description || '',
        amount: initialData?.amount.toString() || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const transactionData: FinancialTransaction = {
            id: initialData?.id || Date.now().toString(),
            ...formData,
            type: formData.type as TransactionType,
            amount: parseFloat(formData.amount),
        };
        
        if (initialData) {
            dispatch({ type: ActionType.UPDATE_TRANSACTION, payload: transactionData });
        } else {
            dispatch({ type: ActionType.ADD_TRANSACTION, payload: transactionData });
        }
        onSuccess();
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-slate-700">Type</label>
                    <select name="type" id="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                        <option value={TransactionType.Income}>Income</option>
                        <option value={TransactionType.Expense}>Expense</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">Date</label>
                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
                    <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required placeholder="e.g., Patient Payment, Lab Fees" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                    <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Amount (₹)</label>
                    <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onSuccess} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">Save Transaction</button>
            </div>
        </form>
    )
};


const FinancialsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [dateRange, setDateRange] = useState({
        start: '',
        end: '',
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | undefined>(undefined);

    const filteredTransactions = useMemo(() => {
        return state.transactions.filter(t => {
            if (!dateRange.start || !dateRange.end) return true;
            const endDate = new Date(dateRange.end);
            endDate.setDate(endDate.getDate() + 1);
            const tDate = new Date(t.date);
            return tDate >= new Date(dateRange.start) && tDate < endDate;
        });
    }, [state.transactions, dateRange]);

    const financialSummary = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            if (t.type === TransactionType.Income) {
                acc.income += t.amount;
            } else {
                acc.expense += t.amount;
            }
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    const totalOutstanding = useMemo(() => {
        return state.patients
            .flatMap(p => p.billing)
            .filter(b => b.status === BillingStatus.Pending)
            .reduce((sum, b) => sum + b.amount, 0);
    }, [state.patients]);
    
    const netBalance = financialSummary.income - financialSummary.expense;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOpenModal = (transaction?: FinancialTransaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(undefined);
    };

    const handleDeleteTransaction = (id: string) => {
        if(window.confirm('Are you sure you want to delete this transaction?')) {
            dispatch({ type: ActionType.DELETE_TRANSACTION, payload: { id }});
        }
    };
    
    const handleExportPDF = () => {
      exportFinancialsToPDF(
        filteredTransactions,
        { income: financialSummary.income, expense: financialSummary.expense, net: netBalance },
        dateRange,
        state.clinicName,
        state.clinicLogo,
        state.clinicAddress
      );
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Financials</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Income" value={`₹${financialSummary.income.toFixed(2)}`} icon={<div className="text-green-800">{ICONS.wallet}</div>} color="bg-green-100 text-green-800" />
                <StatCard title="Total Expenses" value={`₹${financialSummary.expense.toFixed(2)}`} icon={<div className="text-red-800">{ICONS.landmark}</div>} color="bg-red-100 text-red-800" />
                <StatCard title="Total Outstanding" value={`₹${totalOutstanding.toFixed(2)}`} icon={<div className="text-amber-800">{ICONS.wallet}</div>} color="bg-amber-100 text-amber-800" />
                <StatCard title="Net Balance" value={`₹${netBalance.toFixed(2)}`} icon={<div className={netBalance >= 0 ? 'text-blue-800' : 'text-orange-800'}>{ICONS.arrowRight}</div>} color={netBalance >= 0 ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"} />
            </div>

            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-800">Transactions</h2>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                             <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="form-input p-2 border rounded-md text-sm border-slate-300" />
                             <span className="text-slate-500">to</span>
                             <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="form-input p-2 border rounded-md text-sm border-slate-300"/>
                        </div>
                        <button onClick={() => exportFinancialsToCSV(filteredTransactions)} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                            {ICONS.csv} Export CSV
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                            {ICONS.pdf} Export PDF
                        </button>
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700">
                            {ICONS.add} Add Transaction
                        </button>
                    </div>
                </div>
                <div className="p-4 overflow-x-auto">
                     {filteredTransactions.length > 0 ? (
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                    <tr key={t.id} className="bg-white border-b">
                                        <td className="px-6 py-4 whitespace-nowrap">{t.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.type === TransactionType.Income ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{t.category}</td>
                                        <td className="px-6 py-4">{t.description}</td>
                                        <td className={`px-6 py-4 text-right font-semibold ${t.type === TransactionType.Income ? 'text-green-600' : 'text-red-600'}`}>
                                            ₹{t.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => handleOpenModal(t)} className="text-slate-500 hover:text-slate-800 p-1">{ICONS.edit}</button>
                                                <button onClick={() => handleDeleteTransaction(t.id)} className="text-slate-500 hover:text-red-600 p-1">{ICONS.delete}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="text-center text-slate-500 py-8">No transactions found for the selected period.</p>}
                </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTransaction ? "Edit Transaction" : "Add New Transaction"}>
                <TransactionForm onSuccess={handleCloseModal} initialData={editingTransaction} />
            </Modal>
        </div>
    );
};

export default FinancialsPage;