import React, { useState } from 'react';
import { Patient, ActionType, CaseNote } from '../../types';
import { ICONS } from '../../constants';
import { useAppContext } from '../../contexts/AppContext';
import Modal from '../Modal';
import PatientForm from '../AddPatientForm';

const InfoItem: React.FC<{ label: string, value: string, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-start gap-3">
        <div className="text-primary-600 mt-1">{icon}</div>
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-base text-slate-800">{value || 'N/A'}</p>
        </div>
    </div>
);

const AddGeneralNoteForm: React.FC<{ patientId: string; onSuccess: () => void; }> = ({ patientId, onSuccess }) => {
    const { dispatch } = useAppContext();
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;
        const newNote: CaseNote = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            note: note.trim(),
        };
        dispatch({ type: ActionType.ADD_GENERAL_NOTE, payload: { patientId, note: newNote } });
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="note" className="block text-sm font-medium text-slate-700">General Note</label>
                <textarea id="note" value={note} onChange={e => setNote(e.target.value)} required rows={4} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onSuccess} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">Save Note</button>
            </div>
        </form>
    );
};

const OverviewTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
    
    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-700">Patient Information</h3>
                    <button onClick={() => setIsEditPatientModalOpen(true)} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                        {ICONS.edit} Edit
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                   <InfoItem label="First Name" value={patient.firstName} icon={ICONS.user} />
                   <InfoItem label="Last Name" value={patient.lastName} icon={ICONS.user} />
                   <InfoItem label="Date of Birth" value={patient.dateOfBirth} icon={ICONS.appointments} />
                   <InfoItem label="Gender" value={patient.gender} icon={ICONS.user} />
                   <InfoItem label="Phone" value={patient.phone} icon={ICONS.patients} />
                   <InfoItem label="Email" value={patient.email} icon={ICONS.patientRecord} />
                   <InfoItem label="Address" value={patient.address} icon={ICONS.clinic} />
                </div>
            </div>
             <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Medical History</h3>
                <div className="space-y-2 text-sm p-4 bg-amber-50 border border-amber-200 rounded-md">
                   <p><strong className="font-medium text-slate-600">Allergies:</strong> {patient.medicalHistory.allergies || 'None reported'}</p>
                   <p><strong className="font-medium text-slate-600">Conditions:</strong> {patient.medicalHistory.conditions || 'None reported'}</p>
                </div>
            </div>
             <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-700">General Notes</h3>
                    <button onClick={() => setIsNoteModalOpen(true)} className="flex items-center gap-2 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">
                        {ICONS.add} Add Note
                    </button>
                </div>
                <div className="space-y-2 text-sm p-4 bg-slate-50 border border-slate-200 rounded-md min-h-[6rem]">
                   {patient.generalNotes.length > 0 ? (
                       patient.generalNotes.map(note => (
                         <p key={note.id} className="whitespace-pre-wrap border-b border-slate-100 pb-1 mb-1">
                           <span className="font-semibold text-slate-500 text-xs">{note.date}: </span>
                           {note.note}
                         </p>
                       ))
                   ) : (
                       <p className="text-slate-500 italic">No general notes for this patient.</p>
                   )}
                </div>
            </div>
            
            <Modal isOpen={isEditPatientModalOpen} onClose={() => setIsEditPatientModalOpen(false)} title="Edit Patient Details">
                <PatientForm
                    initialData={patient}
                    onSuccess={() => setIsEditPatientModalOpen(false)}
                    onClose={() => setIsEditPatientModalOpen(false)}
                />
            </Modal>
            
            <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title="Add General Note">
              <AddGeneralNoteForm patientId={patient.id} onSuccess={() => setIsNoteModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default OverviewTab;