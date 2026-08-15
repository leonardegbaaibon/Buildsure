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

export const uploadPropertyImages = createAsyncThunk<any, { propertyId: string; imageUris: (string | { uri: string })[] }>(
  'properties/uploadPropertyImages',
  async ({ propertyId, imageUris }, { rejectWithValue }) => {
    try {
      const token = await authService.getSessionToken();
      const formData = new FormData();

      if (Array.isArray(imageUris)) {
        imageUris.forEach((item: any, index: number) => {
          if (!item) return;

          let uriString = '';
          if (typeof item === 'string') {
            uriString = item;
          } else if (typeof item === 'object' && typeof item.uri === 'string') {
            uriString = item.uri;
          } else if (item && typeof item === 'object') {
            uriString = item.uri || item.localUri || item.path || '';
          }

          if (!uriString || typeof uriString !== 'string') return;

          const cleanPath = uriString.split('?')[0];
          let filename = cleanPath.split('/').pop() || `image_${index + 1}.jpg`;
          if (!filename.includes('.')) {
            filename += '.jpg';
          }

          const extMatch = /\.(\w+)$/.exec(filename.toLowerCase());
          const ext = extMatch ? extMatch[1] : 'jpg';
          const mimeType = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';

          formData.append('images', {
            uri: uriString,
            name: filename,
            type: mimeType,
          } as any);
        });
      }

      console.log(`[Upload Property Images API] Uploading ${imageUris.length} image(s) for property ${propertyId}...`);
      const response = await api.postForm(`/properties/${propertyId}/images`, formData, token);
      console.log('[Upload Property Images API] Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (err: any) {
      console.error('[Upload Property Images API] Error response:', err?.details || err?.message || err);
      return rejectWithValue(err.message || 'Failed to upload property images');
    }
  }
);

export const fetchPropertyTypes = createAsyncThunk<{ value: string; label: string }[]>(
  'properties/fetchPropertyTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<any>('/reference/property-types');
      return response.data || response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch property types');
    }
  }
);

export const fetchPropertyAges = createAsyncThunk<{ value: string; label: string }[]>(
  'properties/fetchPropertyAges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<any>('/reference/property-ages');
      return response.data || response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch property ages');
    }
  }
);

export const createProperty = createAsyncThunk<Property, CreatePropertyPayload>(
  'properties/createProperty',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      // 1. Omit local image file URIs from JSON body DTO (since images are uploaded in a separate multipart step)
      const { images, ...jsonPayload } = payload;

      console.log('[Create Property API] JSON Payload:', JSON.stringify(jsonPayload, null, 2));
      const token = await authService.getSessionToken();
      const response = await api.post<{ data?: Property } | Property>('/properties', jsonPayload, token);
      console.log('[Create Property API] Response:', JSON.stringify(response, null, 2));

      const createdProperty = (response as any)?.data || (response as unknown as Property);

      // 2. Step 2: Upload images if local image URIs were provided and property ID is available
      if (images && images.length > 0 && createdProperty?.id) {
        try {
          const uploadRes: any = await dispatch(uploadPropertyImages({ propertyId: createdProperty.id, imageUris: images })).unwrap();
          const uploadedImagesList = uploadRes?.data || uploadRes;
          if (Array.isArray(uploadedImagesList) && uploadedImagesList.length > 0) {
            createdProperty.images = uploadedImagesList;
            const cover = uploadedImagesList.find((img: any) => img.displayOrder === 0) || uploadedImagesList[0];
            if (cover?.imageUrl) {
              (createdProperty as any).coverImage = cover.imageUrl;
            }
          }
        } catch (uploadErr) {
          console.warn('[Create Property] Image upload step failed:', uploadErr);
        }
      }

      return createdProperty;
    } catch (err: any) {
      console.error('[Create Property API] Error response:', err?.details || err?.message || err);
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
      // Upload property images
      .addCase(uploadPropertyImages.fulfilled, (state, action) => {
        const uploadedList = action.payload?.data || action.payload;
        if (Array.isArray(uploadedList) && action.meta?.arg?.propertyId) {
          const targetId = action.meta.arg.propertyId;
          const targetProperty = state.properties.find((p) => p.id === targetId);
          if (targetProperty) {
            (targetProperty as any).images = uploadedList;
            const cover = uploadedList.find((img: any) => img.displayOrder === 0) || uploadedList[0];
            if (cover?.imageUrl) {
              (targetProperty as any).coverImage = cover.imageUrl;
            }
          }
        }
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
