
import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { Staff, WeeklySchedule } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Clock, User } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE: WeeklySchedule = {
  Monday: { start: '09:00', end: '17:00', active: true },
  Tuesday: { start: '09:00', end: '17:00', active: true },
  Wednesday: { start: '09:00', end: '17:00', active: true },
  Thursday: { start: '09:00', end: '17:00', active: true },
  Friday: { start: '09:00', end: '17:00', active: true },
  Saturday: { start: '08:00', end: '18:00', active: true },
  Sunday: { start: '08:00', end: '18:00', active: true },
};

const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Partial<Staff>>({});

  useEffect(() => {
    setStaffList(MockDB.getStaff());
  }, []);

  const handleSave = () => {
    if (!currentStaff.name || !currentStaff.role) return;

    const newStaff: Staff = {
      id: currentStaff.id || `staff_${Date.now()}`,
      name: currentStaff.name,
      role: currentStaff.role,
      schedule: currentStaff.schedule || DEFAULT_SCHEDULE
    };

    MockDB.saveStaff(newStaff);
    setStaffList(MockDB.getStaff());
    setIsEditing(false);
    setCurrentStaff({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this staff member? This will not remove past bookings but may affect future scheduling.')) {
      MockDB.deleteStaff(id);
      setStaffList(MockDB.getStaff());
    }
  };

  const updateSchedule = (day: string, field: 'start' | 'end' | 'active', value: any) => {
    const prev = currentStaff.schedule || DEFAULT_SCHEDULE;
    setCurrentStaff({
      ...currentStaff,
      schedule: {
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Staff & Availability</h1>
        <Button onClick={() => { setCurrentStaff({ schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)) }); setIsEditing(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      </div>

      {isEditing && (
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 animate-fade-in">
           <h2 className="text-lg font-semibold mb-4">{currentStaff.id ? 'Edit Staff Member' : 'New Staff Member'}</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             <div>
               <label className="block text-sm font-medium text-gray-700">Full Name</label>
               <input 
                 className="w-full border p-2 rounded" 
                 value={currentStaff.name || ''} 
                 onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})}
                 placeholder="e.g. Sarah Jones"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Role / Title</label>
               <input 
                 className="w-full border p-2 rounded" 
                 value={currentStaff.role || ''} 
                 onChange={e => setCurrentStaff({...currentStaff, role: e.target.value})}
                 placeholder="e.g. Senior Guide"
               />
             </div>
           </div>

           <div className="border-t pt-4">
             <h3 className="text-md font-medium mb-3 flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2" /> Regular Working Hours
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {DAYS.map(day => {
                 const daySchedule = currentStaff.schedule?.[day] || DEFAULT_SCHEDULE[day];
                 return (
                   <div key={day} className={`p-3 rounded-lg border ${daySchedule.active ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 opacity-60'}`}>
                     <div className="flex items-center justify-between mb-2">
                       <span className="font-semibold text-sm">{day}</span>
                       <input 
                         type="checkbox" 
                         checked={daySchedule.active}
                         onChange={(e) => updateSchedule(day, 'active', e.target.checked)}
                         className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                       />
                     </div>
                     {daySchedule.active && (
                       <div className="flex items-center gap-2 text-sm">
                         <input 
                           type="time" 
                           value={daySchedule.start} 
                           onChange={e => updateSchedule(day, 'start', e.target.value)}
                           className="border rounded px-1 py-0.5 w-24"
                         />
                         <span>to</span>
                         <input 
                           type="time" 
                           value={daySchedule.end} 
                           onChange={e => updateSchedule(day, 'end', e.target.value)}
                           className="border rounded px-1 py-0.5 w-24"
                         />
                       </div>
                     )}
                     {!daySchedule.active && <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Day Off</span>}
                   </div>
                 );
               })}
             </div>
           </div>

           <div className="flex justify-end gap-2 mt-6">
             <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
             <Button onClick={handleSave}>Save Profile</Button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map(staff => (
          <div key={staff.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
             <div className="flex justify-between items-start mb-4">
               <div className="flex items-center space-x-3">
                 <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                    <User size={20} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900">{staff.name}</h3>
                   <p className="text-sm text-gray-500">{staff.role}</p>
                 </div>
               </div>
               <div className="flex space-x-1">
                 <button onClick={() => { setCurrentStaff(staff); setIsEditing(true); }} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Edit2 size={16}/></button>
                 <button onClick={() => handleDelete(staff.id)} className="p-1 hover:bg-gray-100 rounded text-red-600"><Trash2 size={16}/></button>
               </div>
             </div>
             
             <div className="mt-auto">
               <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Schedule Preview</h4>
               <div className="space-y-1">
                 {DAYS.slice(0, 3).map(day => (
                   <div key={day} className="flex justify-between text-xs text-gray-600">
                     <span>{day.substring(0,3)}</span>
                     <span>{staff.schedule[day].active ? `${staff.schedule[day].start} - ${staff.schedule[day].end}` : 'OFF'}</span>
                   </div>
                 ))}
                 <div className="text-xs text-gray-400 italic mt-1">+ {DAYS.length - 3} more days</div>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffPage;
