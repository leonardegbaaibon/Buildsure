import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/utils/api-client';

export interface ApiDocument {
  id: string;
  userId?: string;
  propertyId?: string;
  tenancyId?: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  publicId?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt?: string;
  property?: any;
  tenancy?: any;
}

export interface ApiContract {
  id?: string;
  tenancyId?: string;
  title?: string;
  name?: string;
  contractText?: string;
  property?: any;
  unit?: any;
  status?: string;
  createdAt?: string;
  generatedAt?: string;
  sentAt?: string | null;
}

export interface DocumentsResponseData {
  documents: ApiDocument[];
  contracts: ApiContract[];
}

interface DocumentState {
  documents: ApiDocument[];
  contracts: ApiContract[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  documents: [],
  contracts: [],
  isLoading: false,
  error: null,
};

// GET /api/v1/documents
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 [GET /api/v1/documents] FETCHING USER DOCUMENTS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const response = await api.get<{
        success: boolean;
        message: string;
        data: DocumentsResponseData;
      }>('/documents');

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [GET /api/v1/documents] SUCCESS RESPONSE:');
      console.log(JSON.stringify(response, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return response.data;
    } catch (err: any) {
      console.error('❌ [GET /api/v1/documents] ERROR:', err);
      return rejectWithValue(err.message || 'Failed to fetch documents');
    }
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearDocumentsState: (state) => {
      state.documents = [];
      state.contracts = [];
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents = action.payload?.documents || [];
        state.contracts = action.payload?.contracts || [];
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDocumentsState } = documentSlice.actions;
export default documentSlice.reducer;
