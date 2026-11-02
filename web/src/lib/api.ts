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
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

// Types for domain entities
export interface CarPhoto {
  id: string;
  photoUrl: string;
  isPrimary: boolean;
  orderIndex: number;
}

export interface Car {
  id: string;
  brandId: string;
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
    name: string;
    phone: string;
    source: "whatsapp" | "test_drive" | "kredit" | "tukar_tambah" | "jual";
    carId?: string;
    notes?: string;
    hp?: string;
  }) => api.post<ApiResponse<{ id: string }>>("/api/leads", data),
};
