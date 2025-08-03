// sdaw/hooks/useUserProfile.ts
import { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { Listing } from '../components/cards/ProductCard';
import { UserProfile } from '../components/context/AuthContext';
import { Review } from '../components/profile/ReviewsSection';
import { supabase } from '../supabase';

export const useUserProfile = (profileId?: string, session?: Session | null) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());

    const fetchData = useCallback(async () => {
        if (!profileId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        try {
            // Perform all data fetching in parallel for better performance
            const [
                userRes,
                listingsRes,
                reviewsRes,
                followerCountRes,
                followingCountRes,
                followingStatusRes,
                existingReviewRes,
                favoritesRes
            ] = await Promise.all([
                supabase.from('users').select('*').eq('id', profileId).single(),
                supabase.from('listings').select('*, click_count').eq('user_id', profileId).order('created_at', { ascending: false }),
                supabase.from('reviews').select('*, reviewer:users!reviewer_id(id, fullName, profilePhotoUrl)').eq('reviewee_id', profileId).order('created_at', { ascending: false }),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId),
                session?.user ? supabase.from('follows').select().eq('follower_id', session.user.id).eq('following_id', profileId) : Promise.resolve({ data: [] }),
                session?.user ? supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewer_id', session.user.id).eq('reviewee_id', profileId) : Promise.resolve({ count: 0 }),
                session?.user ? supabase.from('favorites').select('listing_id').eq('user_id', session.user.id) : Promise.resolve({ data: [] })
            ]);

            // Set state based on fetched data
            if (userRes.data) setUser(userRes.data);
            if (listingsRes.data) setListings(listingsRes.data);
            if (reviewsRes.data) setReviews(reviewsRes.data as any);
            setFollowerCount(followerCountRes.count ?? 0);
            setFollowingCount(followingCountRes.count ?? 0);
            setIsFollowing((followingStatusRes.data?.length ?? 0) > 0);
            if(existingReviewRes) setHasReviewed((existingReviewRes.count ?? 0) > 0);
            if(favoritesRes.data) setFavoritedIds(new Set(favoritesRes.data.map(f => f.listing_id)));

        } catch (error) {
            console.error("Error fetching user profile data:", error);
        } finally {
            setLoading(false);
        }
    }, [profileId, session?.user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Return all the state and a refetch function
    return {
        user,
        listings,
        reviews,
        loading,
        isFollowing,
        followerCount,
        followingCount,
        hasReviewed,
        favoritedIds,
        setReviews,
        setFollowerCount,
        setIsFollowing,
        setFavoritedIds,
        refetch: fetchData
    };
};