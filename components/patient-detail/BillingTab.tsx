import React, { useState } from 'react';
import { Patient, BillingStatus, ActionType, BillingEntry, Shortcut } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { ICONS, PREDEFINED_SHORTCUTS } from '../../constants';
import Modal from '../Modal';

const BillingEntryForm: React.FC<{
    patientId: string;
    onSuccess: () => void;
    initialData?: BillingEntry;
}> = ({ patientId, onSuccess, initialData }) => {
    const { state, dispatch } = useAppContext();
    const [formData, setFormData] = useState({
        date: initialData?.date || new Date().toISOString().split('T')[0],
        description: initialData?.description || '',
        amount: initialData?.amount.toString() || '',
    });

    const billingShortcuts = state.shortcuts.filter((s): s is Extract<Shortcut, { category: 'billing' }> => s.category === 'billing');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleShortcutClick = (description: string, amount?: number) => {
        setFormData(prev => ({
            ...prev,
            description,
            amount: amount ? amount.toString() : prev.amount
        }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || !formData.amount) return;

        if (initialData) {
            const updatedEntry: BillingEntry = {
                ...initialData,
                date: formData.date,
                description: formData.description,
                amount: parseFloat(formData.amount),
            };
            dispatch({ type: ActionType.UPDATE_BILLING_ITEM, payload: { patientId, billingItem: updatedEntry } });
        } else {
            const newBillingEntry: BillingEntry = {
                id: Date.now().toString(),
                date: formData.date,
                description: formData.description,
                amount: parseFloat(formData.amount),
                status: BillingStatus.Pending,
            };
            dispatch({ type: ActionType.ADD_BILLING, payload: { patientId, billing: newBillingEntry } });
        }
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700">Date</label>
                <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            {(billingShortcuts.length > 0 || PREDEFINED_SHORTCUTS.billing.length > 0) && (
                 <div>
                    <span className="text-xs text-slate-500">Shortcuts:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {PREDEFINED_SHORTCUTS.billing.map(sc => (
                             <button type="button" key={sc} onClick={() => handleShortcutClick(sc)} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs hover:bg-slate-200">{sc}</button>
                        ))}
                        {billingShortcuts.map(sc => (
                            <button type="button" key={sc.id} onClick={() => handleShortcutClick(sc.value.description, sc.value.amount)} className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs hover:bg-primary-200">{sc.value.description}</button>
                        ))}
                    </div>
                 </div>
            )}
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Amount (₹)</label>
                <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onSuccess} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">Save</button>
            </div>
        </form>
    )
}

const BillingTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<BillingEntry | undefined>(undefined);

    const handleOpenModal = (entry?: BillingEntry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingEntry(undefined);
        setIsModalOpen(false);
    };

    const handleUpdateBillingStatus = (billingId: string, status: BillingStatus) => {
        dispatch({ type: ActionType.UPDATE_BILLING, payload: { patientId: patient.id, billingId, status } });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">Billing History</h3>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">
                    {ICONS.add} Add Entry
                </button>
            </div>

            {patient.billing.length > 0 ? (
                <ul className="space-y-2">
                {patient.billing.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(b => (
                    <li key={b.id} className="flex flex-wrap justify-between items-center p-3 bg-slate-50 rounded-md gap-2">
                        <div>
                            <p className="font-medium text-slate-800">{b.description}</p>
                            <p className="text-xs text-slate-500">{b.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-semibold text-slate-800">₹{b.amount.toFixed(2)}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${b.status === BillingStatus.Paid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{b.status}</span>
                            {b.status === BillingStatus.Pending && (
                                <button onClick={() => handleUpdateBillingStatus(b.id, BillingStatus.Paid)} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Mark as Paid</button>
                            )}
                            <button onClick={() => handleOpenModal(b)} className="text-slate-500 hover:text-primary-700 p-1" title="Edit">{ICONS.edit}</button>
                        </div>
                    </li>
                ))}
                </ul>
            ) : <p className="text-center text-slate-500 py-4">No billing entries found.</p>}

             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEntry ? 'Edit Billing Entry' : 'Add Billing Entry'} size="md">
                <BillingEntryForm patientId={patient.id} onSuccess={handleCloseModal} initialData={editingEntry} />
            </Modal>
        </div>
    );
};

export default BillingTab;