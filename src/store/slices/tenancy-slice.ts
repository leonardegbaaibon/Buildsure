import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/utils/api-client';

export interface CustomFee {
  name: string;
  amount: number;
  dueDate?: string;
}

export interface CreateTenancyPayload {
  propertyId: string;
  unitId: string;
  tenantFirstName: string;
  tenantLastName: string;
  tenantEmail: string;
  tenantPhoneNumber: string;
  rentAmount: number;
  durationYears: number;
  rentStartDate: string; // YYYY-MM-DD
  rentEndDate: string; // YYYY-MM-DD
  rentDueDate: string;
  rentFee?: number;
  lateFee?: number;
  customFees?: CustomFee[];
}

export interface ExistingTenancyPayload extends CreateTenancyPayload {
  contractFile?: { uri: string; name: string; type: string } | null;
  receiptFile?: { uri: string; name: string; type: string } | null;
}

export interface BreakdownLineItem {
  name: string;
  amount: number;
}

export interface TenancyBreakdownDetails {
  lineItems: BreakdownLineItem[];
  rent: number;
  customFeesTotal: number;
  landlordEntitlement: number;
  adminFee: number;
  totalPayable: number;
  currency: string;
}

export interface TenancyBreakdown {
  tenancyId?: string;
  kind?: string;
  requiresPayment?: boolean;
  payer?: 'landlord' | 'tenant' | string;
  adminFee?: number;
  amountDue?: number;
  breakdown?: TenancyBreakdownDetails;
  // Legacy / fallback flat keys
  propertyName?: string;
  unitIdentifier?: string;
  rentAmount?: number | string;
  totalAmount?: number | string;
  customFees?: CustomFee[];
}

export interface TenancyData {
  id: string;
  propertyId: string;
  unitId: string;
  landlordId?: string;
  tenantId?: string | null;
  tenantFirstName: string;
  tenantLastName: string;
  tenantEmail: string;
  tenantPhoneNumber: string;
  status: 'pending_signature' | 'active' | 'terminated' | string;
  rentAmount: string;
  rentFee?: string;
  durationYears: number;
  rentStartDate: string;
  rentEndDate: string;
  rentDueDate: string;
  lateFee?: string | null;
  customFees?: CustomFee[];
  contractText?: string | null;
  contractGeneratedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface TenancyState {
  currentTenancy: TenancyData | null;
  breakdown: TenancyBreakdown | null;
  paymentLink: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: TenancyState = {
  currentTenancy: null,
  breakdown: null,
  paymentLink: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
};

// 1. Create New Draft Tenancy (POST /api/v1/tenancies)
export const createNewTenancy = createAsyncThunk(
  'tenancy/createNew',
  async (payload: CreateTenancyPayload, { rejectWithValue }) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 [POST /api/v1/tenancies] REQUEST PAYLOAD:');
      console.log(JSON.stringify(payload, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const response = await api.post<{ success: boolean; message: string; data: TenancyData }>(
        '/tenancies',
        payload
      );

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [POST /api/v1/tenancies] SUCCESS RESPONSE:');
      console.log(JSON.stringify(response, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return response.data;
    } catch (err: any) {
      console.error('❌ [POST /api/v1/tenancies] ERROR RESPONSE:', {
        message: err.message,
        statusCode: err.statusCode,
        details: err.details,
      });
      return rejectWithValue(err.message || 'Failed to create tenancy');
    }
  }
);

// 2. Board Existing Tenancy with Contract/Receipt (POST /api/v1/tenancies/existing)
export const createExistingTenancy = createAsyncThunk(
  'tenancy/createExisting',
  async (payload: ExistingTenancyPayload, { rejectWithValue }) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 [POST /api/v1/tenancies/existing] REQUEST PAYLOAD:');
      console.log({
        propertyId: payload.propertyId,
        unitId: payload.unitId,
        tenantFirstName: payload.tenantFirstName,
        tenantLastName: payload.tenantLastName,
        tenantEmail: payload.tenantEmail,
        tenantPhoneNumber: payload.tenantPhoneNumber,
        rentAmount: payload.rentAmount,
        durationYears: payload.durationYears,
        rentStartDate: payload.rentStartDate,
        rentEndDate: payload.rentEndDate,
        rentDueDate: payload.rentDueDate,
        customFees: payload.customFees,
        contractFile: payload.contractFile ? { name: payload.contractFile.name, type: payload.contractFile.type } : null,
        receiptFile: payload.receiptFile ? { name: payload.receiptFile.name, type: payload.receiptFile.type } : null,
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const formData = new FormData();
      formData.append('propertyId', payload.propertyId);
      formData.append('unitId', payload.unitId);
      formData.append('tenantFirstName', payload.tenantFirstName);
      formData.append('tenantLastName', payload.tenantLastName);
      formData.append('tenantEmail', payload.tenantEmail);
      formData.append('tenantPhoneNumber', payload.tenantPhoneNumber);
      formData.append('rentAmount', String(payload.rentAmount));
      formData.append('durationYears', String(payload.durationYears));
      formData.append('rentStartDate', payload.rentStartDate);
      formData.append('rentEndDate', payload.rentEndDate);
      formData.append('rentDueDate', payload.rentDueDate);

      if (payload.rentFee !== undefined) {
        formData.append('rentFee', String(payload.rentFee));
      }
      if (payload.lateFee !== undefined) {
        formData.append('lateFee', String(payload.lateFee));
      }
      if (payload.customFees && payload.customFees.length > 0) {
        formData.append('customFees', JSON.stringify(payload.customFees));
      }

      if (payload.contractFile) {
        formData.append('contract', {
          uri: payload.contractFile.uri,
          name: payload.contractFile.name || 'contract.pdf',
          type: payload.contractFile.type || 'application/pdf',
        } as any);
      }

      if (payload.receiptFile) {
        formData.append('receipt', {
          uri: payload.receiptFile.uri,
          name: payload.receiptFile.name || 'receipt.pdf',
          type: payload.receiptFile.type || 'application/pdf',
        } as any);
      }

      const response = await api.postForm<{ success: boolean; message: string; data: TenancyData }>(
        '/tenancies/existing',
        formData
      );

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [POST /api/v1/tenancies/existing] SUCCESS RESPONSE:');
      console.log(JSON.stringify(response, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return response.data;
    } catch (err: any) {
      console.error('❌ [POST /api/v1/tenancies/existing] ERROR RESPONSE:', {
        message: err.message,
        statusCode: err.statusCode,
        details: err.details,
      });
      return rejectWithValue(err.message || 'Failed to record existing tenancy');
    }
  }
);

// 3. Get Tenancy Breakdown (GET /api/v1/tenancies/{id}/breakdown)
export const fetchTenancyBreakdown = createAsyncThunk(
  'tenancy/fetchBreakdown',
  async (tenancyId: string, { rejectWithValue }) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 [GET /api/v1/tenancies/${tenancyId}/breakdown] FETCHING BREAKDOWN`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const response = await api.get<{ success: boolean; data: TenancyBreakdown }>(
        `/tenancies/${tenancyId}/breakdown`
      );

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ [GET /api/v1/tenancies/${tenancyId}/breakdown] RESPONSE:`);
      console.log(JSON.stringify(response, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return response.data;
    } catch (err: any) {
      console.error(`❌ [GET /api/v1/tenancies/${tenancyId}/breakdown] ERROR:`, err);
      return rejectWithValue(err.message || 'Failed to fetch tenancy breakdown');
    }
  }
);

// 4. Create Tenancy Payment (POST /api/v1/tenancies/{id}/payment)
export const createTenancyPayment = createAsyncThunk(
  'tenancy/createPayment',
  async (
    { tenancyId, direction }: { tenancyId: string; direction?: 'wallet' | 'direct_bank' },
    { rejectWithValue }
  ) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 [POST /api/v1/tenancies/${tenancyId}/payment] INITIALIZING PAYMENT:`);
      console.log({ direction: direction || 'wallet' });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const response = await api.post<{
        success: boolean;
        message?: string;
        data: {
          paymentLink?: string;
          authorizationUrl?: string;
          reference?: string;
          amount?: number;
          direction?: string;
          expiresInHours?: number;
        };
      }>(`/tenancies/${tenancyId}/payment`, { direction: direction || 'wallet' });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ [POST /api/v1/tenancies/${tenancyId}/payment] RESPONSE:`);
      console.log(JSON.stringify(response, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return response.data;
    } catch (err: any) {
      console.error(`❌ [POST /api/v1/tenancies/${tenancyId}/payment] ERROR:`, err);
      return rejectWithValue(err.message || 'Failed to initialize payment');
    }
  }
);

// 5. Simulate Tenancy Payment (POST /api/v1/tenancies/{id}/simulate-payment)
export const simulateTenancyPayment = createAsyncThunk(
  'tenancy/simulatePayment',
  async (
    { tenancyId, direction }: { tenancyId: string; direction?: 'wallet' | 'direct_bank' },
    { rejectWithValue }
  ) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 [POST /api/v1/tenancies/${tenancyId}/simulate-payment] SETTLING PAYMENT:`);
      console.log({ direction: direction || 'wallet' });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const response = await api.post<{
        success?: boolean;
        status?: string;
        message?: string;
        tenancyStatus?: string;
        data?: any;
      }>(`/tenancies/${tenancyId}/simulate-payment`, { direction: direction || 'wallet' });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ [POST /api/v1/tenancies/${tenancyId}/simulate-payment] RESPONSE:`);
      console.log(JSON.stringify(response, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return response?.data || response;
    } catch (err: any) {
      console.error(`❌ [POST /api/v1/tenancies/${tenancyId}/simulate-payment] ERROR:`, err);
      return rejectWithValue(err.message || 'Failed to simulate payment');
    }
  }
);

// 6. Upload Signed Contract (POST /api/v1/tenancies/{id}/signed-contract)
export const uploadSignedContract = createAsyncThunk(
  'tenancy/uploadSignedContract',
  async (
    {
      tenancyId,
      file,
    }: {
      tenancyId: string;
      file: { uri: string; name: string; type: string };
    },
    { rejectWithValue }
  ) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 [POST /api/v1/tenancies/${tenancyId}/signed-contract] UPLOADING SIGNED CONTRACT:`);
      console.log({
        tenancyId,
        fileName: file.name,
        fileType: file.type,
        fileUri: file.uri,
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const formData = new FormData();
      formData.append('signedContract', {
        uri: file.uri,
        name: file.name || 'signed_contract.pdf',
        type: file.type || 'application/pdf',
      } as any);

      const response = await api.postForm<{ success: boolean; message: string; data: TenancyData }>(
        `/tenancies/${tenancyId}/signed-contract`,
        formData
      );

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ [POST /api/v1/tenancies/${tenancyId}/signed-contract] SUCCESS RESPONSE:`);
      console.log(JSON.stringify(response, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return response.data;
    } catch (err: any) {
      console.error(`❌ [POST /api/v1/tenancies/${tenancyId}/signed-contract] ERROR:`, err);
      return rejectWithValue(err.message || 'Failed to upload signed contract');
    }
  }
);

// 6. Get Tenancy Profile by ID (GET /api/v1/tenancies/{id})
export const fetchTenancyById = createAsyncThunk(
  'tenancy/fetchById',
  async (tenancyId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{ success: boolean; data: any }>(
        `/tenancies/${tenancyId}`
      );
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch tenancy details');
    }
  }
);

const tenancySlice = createSlice({
  name: 'tenancy',
  initialState,
  reducers: {
    clearTenancyState: (state) => {
      state.currentTenancy = null;
      state.breakdown = null;
      state.paymentLink = null;
      state.error = null;
      state.isSubmitting = false;
    },
    setCurrentTenancy: (state, action) => {
      state.currentTenancy = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // createNewTenancy
      .addCase(createNewTenancy.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createNewTenancy.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentTenancy = action.payload;
      })
      .addCase(createNewTenancy.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      // createExistingTenancy
      .addCase(createExistingTenancy.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createExistingTenancy.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentTenancy = action.payload;
      })
      .addCase(createExistingTenancy.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      // fetchTenancyBreakdown
      .addCase(fetchTenancyBreakdown.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTenancyBreakdown.fulfilled, (state, action) => {
        state.isLoading = false;
        state.breakdown = action.payload;
      })
      .addCase(fetchTenancyBreakdown.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // createTenancyPayment
      .addCase(createTenancyPayment.fulfilled, (state, action) => {
        state.paymentLink =
          action.payload.paymentLink || action.payload.authorizationUrl || null;
      });
  },
});

export const { clearTenancyState, setCurrentTenancy } = tenancySlice.actions;
export default tenancySlice.reducer;
