import React, { useState } from 'react';
import {
  HeartHandshake,
  Plus,
  Search,
  Clock,
  Users,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { mockDemand } from '../services/mockData';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

export const Demand = () => {
  const [demandList, setDemandList] = useState(mockDemand || []);
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    recipient: '',
    beneficiaries: '',
    urgency: 'High',
    neededBy: 'Today, 20:00',
    preferredCategory: 'Prepared Meals',
    dietaryRestrictions: 'Standard',
  });

  const filteredDemand = demandList.filter((item) => {
    const matchesUrgency =
      urgencyFilter === 'ALL' || item.urgency.toUpperCase() === urgencyFilter;
    const matchesSearch =
      item.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.preferredCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dietaryRestrictions.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesUrgency && matchesSearch;
  });

  const handleCreateRequest = (e) => {
    e.preventDefault();
    const newReq = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      recipient: formData.recipient || 'Community Aid Center',
      recipientType: 'Relief Shelter',
      beneficiaries: Number(formData.beneficiaries) || 120,
      urgency: formData.urgency,
      neededBy: formData.neededBy,
      preferredCategory: formData.preferredCategory,
      dietaryRestrictions: formData.dietaryRestrictions,
      distanceKm: 4.0,
      status: 'Pending Match',
    };
    setDemandList([newReq, ...demandList]);
    setShowModal(false);
    setFormData({
      recipient: '',
      beneficiaries: '',
      urgency: 'High',
      neededBy: 'Today, 20:00',
      preferredCategory: 'Prepared Meals',
      dietaryRestrictions: 'Standard',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-amber-600" />
            Shelter & Community Demand
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Real-time hunger relief requests, priority urgency scores, and dietary requirement tracking.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto"
        >
          Submit Food Aid Request
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by shelter name, requested items, or dietary needs..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((level) => (
            <button
              key={level}
              onClick={() => setUrgencyFilter(level)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                urgencyFilter === level
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
              }`}
            >
              {level === 'ALL' ? 'All Demands' : `${level} Urgency`}
            </button>
          ))}
        </div>
      </div>

      {/* Demand Cards List */}
      {filteredDemand.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No Demand Requests Found"
          description="There are currently no relief demand requests matching your criteria."
          actionLabel="Create Food Request"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDemand.map((dem) => {
            const isCritical = dem.urgency === 'Critical';
            const isHigh = dem.urgency === 'High';

            return (
              <div
                key={dem.id}
                className={`p-5 rounded-2xl bg-white/90 backdrop-blur-md border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isCritical
                    ? 'border-rose-300 hover:border-rose-400 bg-rose-50/20'
                    : 'border-slate-200/90 hover:border-cyan-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {dem.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        isCritical
                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          : isHigh
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <ShieldAlert className="w-3 h-3" />
                      {dem.urgency} Urgency
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-0.5">
                    {dem.recipient}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {dem.recipientType} &bull; <span className="text-slate-800 font-bold">{dem.distanceKm} km away</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block font-semibold uppercase">People In Need</span>
                      <span className="text-base font-extrabold text-amber-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {dem.beneficiaries}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block font-semibold uppercase">Required By</span>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {dem.neededBy}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Preferred Food:</span>
                      <span className="font-bold text-slate-800">{dem.preferredCategory}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Dietary Profile:</span>
                      <span className="text-slate-700 font-semibold">{dem.dietaryRestrictions}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      dem.status === 'Matched'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    Status: {dem.status}
                  </span>

                  <Link
                    to="/allocation"
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                    Auto-Allocate <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Submit Relief Demand Request"
        subtitle="Signal community food shortage and dietary constraints to the optimization engine"
        icon={HeartHandshake}
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-bold block mb-1">Shelter / Organization Name</label>
            <input
              type="text"
              required
              placeholder="e.g. St. Jude Relief Kitchen"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Beneficiaries (Individuals)</label>
              <input
                type="number"
                required
                placeholder="150"
                value={formData.beneficiaries}
                onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Urgency Level</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Preferred Food Category</label>
              <input
                type="text"
                required
                placeholder="e.g. Prepared Meals, Dairy"
                value={formData.preferredCategory}
                onChange={(e) => setFormData({ ...formData, preferredCategory: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Needed By Time</label>
              <input
                type="text"
                required
                placeholder="Today, 20:30"
                value={formData.neededBy}
                onChange={(e) => setFormData({ ...formData, neededBy: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Dietary Restrictions</label>
            <input
              type="text"
              placeholder="e.g. Halal, Gluten-Free, No Peanuts"
              value={formData.dietaryRestrictions}
              onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Demand;
