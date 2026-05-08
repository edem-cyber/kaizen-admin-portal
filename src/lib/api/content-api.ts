import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contentRequest } from "@/lib/api-client";
import { toast } from "sonner";

export interface SubAccount {
  id: number;
  userId: string;
  contentProviderOrgId: number;
  revenueSharePercentage: number;
  status: "ACTIVE" | "DISABLED" | "PENDING";
  invitedAt: string;
  acceptedAt?: string;
  disabledAt?: string;
  disabledReason?: string;
  user: {
    id?: number;
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    username?: string;
    imageUrl?: string;
  };
}

export interface SubAccountListResponse {
  data: SubAccount[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UpdateSubAccountDto {
  revenueSharePercentage?: number;
  status?: "ACTIVE" | "DISABLED";
  disabledReason?: string;
}

// Hooks
export const useGetSubAccounts = (orgId: number, params: { status?: string; page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: ["sub-accounts", orgId, params],
    queryFn: () =>
      contentRequest<SubAccountListResponse>({
        url: `/api/v1/organizations/${orgId}/sub-accounts`,
        method: "GET",
        params,
      }),
    enabled: !!orgId,
  });
};

export const useUpdateSubAccount = (orgId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subAccountId, data }: { subAccountId: number; data: UpdateSubAccountDto }) =>
      contentRequest({
        url: `/api/v1/organizations/${orgId}/sub-accounts/${subAccountId}`,
        method: "PATCH",
        data,
      }),
    onSuccess: (_, variables) => {
      toast.success("Sub-account updated successfully");
      queryClient.invalidateQueries({ queryKey: ["sub-accounts", orgId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update sub-account");
    },
  });
};

export const useEnableSubAccount = (orgId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subAccountId: number) =>
      contentRequest({
        url: `/api/v1/organizations/${orgId}/sub-accounts/${subAccountId}/enable`,
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Sub-account enabled");
      queryClient.invalidateQueries({ queryKey: ["sub-accounts", orgId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to enable sub-account");
    },
  });
};

export const useDisableSubAccount = (orgId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subAccountId: number) =>
      contentRequest({
        url: `/api/v1/organizations/${orgId}/sub-accounts/${subAccountId}/disable`,
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Sub-account disabled");
      queryClient.invalidateQueries({ queryKey: ["sub-accounts", orgId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to disable sub-account");
    },
  });
};
