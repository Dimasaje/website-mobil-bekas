export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(
    message: string,
    code = "UNKNOWN_ERROR",
    status = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : endpoint;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg =
      data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    const errorCode = data?.error?.code || `HTTP_${response.status}`;
    throw new ApiClientError(
      errorMsg,
      errorCode,
      response.status,
      data?.error?.details,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, { method: "POST", body: formData }),
};

// Types for domain entities
export interface CarPhoto {
  id: string;
  url?: string;
  photoUrl?: string;
  isPrimary: boolean;
  order?: number;
  orderIndex?: number;
}

export interface Car {
  id: string;
  brandId: string;
  brand?: { id: string; name: string; slug: string } | null;
  brandName?: string;
  title: string;
  slug: string;
  model: string;
  year: number;
  price: string | number;
  dpAmount: string | number;
  monthlyInstallment?: string | number | null;
  mileage: number;
  transmission: "manual" | "otomatis";
  fuelType: "bensin" | "diesel" | "hybrid" | "listrik";
  bodyType: "mpv" | "suv" | "sedan" | "hatchback" | "city_car" | "lainnya";
  color: string;
  description?: string | null;
  status: "tersedia" | "booking" | "terjual";
  isFeatured: boolean;
  primaryPhoto?: string | null;
  photos?: CarPhoto[];
}

export interface CarFilters {
  brands: Array<{ id: string; name: string; slug: string; carCount?: number }>;
  bodyTypes?: string[];
  transmissions: string[];
  fuelTypes: string[];
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
}

export type CarStatus =
  "draft" | "tersedia" | "booking" | "terjual" | "diarsipkan";

export interface AdminCarPhoto {
  id: string;
  carId: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

export interface AdminCar {
  id: string;
  brandId: string;
  brand?: { id: string; name: string; slug: string } | null;
  title: string;
  slug: string;
  model: string;
  year: number;
  price: number | string;
  transmission: "manual" | "matic";
  mileage: number;
  fuelType: "bensin" | "diesel" | "hybrid" | "listrik";
  engineCapacity?: number | null;
  color?: string | null;
  licensePlate?: string | null;
  stnkValidUntil?: string | null;
  description?: string | null;
  features?: string[] | null;
  status: CarStatus;
  isFeatured: boolean;
  viewsCount?: number;
  photos?: AdminCarPhoto[];
}

export interface AdminCarInput {
  brandId: string;
  title: string;
  slug?: string;
  model: string;
  year: number;
  price: number;
  transmission: "manual" | "matic";
  mileage: number;
  fuelType: "bensin" | "diesel" | "hybrid" | "listrik";
  engineCapacity?: number | null;
  color?: string | null;
  licensePlate?: string | null;
  stnkValidUntil?: string | null;
  description?: string | null;
  features?: string[];
  status?: CarStatus;
  isFeatured?: boolean;
}

export interface Promo {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  bannerUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
}

export interface Testimonial {
  id: string;
  customerName: string;
  location?: string | null;
  carName?: string | null;
  photoUrl?: string | null;
  quote: string;
  rating: number;
  isDisplayed: boolean;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImageUrl?: string | null;
  status: "draft" | "terbit";
  publishedAt?: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export interface SiteSettings {
  showroomName: string;
  whatsappNumber: string;
  phoneNumber?: string | null;
  address: string;
  mapsUrl?: string | null;
  openingHours?: string | null;
  defaultInterestRate: string;
  minDownPaymentPercent: string;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
}

// Domain API client methods
export const apiClient = {
  // Cars
  getCars: (params?: Record<string, string | number | boolean | undefined>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== "") {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<ApiResponse<Car[]>>(`/api/cars${query ? `?${query}` : ""}`);
  },

  getCarBySlug: (slug: string) =>
    api.get<ApiResponse<Car>>(`/api/cars/${slug}`),

  getCarFilters: () => api.get<ApiResponse<CarFilters>>("/api/cars/filters"),

  // Promos
  getPromos: () => api.get<ApiResponse<Promo[]>>("/api/promos"),

  // Testimonials
  getTestimonials: () =>
    api.get<ApiResponse<Testimonial[]>>("/api/testimonials"),

  // Articles
  getArticles: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    const query = searchParams.toString();
    return api.get<ApiResponse<Article[]>>(
      `/api/articles${query ? `?${query}` : ""}`,
    );
  },

  getArticleBySlug: (slug: string) =>
    api.get<ApiResponse<Article>>(`/api/articles/${slug}`),

  // Site Settings
  getSettings: () => api.get<ApiResponse<SiteSettings>>("/api/settings"),

  // Leads
  submitLead: (data: {
    type: "tukar_tambah" | "test_drive" | "kontak" | "simulasi";
    name: string;
    phone: string;
    carId?: string | null;
    notes?: string | null;
    data?: Record<string, unknown>;
    honeypot?: string;
  }) =>
    api.post<
      ApiResponse<{
        id: string;
        type: string;
        status: string;
        message?: string;
      }>
    >("/api/leads", data),

  // Auth admin
  loginAdmin: (email: string, password: string) =>
    api.post<ApiResponse<{ user: AdminUser }>>("/api/auth/login", {
      email,
      password,
    }),

  logoutAdmin: () => api.post<ApiResponse<null>>("/api/auth/logout"),

  getAdminMe: () => api.get<ApiResponse<{ user: AdminUser }>>("/api/auth/me"),

  // Admin cars
  listAdminCars: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    brandId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, val]) => {
      if (val !== undefined && val !== "")
        searchParams.append(key, String(val));
    });
    const query = searchParams.toString();
    return api.get<ApiResponse<AdminCar[]>>(
      `/api/admin/cars${query ? `?${query}` : ""}`,
    );
  },

  getAdminCar: (id: string) =>
    api.get<ApiResponse<AdminCar>>(`/api/admin/cars/${id}`),

  createAdminCar: (data: AdminCarInput) =>
    api.post<ApiResponse<AdminCar>>("/api/admin/cars", data),

  updateAdminCar: (id: string, data: Partial<AdminCarInput>) =>
    api.patch<ApiResponse<AdminCar>>(`/api/admin/cars/${id}`, data),

  updateAdminCarStatus: (id: string, status: CarStatus) =>
    api.patch<ApiResponse<AdminCar>>(`/api/admin/cars/${id}/status`, {
      status,
    }),

  updateAdminCarFeatured: (id: string, isFeatured: boolean) =>
    api.patch<ApiResponse<AdminCar>>(`/api/admin/cars/${id}/featured`, {
      isFeatured,
    }),

  archiveAdminCar: (id: string) =>
    api.delete<ApiResponse<AdminCar>>(`/api/admin/cars/${id}`),

  uploadCarPhotos: (carId: string, files: File[]) => {
    const formData = new FormData();
    for (const file of files) formData.append("file", file);
    return api.upload<ApiResponse<AdminCarPhoto[]>>(
      `/api/admin/cars/${carId}/photos`,
      formData,
    );
  },

  reorderCarPhotos: (
    carId: string,
    photos: Array<{ id: string; order: number }>,
  ) =>
    api.put<ApiResponse<AdminCarPhoto[]>>(
      `/api/admin/cars/${carId}/photos/reorder`,
      { photos },
    ),

  setPrimaryCarPhoto: (carId: string, photoId: string) =>
    api.patch<ApiResponse<AdminCarPhoto>>(
      `/api/admin/cars/${carId}/photos/${photoId}/primary`,
    ),

  deleteCarPhoto: (carId: string, photoId: string) =>
    api.delete<ApiResponse<null>>(`/api/admin/cars/${carId}/photos/${photoId}`),
};
