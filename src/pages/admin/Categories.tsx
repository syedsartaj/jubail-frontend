
import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { ActivityCategory } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2, Edit2, Layers, FolderOpen } from 'lucide-react';
import { ApiService } from '../../services/api';
import { Activity } from '../../types';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<ActivityCategory>>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   setCategories(MockDB.getCategories());
  // }, []);

  // const handleSave = () => {
  //   if (!currentCategory.name) return;

  //   const newCategory: ActivityCategory = {
  //     id: currentCategory.id || `cat_${Date.now()}`,
  //     name: currentCategory.name,
  //     description: currentCategory.description || ''
  //   };

  //   MockDB.saveCategory(newCategory);
  //   setCategories(MockDB.getCategories());
  //   setIsEditing(false);
  //   setCurrentCategory({});
  // };

  // const handleDelete = (id: string) => {
  //   // Check if activities are using this category
  //   const activities = MockDB.getActivities();
  //   const inUse = activities.some(a => a.categoryId === id);
    
  //   if (inUse) {
  //     alert("Cannot delete this category because active activities are assigned to it.");
  //     return;
  //   }

  //   if (confirm('Delete this category?')) {
  //     MockDB.deleteCategory(id);
  //     setCategories(MockDB.getCategories());
  //   }
  // };

  // ✅ Load from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, acts] = await Promise.all([
        ApiService.getCategories(),
        ApiService.getActivities()
      ]);
      setCategories(cats);
      setActivities(acts);
    } catch (err) {
      console.error(err);
      alert('Failed to load categories');
    }
  };

  // ✅ Save to MongoDB
  const handleSave = async () => {
    if (!currentCategory.name) return;

    try {
      setLoading(true);

      await ApiService.saveCategory({
        name: currentCategory.name,
        description: currentCategory.description || ''
      });

      setIsEditing(false);
      setCurrentCategory({});
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Safe Delete with Activity Check
  const handleDelete = async (id: string) => {
    const inUse = activities.some(a => a.categoryId === id);

    if (inUse) {
      alert('Cannot delete this category because active activities are assigned to it.');
      return;
    }

    if (!confirm('Delete this category?')) return;

    try {
      await ApiService.deleteCategory(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Categories</h1>
          <p className="text-gray-500">Organize your adventures into logical groups.</p>
        </div>
        <Button onClick={() => { setCurrentCategory({}); setIsEditing(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Category
        </Button>
      </div>

      {isEditing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">{currentCategory.id ? 'Edit Category' : 'Create Category'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
              <input 
                className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500" 
                value={currentCategory.name || ''} 
                onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})}
                placeholder="e.g. Water Sports"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
              <input 
                className="w-full border-slate-400 bg-white border rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500" 
                value={currentCategory.description || ''} 
                onChange={e => setCurrentCategory({...currentCategory, description: e.target.value})}
                placeholder="Short description for customers"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Category</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:border-indigo-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                <FolderOpen size={24} />
              </div>
              <div className="flex space-x-1">
                <button onClick={() => { setCurrentCategory(cat); setIsEditing(true); }} className="p-2 hover:bg-gray-100 rounded text-gray-600"><Edit2 size={16}/></button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-gray-100 rounded text-red-600"><Trash2 size={16}/></button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{cat.name}</h3>
            <p className="text-gray-500 text-sm">{cat.description || 'No description provided.'}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-400">
              <Layers size={14} className="mr-1"/> ID: {cat.id}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
            No categories found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
