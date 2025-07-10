import React, { useState } from 'react';
import { Patient, ActionType, CaseNote, Shortcut } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { ICONS, PREDEFINED_SHORTCUTS } from '../../constants';
import Modal from '../Modal';

const AddNoteForm: React.FC<{ 
  patientId: string; 
  onSuccess: () => void;
  noteType: 'case' | 'general';
}> = ({ patientId, onSuccess, noteType }) => {
    const { state, dispatch } = useAppContext();
    const [note, setNote] = useState('');
    const noteShortcuts = state.shortcuts.filter((s): s is Extract<Shortcut, { category: 'notes' }> => s.category === 'notes');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;
        const newNote: CaseNote = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            note: note.trim(),
        };

        if (noteType === 'case') {
          dispatch({ type: ActionType.ADD_CASE_NOTE, payload: { patientId, caseNote: newNote } });
        } else if (noteType === 'general') {
          dispatch({ type: ActionType.ADD_GENERAL_NOTE, payload: { patientId, note: newNote } });
        }
        onSuccess();
    };
    
    const title = noteType === 'case' ? 'Case Note' : 'General Note';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="note" className="block text-sm font-medium text-slate-700">{title}</label>
                <textarea id="note" value={note} onChange={e => setNote(e.target.value)} required rows={5} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
             {(noteShortcuts.length > 0 || PREDEFINED_SHORTCUTS.notes.length > 0) && (
                 <div>
                    <span className="text-xs text-slate-500">Shortcuts:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {PREDEFINED_SHORTCUTS.notes.map(sc => (
                             <button type="button" key={sc} onClick={() => setNote(prev => `${prev}${prev ? ' ' : ''}${sc}`)} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs hover:bg-slate-200">{sc}</button>
                        ))}
                        {noteShortcuts.map(sc => (
                            <button type="button" key={sc.id} onClick={() => setNote(prev => `${prev}${prev ? ' ' : ''}${sc.value}`)} className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs hover:bg-primary-200">{sc.value}</button>
                        ))}
                    </div>
                 </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onSuccess} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">Save Note</button>
            </div>
        </form>
    );
}

const NoteList: React.FC<{title: string, notes: CaseNote[], onAdd: () => void}> = ({ title, notes, onAdd }) => (
  <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      <button onClick={onAdd} className="flex items-center gap-2 rounded-md bg-primary-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
        {ICONS.add} Add Note
      </button>
    </div>
    {notes.length > 0 ? (
      <ul className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
        {notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(n => (
          <li key={n.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-1">{n.date}</p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{n.note}</p>
          </li>
        ))}
      </ul>
    ) : <p className="text-center text-slate-500 py-4 text-sm">No entries found.</p>}
  </div>
);


const CaseNotesTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [noteType, setNoteType] = useState<'case' | 'general'>('case');

    const openModal = (type: 'case' | 'general') => {
      setNoteType(type);
      setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <NoteList title="Case Notes" notes={patient.caseNotes} onAdd={() => openModal('case')} />
            <NoteList title="General Notes" notes={patient.generalNotes} onAdd={() => openModal('general')} />
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add ${noteType === 'case' ? 'Case Note' : 'General Note'}`}>
                <AddNoteForm patientId={patient.id} onSuccess={() => setIsModalOpen(false)} noteType={noteType} />
            </Modal>
        </div>
    );
};

export default CaseNotesTab;