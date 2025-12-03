import React, { useEffect, useState } from 'react';
import { MockDB } from '../../services/storage';
import { Ticket, TicketCategory } from '../../types';
import { Button } from '../../components/ui/Button';
import { Trash2, Edit2, Plus } from 'lucide-react';

const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Partial<Ticket>>({});

  useEffect(() => {
    setTickets(MockDB.getTickets());
  }, []);

  const handleSave = () => {
    if (!currentTicket.title || !currentTicket.price) return;
    
    const newTicket = {
      id: currentTicket.id || Date.now().toString(),
      title: currentTicket.title,
      description: currentTicket.description || '',
      price: Number(currentTicket.price),
      category: currentTicket.category || TicketCategory.ADULT
    } as Ticket;

    MockDB.saveTicket(newTicket);
    setTickets(MockDB.getTickets());
    setIsEditing(false);
    setCurrentTicket({});
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Delete this ticket type?')) {
        MockDB.deleteTicket(id);
        setTickets(MockDB.getTickets());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Ticket Management</h1>
        <Button onClick={() => { setCurrentTicket({}); setIsEditing(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Ticket
        </Button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl border shadow-sm mb-6 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">{currentTicket.id ? 'Edit Ticket' : 'New Ticket'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input 
                className="w-full border p-2 rounded" 
                value={currentTicket.title || ''} 
                onChange={e => setCurrentTicket({...currentTicket, title: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price ($)</label>
              <input 
                type="number"
                className="w-full border p-2 rounded" 
                value={currentTicket.price || ''} 
                onChange={e => setCurrentTicket({...currentTicket, price: Number(e.target.value)})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select 
                className="w-full border p-2 rounded"
                value={currentTicket.category || TicketCategory.ADULT}
                onChange={e => setCurrentTicket({...currentTicket, category: e.target.value as TicketCategory})}
              >
                {Object.values(TicketCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                className="w-full border p-2 rounded" 
                rows={3}
                value={currentTicket.description || ''} 
                onChange={e => setCurrentTicket({...currentTicket, description: e.target.value})} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Ticket</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                    <div className="text-sm text-gray-500">{ticket.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {ticket.category}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${ticket.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => { setCurrentTicket(ticket); setIsEditing(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(ticket.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tickets;