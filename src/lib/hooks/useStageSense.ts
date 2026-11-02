import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { JobStatus, MethodologyResponse, Report } from '../types/report';
import { DEFAULT_METHODOLOGY_RESPONSE } from '../../mocks/methodology';

export function useJob(jobId: string | undefined) {
  return useQuery<JobStatus, Error>({
    queryKey: ['job', jobId],
    queryFn: () => {
      if (!jobId) throw new Error('No job ID provided');
      return api.getJob(jobId);
    },
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1500;
      if (
  data.status === 'done' ||
  data.status === 'completed' ||
  data.status === 'failed'
) {
  return false;
}
      return 1500;
    },
  });
}

export function useReport(jobId: string | undefined) {
  return useQuery<Report, Error>({
    queryKey: ['report', jobId],
    queryFn: () => {
      if (!jobId) throw new Error('No job ID provided');
      return api.getReport(jobId);
    },
    enabled: Boolean(jobId),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useMethodology() {
  return useQuery<MethodologyResponse, Error>({
    queryKey: ['methodology'],
    queryFn: async () => {
      try {
        return await api.getMethodology();
      } catch {
        return DEFAULT_METHODOLOGY_RESPONSE;
      }
    },
    staleTime: 1000 * 60 * 60,
    initialData: DEFAULT_METHODOLOGY_RESPONSE,
  });
}
