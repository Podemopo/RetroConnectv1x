// sdaw/app/sell-form.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PickerModal, PickerOption } from '../components/modals/PickerModal';
import { categoriesListData } from '../constants/categories';
import { supabase } from '../supabase';


// --- Types (with isCodEnabled added) ---
type ImageUpload = {
    id: string;
    uri: string;
    status: 'pending' | 'uploading' | 'uploaded' | 'error';
};

type FormState = {
    itemName: string;
    selectedCategories: string[];
    isNew: boolean;
    priceType: string;
    price: string;
    description: string;
    dealMethods: string[];
    meetupInfo: string;
    dynamicFields: Record<string, string>;
    isCodEnabled: boolean;
};

interface CategorySection {
    name: string;
    items: string[];
    isCustomSection?: boolean;
}

interface FakePickerProps {
    label: string;
    value: string;
    onPress: () => void;
    placeholder: string;
    error?: boolean;
}

// --- Constants remain the same ---
const priceTypeOptions: PickerOption[] = [
    { label: 'For Sale', value: 'For Sale' },
    { label: 'For Trade', value: 'For Trade' },
    { label: 'For Free', value: 'For Free' },
];
const dealMethodOptions: { label: string, value: string, icon: keyof typeof FontAwesome.glyphMap }[] = [
    { label: 'Meet up', value: 'Meet up', icon: 'handshake-o' },
    { label: 'Delivery', value: 'Delivery', icon: 'truck' },
];
const MAX_IMAGES = 5;


// --- Reusable Components remain the same ---
const FormCard = ({ title, children, onHeaderPress, isExpanded }: { title: string, children: React.ReactNode, onHeaderPress?: () => void, isExpanded?: boolean }) => {
    const { colors } = useTheme();
    const headerContent = (
        <View style={styles.cardToggleHeader}>
            <Text style={[styles.cardHeader, { color: colors.text }]}>{title}</Text>
            {onHeaderPress && <FontAwesome name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.text} />}
        </View>
    );

    return (
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {onHeaderPress ? (
                <TouchableOpacity onPress={onHeaderPress}>{headerContent}</TouchableOpacity>
            ) : (
                headerContent
            )}
            {children}
        </View>
    );
};

const FormField = ({ label, error, children }: { label: string, error?: boolean, children: React.ReactNode }) => {
    const { colors } = useTheme();
    return (
        <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            {children}
            {error && <Text style={styles.errorText}>This field is required.</Text>}
        </View>
    );
};

const FakePickerInput: React.FC<FakePickerProps> = ({ label, value, onPress, placeholder, error }) => {
    const { colors } = useTheme();
    return (
        <FormField label={label} error={error}>
            <TouchableOpacity
                style={[
                    styles.formInput,
                    styles.pickerInput,
                    {
                        backgroundColor: colors.background,
                        borderColor: error ? 'red' : colors.border
                    }
                ]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <Text style={[styles.pickerText, !value && { color: colors.text + '80' }]} numberOfLines={1} ellipsizeMode="tail">
                    {value || placeholder}
                </Text>
                <FontAwesome name="chevron-down" size={14} color={colors.text + '80'} />
            </TouchableOpacity>
        </FormField>
    );
};


// --- Main Screen Component ---
export default function SellFormScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const params = useLocalSearchParams<{ imageUris?: string | string[], listingId?: string }>();
    const { listingId } = params;
    const isEditMode = !!listingId;
    const initialImageUrisFromParams = params.imageUris;

    // --- State Management ---
    const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [formState, setFormState] = useState<FormState>({
        itemName: '',
        selectedCategories: [],
        isNew: true,
        priceType: 'For Sale',
        price: '',
        description: '',
        dealMethods: [],
        meetupInfo: '',
        dynamicFields: {},
        isCodEnabled: false,
    });

    const [pickingImage, setPickingImage] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [locationName, setLocationName] = useState('Fetching location...');
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isPriceTypePickerVisible, setPriceTypePickerVisible] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [userDefinedCategories, setUserDefinedCategories] = useState<string[]>([]);
    const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
    const [progress, setProgress] = useState(0);
    const [lockedCategory, setLockedCategory] = useState<string | null>(null);
    
    const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
    const [customCategoryText, setCustomCategoryText] = useState('');

    const handleFormChange = (field: keyof FormState, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleDynamicFieldChange = (field: string, value: string) => {
        setFormState(prev => ({
            ...prev,
            dynamicFields: {
                ...prev.dynamicFields,
                [field]: value,
            }
        }));
    };
    
    const isServiceSelected = useMemo(() => {
        const serviceCategory = categoriesListData.find(c => c.name === 'Services');
        if (!serviceCategory) return false;
        return formState.selectedCategories.some(selectedCat => 
            selectedCat === 'Services' || serviceCategory.items.includes(selectedCat)
        );
    }, [formState.selectedCategories]);

    useEffect(() => {
        if (isServiceSelected) {
            handleFormChange('dealMethods', []);
            handleFormChange('isCodEnabled', false);
            handleFormChange('priceType', 'For Sale'); // Services must be "For Sale"
        }
    }, [isServiceSelected]);


    const dynamicFields = useMemo(() => {
        const fields: { name: string; label: string; placeholder?: string; helperText?: string }[] = [];
        const helper = 'Use commas ( , ) to separate multiple values.';

        if (formState.selectedCategories.some(cat => categoriesListData.find(c => c.name === 'Fashion')?.items.includes(cat) || formState.selectedCategories.includes('Fashion'))) {
            fields.push({ name: 'size', label: 'Size', helperText: helper });
            fields.push({ name: 'brand', label: 'Brand', helperText: helper });
        }
        if (formState.selectedCategories.some(cat => categoriesListData.find(c => c.name === 'Electronics')?.items.includes(cat) || formState.selectedCategories.includes('Electronics'))) {
            fields.push({ name: 'model', label: 'Model' });
            fields.push({ name: 'specifications', label: 'Specifications', placeholder: 'e.g., 8GB RAM, 256GB SSD', helperText: helper });
        }
        if (formState.selectedCategories.some(cat => categoriesListData.find(c => c.name === 'Motors')?.items.includes(cat) || formState.selectedCategories.includes('Motors'))) {
            fields.push({ name: 'make', label: 'Make', placeholder: 'e.g., Toyota, Honda, etc.' });
            fields.push({ name: 'model', label: 'Model' });
        }
        if (isServiceSelected) {
            fields.push({ name: 'service_type', label: 'Service Type' });
            fields.push({ name: 'availability', label: 'Availability', helperText: helper });
        }
        return fields;
    }, [formState.selectedCategories, isServiceSelected]);

    useEffect(() => {
        const mainCategoryWithDynamicFields = categoriesListData.find(mainCat =>
            formState.selectedCategories.includes(mainCat.name) ||
            mainCat.items.some(item => formState.selectedCategories.includes(item))
        );

        if (mainCategoryWithDynamicFields) {
            setLockedCategory(mainCategoryWithDynamicFields.name);
        } else {
            setLockedCategory(null);
        }
    }, [formState.selectedCategories]);

    // --- Effects ---
    useEffect(() => {
        const fields = [
            imageUploads.length > 0,
            formState.itemName.trim().length > 2,
            formState.selectedCategories.length > 0,
            formState.description.trim().length > 10,
            (formState.priceType === 'For Sale' && parseFloat(formState.price) > 0) || (formState.priceType !== 'For Sale'),
            formState.dealMethods.length > 0 || isServiceSelected,
            (formState.dealMethods.includes('Meet up') && formState.meetupInfo.length > 2) || !formState.dealMethods.includes('Meet up'),
            locationName !== 'Fetching location...'
        ];
        const completedCount = fields.filter(Boolean).length;
        setProgress(completedCount / fields.length);
    }, [formState, imageUploads, locationName, isServiceSelected]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (isEditMode) {
                setLoading(true);
                const { data, error } = await supabase.from('listings').select('*').eq('id', listingId).single();
                if (error || !data) {
                    Alert.alert("Error", "Could not fetch listing data to edit.");
                    router.back();
                    return;
                }
                setFormState({
                    itemName: data.item_name || '',
                    selectedCategories: data.categories || [],
                    isNew: data.is_new,
                    priceType: data.price_type || 'For Sale',
                    price: data.price?.toString() || '',
                    description: data.description || '',
                    dealMethods: data.deal_method?.split(', ') || [],
                    meetupInfo: data.meetup_info || '',
                    dynamicFields: data.dynamic_fields || {},
                    isCodEnabled: data.is_cod_enabled || false,
                });
                setImageUploads(data.image_urls.map((url: string) => ({ id: url, uri: url, status: 'uploaded' })));
                setExistingImageUrls(data.image_urls);
                setLocationName(data.location_name || 'Location set');
                setLoading(false);
            } else {
                if (initialImageUrisFromParams) {
                    let parsedUris: string[] = Array.isArray(initialImageUrisFromParams)
                        ? initialImageUrisFromParams
                        : (typeof initialImageUrisFromParams === 'string' ? initialImageUrisFromParams.split(',') : []);
                    if (parsedUris.length > 0) {
                        setImageUploads(parsedUris.map(uri => ({ id: uri, uri, status: 'pending' })));
                    }
                }
                const requestLocation = async () => {
                     let { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission Denied', 'Location access is needed to list an item.');
                        setLocationName('Permission denied');
                        return;
                    }
                    try {
                        let currentLocation = await Location.getCurrentPositionAsync({});
                        setLocation(currentLocation);
                        const reverseGeocode = await Location.reverseGeocodeAsync(currentLocation.coords);
                        if (reverseGeocode.length > 0) {
                            const { city, district, subregion } = reverseGeocode[0];
                            setLocationName(`${district || city}, ${subregion}`);
                        } else {
                            setLocationName('Location found');
                        }
                    } catch (error) {
                        console.error("Error fetching location:", error);
                        setLocationName('Could not fetch location');
                    }
                };
                requestLocation();
            }
        };

        loadInitialData();
    }, [listingId, isEditMode]);

    // --- Functions ---
    const pickImage = async () => {
        if (imageUploads.length >= MAX_IMAGES) {
            Alert.alert('Maximum Reached', `You can only add up to ${MAX_IMAGES} images.`);
            return;
        }
        setPickingImage(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: MAX_IMAGES - imageUploads.length,
                quality: 0.8,
            });
            if (!result.canceled && result.assets) {
                const newUploads = result.assets.map(asset => ({ id: asset.uri, uri: asset.uri, status: 'pending' as 'pending' }));
                setImageUploads(prev => [...prev, ...newUploads]);
            }
        } catch (error) {
            console.error("ImagePicker Error: ", error);
            Alert.alert('Error', 'Could not open image library.');
        } finally {
            setPickingImage(false);
        }
    };

    const takePicture = async () => {
        if (imageUploads.length >= MAX_IMAGES) {
            Alert.alert('Maximum Reached', `You can only add up to ${MAX_IMAGES} images.`);
            return;
        }
        setPickingImage(true);
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            });
            if (!result.canceled && result.assets) {
                const newUploads = result.assets.map(asset => ({ id: asset.uri, uri: asset.uri, status: 'pending' as 'pending' }));
                setImageUploads(prev => [...prev, ...newUploads]);
            }
        } catch (error) {
            console.error("Camera Error: ", error);
            Alert.alert('Error', 'Could not open camera.');
        } finally {
            setPickingImage(false);
        }
    };

    const removeImage = (uriToRemove: string) => {
        Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => setImageUploads(prev => prev.filter(img => img.uri !== uriToRemove)) }
        ]);
    };

    const toggleDealMethod = (method: string) => {
        const newMethods = formState.dealMethods.includes(method) ? formState.dealMethods.filter(m => m !== method) : [...formState.dealMethods, method];
        handleFormChange('dealMethods', newMethods);
        if (!newMethods.includes('Meet up')) handleFormChange('meetupInfo', '');
    };

    const generateDescription = () => {
        if (formState.itemName.trim().length < 3 || formState.selectedCategories.length === 0) {
            Alert.alert("Please provide an item name and category first.");
            return;
        }
        const conditionText = formState.isNew ? "brand new" : "gently used";
        const desc = `Up for grabs is a ${conditionText} ${formState.itemName}. Perfect for anyone interested in ${formState.selectedCategories.join(', ')}. In excellent condition and ready for a new home!`;
        handleFormChange('description', desc);
    };

    const validateForm = () => {
        const errors: Record<string, boolean> = {};
        if (imageUploads.length === 0) errors.images = true;
        if (formState.itemName.trim().length < 3) errors.itemName = true;
        if (formState.selectedCategories.length === 0) errors.categories = true;
        if (formState.priceType === 'For Sale' && (!formState.price || parseFloat(formState.price) <= 0)) errors.price = true;
        if (formState.description.trim().length < 10) errors.description = true;
        if (!isServiceSelected && formState.dealMethods.length === 0) errors.dealMethods = true;
        if (formState.dealMethods.includes('Meet up') && formState.meetupInfo.trim().length < 3) errors.meetupInfo = true;

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            Alert.alert('Missing Information', 'Please fill out all required fields.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { Alert.alert('Not Authenticated', 'You must be logged in to list an item.'); return; }
        if (!isEditMode && !location) { Alert.alert('Location Not Found', 'Could not determine your location.'); return; }

        setIsUploading(true);
        const newImageUploads = imageUploads.filter(img => !img.uri.startsWith('http'));
        const remainingOldUrls = imageUploads.filter(img => img.uri.startsWith('http')).map(img => img.uri);
        const uploadedUrls: string[] = [...remainingOldUrls];
        let uploadFailed = false;

        for (const [index, image] of newImageUploads.entries()) {
            setImageUploads(current => current.map((img) => (img.id === image.id ? { ...img, status: 'uploading' } : img)));
            try {
                const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: FileSystem.EncodingType.Base64 });
                const arrayBuffer = decode(base64);
                const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
                const filePath = `${user.id}/${new Date().getTime()}_${index}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('itemimages').upload(filePath, arrayBuffer, { contentType: `image/${fileExt}` });
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('itemimages').getPublicUrl(filePath);
                uploadedUrls.push(data.publicUrl);
                setImageUploads(current => current.map((img) => (img.id === image.id ? { ...img, status: 'uploaded' } : img)));
            } catch (error) {
                console.error("Image upload error:", error);
                uploadFailed = true;
                setImageUploads(current => current.map((img) => (img.id === image.id ? { ...img, status: 'error' } : img)));
                break;
            }
        }

        const urlsToRemove = existingImageUrls.filter(url => !uploadedUrls.includes(url));
        if (urlsToRemove.length > 0) {
            const filePathsToRemove = urlsToRemove.map(url => url.substring(url.lastIndexOf('/itemimages/') + '/itemimages/'.length));
            await supabase.storage.from('itemimages').remove(filePathsToRemove);
        }

        setIsUploading(false);

        if (uploadFailed) { Alert.alert('Upload Failed', 'One or more images failed to upload. Please try again.'); return; }

        setLoading(true);
        const listingData = {
            user_id: user.id,
            item_name: formState.itemName,
            categories: formState.selectedCategories,
            is_new: formState.isNew,
            price_type: formState.priceType,
            price: formState.priceType === 'For Sale' ? parseFloat(formState.price) : null,
            description: formState.description,
            deal_method: isServiceSelected ? 'Message Only' : formState.dealMethods.join(', '),
            meetup_info: formState.meetupInfo || null,
            image_urls: uploadedUrls,
            dynamic_fields: formState.dynamicFields,
            is_cod_enabled: isServiceSelected ? false : formState.isCodEnabled,
            ...(isEditMode ? {} : {
                location: `POINT(${location!.coords.longitude} ${location!.coords.latitude})`,
                location_name: locationName,
            })
        };

        try {
            let error;
            if (isEditMode) {
                const { error: updateError } = await supabase.from('listings').update(listingData).eq('id', listingId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('listings').insert(listingData);
                error = insertError;
            }

            if (error) throw error;
            Alert.alert(isEditMode ? 'Success!' : 'Success!', isEditMode ? 'Your listing has been updated.' : 'Your item has been listed.');
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error("Error saving item:", error);
            Alert.alert(isEditMode ? 'Error Updating Item' : 'Error Listing Item', error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Render Functions ---
    const renderImageListItem = useCallback(({ item }: { item: ImageUpload }) => {
        return (
            <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: item.uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(item.uri)}>
                    <FontAwesome name="times-circle" size={24} color="#FFF" style={styles.removeImageIcon} />
                </TouchableOpacity>
                {item.status === 'uploading' && <View style={styles.imageOverlay}><ActivityIndicator size="small" color="#FFF" /></View>}
                {item.status === 'uploaded' && <View style={[styles.imageOverlay, { backgroundColor: 'rgba(46, 204, 64, 0.7)' }]}><FontAwesome name="check" size={20} color="#FFF" /></View>}
                {item.status === 'error' && <View style={[styles.imageOverlay, { backgroundColor: 'rgba(255, 65, 54, 0.7)' }]}><FontAwesome name="times" size={20} color="#FFF" /></View>}
            </View>
        );
    }, []);

    const displayableCategorySections = useMemo(() => {
        const query = (categorySearchQuery || '').toLowerCase().trim();
        let finalSections: CategorySection[] = categoriesListData
            .map(section => ({...section, items: section.items.filter(item => item.toLowerCase().includes(query))}))
            .filter(section => section.items.length > 0 || section.name.toLowerCase().includes(query));
        const matchingUserCategories = userDefinedCategories.filter(cat => cat.toLowerCase().includes(query));
        if (matchingUserCategories.length > 0) {
            finalSections.push({ name: "Your Added Categories", items: matchingUserCategories, isCustomSection: true });
        }
        return finalSections;
    }, [categorySearchQuery, userDefinedCategories]);

    const handleCategoryToggle = (categoryItem: string) => handleFormChange('selectedCategories', formState.selectedCategories.includes(categoryItem) ? formState.selectedCategories.filter(item => item !== categoryItem) : [...formState.selectedCategories, categoryItem]);
    
    const handleStartAddCustom = () => {
        setCategorySearchQuery('');
        setIsAddingCustomCategory(true);
    };

    const handleConfirmAddCustom = () => {
        const newCat = customCategoryText.trim();
        if (newCat) {
            if (!userDefinedCategories.includes(newCat)) {
                setUserDefinedCategories(prev => [...prev, newCat]);
            }
            if (!formState.selectedCategories.includes(newCat)) {
                handleFormChange('selectedCategories', [...formState.selectedCategories, newCat]);
            }
        }
        setCustomCategoryText('');
        setIsAddingCustomCategory(false);
    };

    const handleCancelAddCustom = () => {
        setCustomCategoryText('');
        setIsAddingCustomCategory(false);
    };

    const closeModalAndResetSearch = () => { 
        setCategoryModalVisible(false); 
        setCategorySearchQuery(''); 
        setIsAddingCustomCategory(false);
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={{ backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
                    <View style={styles.headerBar}>
                        <TouchableOpacity onPress={() => router.back()}><FontAwesome name="arrow-left" size={20} color={colors.text} /></TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditMode ? 'Edit Listing' : 'Create Listing'}</Text>
                        <View style={{ width: 20 }} />
                    </View>
                    {!isEditMode && <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
                    </View>}
                </View>

                <ScrollView style={styles.screenContainer} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
                    <FormCard title="Item Details">
                        <FormField label="Photos*" error={validationErrors.images}>
                            <FlatList
                                horizontal
                                data={imageUploads}
                                renderItem={renderImageListItem}
                                keyExtractor={(item, index) => `${item.id}-${index}`}
                                ListFooterComponent={
                                    imageUploads.length < MAX_IMAGES ? (
                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity style={[styles.addPhotoThumbnail, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={pickImage} disabled={pickingImage}>
                                                {pickingImage ? <ActivityIndicator color={colors.primary} /> : <FontAwesome name="photo" size={24} color={colors.text + '80'} />}
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.addPhotoThumbnail, { borderColor: colors.border, backgroundColor: colors.card, marginLeft: 10 }]} onPress={takePicture} disabled={pickingImage}>
                                                {pickingImage ? <ActivityIndicator color={colors.primary} /> : <FontAwesome name="camera" size={24} color={colors.text + '80'} />}
                                            </TouchableOpacity>
                                        </View>
                                    ) : null
                                }
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.horizontalImageScrollContent}
                            />
                        </FormField>
                        <FormField label="Item Name*" error={validationErrors.itemName}>
                            <TextInput style={[styles.formInput, { backgroundColor: colors.background, borderColor: validationErrors.itemName ? 'red' : colors.border, color: colors.text }]} value={formState.itemName} onChangeText={(v) => handleFormChange('itemName', v)} placeholder="What are you selling?" placeholderTextColor={colors.text + '80'}/>
                        </FormField>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <FakePickerInput label="Category(s)*" value={formState.selectedCategories.join(', ')} onPress={() => setCategoryModalVisible(true)} placeholder="Select..." error={validationErrors.categories} />
                            </View>
                            <View style={{ width: 16 }} />
                            <View style={{ flex: 1 }}>
                                <FormField label="Condition">
                                    <View style={styles.segmentedControl}>
                                        <TouchableOpacity style={[styles.segment, formState.isNew && { backgroundColor: colors.primary }]} onPress={() => handleFormChange('isNew', true)}>
                                            <Text style={[styles.segmentText, { color: formState.isNew ? colors.card : colors.text }]}>New</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.segment, !formState.isNew && { backgroundColor: colors.primary }]} onPress={() => handleFormChange('isNew', false)}>
                                            <Text style={[styles.segmentText, { color: !formState.isNew ? colors.card : colors.text }]}>Used</Text>
                                        </TouchableOpacity>
                                    </View>
                                </FormField>
                            </View>
                        </View>
                        {dynamicFields.map(field => (
                            <FormField key={field.name} label={field.label}>
                                <TextInput
                                    style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                    value={formState.dynamicFields[field.name] || ''}
                                    onChangeText={(v) => handleDynamicFieldChange(field.name, v)}
                                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                    placeholderTextColor={colors.text + '80'}
                                />
                                {field.helperText && <Text style={[styles.helperText, {color: colors.text + '99'}]}>{field.helperText}</Text>}
                            </FormField>
                        ))}
                        <FormField label="Description*" error={validationErrors.description}>
                            <View>
                                <TextInput style={[styles.formInput, styles.textArea, { backgroundColor: colors.background, borderColor: validationErrors.description ? 'red' : colors.border, color: colors.text }]} value={formState.description} onChangeText={(v) => handleFormChange('description', v)} placeholder="Describe your item..." placeholderTextColor={colors.text + '80'} multiline/>
                                <TouchableOpacity style={styles.aiButton} onPress={generateDescription}>
                                    <FontAwesome name="magic" size={16} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </FormField>
                    </FormCard>

                    <FormCard title="Deal & Logistics">
                        <View style={styles.collapsibleContent}>
                            <FormField label="Listing Type*">
                                <PickerModal visible={isPriceTypePickerVisible} onClose={() => setPriceTypePickerVisible(false)} title="Select Listing Type" options={priceTypeOptions} selectedValue={formState.priceType} onSelect={(value) => { handleFormChange('priceType', value); if (value !== 'For Sale') { handleFormChange('price', ''); } }}/>
                                <TouchableOpacity onPress={() => !isServiceSelected && setPriceTypePickerVisible(true)} style={[styles.formInput, styles.pickerInput, { backgroundColor: colors.background, borderColor: colors.border }, isServiceSelected && styles.disabledInput]}><Text style={[styles.pickerText]}>{formState.priceType}</Text><FontAwesome name="chevron-down" size={14} color={colors.text + '80'} /></TouchableOpacity>
                            </FormField>

                            {formState.priceType === 'For Sale' && (
                                <FormField label="Price*" error={validationErrors.price}>
                                    <TextInput style={[styles.formInput, { backgroundColor: colors.background, borderColor: validationErrors.price ? 'red' : colors.border, color: colors.text }]} value={formState.price} onChangeText={(v) => handleFormChange('price', v)} placeholder="e.g., 1500" placeholderTextColor={colors.text + '80'} keyboardType="numeric"/>
                                </FormField>
                            )}
                            
                            {!isServiceSelected && (
                                <>
                                    {formState.priceType === 'For Sale' && (
                                        <View style={styles.codToggleContainer}>
                                            <Text style={[styles.label, {flex: 1, marginBottom: 0}]}>Accept Cash on Delivery (COD)?</Text>
                                            <Switch
                                                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                                thumbColor={formState.isCodEnabled ? colors.primary : colors.card}
                                                onValueChange={(value) => handleFormChange('isCodEnabled', value)}
                                                value={formState.isCodEnabled}
                                            />
                                        </View>
                                    )}

                                    <FormField label="Deal Method*" error={validationErrors.dealMethods}>
                                        <View style={styles.row}>
                                            {dealMethodOptions.map((opt) => (
                                                <TouchableOpacity key={opt.value} style={[styles.dealMethodButton, { flex: 1, backgroundColor: formState.dealMethods.includes(opt.value) ? colors.primary+'20' : colors.background, borderColor: formState.dealMethods.includes(opt.value) ? colors.primary : colors.border }]} onPress={() => toggleDealMethod(opt.value)}>
                                                    <FontAwesome name={opt.icon} size={16} color={formState.dealMethods.includes(opt.value) ? colors.primary : colors.text} />
                                                    <Text style={[styles.dealMethodText, { color: formState.dealMethods.includes(opt.value) ? colors.primary : colors.text }]}>{opt.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </FormField>
                                </>
                            )}
                            
                            {isServiceSelected && (
                                <View style={styles.serviceInfoBox}>
                                    <FontAwesome name="info-circle" size={18} color={colors.primary} />
                                    <Text style={styles.serviceInfoText}>"Services" are message-only. Buyers will contact you to arrange details.</Text>
                                </View>
                            )}


                            {formState.dealMethods.includes('Meet up') && (
                                <FormField label="Preferred Meet-up Locations*" error={validationErrors.meetupInfo}>
                                    <TextInput style={[styles.formInput, { backgroundColor: colors.background, borderColor: validationErrors.meetupInfo ? 'red' : colors.border, color: colors.text }]} value={formState.meetupInfo} onChangeText={(v) => handleFormChange('meetupInfo', v)} placeholder="e.g., SM Megamall, Trinoma" placeholderTextColor={colors.text + '80'}/>
                                </FormField>
                            )}

                            <FormField label="Item Location">
                                <View style={[styles.formInput, styles.locationInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <FontAwesome name="map-marker" size={16} color={colors.text + '80'} />
                                    <Text style={[styles.pickerText, { marginLeft: 8 }]}>{locationName}</Text>
                                </View>
                            </FormField>
                        </View>
                    </FormCard>
                </ScrollView>

                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={[styles.publishButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={loading || isUploading}>
                        {loading || isUploading ? <ActivityIndicator color={colors.card} /> : <Text style={[styles.publishButtonText, { color: colors.card }]}>{isEditMode ? 'Save Changes' : 'Publish Listing'}</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal animationType="slide" visible={isCategoryModalVisible} onRequestClose={closeModalAndResetSearch}>
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
                        <View style={styles.modalInnerContent}>
                            <Text style={[styles.modalHeader, { color: colors.text }]}>
                                {isAddingCustomCategory ? 'Add Custom Category' : 'Select Category(s)'}
                            </Text>
                            
                            {isAddingCustomCategory ? (
                                <View>
                                    <TextInput
                                        style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Your custom category name"
                                        value={customCategoryText}
                                        onChangeText={setCustomCategoryText}
                                        autoFocus={true}
                                        returnKeyType="done"
                                        onSubmitEditing={handleConfirmAddCustom}
                                    />
                                    <View style={styles.customCategoryActions}>
                                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton, {borderColor: colors.border}]} onPress={handleCancelAddCustom}>
                                            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleConfirmAddCustom}>
                                            <Text style={[styles.buttonText, { color: colors.card }]}>Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <TextInput 
                                      style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                                      placeholder="Search or add your own..." 
                                      placeholderTextColor={colors.text + '80'} 
                                      value={categorySearchQuery} 
                                      onChangeText={setCategorySearchQuery}
                                    />
                                    <FlatList
                                        data={displayableCategorySections}
                                        keyExtractor={(section) => section.name}
                                        renderItem={({ item: section }: { item: CategorySection }) => {
                                            const isDisabled = lockedCategory !== null && lockedCategory !== section.name && !section.isCustomSection;
                                            const isMainCategorySelected = formState.selectedCategories.includes(section.name);
                                            return (
                                                <View style={isDisabled && styles.disabledCategory}>
                                                    <TouchableOpacity 
                                                        style={[styles.modalMainCategoryTouchable, isMainCategorySelected && styles.modalItemSelected]}
                                                        onPress={() => handleCategoryToggle(section.name)}
                                                        disabled={isDisabled}
                                                    >
                                                        <Text style={[
                                                            section.isCustomSection ? [styles.modalUserCategoryHeader, { color: colors.text, borderTopColor: colors.border }] : [styles.modalMainCategory, { color: colors.primary }],
                                                            isMainCategorySelected && [styles.modalItemSelectedText, { color: colors.primary }]
                                                        ]}>
                                                            {section.name}
                                                        </Text>
                                                        {isMainCategorySelected && <FontAwesome name="check-circle" size={20} color={colors.primary} />}
                                                    </TouchableOpacity>

                                                    {section.items.map((categoryItem: string) => {
                                                        const isSelected = formState.selectedCategories.includes(categoryItem);
                                                        return (
                                                            <TouchableOpacity key={categoryItem} style={[styles.modalItem, { borderBottomColor: colors.border }, isSelected && [styles.modalItemSelected, { backgroundColor: colors.background }]]} onPress={() => handleCategoryToggle(categoryItem)} disabled={isDisabled}>
                                                                <Text style={[styles.modalItemText, { color: colors.text }, isSelected && [styles.modalItemSelectedText, { color: colors.primary }]]}>{categoryItem}</Text>
                                                                {isSelected && <FontAwesome name="check-circle" size={20} color={colors.primary} />}
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            )
                                        }}
                                        ListEmptyComponent={<View style={styles.emptyListContainer}><Text style={[styles.emptyListText, { color: colors.text }]}>No categories found.</Text></View>}
                                        showsVerticalScrollIndicator={false}
                                        style={styles.flatListStyle}
                                        extraData={{selected: formState.selectedCategories, locked: lockedCategory}}
                                    />
                                    <TouchableOpacity style={[styles.addOwnCategoryButton, { borderTopColor: colors.border }]} onPress={handleStartAddCustom}>
                                        <FontAwesome name="plus-circle" size={18} color={colors.primary} />
                                        <Text style={[styles.addOwnCategoryText, { color: colors.primary }]}>Add your own category</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.button, styles.modalConfirmButton, { backgroundColor: colors.primary }]} onPress={closeModalAndResetSearch}>
                                        <Text style={[styles.buttonText, { color: colors.card }]}>Done</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    codToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
        paddingVertical: 8,
    },
    safeArea: {
        flex: 1,
    },
    screenContainer: { flex: 1 },
    contentContainer: { padding: 16 },
    headerBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 56,
    },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    progressBarContainer: { height: 4, backgroundColor: '#E5E7EB' },
    progressBar: { height: 4 },
    formCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
    cardHeader: { fontSize: 18, fontWeight: 'bold' },
    cardToggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    collapsibleContent: { paddingTop: 16 },
    fieldGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
    formInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, height: 48, justifyContent: 'center' },
    textArea: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12, height: 'auto' },
    pickerInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerText: { fontSize: 16, flex: 1 },
    row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
    segmentedControl: {
        flexDirection: 'row', borderWidth: 1, borderColor: '#E5E7EB',
        borderRadius: 8, overflow: 'hidden', height: 48,
    },
    segment: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    segmentText: { fontSize: 14, fontWeight: '600' },
    dealMethodButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 8, borderWidth: 1,
    },
    dealMethodText: { marginLeft: 8, fontSize: 14, fontWeight: '500' },
    locationInput: { flexDirection: 'row', alignItems: 'center' },
    horizontalImageScrollContent: { paddingVertical: 4 },
    imagePreviewContainer: { width: 100, height: 100, marginRight: 12, borderRadius: 8 },
    imagePreview: { width: '100%', height: '100%', borderRadius: 8 },
    removeImageButton: {
        position: 'absolute', top: 4, right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
        width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    },
    removeImageIcon: { textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
    addPhotoThumbnail: {
        width: 100, height: 100, borderRadius: 8,
        borderWidth: 2, borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center',
    },
    imageOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    footer: {
        padding: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
    },
    publishButton: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    publishButtonText: { fontSize: 16, fontWeight: 'bold' },
    errorText: { color: 'red', fontSize: 12, marginTop: 4 },
    aiButton: { position: 'absolute', top: 12, right: 12 },
    helperText: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 2,
        fontStyle: 'italic',
    },
    // Modal Styles
    modalContainer: { flex: 1 },
    keyboardAvoidingView: { flex: 1 },
    modalInnerContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    modalHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    searchInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 16, marginBottom: 20 },
    flatListStyle: { flex: 1 },
    modalMainCategory: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, paddingLeft: 5 },
    modalMainCategoryTouchable: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5 },
    modalUserCategoryHeader: { fontSize: 17, fontWeight: '600', marginTop: 20, marginBottom: 10, paddingLeft: 5, borderTopWidth: 1, paddingTop: 15 },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10, borderBottomWidth: 1 },
    modalItemSelected: { borderRadius: 6 },
    modalItemText: { fontSize: 16, flex: 1 },
    modalItemSelectedText: { fontWeight: 'bold' },
    emptyListContainer: { alignItems: 'center', paddingVertical: 30 },
    emptyListText: { textAlign: 'center', marginTop: 8, fontSize: 16 },
    addOwnCategoryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, marginTop: 15, borderTopWidth: 1 },
    addOwnCategoryText: { fontSize: 16, marginLeft: 10, fontWeight: '500' },
    modalConfirmButton: { marginTop: 20, paddingVertical: 16, borderRadius: 8 },
    button: { borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontSize: 16, fontWeight: '600' },
    disabledCategory: {
        opacity: 0.4,
    },
    customCategoryActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelButton: {
        borderWidth: 1.5,
    },
    serviceInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#E6F7FF', // A light blue color
        marginBottom: 16,
    },
    serviceInfoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    disabledInput: {
        backgroundColor: '#f0f0f0', // A light gray to indicate disabled
        opacity: 0.6,
    },
});
