'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  initialHasLiked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function LikeButton({ 
  postId, 
  initialLikes, 
  initialHasLiked,
  size = 'md' 
}: LikeButtonProps) {
  const { supabaseUser } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!supabaseUser) {
      alert('Please sign in to like posts.');
      return;
    }

    if (loading) return;

    // Optimistic Update
    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikes(prev => newHasLiked ? prev + 1 : prev - 1);
    setLoading(true);

    try {
      if (newHasLiked) {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: supabaseUser.id });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', supabaseUser.id);
        
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Like error:', err);
      
      // If table is missing, we don't rollback the local state to avoid frustrating the user.
      // We show a clear instructional alert instead.
      if (err.message?.includes('likes') || err.code === 'PGRST205' || err.code === 'PGRST204') {
        alert('Database table "likes" is missing! 💎\n\nPlease run the SQL migration I provided in your Supabase SQL Editor to enable persistent likes.');
        // We DO NOT rollback here so the button stays red locally for this session.
        return; 
      }

      // Operational rollback for other errors (network, timeout, etc.)
      setHasLiked(!newHasLiked);
      setLikes(prev => !newHasLiked ? prev + 1 : prev - 1);
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === 'sm' ? '14px' : size === 'lg' ? '24px' : '18px';

  return (
    <button 
      onClick={handleLike}
      className={`like-button ${hasLiked ? 'active' : ''}`}
      disabled={loading}
      title={hasLiked ? 'Unlike' : 'Like'}
    >
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 24 24" 
        fill={hasLiked ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span className="like-count">{likes}</span>
    </button>
  );
}
