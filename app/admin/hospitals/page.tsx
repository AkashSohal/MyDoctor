'use client'

import * as React from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Loader2, MapPin, Phone, Globe } from 'lucide-react'

const supabase = createClient()

type HospitalRow = {
  id: string
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  website: string | null
  _count?: { doctors: number }
}

const defaultForm = { name: '', address: '', phone: '', website: '', latitude: '', longitude: '' }

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = React.useState<HospitalRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showModal, setShowModal] = React.useState(false)
  const [editing, setEditing] = React.useState<HospitalRow | null>(null)
  const [formData, setFormData] = React.useState(defaultForm)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    loadHospitals()
  }, [])

  const loadHospitals = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('hospitals')
      .select(`
        *,
        doctors:doctor_hospitals(count)
      `)
      .order('name')

    if (data) {
      setHospitals(data.map((h: any) => ({
        ...h,
        _count: { doctors: h.doctors?.[0]?.count || 0 }
      })))
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone || null,
      website: formData.website || null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    }

    if (editing) {
      await supabase.from('hospitals').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('hospitals').insert(payload)
    }

    setShowModal(false)
    setSaving(false)
    loadHospitals()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this hospital?')) {
      await supabase.from('hospitals').delete().eq('id', id)
      loadHospitals()
    }
  }

  const openModal = (hospital?: HospitalRow) => {
    if (hospital) {
      setEditing(hospital)
      setFormData({
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone || '',
        website: hospital.website || '',
        latitude: hospital.latitude?.toString() || '',
        longitude: hospital.longitude?.toString() || '',
      })
    } else {
      setEditing(null)
      setFormData(defaultForm)
    }
    setShowModal(true)
  }

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Hospitals Management</h1>
              <p className="text-sm text-secondary-500 mt-1">{hospitals.length} total hospitals</p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hospital
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Hospitals</CardTitle>
              <Input placeholder="Search by name or address..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-secondary-500 py-8">No hospitals found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Doctors</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((hospital) => (
                      <TableRow key={hospital.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            {hospital.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-secondary-500 max-w-xs truncate">{hospital.address}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm text-secondary-500">
                            {hospital.phone && (
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {hospital.phone}</span>
                            )}
                            {hospital.website && (
                              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {hospital.website}</span>
                            )}
                            {!hospital.phone && !hospital.website && '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{hospital._count?.doctors || 0} doctors</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openModal(hospital)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(hospital.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editing ? 'Edit Hospital' : 'Add Hospital'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input value={formData.website} onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Latitude</Label>
                    <Input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                  <Button type="submit" className="flex-1" loading={saving}>{editing ? 'Save Changes' : 'Add Hospital'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
