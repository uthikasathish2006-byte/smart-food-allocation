import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Server,
  Save,
  CheckCircle2,
  Wheat,
  Thermometer,
  ShieldCheck,
} from 'lucide-react';
import { mockAdminConfig } from '../services/mockData';
import { Button } from '../components/Button';

export const Admin = () => {
  const [config, setConfig] = useState(mockAdminConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleWeightChange = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      algorithmWeights: {
        ...prev.algorithmWeights,
        [key]: Number(value),
      },
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-600" />
            System Administration & Algorithm Tuning
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Fine-tune the multi-objective heuristic weights of the Smart Food Allocation engine and safety cutoffs.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Save}
          onClick={handleSave}
          className="self-start sm:self-auto"
        >
          Save Parameters
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          Optimization heuristic parameters saved and broadcasted to active matching worker nodes!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Algorithm Weights Tuning */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Multi-Objective Matching Heuristics
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              The allocation engine computes the final match score based on these weighted objectives:
            </p>

            {/* Slider 1: Urgency Priority */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-800">1. Shelter Hunger Urgency Weight</span>
                <span className="text-emerald-700 font-extrabold">{config.algorithmWeights.urgencyPriority}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                value={config.algorithmWeights.urgencyPriority}
                onChange={(e) => handleWeightChange('urgencyPriority', e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block font-medium">
                Prioritizes critical relief needs with zero delay.
              </span>
            </div>

            {/* Slider 2: Shelf Life Decay */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-800">2. Food Perishability & Shelf Life Decay</span>
                <span className="text-cyan-700 font-extrabold">{config.algorithmWeights.shelfLifeDecay}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                value={config.algorithmWeights.shelfLifeDecay}
                onChange={(e) => handleWeightChange('shelfLifeDecay', e.target.value)}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block font-medium">
                Accelerates matches for hot cooked meals and short-expiry produce.
              </span>
            </div>

            {/* Slider 3: Distance Minimization */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-800">3. Distance & Fuel Minimization Penalty</span>
                <span className="text-amber-700 font-extrabold">{config.algorithmWeights.distanceMinimization}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={config.algorithmWeights.distanceMinimization}
                onChange={(e) => handleWeightChange('distanceMinimization', e.target.value)}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block font-medium">
                Penalizes cross-town trips to reduce vehicle carbon footprint and transit time.
              </span>
            </div>
          </div>

          {/* Thresholds */}
          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-600" />
              Safety & Autonomous Dispatch Thresholds
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="text-slate-700 font-bold block mb-1">
                  Cold-Chain Safety Cutoff (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.temperatureSafetyLimit}
                  onChange={(e) => setConfig({ ...config, temperatureSafetyLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold text-sm focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                  Vehicles above this trigger instant cold-chain alarm
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="text-slate-700 font-bold block mb-1">
                  Auto-Dispatch Score Threshold (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={config.autoDispatchThresholdScore}
                  onChange={(e) => setConfig({ ...config, autoDispatchThresholdScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold text-sm focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                  Pairs above this score can be dispatched without manual review
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: API & Service Health */}
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-600" />
              <h2 className="text-sm font-bold text-slate-900">System Infrastructure</h2>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Express API Service</div>
                  <div className="text-[11px] text-slate-500">http://localhost:5000/api</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Ready
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">PostgreSQL Relational DB</div>
                  <div className="text-[11px] text-slate-500">localhost:5432 (smart_food_db)</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Schema Configured
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Frontend Client</div>
                  <div className="text-[11px] text-slate-500">React 19 + Vite 6 + Tailwind 4</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-cyan-50/40 to-emerald-50/50 border border-slate-200/90 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-cyan-800 font-bold">
              <Wheat className="w-5 h-5 text-cyan-600" />
              <h2 className="text-sm font-bold text-slate-900">SDG 2 Impact Milestone</h2>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Hackathon target goal: rescue and deliver 50,000 meals through optimized distribution.
            </p>
            <div className="pt-2">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-500">Progress</span>
                <span className="text-emerald-700">32,900 / 50,000 (65.8%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 w-[65.8%] rounded-full shadow-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
