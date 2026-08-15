export interface PropertyUnit {
  id: string;
  propertyId: string;
  unitIdentifier: string;
  bedrooms: number;
  bathrooms: number;
  isOccupied: boolean;
  monthlyRent: number;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  imageUrl: string;
  publicId?: string;
  displayOrder?: number;
}

export type PropertyType = 'townhome' | 'single_family' | 'apartment' | 'duplex_triplex' | 'other' | string;
export type PropertyAge = 'below_1' | '1_to_3' | '3_to_7' | 'above_7' | string;
export type ApprovalStatus = 'approved' | 'pending' | 'rejected' | string;

export interface Property {
  id: string;
  userId: string;
  propertyType: PropertyType;
  customPropertyType?: string;
  propertyName: string;
  state: string;
  city: string;
  streetAddress: string;
  apartmentSuiteFloor?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  propertyAge?: PropertyAge;
  totalPortfolioValue?: number;
  status?: string;
  approvalStatus?: ApprovalStatus;
  hasProofOfOwnership?: boolean;
  hasProofOfInsurance?: boolean;
  units?: PropertyUnit[];
  images?: PropertyImage[];
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyHeaderStats {
  totalProperties: number;
  heldDeposit: {
    total: number;
    currency: string;
  };
}

export interface PropertyListItem {
  id: string;
  propertyName: string;
  coverImage?: string;
  occupancyType?: 'single' | 'multiple' | string;
  unitCount?: number;
  occupiedCount?: number;
  approvalStatus?: string;
  apartmentSuiteFloor?: string;
  city?: string;
  state?: string;
  createdAt?: string;
}

export interface PropertiesApiData {
  header: PropertyHeaderStats;
  properties: PropertyListItem[];
}

export interface PropertiesApiResponse {
  success: boolean;
  message: string;
  data: PropertiesApiData;
}

export interface CreatePropertyPayload {
  propertyType: PropertyType;
  customPropertyType?: string;
  propertyName: string;
  state: string;
  city: string;
  streetAddress: string;
  apartmentSuiteFloor?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  propertyAge?: PropertyAge;
  hasProofOfOwnership?: boolean;
  hasProofOfInsurance?: boolean;
  units?: Omit<PropertyUnit, 'id' | 'propertyId'>[];
  images?: string[];
}
