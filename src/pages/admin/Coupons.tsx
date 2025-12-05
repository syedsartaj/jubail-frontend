
import React, { useEffect, useState } from 'react';
import { Coupon, DiscountType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2, Tag, Check, X } from 'lucide-react';
import { ApiService } from '../../services/api';

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    type: DiscountType.PERCENT,
    value: 0,
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  // ✅ Load coupons from API
  const loadCoupons = async () => {
    try {
      const data = await ApiService.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load coupons');
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // ✅ Save new coupon to MongoDB
  const handleSave = async () => {
    if (!newCoupon.code || !newCoupon.value) return;

    try {
      setLoading(true);

      await ApiService.saveCoupon({
        code: newCoupon.code.toUpperCase(),
        type: newCoupon.type || DiscountType.PERCENT,
        value: Number(newCoupon.value),
        isActive: newCoupon.isActive ?? true,
      });

      setIsCreating(false);
      setNewCoupon({ code: '', type: DiscountType.PERCENT, value: 0, isActive: true });
      await loadCoupons();
    } catch (err) {
      console.error(err);
      alert('Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete coupon from MongoDB
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;

    try {
      await ApiService.deleteCoupon(id);
      await loadCoupons();
    } catch (err) {
      console.error(err);
      alert('Failed to delete coupon');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coupon Management</h1>
          <p className="text-gray-500">Create discount codes for customers.</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Coupon
        </Button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">New Coupon</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Code</label>
              <input 
                className="w-full border-slate-400 bg-white border rounded-lg p-2.5 uppercase"
                placeholder="e.g. SUMMER25"
                value={newCoupon.code}
                onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Discount Type</label>
              <select 
                className="w-full border-slate-400 bg-white border rounded-lg p-2.5"
                value={newCoupon.type}
                onChange={e => setNewCoupon({...newCoupon, type: e.target.value as DiscountType})}
              >
                <option value={DiscountType.PERCENT}>Percentage (%)</option>
                <option value={DiscountType.FIXED}>Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Value</label>
              <input 
                type="number"
                className="w-full border-slate-400 bg-white border rounded-lg p-2.5"
                placeholder="10"
                value={newCoupon.value}
                onChange={e => setNewCoupon({...newCoupon, value: Number(e.target.value)})}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">Save</Button>
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <div key={coupon.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-center relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${coupon.isActive ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span className="font-mono font-bold text-xl text-slate-900">{coupon.code}</span>
              </div>
              <p className="text-gray-600">
                {coupon.type === DiscountType.PERCENT ? `${coupon.value}% Off` : `$${coupon.value} Off`}
              </p>
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(coupon.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
            No active coupons found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;
