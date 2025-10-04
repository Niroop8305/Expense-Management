import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/*
  WorkflowBuilder Page (Admin Only)
  Features:
   - List existing workflows for the company
   - Create new workflow with ordered steps (roles)
   - Configure optional conditional rules (percentage / specific / hybrid / none)
   - Persist via backend POST /api/workflows
*/

const BASE_ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'finance', label: 'Finance' },
  { value: 'director', label: 'Director' },
  { value: 'admin', label: 'Admin' },
];

const WorkflowBuilder = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // dynamic approver roles fetched from backend (excluding system roles)
  const [dynamicRoles, setDynamicRoles] = useState([]);

  // Builder state
  const [name, setName] = useState('');
  const [steps, setSteps] = useState([]); // { stepIndex, approverRole }
  const [ruleType, setRuleType] = useState('none');
  const [percentage, setPercentage] = useState(60);
  const [specialRole, setSpecialRole] = useState('');
  const [companyUsers, setCompanyUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    // Always verify with backend to avoid stale localStorage forcing re-login
    const sync = async () => {
      try {
        const me = await axios.get('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!me.data?.user || me.data.user.role !== 'admin') {
          navigate('/login');
          return;
        }
        setUser(me.data.user);
        localStorage.setItem('user', JSON.stringify(me.data.user));
        fetchWorkflows(token, me.data.user.company.id);
        fetchUsers(token);
        fetchRoles(token);
      } catch (e) {
        navigate('/login');
      }
    };
    sync();
  }, [navigate]);

  const fetchWorkflows = async (token, companyId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/workflows/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkflows(res.data.workflows || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workflows');
    }
  };

  const fetchUsers = async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', { headers: { Authorization: `Bearer ${token}` } });
      const mapped = (res.data.users || []).map(u => ({ id: u._id, name: u.name, role: u.role }));
      setCompanyUsers(mapped);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchRoles = async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/api/roles', { headers: { Authorization: `Bearer ${token}` } });
      const mapped = (res.data.roles || []).filter(r=>!['admin','employee'].includes(r.name)).map(r=>({ value: r.name, label: r.displayName || r.name }));
      setDynamicRoles(mapped);
    } catch (e) { console.error('Failed to fetch roles', e); }
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { stepIndex: prev.length, approverType: 'role', approverRole: 'manager', approverUsers: [], approvalMode: 'any' }]);
  };

  const updateStepRole = (idx, role) => {
    setSteps((prev) => prev.map((s) => (s.stepIndex === idx ? { ...s, approverRole: role } : s)));
  };

  const updateStepType = (idx, type) => {
    setSteps(prev => prev.map(s => s.stepIndex === idx ? { ...s, approverType: type } : s));
  };

  const toggleUserForStep = (idx, userId) => {
    setSteps(prev => prev.map(s => {
      if (s.stepIndex !== idx) return s;
      const exists = s.approverUsers.includes(userId);
      return { ...s, approverUsers: exists ? s.approverUsers.filter(u=>u!==userId) : [...s.approverUsers, userId] };
    }));
  };

  const updateApprovalMode = (idx, mode) => {
    setSteps(prev => prev.map(s => s.stepIndex === idx ? { ...s, approvalMode: mode } : s));
  };

  const removeStep = (idx) => {
    setSteps((prev) => prev.filter((s) => s.stepIndex !== idx).map((s, i) => ({ ...s, stepIndex: i })));
  };

  const moveStep = (idx, dir) => {
    setSteps((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return prev;
      const temp = arr[idx];
      arr[idx] = arr[target];
      arr[target] = temp;
      return arr.map((s, i) => ({ ...s, stepIndex: i }));
    });
  };

  const resetBuilder = () => {
    setName('');
    setSteps([]);
    setRuleType('none');
    setPercentage(60);
    setSpecialRole('');
  };

  const submitWorkflow = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Workflow name required');
      return;
    }
    if (steps.length === 0) {
      setError('At least one step is required');
      return;
    }
    // validate user steps have members
    for (const s of steps) {
      if (s.approverType === 'users' && (!s.approverUsers || s.approverUsers.length === 0)) {
        setError('Each member-based step must include at least one member.');
        return;
      }
    }
    if (ruleType === 'percentage' || ruleType === 'hybrid') {
      if (percentage < 1 || percentage > 100) {
        setError('Percentage must be between 1 and 100');
        return;
      }
    }
    if ((ruleType === 'specificApprover' || ruleType === 'hybrid') && !specialRole) {
      setError('Special role required for this rule type');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
          name: name.trim(),
          steps: steps.map(({ stepIndex, approverType, approverRole, approverUsers, approvalMode }) => ({ stepIndex, approverType, approverRole: approverType==='role'?approverRole:undefined, approverUsers: approverType==='users'?approverUsers:[], approvalMode })),
        rules: {
          type: ruleType,
          percentage: ruleType === 'percentage' || ruleType === 'hybrid' ? Number(percentage) : undefined,
          specialRole: (ruleType === 'specificApprover' || ruleType === 'hybrid') ? specialRole : undefined,
        },
      };
      await axios.post('http://localhost:5000/api/workflows', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Workflow created');
      resetBuilder();
      fetchWorkflows(token, user.company.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  const ruleSummary = () => {
    switch (ruleType) {
      case 'percentage':
        return `Approve when ≥ ${percentage}% of approvers approve.`;
      case 'specificApprover':
        return `Auto-approve when ${specialRole || 'SPECIAL_ROLE'} approves.`;
      case 'hybrid':
        return `Approve when ≥ ${percentage}% OR ${specialRole || 'SPECIAL_ROLE'} approves.`;
      default:
        return 'No conditional rules.';
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflow Builder</h1>
            <p className="text-sm text-gray-600">Company: {user.company.name}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/admin/dashboard')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Back</button>
            <button onClick={() => navigate('/settings')} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Settings</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-2">
        {/* Builder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Create Workflow</h2>
          {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">{error}</div>}
          {success && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded">{success}</div>}
          <form onSubmit={submitWorkflow} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="e.g. Standard Expense Flow" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Steps (after optional Manager pre-approval)</label>
                <button type="button" onClick={addStep} className="text-sm text-blue-600 hover:underline">+ Add Step</button>
              </div>
              {steps.length === 0 && <p className="text-xs text-gray-500">No steps yet. Add at least one.</p>}
              <ul className="space-y-3">
                {steps.map((s, idx) => (
                  <li key={s.stepIndex} className="bg-gray-50 border rounded px-3 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold w-6 text-gray-600">{idx + 1}</span>
                      <select value={s.approverType} onChange={(e)=>updateStepType(s.stepIndex, e.target.value)} className="border rounded px-2 py-1 text-xs">
                        <option value="role">Role</option>
                        <option value="users">Members</option>
                      </select>
                      {s.approverType === 'role' && (
                        <select
                          value={s.approverRole}
                          onChange={(e) => updateStepRole(s.stepIndex, e.target.value)}
                          className="border rounded px-2 py-1 text-sm flex-1"
                        >
                          {[...BASE_ROLE_OPTIONS, ...dynamicRoles].map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      )}
                      {s.approverType === 'users' && (
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1">
                            {companyUsers.map(u => (
                              <button type="button" key={u.id} onClick={()=>toggleUserForStep(s.stepIndex, u.id)} className={`px-2 py-1 text-xs rounded border ${s.approverUsers.includes(u.id) ? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`}>{u.name}</button>
                            ))}
                          </div>
                          <div className="mt-1">
                            <label className="text-[10px] uppercase tracking-wide text-gray-500 mr-1">Mode:</label>
                            <select value={s.approvalMode} onChange={(e)=>updateApprovalMode(s.stepIndex, e.target.value)} className="border rounded px-2 py-1 text-xs">
                              <option value="any">Any</option>
                              <option value="all">All</option>
                            </select>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0} className="px-2 py-1 text-xs border rounded disabled:opacity-30">↑</button>
                        <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1} className="px-2 py-1 text-xs border rounded disabled:opacity-30">↓</button>
                        <button type="button" onClick={() => removeStep(s.stepIndex)} className="px-2 py-1 text-xs border rounded text-red-600">✕</button>
                      </div>
                    </div>
                    {s.approverType === 'users' && s.approverUsers.length === 0 && (
                      <p className="text-[11px] text-red-500">Select at least one member.</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Conditional Rule</label>
              <select value={ruleType} onChange={(e) => setRuleType(e.target.value)} className="border rounded px-3 py-2 w-full">
                <option value="none">None</option>
                <option value="percentage">Percentage</option>
                <option value="specificApprover">Specific Approver</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {(ruleType === 'percentage' || ruleType === 'hybrid') && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Percentage Threshold (%)</label>
                  <input type="number" value={percentage} min={1} max={100} onChange={(e) => setPercentage(e.target.value)} className="border rounded px-2 py-1 w-24" />
                </div>
              )}
              {(ruleType === 'specificApprover' || ruleType === 'hybrid') && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Special Role</label>
                  <select value={specialRole} onChange={(e) => setSpecialRole(e.target.value)} className="border rounded px-2 py-1 w-48">
                    <option value="">-- Select Role --</option>
                    {[...BASE_ROLE_OPTIONS, ...dynamicRoles].map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              )}
              <p className="text-xs text-gray-500 italic">{ruleSummary()}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetBuilder} className="px-4 py-2 border rounded hover:bg-gray-50">Reset</button>
              <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Create Workflow'}</button>
            </div>
          </form>
        </div>

        {/* Existing Workflows */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Existing Workflows</h2>
          {workflows.length === 0 ? (
            <p className="text-sm text-gray-500">No workflows created yet.</p>
          ) : (
            <ul className="space-y-3 max-h-[600px] overflow-auto pr-1">
              {workflows.map(wf => (
                <li key={wf._id} className="border rounded p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{wf.name}</h3>
                      <p className="text-xs text-gray-500">Created {new Date(wf.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Steps:</p>
                    {wf.steps.length === 0 ? (
                      <p className="text-xs text-gray-500">(None)</p>
                    ) : (
                      <ol className="list-decimal ml-5 text-sm space-y-1">
                        {wf.steps
                          .sort((a,b)=>a.stepIndex-b.stepIndex)
                          .map(s => {
                            if (s.approverType === 'users') {
                              return <li key={s._id || s.stepIndex}>Members ({s.approverUsers?.length || 0}) - mode: {s.approvalMode}</li>;
                            }
                            const allRoles = [...BASE_ROLE_OPTIONS, ...dynamicRoles];
                            const roleObj = allRoles.find(r => r.value === s.approverRole);
                            return <li key={s._id || s.stepIndex}>{roleObj ? roleObj.label : s.approverRole}</li>;
                          })}
                      </ol>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Rule:</span> {wf.rules?.type || 'none'}
                    {wf.rules?.type === 'percentage' && ` (≥ ${wf.rules.percentage}%)`}
                    {wf.rules?.type === 'specificApprover' && ` (special: ${wf.rules.specialRole})`}
                    {wf.rules?.type === 'hybrid' && ` (≥ ${wf.rules.percentage}% OR ${wf.rules.specialRole})`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkflowBuilder;
