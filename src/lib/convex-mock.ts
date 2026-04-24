"use client";

import { useQuery as useReactQuery, useMutation as useReactMutation, useQueryClient } from "@tanstack/react-query";
import { api as baseApi } from "./api";

type ApiEndpoint = { endpoint: string; method: "GET" | "POST" | "PATCH" | "DELETE" };

export const api = {
  users: {
    list: { endpoint: "/users", method: "GET" },
    updateRole: { endpoint: "/users/:id/role", method: "PATCH" },
    getStats: { endpoint: "/users/stats", method: "GET" },
  },
  accounts: {
    list: { endpoint: "/accounts", method: "GET" },
    get: { endpoint: "/accounts/:id", method: "GET" },
    create: { endpoint: "/accounts", method: "POST" },
    update: { endpoint: "/accounts/:id", method: "PATCH" },
    delete: { endpoint: "/accounts/:id", method: "DELETE" },
  },
  codeMaster: {
    list: { endpoint: "/code-master", method: "GET" },
    getByAccount: { endpoint: "/code-master/by-account/:accountId", method: "GET" },
    create: { endpoint: "/code-master", method: "POST" },
    update: { endpoint: "/code-master/:id", method: "PATCH" },
    delete: { endpoint: "/code-master/:id", method: "DELETE" },
  },
  weavers: {
    list: { endpoint: "/weavers", method: "GET" },
    get: { endpoint: "/weavers/:id", method: "GET" },
    create: { endpoint: "/weavers", method: "POST" },
    update: { endpoint: "/weavers/:id", method: "PATCH" },
    delete: { endpoint: "/weavers/:id", method: "DELETE" },
  },
  qualities: {
    list: { endpoint: "/qualities", method: "GET" },
    get: { endpoint: "/qualities/:id", method: "GET" },
    create: { endpoint: "/qualities", method: "POST" },
    update: { endpoint: "/qualities/:id", method: "PATCH" },
    delete: { endpoint: "/qualities/:id", method: "DELETE" },
  },
  orders: {
    list: { endpoint: "/orders", method: "GET" },
    get: { endpoint: "/orders/:id", method: "GET" },
    create: { endpoint: "/orders", method: "POST" },
    createBatch: { endpoint: "/orders/batch", method: "POST" },
    update: { endpoint: "/orders/:id", method: "PATCH" },
    delete: { endpoint: "/orders/:id", method: "DELETE" },
  },
  challans: {
    list: { endpoint: "/challans", method: "GET" },
    get: { endpoint: "/challans/:id", method: "GET" },
    getByOrder: { endpoint: "/challans/by-order/:orderId", method: "GET" },
    create: { endpoint: "/challans", method: "POST" },
    delete: { endpoint: "/challans/:id", method: "DELETE" },
  },
  lots: {
    list: { endpoint: "/lots", method: "GET" },
    get: { endpoint: "/lots/:id", method: "GET" },
    getByChallan: { endpoint: "/lots/by-challan/:challanId", method: "GET" },
    create: { endpoint: "/lots", method: "POST" },
    updateStatus: { endpoint: "/lots/:id/status", method: "PATCH" },
    delete: { endpoint: "/lots/:id", method: "DELETE" },
  },
  locations: {
    list: { endpoint: "/locations", method: "GET" },
    get: { endpoint: "/locations/:id", method: "GET" },
    getDashboardStats: { endpoint: "/locations/dashboard-stats", method: "GET" },
    create: { endpoint: "/locations", method: "POST" },
    update: { endpoint: "/locations/:id", method: "PATCH" },
    assignLot: { endpoint: "/locations/:id/assign-lot", method: "POST" },
    delete: { endpoint: "/locations/:id", method: "DELETE" },
  },
  stamping: {
    listStampable: { endpoint: "/stamping", method: "GET" },
    stampTaka: { endpoint: "/stamping/stamp", method: "POST" },
    unstampTaka: { endpoint: "/stamping/unstamp", method: "POST" },
    stampAll: { endpoint: "/stamping/stamp-all", method: "POST" },
  },
  processIssues: {
    list: { endpoint: "/process-issues", method: "GET" },
    get: { endpoint: "/process-issues/:id", method: "GET" },
    getByLot: { endpoint: "/process-issues/by-lot/:lotId", method: "GET" },
    create: { endpoint: "/process-issues", method: "POST" },
    complete: { endpoint: "/process-issues/:id/complete", method: "PATCH" },
    delete: { endpoint: "/process-issues/:id", method: "DELETE" },
  },
  jobCards: {
    list: { endpoint: "/job-cards", method: "GET" },
    get: { endpoint: "/job-cards/:id", method: "GET" },
    getByLot: { endpoint: "/job-cards/by-lot/:lotId", method: "GET" },
    create: { endpoint: "/job-cards", method: "POST" },
    updateRecipe: { endpoint: "/job-cards/:id/recipe", method: "PATCH" },
    recordProduction: { endpoint: "/job-cards/:id/production", method: "PATCH" },
    delete: { endpoint: "/job-cards/:id", method: "DELETE" },
  },
  dispatches: {
    list: { endpoint: "/dispatches", method: "GET" },
    get: { endpoint: "/dispatches/:id", method: "GET" },
    listByParty: { endpoint: "/dispatches/by-party/:partyId", method: "GET" },
    create: { endpoint: "/dispatches", method: "POST" },
    markBilled: { endpoint: "/dispatches/:id/mark-billed", method: "PATCH" },
    delete: { endpoint: "/dispatches/:id", method: "DELETE" },
  },
  bills: {
    list: { endpoint: "/bills", method: "GET" },
    get: { endpoint: "/bills/:id", method: "GET" },
    listByParty: { endpoint: "/bills/by-party/:partyId", method: "GET" },
    create: { endpoint: "/bills", method: "POST" },
    updateStatus: { endpoint: "/bills/:id/status", method: "PATCH" },
    delete: { endpoint: "/bills/:id", method: "DELETE" },
  },
  ocr: {
    extract: { endpoint: "/ocr/extract", method: "POST" },
  }
} as const;

function buildUrl(endpoint: string, args: any = {}) {
  let url = endpoint;
  const queryParams = new URLSearchParams();
  
  // Replace path params
  if (args.id) {
    url = url.replace(":id", args.id);
  }
  if (args.accountId) {
    url = url.replace(":accountId", args.accountId);
  }
  if (args.orderId) {
    url = url.replace(":orderId", args.orderId);
  }
  if (args.challanId) {
    url = url.replace(":challanId", args.challanId);
  }
  if (args.lotId) {
    url = url.replace(":lotId", args.lotId);
  }
  if (args.partyId) {
    url = url.replace(":partyId", args.partyId);
  }

  // Add remaining args as query params if it's a GET request
  if (args && typeof args === "object") {
    for (const key in args) {
      if (!["id", "accountId", "orderId", "challanId", "lotId", "partyId"].includes(key) && args[key] !== undefined) {
        queryParams.append(key, String(args[key]));
      }
    }
  }
  
  const qStr = queryParams.toString();
  return qStr ? `${url}?${qStr}` : url;
}

export function useQuery(apiAction: ApiEndpoint, args?: any) {
  // If apiAction is missing (happens when passing skip token), skip
  const skip = apiAction === "skip" || !apiAction;
  
  const { data } = useReactQuery({
    queryKey: [apiAction?.endpoint, args],
    queryFn: () => {
      if (skip) return null;
      return baseApi.get(buildUrl(apiAction.endpoint, args));
    },
    enabled: !skip,
  });
  
  return data as any;
}

export function useMutation(apiAction: ApiEndpoint) {
  const queryClient = useQueryClient();
  
  return async (args: any) => {
    let url = buildUrl(apiAction.endpoint, args);
    let res;
    
    if (apiAction.method === "POST") {
      res = await baseApi.post(url, args);
    } else if (apiAction.method === "PATCH") {
      res = await baseApi.patch(url, args);
    } else if (apiAction.method === "DELETE") {
      res = await baseApi.delete(url);
    }
    
    // Invalidate everything to be safe and match Convex's reactive nature
    await queryClient.invalidateQueries();
    return res;
  };
}
