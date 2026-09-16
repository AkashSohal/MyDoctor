'use client'

import * as React from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ReviewStatusBadge, ReportStatusBadge, RatingStars } from '@/components/admin/AdminStatusBadges'
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const supabase = createClient()

type ReviewRow = {
  id: string
  doctor_id: string
  patient_id: string
  appointment_id: string
  rating: number
  review_text: string | null
  status: string
  is_verified: boolean
  created_at: string
  doctor: { full_name: string } | null
  patient: { full_name: string } | null
}

type ReportRow = {
  id: string
  review_id: string | null
  user_id: string
  doctor_id: string | null
  reason: string
  status: string
  created_at: string
  review: { review_text: string; status: string; doctor: { full_name: string } | null; patient: { full_name: string } | null } | null
  reporter: { full_name: string } | null
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState<ReviewRow[]>([])
  const [reports, setReports] = React.useState<ReportRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const [reviewsResult, reportsResult] = await Promise.all([
      supabase
        .from('reviews')
        .select(`
          *,
          doctor:doctors(full_name),
          patient:users(full_name)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('reports')
        .select(`
          *,
          review:reviews(review_text, status, doctor:doctors(full_name), patient:users(full_name)),
          reporter:users(full_name)
        `)
        .order('created_at', { ascending: false }),
    ])

    if (reviewsResult.data) setReviews(reviewsResult.data as any)
    if (reportsResult.data) setReports(reportsResult.data as any)
    setLoading(false)
  }

  const handleApproveReview = async (reviewId: string) => {
    setUpdatingId(reviewId)
    await supabase.from('reviews').update({ status: 'published' }).eq('id', reviewId)
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'published' } : r))
    setUpdatingId(null)
  }

  const handleHideReview = async (reviewId: string) => {
    setUpdatingId(reviewId)
    await supabase.from('reviews').update({ status: 'hidden' }).eq('id', reviewId)
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'hidden' } : r))
    setUpdatingId(null)
  }

  const handleResolveReport = async (reportId: string, reviewId: string | null) => {
    setUpdatingId(reportId)
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
    if (reviewId) {
      await supabase.from('reviews').update({ status: 'hidden' }).eq('id', reviewId)
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'hidden' } : r))
    }
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r))
    setUpdatingId(null)
  }

  const handleDismissReport = async (reportId: string) => {
    setUpdatingId(reportId)
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId)
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r))
    setUpdatingId(null)
  }

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = !search ||
      r.doctor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.review_text?.toLowerCase().includes(search.toLowerCase())

    if (activeTab === 'all') return matchesSearch
    return matchesSearch && r.status === activeTab
  })

  const pendingCount = reviews.filter(r => r.status === 'pending_moderation').length
  const reportedCount = reviews.filter(r => r.status === 'reported').length
  const pendingReports = reports.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Review Moderation</h1>
              <div className="flex gap-2 mt-2">
                <Badge variant="warning">Pending: {pendingCount}</Badge>
                <Badge variant="danger">Reported: {reportedCount}</Badge>
                <Badge variant="outline">Reports: {pendingReports}</Badge>
              </div>
            </div>
            <Input placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="pending_moderation">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="reported">Reported ({reportedCount})</TabsTrigger>
            <TabsTrigger value="hidden">Hidden</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <p className="text-center text-secondary-500 py-12">No reviews found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reviewer</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Review</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReviews.map((review) => (
                          <TableRow key={review.id}>
                            <TableCell className="font-medium">{review.patient?.full_name || 'Unknown'}</TableCell>
                            <TableCell>Dr. {review.doctor?.full_name || 'Unknown'}</TableCell>
                            <TableCell><RatingStars rating={review.rating} /></TableCell>
                            <TableCell className="max-w-xs">
                              <p className="text-sm text-secondary-600 truncate">{review.review_text || '-'}</p>
                            </TableCell>
                            <TableCell><ReviewStatusBadge status={review.status} /></TableCell>
                            <TableCell className="text-sm text-secondary-500">{formatDate(review.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {review.status !== 'published' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleApproveReview(review.id)}
                                    disabled={updatingId === review.id}
                                    className="text-green-600 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {review.status !== 'hidden' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleHideReview(review.id)}
                                    disabled={updatingId === review.id}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
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
          </TabsContent>
        </Tabs>

        {pendingReports > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Pending Reports ({pendingReports})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.filter(r => r.status === 'pending').map((report) => (
                  <div key={report.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-700">Report by {report.reporter?.full_name || 'Unknown'}</span>
                          <ReportStatusBadge status={report.status} />
                        </div>
                        <p className="text-sm text-secondary-600">Reason: {report.reason}</p>
                        {report.review && (
                          <div className="text-sm text-secondary-500">
                            <p>Review by {report.review.patient?.full_name} for Dr. {report.review.doctor?.full_name}</p>
                            <p className="italic">&quot;{report.review.review_text}&quot;</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleResolveReport(report.id, report.review_id)}
                          disabled={updatingId === report.id}
                        >
                          Hide Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismissReport(report.id)}
                          disabled={updatingId === report.id}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
