import { useQuery, useMutation } from "@tanstack/react-query";
import { Camp, InsertCamp } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Get all camps
export function useCamps() {
  return useQuery<Camp[]>({
    queryKey: ["/api/camps"],
    refetchInterval: false,
  });
}

// Get a single camp by ID
export function useCamp(id: number | undefined) {
  return useQuery<Camp>({
    queryKey: [`/api/camps/${id}`],
    enabled: !!id,
    refetchInterval: false,
  });
}

// Create a new camp
export function useCreateCamp() {
  return useMutation({
    mutationFn: async (camp: InsertCamp) => {
      const res = await apiRequest("POST", "/api/camps", camp);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camps"] });
    },
  });
}

// Update an existing camp
export function useUpdateCamp(id: number) {
  return useMutation({
    mutationFn: async (camp: Partial<InsertCamp>) => {
      const res = await apiRequest("PUT", `/api/camps/${id}`, camp);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/camps/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/camps"] });
    },
  });
}

// Delete a camp
export function useDeleteCamp() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/camps/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camps"] });
    },
  });
}

// Get all participants for a camp
export function useCampParticipants(campId: number | undefined) {
  return useQuery({
    queryKey: [`/api/camps/${campId}/participants`],
    enabled: !!campId,
    refetchInterval: false,
  });
}

// Get all staff members for a camp
export function useCampStaff(campId: number | undefined) {
  return useQuery({
    queryKey: [`/api/camps/${campId}/staff`],
    enabled: !!campId,
    refetchInterval: false,
  });
}

// Get all housing units for a camp
export function useCampHousing(campId: number | undefined) {
  return useQuery({
    queryKey: [`/api/camps/${campId}/housing`],
    enabled: !!campId,
    refetchInterval: false,
  });
}

// Get all travel arrangements for a camp
export function useCampTravel(campId: number | undefined) {
  return useQuery({
    queryKey: [`/api/camps/${campId}/travel`],
    enabled: !!campId,
    refetchInterval: false,
  });
}

// Get all schedule events for a camp
export function useCampSchedule(campId: number | undefined) {
  return useQuery({
    queryKey: [`/api/camps/${campId}/schedule`],
    enabled: !!campId,
    refetchInterval: false,
  });
}

// Get all budget items for a camp
export function useCampBudget(campId: number | undefined) {
  return useQuery({
    queryKey: [`/api/camps/${campId}/budget`],
    enabled: !!campId,
    refetchInterval: false,
  });
}

// Get all documents for a camp
export function useCampDocuments(campId: number | undefined) {
  return useQuery({
    queryKey: [`/api/camps/${campId}/documents`],
    enabled: !!campId,
    refetchInterval: false,
  });
}

// Get all tasks for a camp
export function useCampTasks(campId: number | undefined) {
  return useQuery({
    queryKey: [`/api/camps/${campId}/tasks`],
    enabled: !!campId,
    refetchInterval: false,
  });
}

// Get all activities for a camp
export function useCampActivities(campId: number | undefined) {
  return useQuery({
    queryKey: [`/api/camps/${campId}/activities`],
    enabled: !!campId,
    refetchInterval: false,
  });
}
