import React, { useState } from 'react';
import { Patient, ActionType, Prescription, Shortcut, PrescriptionStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { ICONS, PREDEFINED_SHORTCUTS } from '../../constants';
import Modal from '../Modal';

const PrescriptionForm: React.FC<{ 
    patientId: string; 
    onSuccess: () => void;
    initialData?: Prescription;
}> = ({ patientId, onSuccess, initialData }) => {
    const { state, dispatch } = useAppContext();
    const [formData, setFormData] = useState<Omit<Prescription, 'id'>>({
        medication: initialData?.medication || '',
        dosage: initialData?.dosage || '',
        frequency: initialData?.frequency || '',
        drugType: initialData?.drugType || 'Analgesic',
        duration: initialData?.duration || '',
        route: initialData?.route || 'Oral',
        instructions: initialData?.instructions || '',
        advice: initialData?.advice || '',
        doctor: initialData?.doctor || '',
        status: initialData?.status || PrescriptionStatus.Active,
        startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
        endDate: initialData?.endDate || '',
    });

    const prescriptionShortcuts = state.shortcuts.filter((s): s is Extract<Shortcut, { category: 'prescriptions' }> => s.category === 'prescriptions');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    }
    
    const applyShortcut = (shortcutValue: Partial<Omit<Prescription, 'id'>>) => {
        setFormData(prev => ({ ...prev, ...shortcutValue }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.medication) return;
        const newPrescription: Prescription = {
            id: initialData?.id || Date.now().toString(),
            ...formData,
        };
        
        if (initialData) {
            dispatch({ type: ActionType.UPDATE_PRESCRIPTION, payload: { patientId, prescription: newPrescription } });
        } else {
            dispatch({ type: ActionType.ADD_PRESCRIPTION, payload: { patientId, prescription: newPrescription } });
        }
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <span className="text-xs text-slate-500">Shortcuts:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                    {prescriptionShortcuts.map(sc => (
                        <button type="button" key={sc.id} onClick={() => applyShortcut(sc.value)} className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs hover:bg-primary-200">{sc.value.medication}</button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="medication" className="block text-sm font-medium text-slate-700">Medication</label>
                    <input type="text" name="medication" value={formData.medication} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                
                 <div>
                    <label htmlFor="drugType" className="block text-sm font-medium text-slate-700">Drug Type</label>
                    <input type="text" name="drugType" value={formData.drugType} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="e.g., Antibiotic" />
                </div>
                 <div>
                    <label htmlFor="dosage" className="block text-sm font-medium text-slate-700">Dosage</label>
                    <input type="text" name="dosage" value={formData.dosage} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="e.g., 500mg" />
                </div>
                <div>
                    <label htmlFor="frequency" className="block text-sm font-medium text-slate-700">Frequency</label>
                    <input type="text" name="frequency" value={formData.frequency} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="e.g., Twice a day" />
                </div>
                 <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-slate-700">Duration</label>
                    <input type="text" name="duration" value={formData.duration} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="e.g., 7 days" />
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="instructions" className="block text-sm font-medium text-slate-700">Instructions</label>
                    <textarea name="instructions" value={formData.instructions} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="e.g., After meals"></textarea>
                </div>
                 <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Start Date</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">End Date</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
                     <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                        {Object.values(PrescriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onSuccess} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">Save Prescription</button>
            </div>
        </form>
    );
}

const PrescriptionsTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrescription, setEditingPrescription] = useState<Prescription | undefined>(undefined);

    const handleOpenModal = (prescription?: Prescription) => {
        setEditingPrescription(prescription);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPrescription(undefined);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this prescription?')) {
            dispatch({ type: ActionType.DELETE_PRESCRIPTION, payload: { patientId: patient.id, prescriptionId: id } });
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">Prescriptions</h3>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-md bg-primary-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
                    {ICONS.add} Add Prescription
                </button>
            </div>

            {patient.prescriptions && patient.prescriptions.length > 0 ? (
                <div className="space-y-4">
                    {patient.prescriptions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(p => (
                        <div key={p.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-md text-primary-700 flex items-center gap-2">
                                        {ICONS.prescription} {p.medication}
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{p.drugType}</span>
                                    </p>
                                    <p className="text-sm text-slate-600">{p.dosage} &bull; {p.frequency}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>{p.status}</span>
                                    <button onClick={() => handleOpenModal(p)} className="p-1 text-slate-500 hover:text-primary-700">{ICONS.edit}</button>
                                    <button onClick={() => handleDelete(p.id)} className="p-1 text-slate-500 hover:text-red-600">{ICONS.delete}</button>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200 text-sm space-y-1">
                                <p><strong className="font-medium text-slate-500">Duration:</strong> {p.duration || 'N/A'}</p>
                                <p><strong className="font-medium text-slate-500">Instructions:</strong> {p.instructions || 'N/A'}</p>
                                <p><strong className="font-medium text-slate-500">Dates:</strong> {p.startDate} to {p.endDate || 'Ongoing'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-center text-slate-500 py-8">No prescriptions found.</p>}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPrescription ? 'Edit Prescription' : 'Add New Prescription'}>
                <PrescriptionForm patientId={patient.id} onSuccess={handleCloseModal} initialData={editingPrescription}/>
            </Modal>
        </div>
    );
};

export default PrescriptionsTab;