import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ICONS, PREDEFINED_SHORTCUTS } from '../constants';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import Modal from '../components/Modal';
import { Appointment, ActionType, Patient } from '../types';
import { exportAppointmentConfirmationToWhatsAppMessage, exportAppointmentReminderToWhatsAppMessage } from '../services/exportService';

const WhatsAppAppointmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  type: 'confirmation' | 'reminder';
}> = ({ isOpen, onClose, appointment, type }) => {
    const { state } = useAppContext();
    
    if (!isOpen || !appointment) return null;

    const patient = state.patients.find(p => p.id === appointment.patientId);
    
    if (!patient) {
        // This should not happen in normal flow
        console.error("Patient not found for appointment.");
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Error" size="md">
                <p>Could not find patient details for this appointment. Unable to send message.</p>
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Close</button>
                </div>
            </Modal>
        );
    }
    
    const handleSend = () => {
        const template = type === 'confirmation' 
            ? state.whatsappTemplates.appointmentConfirmation
            : state.whatsappTemplates.appointmentReminder;

        const message = type === 'confirmation' 
            ? exportAppointmentConfirmationToWhatsAppMessage(appointment, patient, state.clinicName, state.clinicContactNumber, state.clinicAddress, template)
            : exportAppointmentReminderToWhatsAppMessage(appointment, patient, state.clinicName, state.clinicContactNumber, state.clinicAddress, template);

        const phoneNumber = patient.phone.replace(/\D/g, '');
        if (!phoneNumber) {
            alert("Patient phone number is not valid.");
            return;
        }
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        onClose();
    };

    const title = type === 'confirmation' ? 'Send Appointment Confirmation' : 'Send Appointment Reminder';
    const description = type === 'confirmation'
        ? 'A confirmation message will be pre-filled in WhatsApp for you to send to the patient.'
        : 'A reminder message will be pre-filled in WhatsApp for you to send to the patient.';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
            <div className="space-y-4">
                <p className="text-slate-600">{description}</p>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <p><strong className="font-medium text-slate-600">Patient:</strong> {patient.firstName} {patient.lastName}</p>
                    <p><strong className="font-medium text-slate-600">Date:</strong> {format(new Date(appointment.date), 'PP')}</p>
                    <p><strong className="font-medium text-slate-600">Time:</strong> {appointment.time}</p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSend} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700">
                        <span className="text-white">{ICONS.whatsapp}</span> Generate & Send
                    </button>
                </div>
            </div>
        </Modal>
    );
};


const AppointmentForm: React.FC<{
  onSuccess: (appointment: Appointment) => void;
  onCancel: () => void;
  selectedDate?: Date;
  initialData?: Appointment;
}> = ({ onSuccess, onCancel, selectedDate, initialData }) => {
    const { state, dispatch } = useAppContext();
    const [formData, setFormData] = useState({
        patientId: initialData?.patientId || '',
        doctor: initialData?.doctor || '',
        procedure: initialData?.procedure || '',
        date: initialData?.date || format(selectedDate!, 'yyyy-MM-dd'),
        time: initialData?.time || '10:00',
    });

    const doctorShortcuts = [...new Set([...PREDEFINED_SHORTCUTS.doctors, ...state.shortcuts.flatMap(s => s.category === 'doctors' && typeof s.value === 'string' ? [s.value] : [])])];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedPatient = state.patients.find(p => p.id === formData.patientId);
        if (!selectedPatient) {
            alert("Please select a patient.");
            return;
        }

        const appointmentData: Appointment = {
            id: initialData?.id || Date.now().toString(),
            patientId: formData.patientId,
            patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
            doctor: formData.doctor,
            procedure: formData.procedure,
            date: formData.date,
            time: formData.time,
        };
        
        if (initialData) {
            dispatch({ type: ActionType.UPDATE_APPOINTMENT, payload: appointmentData });
        } else {
            dispatch({ type: ActionType.ADD_APPOINTMENT, payload: appointmentData });
        }
        onSuccess(appointmentData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="patientId" className="block text-sm font-medium text-slate-700">Patient</label>
                <select name="patientId" id="patientId" value={formData.patientId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                    <option value="" disabled>Select a patient</option>
                    {state.patients.map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="procedure" className="block text-sm font-medium text-slate-700">Procedure</label>
                <input type="text" name="procedure" id="procedure" value={formData.procedure} onChange={handleChange} required placeholder="e.g., Annual Check-up" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
             <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-slate-700">Doctor</label>
                <input list="doctors" name="doctor" id="doctor" value={formData.doctor} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                 <datalist id="doctors">
                    {doctorShortcuts.map(d => <option key={d} value={d} />)}
                </datalist>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">Date</label>
                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 shadow-sm sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="time" className="block text-sm font-medium text-slate-700">Time</label>
                    <input type="time" name="time" id="time" value={formData.time} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">Save Appointment</button>
            </div>
        </form>
    );
};

const CalendarHeader: React.FC<{ currentMonth: Date; onPrevMonth: () => void; onNextMonth: () => void; }> = ({ currentMonth, onPrevMonth, onNextMonth }) => (
    <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
            <button onClick={onPrevMonth} className="p-2 rounded-full hover:bg-slate-100">{ICONS.left}</button>
            <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-slate-100">{ICONS.right}</button>
        </div>
    </div>
);

const CalendarGrid: React.FC<{ currentMonth: Date; selectedDate: Date; onDateClick: (date: Date) => void; appointmentsByDate: { [key: string]: number } }> = ({ currentMonth, onDateClick, appointmentsByDate, selectedDate }) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="grid grid-cols-7 gap-px bg-slate-200 border-t border-b border-slate-200">
            {weekdays.map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-slate-600 bg-slate-50">{day}</div>
            ))}
            {days.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const appointmentCount = appointmentsByDate[dayKey] || 0;
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                return (
                    <div key={day.toString()} onClick={() => onDateClick(day)} className={`relative p-2 h-24 flex flex-col group transition-colors ${isCurrentMonth ? 'bg-white hover:bg-primary-50' : 'bg-slate-50 text-slate-400'} ${isSelected && isCurrentMonth ? 'bg-primary-100' : ''} cursor-pointer`}>
                        <time dateTime={format(day, 'yyyy-MM-dd')} className={`text-sm ${isToday ? 'flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white font-bold' : ''} ${isSelected ? 'font-bold text-primary-700':''}`}>
                            {format(day, 'd')}
                        </time>
                        {appointmentCount > 0 && (
                             <div className="absolute bottom-2 right-2 text-xs text-white bg-primary-400 rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                                {appointmentCount}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    );
};

const DailyAppointmentList: React.FC<{
  selectedDate: Date;
  onEdit: (appointment: Appointment) => void;
  onRemind: (appointment: Appointment) => void;
}> = ({ selectedDate, onEdit, onRemind }) => {
    const { state, dispatch } = useAppContext();
    const appointmentsForDay = useMemo(() => 
        state.appointments
            .filter(app => isSameDay(new Date(app.date), selectedDate))
            .sort((a,b) => a.time.localeCompare(b.time)),
        [state.appointments, selectedDate]
    );
    
    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this appointment?")) {
            dispatch({ type: ActionType.DELETE_APPOINTMENT, payload: { id }});
        }
    }

    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Appointments for {format(selectedDate, 'EEEE, MMMM do')}
            </h3>
            {appointmentsForDay.length > 0 ? (
                <ul className="space-y-3">
                    {appointmentsForDay.map(app => (
                        <li key={app.id} className="p-4 bg-white rounded-lg shadow-sm flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-primary-700">{app.patientName}</p>
                                <p className="text-sm text-slate-600">{app.procedure}</p>
                                <p className="text-xs text-slate-400">with {app.doctor}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-base text-slate-800 bg-slate-100 px-3 py-1 rounded-md">{app.time}</span>
                                <button onClick={() => onRemind(app)} className="text-slate-500 hover:text-blue-600 p-1" title="Send Reminder">{ICONS.reminder}</button>
                                <button onClick={() => onEdit(app)} className="text-slate-500 hover:text-slate-800 p-1" title="Edit">{ICONS.edit}</button>
                                <button onClick={() => handleDelete(app.id)} className="text-slate-500 hover:text-red-600 p-1" title="Delete">{ICONS.delete}</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-slate-500 py-8">
                    <p>No appointments scheduled.</p>
                </div>
            )}
        </div>
    );
}

const AppointmentsPage: React.FC = () => {
    const { state } = useAppContext();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
    const [whatsAppModalData, setWhatsAppModalData] = useState<{ appointment: Appointment; type: 'confirmation' | 'reminder' } | null>(null);

    const appointmentsByDate = useMemo(() => {
        return state.appointments.reduce((acc, app) => {
            const dateKey = format(new Date(app.date), 'yyyy-MM-dd');
            acc[dateKey] = (acc[dateKey] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
    }, [state.appointments]);

    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleDateClick = (date: Date) => setSelectedDate(date);
    
    const handleOpenFormModal = (appointment?: Appointment) => {
        setEditingAppointment(appointment);
        setIsFormModalOpen(true);
    };
    
    const handleFormSuccess = (appointment: Appointment) => {
        const isNewAppointment = !editingAppointment;
        setIsFormModalOpen(false);
        setEditingAppointment(undefined);
        if (isNewAppointment) {
            setWhatsAppModalData({ appointment, type: 'confirmation' });
        }
    };
    
    const handleFormCancel = () => {
        setIsFormModalOpen(false);
        setEditingAppointment(undefined);
    };
    
    const handleRemind = (appointment: Appointment) => {
        setWhatsAppModalData({ appointment, type: 'reminder' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Appointments</h1>
                <button onClick={() => handleOpenFormModal()} className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">
                    {ICONS.add} New Appointment
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
                    <CalendarHeader currentMonth={currentMonth} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} />
                    <CalendarGrid currentMonth={currentMonth} selectedDate={selectedDate} onDateClick={handleDateClick} appointmentsByDate={appointmentsByDate} />
                </div>
                <div className="bg-slate-50 rounded-lg shadow-sm">
                    <DailyAppointmentList selectedDate={selectedDate} onEdit={handleOpenFormModal} onRemind={handleRemind} />
                </div>
            </div>
            <Modal
              isOpen={isFormModalOpen}
              onClose={handleFormCancel}
              title={editingAppointment ? 'Edit Appointment' : `New Appointment on ${format(selectedDate, 'MMMM do')}`}
            >
                <AppointmentForm
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                  initialData={editingAppointment}
                  selectedDate={selectedDate}
                />
            </Modal>
            
            {whatsAppModalData && (
                <WhatsAppAppointmentModal
                    isOpen={!!whatsAppModalData}
                    onClose={() => setWhatsAppModalData(null)}
                    appointment={whatsAppModalData.appointment}
                    type={whatsAppModalData.type}
                />
            )}
        </div>
    );
};

export default AppointmentsPage;