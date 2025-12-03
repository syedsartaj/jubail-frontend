import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { Staff, WeeklySchedule, Activity } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Clock, User, CheckSquare, Square } from 'lucide-react';

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
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Partial<Staff>>({});
  
  // Local state for handling activity toggles during edit
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  useEffect(() => {
    setStaffList(MockDB.getStaff());
    setAllActivities(MockDB.getActivities());
  }, []);

  const handleEditClick = (staff: Staff) => {
    setCurrentStaff(staff);
    // Determine which activities this staff is assigned to
    const assignedIds = allActivities
      .filter(a => a.assignedStaffIds.includes(staff.id))
      .map(a => a.id);
    setSelectedActivityIds(assignedIds);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentStaff({ schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)) });
    setSelectedActivityIds([]);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!currentStaff.name || !currentStaff.role) return;

    const staffId = currentStaff.id || `staff_${Date.now()}`;

    const newStaff: Staff = {
      id: staffId,
      name: currentStaff.name,
      role: currentStaff.role,
      schedule: currentStaff.schedule || DEFAULT_SCHEDULE
    };

    MockDB.saveStaff(newStaff);

    // Update Activities relationships
    allActivities.forEach(act => {
      const isSelected = selectedActivityIds.includes(act.id);
      const currentAssigned = act.assignedStaffIds || [];
      let newAssigned = [...currentAssigned];

      if (isSelected && !currentAssigned.includes(staffId)) {
        newAssigned.push(staffId);
      } else if (!isSelected && currentAssigned.includes(staffId)) {
        newAssigned = newAssigned.filter(id => id !== staffId);
      }

      if (newAssigned.length !== currentAssigned.length) {
        MockDB.saveActivity({ ...act, assignedStaffIds: newAssigned });
      }
    });

    // Refresh Data
    setStaffList(MockDB.getStaff());
    setAllActivities(MockDB.getActivities());
    setIsEditing(false);
    setCurrentStaff({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this staff member? This will not remove past bookings but may affect future scheduling.')) {
      MockDB.deleteStaff(id);
      setStaffList(MockDB.getStaff());
      // Optionally cleanup activity references here, but simplified for now
    }
  };

  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivityIds(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId) 
        : [...prev, activityId]
    );
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
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      </div>

      {isEditing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6 animate-fade-in">
           <h2 className="text-lg font-semibold mb-4 text-slate-800">{currentStaff.id ? 'Edit Staff Member' : 'New Staff Member'}</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
               <input 
                 className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                 value={currentStaff.name || ''} 
                 onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})}
                 placeholder="e.g. Sarah Jones"
               />
             </div>
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">Role / Title</label>
               <input 
                 className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                 value={currentStaff.role || ''} 
                 onChange={e => setCurrentStaff({...currentStaff, role: e.target.value})}
                 placeholder="e.g. Senior Guide"
               />
             </div>
           </div>

           {/* Activity Assignment Section */}
           <div className="mb-6 border-b border-gray-200 pb-6">
             <h3 className="text-md font-bold mb-3 flex items-center text-slate-800">
               Activity Assignment
             </h3>
             <p className="text-sm text-gray-500 mb-3">Select the activities this staff member is qualified to lead.</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
               {allActivities.map(activity => (
                 <div 
                   key={activity.id} 
                   onClick={() => toggleActivitySelection(activity.id)}
                   className={`
                     cursor-pointer p-3 rounded-lg border flex items-center space-x-3 transition-colors
                     ${selectedActivityIds.includes(activity.id) 
                       ? 'bg-indigo-50 border-indigo-500 text-indigo-900' 
                       : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'}
                   `}
                 >
                   {selectedActivityIds.includes(activity.id) ? (
                     <CheckSquare className="w-5 h-5 text-indigo-600" />
                   ) : (
                     <Square className="w-5 h-5 text-gray-400" />
                   )}
                   <span className="font-medium">{activity.title}</span>
                 </div>
               ))}
               {allActivities.length === 0 && (
                 <p className="text-sm text-gray-400 italic">No activities created yet.</p>
               )}
             </div>
           </div>

           <div className="border-t border-gray-200 pt-6">
             <h3 className="text-md font-bold mb-3 flex items-center text-slate-800">
                <Clock className="w-4 h-4 mr-2" /> Working Hours / Available Slots
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {DAYS.map(day => {
                 const daySchedule = currentStaff.schedule?.[day] || DEFAULT_SCHEDULE[day];
                 return (
                   <div key={day} className={`p-3 rounded-lg border ${daySchedule.active ? 'bg-white border-slate-400' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                     <div className="flex items-center justify-between mb-2">
                       <span className="font-bold text-sm text-slate-800">{day}</span>
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
                           className="border-slate-400 bg-white border rounded px-1 py-1 w-full text-center text-slate-900"
                         />
                         <span className="text-gray-500">-</span>
                         <input 
                           type="time" 
                           value={daySchedule.end} 
                           onChange={e => updateSchedule(day, 'end', e.target.value)}
                           className="border-slate-400 bg-white border rounded px-1 py-1 w-full text-center text-slate-900"
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
          <div key={staff.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
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
                 <button onClick={() => handleEditClick(staff)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Edit2 size={16}/></button>
                 <button onClick={() => handleDelete(staff.id)} className="p-1 hover:bg-gray-100 rounded text-red-600"><Trash2 size={16}/></button>
               </div>
             </div>
             
             <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qualified Activities</h4>
                <div className="flex flex-wrap gap-1">
                  {allActivities.filter(a => a.assignedStaffIds.includes(staff.id)).length > 0 ? (
                    allActivities
                      .filter(a => a.assignedStaffIds.includes(staff.id))
                      .map(a => (
                        <span key={a.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                          {a.title}
                        </span>
                      ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No activities assigned</span>
                  )}
                </div>
             </div>

             <div className="mt-auto border-t border-gray-100 pt-3">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Schedule Preview</h4>
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