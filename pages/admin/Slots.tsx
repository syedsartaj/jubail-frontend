
import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { ActivitySlot, Staff, Activity } from '../../types';
import { Button } from '../../components/ui/Button';
import { Calendar, User, Clock } from 'lucide-react';

const Slots: React.FC = () => {
  const [slots, setSlots] = useState<ActivitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

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
    // Adjust for timezone issues in JS dates for simple string parsing
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

  const handleGenerateSlots = () => {
    const newSlots: ActivitySlot[] = [];
    const dayName = getDayName(selectedDate);
    
    // 1. Iterate through all staff
    staffList.forEach(staff => {
      const schedule = staff.schedule[dayName];
      
      // 2. Check if staff is working today
      if (schedule && schedule.active) {
        const shiftStart = schedule.start;
        const shiftEnd = schedule.end;

        // 3. Find activities this staff can do
        const staffActivities = activities.filter(act => act.assignedStaffIds.includes(staff.id));
        
        staffActivities.forEach(activity => {
          // 4. Generate slots for this activity within staff shift
          // Simplified: We'll create slots starting every hour or every duration interval
          // For demo simplicity: Create 1 slot per hour if it fits duration
          
          let currentTime = shiftStart;
          while (true) {
            const nextTime = addMinutes(currentTime, activity.durationMinutes);
            if (nextTime > shiftEnd || nextTime < currentTime) break; // Check bounds

            const slotId = `slot_${selectedDate}_${staff.id}_${activity.id}_${currentTime.replace(':','')}`;
            
            // Avoid duplicate slot generation if already exists (basic check)
            if (!slots.some(s => s.id === slotId)) {
               newSlots.push({
                 id: slotId,
                 activityId: activity.id,
                 staffId: staff.id,
                 date: selectedDate,
                 startTime: currentTime,
                 endTime: nextTime,
                 price: activity.price,
                 capacity: activity.capacityPerSlot,
                 bookedCount: 0
               });
            }

            // Move to next hour (or duration + break)
            // For simplicity, assume new slots start on the hour
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

  const getActivity = (id: string) => activities.find(a => a.id === id);
  const getStaff = (id: string) => staffList.find(s => s.id === id);

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Daily Schedule</h1>
              <p className="text-gray-500">Generate slots based on staff availability.</p>
            </div>
            <div className="flex items-center gap-4">
                <input 
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="border p-2 rounded-lg"
                />
                <Button onClick={handleGenerateSlots}>
                    <Calendar className="w-4 h-4 mr-2" /> Auto-Fill Schedule
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed">
                    No slots for {selectedDate}. Ensure Staff have schedules and Activities are assigned, then click Auto-Fill.
                </div>
            ) : (
                slots.map(slot => {
                  const activity = getActivity(slot.activityId);
                  const staff = getStaff(slot.staffId);
                  if (!activity || !staff) return null;

                  return (
                    <div key={slot.id} className="bg-white p-4 rounded-xl border shadow-sm relative overflow-hidden">
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
                              <span className="text-sm font-bold">${slot.price}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                            <User size={14} className="mr-2" />
                            <span className="truncate">{staff.name}</span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                              <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${(slot.bookedCount/slot.capacity)*100}%` }}></div>
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
