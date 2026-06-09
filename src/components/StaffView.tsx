import React, { useState } from 'react';
import { Staff } from '../types';
import { Plus, Users, Calendar, Lock, CheckCircle, ShieldAlert, Award, FileText, ArrowLeft, Printer } from 'lucide-react';

interface StaffViewProps {
  staffList: Staff[];
  isPro: boolean;
  onUpdateStaff: (updatedList: Staff[]) => void;
  triggerUpgrade: () => void;
  showToast: (msg: string) => void;
}

export default function StaffView({
  staffList,
  isPro,
  onUpdateStaff,
  triggerUpgrade,
  showToast
}: StaffViewProps) {
  // Navigation: 'list' | 'slip'
  const [viewMode, setViewMode] = useState<'list' | 'slip'>('list');
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState<Staff | null>(null);

  // Form modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Sales Staff');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState<number>(10000);
  const [joiningDate, setJoiningDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Get total days in current month
  const getDaysInCurrentMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  };
  const totalDaysInMonth = getDaysInCurrentMonth();

  const handleOpenAdd = () => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    setName('');
    setRole('Sales Staff');
    setPhone('');
    setSalary(10000);
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setErrors({});
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: { [key: string]: string } = {};

    if (!name.trim()) tempErrors.name = 'Yeh field zaroori hai';
    if (!phone.trim()) tempErrors.phone = 'Yeh field zaroori hai';
    if (salary <= 0) tempErrors.salary = 'Tankhwah 0 se zyada honi chahiye';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const newStaff: Staff = {
      id: 'staff_' + Date.now(),
      name: name.trim(),
      role,
      phone: phone.trim(),
      salary,
      joiningDate,
      status: 'Active',
      attendance: {}
    };

    onUpdateStaff([...staffList, newStaff]);
    showToast('Staff member add ho gaya!');
    setIsAddOpen(false);
  };

  const handleMarkAttendance = (staffId: string, status: 'P' | 'A' | 'H') => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    const updated = staffList.map(emp => {
      if (emp.id === staffId) {
        return {
          ...emp,
          attendance: {
            ...emp.attendance,
            [todayStr]: status
          }
        };
      }
      return emp;
    });

    onUpdateStaff(updated);
    showToast('Hazri lag gayi!');
  };

  // Calculations for Salary Slip
  const calculateSalaryMetrics = (emp: Staff) => {
    const attendanceKeys = Object.keys(emp.attendance);
    // Filter attendance instances that occur in the current month
    const d = new Date();
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const currentMonthKeys = attendanceKeys.filter(k => k.startsWith(prefix));
    
    let daysPresent = 0;
    currentMonthKeys.forEach(day => {
      const mark = emp.attendance[day];
      if (mark === 'P') daysPresent += 1;
      else if (mark === 'H') daysPresent += 0.5;
    });

    // Default to the month's elapsed days or 30 days for calculations if no attendance marked yet
    const workingDaysCount = totalDaysInMonth; 
    const finalDaysCalculated = daysPresent || workingDaysCount; // fallback to complete month if none marked

    const calculatedPay = Math.round((finalDaysCalculated / workingDaysCount) * emp.salary);
    const deductions = emp.salary - calculatedPay;

    return {
      daysPresent: daysPresent || workingDaysCount, // if 0, show fallback full months
      calculatedPay,
      deductions,
      workingDays: workingDaysCount
    };
  };

  const handleViewSlip = (emp: Staff) => {
    setSelectedStaffForSlip(emp);
    setViewMode('slip');
  };

  return (
    <div className="space-y-6">
      
      {/* List / Slip view split */}
      {viewMode === 'list' && (
        <>
          {/* Header Controls */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Staff Management Directory</h3>
            <button
              onClick={handleOpenAdd}
              className={`px-4 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-sm font-semibold shadow-md inline-flex items-center space-x-2 transition-all ${
                !isPro ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
              {!isPro && <Lock className="w-3.5 h-3.5 ml-1" />}
            </button>
          </div>

          {/* Today's Daily Attendance Marker Row */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">
              Daily Attendance - Aaj ki Hazri ({todayStr})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffList.filter(s => s.status === 'Active').map((emp) => {
                const todayAttendance = emp.attendance[todayStr];

                return (
                  <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-lg text-sm transition-all">
                    <div>
                      <p className="font-bold text-gray-800">{emp.name}</p>
                      <p className="text-xxs text-gray-400 capitalize font-medium">{emp.role}</p>
                    </div>

                    <div className="flex space-x-1.5">
                      {(['P', 'A', 'H'] as const).map((code) => {
                        let btnStyle = 'text-gray-400 hover:bg-gray-150 border-gray-200';
                        if (todayAttendance === code) {
                          if (code === 'P') btnStyle = 'bg-emerald-600 border-emerald-600 text-white font-extrabold shadow-sm';
                          if (code === 'A') btnStyle = 'bg-red-650 border-red-650 text-white font-extrabold shadow-sm';
                          if (code === 'H') btnStyle = 'bg-amber-500 border-amber-500 text-white font-extrabold shadow-sm';
                        }
                        
                        return (
                          <button
                            key={code}
                            onClick={() => handleMarkAttendance(emp.id, code)}
                            className={`w-9 py-1 text-xs font-black border rounded-lg transition-all ${btnStyle} ${
                              !isPro ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={code === 'P' ? 'Present (हाजिर)' : code === 'A' ? 'Absent (गैरहाजिर)' : 'Half-day (आधा दिन)'}
                          >
                            {code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff Registry Directory table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-gray-500 font-semibold text-xs tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Fixed Monthly Salary</th>
                    <th className="px-6 py-4 text-center">Joining Date</th>
                    <th className="px-6 py-4 text-center font-bold">Attendance Grid</th>
                    <th className="px-6 py-4 text-center">Payroll slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staffList.length > 0 ? (
                    staffList.map((emp) => {
                      const { daysPresent, calculatedPay } = calculateSalaryMetrics(emp);
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/50 transition-all">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{emp.name}</div>
                            <span className="text-[10px] text-gray-400 font-mono">Ph: {emp.phone}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-tight">{emp.role}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-gray-750">₹{emp.salary.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-center text-xs text-gray-500 font-medium">{emp.joiningDate}</td>
                          <td className="px-6 py-4 text-center">
                            {/* Small rendering grid showing calendar days status indicators list */}
                            <div className="flex items-center justify-center space-x-1">
                              {Array.from({ length: 15 }).map((_, idx) => {
                                const d = new Date();
                                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(idx + 1).padStart(2, '0')}`;
                                const mark = emp.attendance[dateStr];
                                let markerColor = 'bg-gray-200';
                                if (mark === 'P') markerColor = 'bg-emerald-500 text-white font-extrabold';
                                if (mark === 'A') markerColor = 'bg-red-500 text-white font-extrabold';
                                if (mark === 'H') markerColor = 'bg-amber-500 text-white font-extrabold';

                                return (
                                  <span
                                    key={idx}
                                    className={`w-4 h-4 rounded-full text-[7px] flex items-center justify-center font-black ${markerColor}`}
                                    title={`Day ${idx + 1}: ${mark || 'No Hazri'}`}
                                  >
                                    {mark || (idx + 1)}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleViewSlip(emp)}
                              className={`text-xs font-black bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20 text-[#0F6E56] px-3.5 py-1.5 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1 mx-auto ${
                                !isPro ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Salary Slip</span>
                              {!isPro && <Lock className="w-3 h-3 ml-0.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="w-10 h-10 text-gray-300" />
                          <p className="font-semibold text-sm">Koi staff details nahi hai</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SALARY SLIP VIEW PANEL */}
      {viewMode === 'slip' && selectedStaffForSlip && (() => {
        const { daysPresent, calculatedPay, deductions, workingDays } = calculateSalaryMetrics(selectedStaffForSlip);
        return (
          <div className="space-y-6">
            <div className="no-print flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className="text-xs bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 px-3 py-2 rounded-lg transition-all inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Directory</span>
              </button>

              <button
                onClick={() => window.print()}
                className="text-xs bg-[#0F6E56] hover:bg-[#0c5946] text-white font-bold px-4 py-2 rounded-lg shadow-md transition-all inline-flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Salary Slip</span>
              </button>
            </div>

            {/* Slip Paper Card Template */}
            <div id="printable-salary-slip-card" className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-xl mx-auto font-sans">
              <div className="border-b-2 border-[#0F6E56] pb-6 mb-6 text-center">
                <span className="text-xxs bg-[#0F6E56] text-white font-bold px-2 py-0.5 rounded tracking-widest uppercase">SALARY STATEMENT</span>
                <h2 className="text-xl font-bold text-gray-950 mt-2 uppercase tracking-wide">Vedik Enterprises Kirana Outlet Payroll</h2>
                <p className="text-xs text-gray-400 mt-1 italic">Taneesh & Sons Wholesale Trading Enterprise</p>
                <p className="text-xs font-semibold text-[#0F6E56] mt-2">Salay Slip for month: {currentMonthLabel}</p>
              </div>

              {/* Staff Details list */}
              <div className="grid grid-cols-2 gap-4 bg-[#F1EFE8]/30 p-4 rounded-xl border border-gray-100 mb-6 text-xs text-gray-700">
                <div>
                  <p className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Staff Name:</p>
                  <p className="font-extrabold text-sm text-gray-900 mt-1">{selectedStaffForSlip.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium capitalize mt-0.5">{selectedStaffForSlip.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Emp Contact ID:</p>
                  <p className="font-bold text-gray-900 mt-1 text-xs">{selectedStaffForSlip.phone}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Joined: {selectedStaffForSlip.joiningDate}</p>
                </div>
              </div>

              {/* Attendance Breakdown Grid list */}
              <div className="border-t border-b border-gray-100 py-3 mb-6 grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
                  <span className="text-[9px] uppercase font-bold text-gray-400">Days Active</span>
                  <p className="font-black text-emerald-700 font-mono text-base mt-1">{daysPresent}</p>
                </div>
                <div className="bg-red-50/40 p-2 rounded border border-red-100">
                  <span className="text-[9px] uppercase font-bold text-gray-400">Days Unmarked</span>
                  <p className="font-black text-red-600 font-mono text-base mt-1">{workingDays - daysPresent}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-[9px] uppercase font-bold text-gray-400">Total Month Days</span>
                  <p className="font-black text-gray-700 font-mono text-base mt-1">{workingDays}</p>
                </div>
              </div>

              {/* Earnings Details Ledger Table */}
              <div className="space-y-3.5 mb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">Payslip Ledger Breakdown</h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-700 font-medium">
                    <span>Base Monthly Salary:</span>
                    <span className="font-mono font-bold">₹{selectedStaffForSlip.salary}</span>
                  </div>

                  <div className="flex justify-between items-center text-red-650 font-medium">
                    <span>Attendance Deductions (unmarked days):</span>
                    <span className="font-mono">-₹{deductions}</span>
                  </div>

                  <div className="flex justify-between items-center text-gray-700 font-medium">
                    <span>Tax & PF Deductions:</span>
                    <span className="font-mono">₹0</span>
                  </div>

                  <div className="flex justify-between items-center text-[#0F6E56] font-extrabold border-t border-gray-200 pt-3 text-sm">
                    <span>Net Take-home Salary:</span>
                    <span className="font-mono text-base">₹{calculatedPay}</span>
                  </div>
                </div>
              </div>

              {/* Verified Authorised Signature */}
              <div className="pt-8 border-t border-dashed border-gray-200 flex justify-between items-end">
                <div className="text-xxs text-gray-405 italic">
                  <p>Invoices & payroll powered on-device securely</p>
                  <p className="mt-0.5">by Vedik Enterprises Kirana Software Applet 1.0</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-300 w-32 mb-1.5 h-12"></div>
                  <span className="text-[9px] uppercase font-bold text-gray-400">Authorised Signatory</span>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Add Staff Modal */}
      {isAddOpen && (
        <div id="staff-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Add Staff Member (नया कर्मचारी जोड़ें)</h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-gray-650 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Employee Name (कर्मचारी का नाम) *</label>
                <input
                  id="staff-input-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jaise: Suresh Malik..."
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${
                    errors.name ? 'border-red-500' : 'border-gray-200 focus:border-[#0F6E56]'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role (पद)</label>
                <select
                  id="staff-input-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#0F6E56]"
                >
                  <option value="Manager">Manager</option>
                  <option value="Sales Staff">Sales Staff</option>
                  <option value="Delivery Partner">Delivery Partner</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mobile Number *</label>
                <input
                  id="staff-input-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 98xxxxxxxx"
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${
                    errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-[#0F6E56]'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Monthly Salary (महीने की तनख्वाह) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-400">₹</span>
                  <input
                    id="staff-input-salary"
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className={`w-full pl-7 pr-4 py-2 border rounded-lg text-sm outline-none ${
                      errors.salary ? 'border-red-500' : 'border-gray-200 focus:border-[#0F6E56]'
                    }`}
                  />
                </div>
                {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Joining Date</label>
                <input
                  id="staff-input-joining"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0F6E56]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-gray-550 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 pb-2"
                >
                  Radd Karein
                </button>
                <button
                  id="btn-staff-save"
                  type="submit"
                  className="px-5 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Member Add Karein
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
