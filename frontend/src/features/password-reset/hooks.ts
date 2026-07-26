import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchResetRequests, rejectResetRequest, resolveResetRequest } from './api'

const requestsKey = ['reset-requests'] as const

export function useResetRequests(enabled: boolean) {
  return useQuery({ queryKey: requestsKey, queryFn: fetchResetRequests, enabled })
}

export function useRejectRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rejectResetRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: requestsKey }),
  })
}

export function useResolveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      resolveResetRequest(id, newPassword),
    onSuccess: () => qc.invalidateQueries({ queryKey: requestsKey }),
  })
}
