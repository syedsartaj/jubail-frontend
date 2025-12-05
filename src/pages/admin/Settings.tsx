
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Save, AlertCircle, Percent } from 'lucide-react';


const Settings: React.FC = () => {
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch current settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
      const res = await fetch('http://localhost:5000/api/system-settings'); 
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
              setTaxPercentage(data.taxPercentage);
      } catch (err) {
        console.error(err);
        alert('Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

    useEffect(() => {
    const fetchSettings = async () => {
      try {
      const res = await fetch('http://localhost:5000/api/system-settings'); 
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
              setTaxPercentage(data.data.taxPercentage);
      } catch (err) {
        console.error(err);
        alert('Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
const saveRes = await fetch('http://localhost:5000/api/system-settings', {
  method: 'PUT', // must match Express
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ taxPercentage }),
});
if (!saveRes.ok) throw new Error('Failed to save settings');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    }
  };
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-gray-500">Manage global configurations for the booking platform.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
          <Percent className="w-5 h-5 mr-2 text-indigo-600" /> Billing & Taxes
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Tax Percentage (%)
            </label>
            <p className="text-sm text-gray-500 mb-2">
              This percentage will be added to the subtotal of all new bookings at checkout.
            </p>
            <div className="relative max-w-xs">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(Number(e.target.value))}
                className="w-full border-slate-400 bg-white border rounded-lg p-2.5 pr-8 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-bold"
              />
              <span className="absolute right-3 top-2.5 text-gray-500 font-bold">%</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 text-sm text-blue-800">
             <AlertCircle className="w-5 h-5 flex-shrink-0" />
             <p>Changing the tax rate will only affect <strong>future bookings</strong>. Existing bookings and invoices will remain unchanged.</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <Button onClick={handleSave} className="flex items-center">
            {isSaved ? 'Saved Successfully!' : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
