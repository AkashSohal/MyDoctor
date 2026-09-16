'use client'

import * as React from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react'

const supabase = createClient()

export default function AdminSpecialtiesPage() {
  const [specialties, setSpecialties] = React.useState<Array<{id: string, name: string, description: string, icon: string, _count?: {doctors: number}}>>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showModal, setShowModal] = React.useState(false)
  const [editing, setEditing] = React.useState<typeof specialties[0] | null>(null)
  const [formData, setFormData] = React.useState({ name: '', description: '', icon: 'stethoscope' })

  React.useEffect(() => {
    loadSpecialties()
  }, [])

  const loadSpecialties = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('specialties')
      .select(`
        *,
        doctors:doctors(count)
      `)
      .order('name')
    
    if (data) {
      setSpecialties(data.map((s: any) => ({
        ...s,
        _count: { doctors: s.doctors?.[0]?.count || 0 }
      })))
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let error
    if (editing) {
      ({ error } = await supabase.from('specialties').update(formData).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('specialties').insert(formData))
    }
    if (error) alert('Error saving specialty: ' + error.message)
    setShowModal(false)
    loadSpecialties()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this specialty?')) {
      const { error } = await supabase.from('specialties').delete().eq('id', id)
      if (error) alert('Error deleting specialty: ' + error.message)
      loadSpecialties()
    }
  }

  const openModal = (specialty?: typeof specialties[0]) => {
    if (specialty) {
      setEditing(specialty)
      setFormData({ name: specialty.name, description: specialty.description || '', icon: specialty.icon })
    } else {
      setEditing(null)
      setFormData({ name: '', description: '', icon: 'stethoscope' })
    }
    setShowModal(true)
  }

  const icons = ['stethoscope', 'heart', 'sparkles', 'bone', 'baby', 'female', 'ear', 'brain', 'eye', 'stomach', 'lungs', 'droplet', 'activity', 'kidney', 'shield', 'tooth']

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-secondary-900">Specialties Management</h1>
            <Button onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Specialty
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Specialties</CardTitle>
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Icon</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Doctors</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialties.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map((specialty) => (
                      <TableRow key={specialty.id}>
                        <TableCell>
                          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            {specialty.icon && <span className="text-primary-600">{specialty.icon}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{specialty.name}</TableCell>
                        <TableCell className="text-secondary-500 max-w-xs truncate">{specialty.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{specialty._count?.doctors || 0} doctors</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openModal(specialty)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(specialty.id)}>
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
              <CardTitle>{editing ? 'Edit Specialty' : 'Add Specialty'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div>
                  <Label>Icon</Label>
                  <select value={formData.icon} onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))} className="w-full px-3 py-2 border border-secondary-300 rounded-lg">
                    {icons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">{editing ? 'Save Changes' : 'Add Specialty'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}