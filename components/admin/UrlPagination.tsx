'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { Pagination } from '@/components/common/Pagination'

export function UrlPagination({
  totalPages,
  totalItems,
  itemsPerPage,
}: {
  totalPages: number
  totalItems: number
  itemsPerPage: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1)

  const onPageChange = React.useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (page <= 1) params.delete('page')
      else params.set('page', String(page))
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams]
  )

  return (
    <Pagination
      className="mt-6"
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
    />
  )
}
