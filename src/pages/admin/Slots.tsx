import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { ActivitySlot, Staff, Activity, ActivityCategory, RecurrencePattern, ScheduleRule } from '../../types';
import { Button } from '../../components/ui/Button';
import { Calendar, User, Clock, Plus, Edit2, Trash2, X, Wand2, AlertCircle, RefreshCw, FolderOpen, ChevronLeft, ChevronRight, CheckSquare, Square, Repeat, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 8; 

const Slots: React.FC = () => {
  // View State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data
  const [allSlots, setAllSlots] = useState<ActivitySlot[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Tab State
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeActivity, setActiveActivity] = useState<string>('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoFillOpen, setIsAutoFillOpen] = useState(false);

  // Form States
  const [currentSlot, setCurrentSlot] = useState<Partial<ActivitySlot>>({});
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  
  // Rule Generator State
  const [ruleStart, setRuleStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recurrenceType, setRecurrenceType] = useState<RecurrencePattern>(RecurrencePattern.DAILY);
  const [customDays, setCustomDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  
  // Replication Logic
  const [replicationMode, setReplicationMode] = useState<'RANGE' | 'DURATION'>('RANGE');
  const [ruleEnd, setRuleEnd] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  );
  const [durationValue, setDurationValue] = useState<number>(3);
  const [durationUnit, setDurationUnit] = useState<'MONTHS' | 'YEARS' | 'WEEKS'>('MONTHS');

  const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // 1. Load Core Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [acts, cats, staff] = await Promise.all([
          ApiService.getActivities(),
          ApiService.getCategories(),
          ApiService.getStaff()
        ]);
        
        setActivities(acts);
        setCategories(cats);
        setStaffList(staff);

        if (cats.length > 0 && !activeCategory) {
            setActiveCategory(cats[0].id || cats[0]._id || '');
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Update Activity Tab
  useEffect(() => {
    if (activeCategory) {
        const catActs = activities.filter(a => (a.categoryId === activeCategory));
        if (catActs.length > 0) {
            setActiveActivity(catActs[0].id || catActs[0]._id || '');
        } else {
            setActiveActivity('');
        }
        setCurrentPage(1); 
    }
  }, [activeCategory, activities]);

  // 2. Load Slots
  useEffect(() => {
    refreshSlots();
  }, [selectedDate]);

  const refreshSlots = async () => {
    try {
      setIsLoading(true);
      const daySlots = await ApiService.getSlots(selectedDate);
      const sorted = daySlots.sort((a: ActivitySlot, b: ActivitySlot) => 
        a.startTime.localeCompare(b.startTime)
      );
      setAllSlots(sorted);
    } catch (err) {
      console.error("Failed to load slots", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- DERIVED DATA ---
  const currentCategoryActivities = activities.filter(a => a.categoryId === activeCategory);
  const currentSlots = allSlots.filter(s => (s.activityId === activeActivity));
  
  const totalPages = Math.ceil(currentSlots.length / ITEMS_PER_PAGE);
  const paginatedSlots = currentSlots.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // --- HELPERS ---
  const getStaffNames = (ids: string[]) => {
    const names = ids.map(id => staffList.find(s => (s.id === id || s._id === id))?.name).filter(Boolean);
    if (names.length === 0) return 'Unassigned';
    if (names.length === 1) return names[0];
    return `${names[0]} +${names.length - 1}`;
  };

  const toggleCustomDay = (day: string) => {
    setCustomDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Define toggleStaffSelection HERE in the component scope so it's accessible
  const toggleStaffSelection = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSlot({});
    setSelectedStaffIds([]);
  };

  // --- SAVE LOGIC ---
  const handleSaveRule = async () => {
    if (!ruleStart) return;
    setIsLoading(true);
    let calculatedEndDate = ruleEnd;

    if (replicationMode === 'DURATION') {
        const start = new Date(ruleStart);
        if (durationUnit === 'WEEKS') start.setDate(start.getDate() + (durationValue * 7));
        if (durationUnit === 'MONTHS') start.setMonth(start.getMonth() + durationValue);
        if (durationUnit === 'YEARS') start.setFullYear(start.getFullYear() + durationValue);
        calculatedEndDate = start.toISOString().split('T')[0];
    }
    
    const newRules: ScheduleRule[] = [];

    activities.forEach(activity => {
        const qualifiedStaff = staffList.filter(s => activity.assignedStaffIds.includes(s.id || s._id || ''));
        if (qualifiedStaff.length === 0) return;

        const rule: ScheduleRule = {
            activityId: activity.id || activity._id || '',
            staffIds: qualifiedStaff.map(s => s.id || s._id || ''),
            startDate: ruleStart,
            endDate: calculatedEndDate,
            startTime: "09:00",
            endTime: "17:00",
            pattern: recurrenceType,
            customDays: recurrenceType === RecurrencePattern.CUSTOM ? customDays : undefined,
            price: activity.price,
            capacity: activity.capacityPerSlot
        };
        newRules.push(rule);
    });

    try {
        await Promise.all(newRules.map(r => ApiService.saveScheduleRule(r)));
        await refreshSlots();
        setIsAutoFillOpen(false);
        alert(`Success! Created recurring schedules for ${newRules.length} activities.`);
    } catch (err) {
        alert("Failed to save rules to server.");
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveSlot = async () => {
    if (!currentSlot.activityId || !currentSlot.startTime || !currentSlot.endTime) {
      alert("Please fill all required fields.");
      return;
    }

    const newSlot: any = {
      ...(currentSlot.id ? { id: currentSlot.id } : {}),
      ...(currentSlot._id ? { _id: currentSlot._id } : {}),
      activityId: currentSlot.activityId,
      staffIds: selectedStaffIds,
      date: currentSlot.date || selectedDate,
      startTime: currentSlot.startTime,
      endTime: currentSlot.endTime,
      price: Number(currentSlot.price),
      capacity: Number(currentSlot.capacity),
      bookedCount: currentSlot.bookedCount || 0
    };

    try {
      setIsLoading(true);
      await ApiService.saveSlot(newSlot);
      await refreshSlots();
      closeModal();
    } catch (err) {
      alert("Failed to save slot.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (confirm("Delete this slot?")) {
      try {
        setIsLoading(true);
        await ApiService.deleteSlot(id);
        await refreshSlots();
      } catch (err) {
        alert("Failed to delete slot.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openModal = (slot?: ActivitySlot) => {
    if (slot) {
      setCurrentSlot(slot);
      setSelectedStaffIds(slot.staffIds || []);
    } else {
      setCurrentSlot({
        date: selectedDate,
        startTime: '09:00',
        endTime: '10:00',
        capacity: 10,
        price: 0,
        activityId: activeActivity
      });
      setSelectedStaffIds([]);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Schedule Management</h1>
              <p className="text-gray-500 text-sm">Create recurring rules or manage individual slots.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                    <span className="text-xs font-bold text-gray-500 pl-2 uppercase tracking-wider">View Date:</span>
                    <input 
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="bg-white border-none text-sm focus:ring-0 rounded-md py-1 text-slate-800 font-medium cursor-pointer"
                    />
                </div>
                
                <div className="h-8 w-px bg-gray-300 mx-1 hidden md:block"></div>

                <Button variant="secondary" onClick={() => setIsAutoFillOpen(true)} className="flex items-center gap-2 text-sm" disabled={isLoading}>
                    <Wand2 size={16} /> New Schedule Rule
                </Button>
                
                <Button onClick={() => openModal()} className="flex items-center gap-2 text-sm" disabled={isLoading}>
                    <Plus size={16} /> Add Single Slot
                </Button>
            </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
                <button
                    key={cat.id || cat._id}
                    onClick={() => setActiveCategory(cat.id || cat._id || '')}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                        activeCategory === (cat.id || cat._id)
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FolderOpen size={16} /> {cat.name}
                </button>
            ))}
        </div>

        {activeCategory && (
            <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar">
                {currentCategoryActivities.map(act => (
                    <button
                        key={act.id || act._id}
                        onClick={() => setActiveActivity(act.id || act._id || '')}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                            activeActivity === (act.id || act._id)
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                    >
                        {act.title}
                    </button>
                ))}
            </div>
        )}

        {/* SLOT GRID */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 min-h-[400px]">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Loader2 size={48} className="mb-4 animate-spin text-indigo-500" />
                    <p>Loading schedule...</p>
                </div>
            ) : !activeActivity ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p>Select an Activity to view slots.</p>
                </div>
            ) : paginatedSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Calendar size={48} className="mb-4 opacity-50" />
                    <p>No slots found on {selectedDate}.</p>
                    <p className="text-xs mt-1">If you created a Rule, check if this date matches the pattern.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedSlots.map(slot => {
                        const activity = activities.find(a => (a.id === slot.activityId || a._id === slot.activityId));
                        const staffNames = getStaffNames(slot.staffIds || []);
                        if (!activity) return null;

                        return (
                            <div key={slot.id || slot._id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 relative group hover:border-indigo-300 transition-all">
                                {slot.isGenerated && (
                                    <div className="absolute top-0 right-0 bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold">
                                        AUTO
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center text-sm font-bold text-slate-800">
                                        <Clock size={14} className="mr-1.5 text-gray-400" />
                                        {slot.startTime} - {slot.endTime}
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">${slot.price}</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mb-3 bg-gray-50 p-1.5 rounded border border-gray-100">
                                    <User size={12} className="mr-1.5 text-indigo-400 shrink-0" />
                                    <span className="truncate" title={staffNames}>{staffNames}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                        <span>Capacity</span>
                                        <span>{slot.bookedCount} / {slot.capacity}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full ${slot.bookedCount >= slot.capacity ? 'bg-red-500' : 'bg-teal-500'}`} style={{ width: `${Math.min((slot.bookedCount/slot.capacity)*100, 100)}%` }}></div>
                                    </div>
                                </div>
                                {!slot.isGenerated && (
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 bg-white shadow-sm p-1 rounded-md">
                                        <button onClick={() => handleDeleteSlot(slot.id || slot._id || '')} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><ChevronLeft size={16} /></Button>
                <span className="text-sm font-medium text-gray-600">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight size={16} /></Button>
            </div>
        )}

        {/* --- SCHEDULE GENERATOR MODAL --- */}
        {isAutoFillOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in transform transition-all scale-100">
                    <div className="p-6 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold flex items-center gap-2"><RefreshCw size={20}/> Schedule Rule Generator</h3>
                            <button onClick={() => setIsAutoFillOpen(false)} className="text-teal-100 hover:text-white"><X size={20}/></button>
                        </div>
                        <p className="text-teal-100 text-sm mt-2 opacity-90">Define patterns (Weekdays, Monthly) to auto-generate slots.</p>
                    </div>
                    
                    <div className="p-6 space-y-5">
                        {/* 1. Recurrence Pattern */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. Weekday / Weekend Rules</label>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {[
                                    { id: RecurrencePattern.DAILY, label: 'Daily (All Week)' },
                                    { id: RecurrencePattern.WEEKDAYS, label: 'Weekdays Only (Mon-Fri)' },
                                    { id: RecurrencePattern.WEEKENDS, label: 'Weekends Only (Sat-Sun)' },
                                    { id: RecurrencePattern.CUSTOM, label: 'Custom Days' }
                                ].map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => setRecurrenceType(p.id)}
                                        className={`py-2 text-sm border rounded-lg transition-all ${recurrenceType === p.id ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold ring-1 ring-teal-500' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            {recurrenceType === RecurrencePattern.CUSTOM && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 grid grid-cols-3 gap-2">
                                    {WEEK_DAYS.map(day => (
                                        <div key={day} onClick={() => toggleCustomDay(day)} className={`cursor-pointer flex items-center gap-2 p-2 rounded border text-xs font-medium ${customDays.includes(day) ? 'bg-teal-100 border-teal-300 text-teal-800' : 'bg-white border-gray-200'}`}>
                                            {customDays.includes(day) ? <CheckSquare size={14}/> : <Square size={14}/>} {day.substring(0,3)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Start Date */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">2. Start From</label>
                            <input type="date" value={ruleStart} onChange={e => setRuleStart(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>

                        {/* 3. Replication Logic */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. Replication Duration</label>
                            <div className="flex gap-4 mb-3 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="repMode" checked={replicationMode === 'DURATION'} onChange={() => setReplicationMode('DURATION')} className="text-teal-600 focus:ring-teal-500" />
                                    <span>By Duration (Months/Years)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="repMode" checked={replicationMode === 'RANGE'} onChange={() => setReplicationMode('RANGE')} className="text-teal-600 focus:ring-teal-500" />
                                    <span>Specific End Date</span>
                                </label>
                            </div>

                            {replicationMode === 'DURATION' ? (
                                <div className="flex gap-2">
                                    <input type="number" min="1" max="24" value={durationValue} onChange={e => setDurationValue(Number(e.target.value))} className="w-20 border border-gray-300 rounded-lg p-2 text-center" />
                                    <select value={durationUnit} onChange={e => setDurationUnit(e.target.value as any)} className="flex-1 border border-gray-300 rounded-lg p-2">
                                        <option value="WEEKS">Weeks</option>
                                        <option value="MONTHS">Months</option>
                                        <option value="YEARS">Years</option>
                                    </select>
                                </div>
                            ) : (
                                <input type="date" value={ruleEnd} onChange={e => setRuleEnd(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                            )}
                        </div>
                    </div>
                    
                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsAutoFillOpen(false)}>Cancel</Button>
                        <Button variant="secondary" onClick={handleSaveRule} className="shadow-sm" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin mr-2" size={16}/> : <Repeat size={16} className="mr-2" />} 
                            Save Rule & Generate
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* --- ADD/EDIT SLOT MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-slate-900">{currentSlot.id ? 'Edit Slot' : 'Add New Slot'}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Activity Type</label>
                  <select 
                    className="w-full border-slate-300 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={currentSlot.activityId || ''}
                    onChange={e => {
                      const act = activities.find(a => (a.id === e.target.value || a._id === e.target.value));
                      setCurrentSlot({
                        ...currentSlot, 
                        activityId: e.target.value,
                        price: act?.price || 0,
                        capacity: act?.capacityPerSlot || 10
                      });
                    }}
                  >
                    <option value="">Select Activity...</option>
                    {activities.map(a => <option key={a.id || a._id} value={a.id || a._id}>{a.title} ({a.durationMinutes} min)</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Start Time</label>
                    <input 
                      type="time" 
                      className="w-full border-slate-300 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      value={currentSlot.startTime || ''}
                      onChange={e => setCurrentSlot({...currentSlot, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">End Time</label>
                    <input 
                      type="time" 
                      className="w-full border-slate-300 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full border-slate-300 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      value={currentSlot.price || 0}
                      onChange={e => setCurrentSlot({...currentSlot, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Capacity</label>
                    <input 
                      type="number" 
                      className="w-full border-slate-300 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      value={currentSlot.capacity || 0}
                      onChange={e => setCurrentSlot({...currentSlot, capacity: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Assign Staff</label>
                   <div className="border border-slate-300 rounded-lg p-1 max-h-48 overflow-y-auto bg-slate-50">
                     {staffList.length === 0 && <p className="text-gray-500 text-sm p-3">No staff found.</p>}
                     {staffList.map(staff => (
                       <label key={staff.id || staff._id} className="flex items-center space-x-3 p-3 hover:bg-white rounded cursor-pointer transition-colors border-b border-transparent hover:border-gray-100">
                         <input 
                           type="checkbox" 
                           className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300"
                           checked={selectedStaffIds.includes(staff.id || staff._id || '')}
                           onChange={() => toggleStaffSelection(staff.id || staff._id || '')}
                         />
                         <div>
                            <div className="text-sm font-medium text-slate-800">{staff.name}</div>
                            <div className="text-xs text-gray-500">{staff.role}</div>
                         </div>
                       </label>
                     ))}
                   </div>
                   <p className="text-xs text-gray-500 mt-2">Multiple staff can be assigned to a single large slot.</p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button onClick={handleSaveSlot}>Save</Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Slots;