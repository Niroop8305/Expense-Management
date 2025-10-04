import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ companyName: '', country: 'US', adminName: '', adminEmail: '', adminPassword: '' })
  const [msg, setMsg] = useState(null)

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setMsg(null)
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register-company', form)
      setMsg({ type: 'success', text: res.data.message })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Server error' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Register Company</h1>
        {msg && <div className={`p-2 mb-4 ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{msg.text}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Company Name</label>
            <input name="companyName" value={form.companyName} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Country</label>
            <select name="country" value={form.country} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1">
              <option value="US">United States</option>
              <option value="IN">India</option>
              <option value="GB">United Kingdom</option>
              <option value="EU">Eurozone</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Admin Name</label>
            <input name="adminName" value={form.adminName} onChange={onChange} className="mt-1 block w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Admin Email</label>
            <input name="adminEmail" value={form.adminEmail} onChange={onChange} type="email" className="mt-1 block w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input name="adminPassword" value={form.adminPassword} onChange={onChange} type="password" className="mt-1 block w-full border rounded px-2 py-1" />
          </div>
          <div>
            <button className="w-full bg-blue-600 text-white py-2 rounded">Register</button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
