
import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { Activity, Staff } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

const COLORS = [
  'bg-teal-100 text-teal-800',
  'bg-green-100 text-green-800',
  'bg-blue-100 text-blue-800',
  'bg-orange-100 text-orange-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
];

const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Partial<Activity>>({});

  useEffect(() => {
    setActivities(MockDB.getActivities());
    setStaffList(MockDB.getStaff());
  }, []);

  const handleSave = () => {
    if (!currentActivity.title || !currentActivity.price) return;

    const newActivity: Activity = {
      id: currentActivity.id || `act_${Date.now()}`,
      title: currentActivity.title,
      description: currentActivity.description || '',
      price: Number(currentActivity.price),
      durationMinutes: Number(currentActivity.durationMinutes) || 60,
      capacityPerSlot: Number(currentActivity.capacityPerSlot) || 1,
      color: currentActivity.color || COLORS[0],
      assignedStaffIds: currentActivity.assignedStaffIds || []
    };

    MockDB.saveActivity(newActivity);
    setActivities(MockDB.getActivities());
    setIsEditing(false);
    setCurrentActivity({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this activity type?')) {
      MockDB.deleteActivity(id);
      setActivities(MockDB.getActivities());
    }
  };

  const toggleStaffAssignment = (staffId: string) => {
    const current = currentActivity.assignedStaffIds || [];
    if (current.includes(staffId)) {
      setCurrentActivity({ ...currentActivity, assignedStaffIds: current.filter(id => id !== staffId) });
    } else {
      setCurrentActivity({ ...currentActivity, assignedStaffIds: [...current, staffId] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Activity Types</h1>
        <Button onClick={() => { setCurrentActivity({ assignedStaffIds: [] }); setIsEditing(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Create Activity
        </Button>
      </div>

      {isEditing && (
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 animate-fade-in">
           <h2 className="text-lg font-semibold mb-4">{currentActivity.id ? 'Edit Activity' : 'New Activity'}</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700">Activity Title</label>
               <input 
                 className="w-full border p-2 rounded" 
                 value={currentActivity.title || ''} 
                 onChange={e => setCurrentActivity({...currentActivity, title: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Price ($)</label>
               <input 
                 type="number"
                 className="w-full border p-2 rounded" 
                 value={currentActivity.price || ''} 
                 onChange={e => setCurrentActivity({...currentActivity, price: Number(e.target.value)})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
               <input 
                 type="number"
                 className="w-full border p-2 rounded" 
                 value={currentActivity.durationMinutes || ''} 
                 onChange={e => setCurrentActivity({...currentActivity, durationMinutes: Number(e.target.value)})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Max Capacity (per slot)</label>
               <input 
                 type="number"
                 className="w-full border p-2 rounded" 
                 value={currentActivity.capacityPerSlot || ''} 
                 onChange={e => setCurrentActivity({...currentActivity, capacityPerSlot: Number(e.target.value)})}
               />
             </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700">Description</label>
               <textarea 
                 className="w-full border p-2 rounded" 
                 rows={3}
                 value={currentActivity.description || ''} 
                 onChange={e => setCurrentActivity({...currentActivity, description: e.target.value})}
               />
             </div>
             
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-2">Qualified Staff</label>
               <div className="flex flex-wrap gap-2">
                 {staffList.map(staff => (
                   <button
                     key={staff.id}
                     onClick={() => toggleStaffAssignment(staff.id)}
                     className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                       (currentActivity.assignedStaffIds || []).includes(staff.id)
                         ? 'bg-indigo-600 text-white border-indigo-600'
                         : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     {staff.name}
                   </button>
                 ))}
                 {staffList.length === 0 && <span className="text-sm text-gray-500 italic">No staff members found. Add staff first.</span>}
               </div>
             </div>

             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-2">Color Tag</label>
               <div className="flex gap-2">
                 {COLORS.map(color => (
                   <button
                     key={color}
                     onClick={() => setCurrentActivity({...currentActivity, color})}
                     className={`w-8 h-8 rounded-full ${color.split(' ')[0]} ${currentActivity.color === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                   />
                 ))}
               </div>
             </div>
           </div>

           <div className="flex justify-end gap-2 mt-6">
             <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
             <Button onClick={handleSave}>Save Activity</Button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map(activity => (
          <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <div className="flex justify-between items-start mb-4">
               <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${activity.color}`}>
                 {activity.durationMinutes} min
               </span>
               <div className="flex space-x-1">
                 <button onClick={() => { setCurrentActivity(activity); setIsEditing(true); }} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Edit2 size={16}/></button>
                 <button onClick={() => handleDelete(activity.id)} className="p-1 hover:bg-gray-100 rounded text-red-600"><Trash2 size={16}/></button>
               </div>
             </div>
             
             <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.title}</h3>
             <p className="text-gray-500 text-sm mb-4 line-clamp-2">{activity.description}</p>
             
             <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
               <div className="flex items-center">
                 <span className="font-bold text-lg text-slate-900 mr-1">${activity.price}</span>
                 <span>/ person</span>
               </div>
               <div className="flex items-center" title={`${activity.assignedStaffIds.length} staff members qualified`}>
                 <Users size={16} className="mr-1" />
                 <span>{activity.assignedStaffIds.length} staff</span>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivitiesPage;
