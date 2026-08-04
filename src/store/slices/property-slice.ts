import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Property,
  PropertyListItem,
  PropertyHeaderStats,
  PropertiesApiResponse,
  CreatePropertyPayload,
} from '@/types/property';
import { api } from '@/utils/api-client';
import { authService } from '@/utils/auth-service';

export interface PropertyState {
  properties: (Property | PropertyListItem)[];
  headerStats: PropertyHeaderStats | null;
  selectedProperty: Property | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: PropertyState = {
  properties: [],
  headerStats: null,
  selectedProperty: null,
  status: 'idle',
  error: null,
};

// Async Thunks for API Calls
export const fetchProperties = createAsyncThunk<
  { header?: PropertyHeaderStats; properties: (Property | PropertyListItem)[] },
  string | undefined
>(
  'properties/fetchProperties',
  async (status, { rejectWithValue }) => {
    try {
      const token = await authService.getSessionToken();
      const endpoint = status ? `/properties?status=${status}` : '/properties';
      const response = await api.get<PropertiesApiResponse | any>(endpoint, token);
      
      if (response && response.data) {
        return {
          header: response.data.header,
          properties: response.data.properties || [],
        };
      }
      
      const propertiesList = Array.isArray(response) ? response : response.properties || [];
      return { properties: propertiesList };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch properties');
    }
  }
);

export const fetchPropertyById = createAsyncThunk<Property, string>(
  'properties/fetchPropertyById',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data?: Property }> (`/properties/${propertyId}`);
      return response.data || (response as unknown as Property);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch property details');
    }
  }
);

export const createProperty = createAsyncThunk<Property, CreatePropertyPayload>(
  'properties/createProperty',
  async (payload, { rejectWithValue }) => {
    try {
      const token = await authService.getSessionToken();
      const response = await api.post<{ data?: Property }>('/properties', payload, token);
      return response.data || (response as unknown as Property);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create property');
    }
  }
);

export const updateProperty = createAsyncThunk<Property, { id: string; payload: Partial<CreatePropertyPayload> }>(
  'properties/updateProperty',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await api.put<{ data?: Property }>(`/properties/${id}`, payload);
      return response.data || (response as unknown as Property);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update property');
    }
  }
);

export const deleteProperty = createAsyncThunk<string, string>(
  'properties/deleteProperty',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/properties/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete property');
    }
  }
);

export const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setSelectedProperty: (state, action: PayloadAction<Property | null>) => {
      state.selectedProperty = action.payload;
    },
    addLocalProperty: (state, action: PayloadAction<Property>) => {
      state.properties.unshift(action.payload);
    },
    clearPropertyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch properties
      .addCase(fetchProperties.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.properties = action.payload.properties;
        if (action.payload.header) {
          state.headerStats = action.payload.header;
        }
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch property by id
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.selectedProperty = action.payload;
      })
      // Create property
      .addCase(createProperty.fulfilled, (state, action) => {
        state.properties.unshift(action.payload);
        state.selectedProperty = action.payload;
      })
      // Update property
      .addCase(updateProperty.fulfilled, (state, action) => {
        const index = state.properties.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.properties[index] = action.payload;
        }
        if (state.selectedProperty?.id === action.payload.id) {
          state.selectedProperty = action.payload;
        }
      })
      // Delete property
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.properties = state.properties.filter((p) => p.id !== action.payload);
        if (state.selectedProperty?.id === action.payload) {
          state.selectedProperty = null;
        }
      });
  },
});

export const { setSelectedProperty, addLocalProperty, clearPropertyError } = propertySlice.actions;

export default propertySlice.reducer;
