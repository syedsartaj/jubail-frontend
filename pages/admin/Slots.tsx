
import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { ActivitySlot, Staff, Activity } from '../../types';
import { Button } from '../../components/ui/Button';
import { Calendar, User, Clock, Plus, Edit2, Trash2, X } from 'lucide-react';

const Slots: React.FC = () => {
  const [slots, setSlots] = useState<ActivitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<Partial<ActivitySlot>>({});
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  useEffect(() => {
    setActivities(MockDB.getActivities());
    setStaffList(MockDB.getStaff());
    refreshSlots();
  }, [selectedDate]);

  const refreshSlots = () => {
    const all = MockDB.getSlots();
    setSlots(all.filter(s => s.date === selectedDate).sort((a,b) => a.startTime.localeCompare(b.startTime)));
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayIndex = new Date(date.getTime() + date.getTimezoneOffset() * 60000).getDay(); 
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const addMinutes = (time: string, mins: number) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + mins);
    return date.toTimeString().slice(0, 5);
  };

  // --- Auto-Fill Logic ---
  const handleGenerateSlots = () => {
    const newSlots: ActivitySlot[] = [];
    const dayName = getDayName(selectedDate);
    
    staffList.forEach(staff => {
      const schedule = staff.schedule[dayName];
      if (schedule && schedule.active) {
        const shiftStart = schedule.start;
        const shiftEnd = schedule.end;
        const staffActivities = activities.filter(act => act.assignedStaffIds.includes(staff.id));
        
        staffActivities.forEach(activity => {
          let currentTime = shiftStart;
          while (true) {
            const nextTime = addMinutes(currentTime, activity.durationMinutes);
            if (nextTime > shiftEnd || nextTime < currentTime) break; 

            // Create ID
            const slotId = `slot_${selectedDate}_${staff.id}_${activity.id}_${currentTime.replace(':','')}`;
            
            // Basic check to avoid overwriting existing slots with same ID (though ID includes staffId, so it's unique per staff)
            // If using multi-staff slots, auto-fill creates INDIVIDUAL slots per staff
            if (!slots.some(s => s.id === slotId)) {
               newSlots.push({
                 id: slotId,
                 activityId: activity.id,
                 staffIds: [staff.id], // Auto-fill assigns single staff
                 date: selectedDate,
                 startTime: currentTime,
                 endTime: nextTime,
                 price: activity.price,
                 capacity: activity.capacityPerSlot,
                 bookedCount: 0
               });
            }
            const [h] = currentTime.split(':').map(Number);
            const nextHour = h + 1;
            currentTime = `${nextHour.toString().padStart(2, '0')}:00`;
          }
        });
      }
    });

    newSlots.forEach(s => MockDB.saveSlot(s));
    refreshSlots();
  };

  // --- Manual CRUD Logic ---
  const openModal = (slot?: ActivitySlot) => {
    if (slot) {
      setCurrentSlot(slot);
      setSelectedStaffIds(slot.staffIds || []);
    } else {
      // Default new slot
      setCurrentSlot({
        date: selectedDate,
        startTime: '09:00',
        endTime: '10:00',
        capacity: 10,
        price: 0,
        bookedCount: 0
      });
      setSelectedStaffIds([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSlot({});
    setSelectedStaffIds([]);
  };

  const handleSaveSlot = () => {
    if (!currentSlot.activityId || !currentSlot.startTime || !currentSlot.endTime || selectedStaffIds.length === 0) {
      alert("Please fill all fields and assign at least one staff member.");
      return;
    }

    const activity = activities.find(a => a.id === currentSlot.activityId);
    
    const newSlot: ActivitySlot = {
      id: currentSlot.id || `manual_slot_${Date.now()}`,
      activityId: currentSlot.activityId,
      staffIds: selectedStaffIds,
      date: currentSlot.date || selectedDate,
      startTime: currentSlot.startTime,
      endTime: currentSlot.endTime,
      price: Number(currentSlot.price),
      capacity: Number(currentSlot.capacity),
      bookedCount: currentSlot.bookedCount || 0
    };

    MockDB.saveSlot(newSlot);
    refreshSlots();
    closeModal();
  };

  const handleDeleteSlot = (id: string) => {
    if (confirm("Are you sure you want to delete this slot?")) {
      MockDB.deleteSlot(id);
      refreshSlots();
    }
  };

  const toggleStaffSelection = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Helper for rendering cards
  const getActivity = (id: string) => activities.find(a => a.id === id);
  const getStaffNames = (ids: string[]) => {
    return ids.map(id => staffList.find(s => s.id === id)?.name).filter(Boolean).join(', ');
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Daily Schedule</h1>
              <p className="text-gray-500">Manage slots and staff assignments.</p>
            </div>
            <div className="flex items-center gap-2">
                <input 
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="border-slate-400 bg-white border rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500"
                />
                <Button variant="outline" onClick={handleGenerateSlots}>
                    <Calendar className="w-4 h-4 mr-2" /> Auto-Fill
                </Button>
                <Button onClick={() => openModal()}>
                    <Plus className="w-4 h-4 mr-2" /> Manual Add
                </Button>
            </div>
        </div>

        {/* --- MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">{currentSlot.id ? 'Edit Slot' : 'Add New Slot'}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Activity</label>
                  <select 
                    className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900"
                    value={currentSlot.activityId || ''}
                    onChange={e => {
                      const act = activities.find(a => a.id === e.target.value);
                      setCurrentSlot({
                        ...currentSlot, 
                        activityId: e.target.value,
                        price: act?.price || 0,
                        capacity: act?.capacityPerSlot || 10
                      });
                    }}
                  >
                    <option value="">Select Activity...</option>
                    {activities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Start Time</label>
                    <input 
                      type="time" 
                      className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900"
                      value={currentSlot.startTime || ''}
                      onChange={e => setCurrentSlot({...currentSlot, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">End Time</label>
                    <input 
                      type="time" 
                      className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900"
                      value={currentSlot.endTime || ''}
                      onChange={e => setCurrentSlot({...currentSlot, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Price ($)</label>
                    <input 
                      type="number" 
                      className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900"
                      value={currentSlot.price || 0}
                      onChange={e => setCurrentSlot({...currentSlot, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Capacity</label>
                    <input 
                      type="number" 
                      className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900"
                      value={currentSlot.capacity || 0}
                      onChange={e => setCurrentSlot({...currentSlot, capacity: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Assign Staff (Multi-Select)</label>
                   <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-slate-50">
                     {staffList.length === 0 && <p className="text-gray-500 text-sm">No staff found.</p>}
                     {staffList.map(staff => (
                       <label key={staff.id} className="flex items-center space-x-2 mb-2 cursor-pointer">
                         <input 
                           type="checkbox" 
                           className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-gray-300"
                           checked={selectedStaffIds.includes(staff.id)}
                           onChange={() => toggleStaffSelection(staff.id)}
                         />
                         <span className="text-sm text-slate-800">{staff.name} <span className="text-gray-400 text-xs">({staff.role})</span></span>
                       </label>
                     ))}
                   </div>
                   <p className="text-xs text-gray-500 mt-1">Check all staff members managing this specific slot.</p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button onClick={handleSaveSlot}>Save Schedule</Button>
              </div>
            </div>
          </div>
        )}

        {/* --- SLOT LIST --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed">
                    No slots for {selectedDate}. Use "Auto-Fill" or "Manual Add" to create schedule.
                </div>
            ) : (
                slots.map(slot => {
                  const activity = getActivity(slot.activityId);
                  const staffNames = getStaffNames(slot.staffIds || []);
                  
                  if (!activity) return null;

                  return (
                    <div key={slot.id} className="bg-white p-4 rounded-xl border shadow-sm relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${activity.color.split(' ')[0]}`}></div>
                        
                        <div className="pl-3">
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-gray-900">{activity.title}</h3>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <Clock size={12} className="mr-1" />
                                  <span>{slot.startTime} - {slot.endTime}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="block text-sm font-bold">${slot.price}</span>
                                <div className="flex space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(slot)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><Edit2 size={14}/></button>
                                    <button onClick={() => handleDeleteSlot(slot.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
                                </div>
                              </div>
                          </div>
                          
                          <div className="flex items-start text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                            <User size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                            <span className="truncate" title={staffNames}>{staffNames || 'Unassigned'}</span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                              <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${Math.min((slot.bookedCount/slot.capacity)*100, 100)}%` }}></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                              <span>Booked: {slot.bookedCount}</span>
                              <span>Cap: {slot.capacity}</span>
                          </div>
                        </div>
                    </div>
                  );
                })
            )}
        </div>
    </div>
  );
};

export default Slots;
