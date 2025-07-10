import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Patient } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { ICONS, ROUTES } from '../../constants';

const AppointmentsTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { state } = useAppContext();

    const patientAppointments = state.appointments
        .filter(app => app.patientId === patient.id)
        .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">Appointment History</h3>
                <Link to={ROUTES.APPOINTMENTS} className="flex items-center gap-2 rounded-md bg-primary-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800">
                    {ICONS.add} Schedule New
                </Link>
            </div>
            
            {patientAppointments.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Time</th>
                                <th className="px-4 py-2">Procedure</th>
                                <th className="px-4 py-2">Doctor</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            {patientAppointments.map(app => (
                                <tr key={app.id} className="border-b">
                                    <td className="px-4 py-2 whitespace-nowrap">{format(new Date(app.date), 'PP')}</td>
                                    <td className="px-4 py-2">{app.time}</td>
                                    <td className="px-4 py-2 font-medium">{app.procedure}</td>
                                    <td className="px-4 py-2">{app.doctor || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center text-slate-500 py-8">
                    <p>No appointments found for this patient.</p>
                </div>
            )}
        </div>
    );
};

export default AppointmentsTab;
