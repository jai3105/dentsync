import React, { useState } from 'react';
import { Patient, ActionType, Document as PatientDocument } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { ICONS } from '../../constants';
import { format } from 'date-fns';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const DocumentsTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { dispatch } = useAppContext();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setIsUploading(true);
            const files = Array.from(event.target.files);
            for (const file of files) {
                try {
                    const fileDataUrl = await readFileAsDataURL(file);
                    const newDocument: PatientDocument = {
                        id: `${Date.now()}-${file.name}`,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: fileDataUrl,
                        uploadedAt: new Date().toISOString(),
                    };
                    dispatch({
                        type: ActionType.ADD_DOCUMENT,
                        payload: { patientId: patient.id, document: newDocument }
                    });
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            }
            setIsUploading(false);
            // Reset file input
            event.target.value = '';
        }
    };
    
    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
    
    const handleDelete = (documentId: string) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            dispatch({ type: ActionType.DELETE_DOCUMENT, payload: { patientId: patient.id, documentId }});
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Patient Documents</h3>
            
            <div className="mb-6 p-6 border-2 border-dashed border-slate-300 rounded-lg text-center bg-slate-50">
                <label htmlFor="file-upload" className="cursor-pointer font-semibold text-primary-700 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 text-primary-600">{ICONS.addFile}</div>
                    <span className="mt-2 text-sm">
                        {isUploading ? 'Uploading...' : 'Select files to upload'}
                    </span>
                    <span className="mt-1 text-xs text-slate-500 font-normal">X-Rays, Reports, Consent forms etc.</span>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="hidden"
                        id="file-upload"
                    />
                </label>
            </div>

            {patient.documents && patient.documents.length > 0 ? (
                <div className="space-y-3">
                    {patient.documents.map(doc => (
                        <div key={doc.id} className="flex flex-wrap justify-between items-center p-3 bg-slate-100 rounded-md gap-2">
                            <div className="flex items-center gap-3">
                                <div className="text-primary-700">{ICONS.notes}</div>
                                <div>
                                    <p className="font-medium text-slate-800 break-all">{doc.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')} &bull; {formatBytes(doc.size)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <a href={doc.url} download={doc.name} className="p-2 text-slate-500 hover:text-primary-700" title="Download">
                                    {ICONS.pdf}
                                </a>
                                <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-500 hover:text-red-600" title="Delete">
                                    {ICONS.delete}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-500 py-8">No documents uploaded for this patient.</p>
            )}
        </div>
    );
};

export default DocumentsTab;