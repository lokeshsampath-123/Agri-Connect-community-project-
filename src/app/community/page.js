'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';
import FallbackImage from '@/components/FallbackImage';
import { getAssetUrl } from '@/lib/assets';

// AP Only Districts
const AP_DISTRICTS = [
  'Guntur',
  'Kurnool',
  'Krishna',
  'Anantapur',
  'Visakhapatnam (Vizag)',
  'Nellore',
  'Chittoor',
  'Prakasam',
  'Srikakulam',
  'Vizianagaram',
  'West Godavari',
  'East Godavari',
  'Kadapa (YSR Kadapa)'
];

// AP Only Crops for dropdowns
const AP_CROPS = [
  'Paddy',
  'Cotton',
  'Chillies',
  'Mangoes',
  'Groundnut',
  'Sugarcane',
  'Maize',
  'Bengal Gram',
  'Tobacco',
  'Tomatoes',
  'Turmeric',
  'Cashews',
  'Onions',
  'Sunflower',
  'General'
];

export default function Community() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Filters
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [filterCrop, setFilterCrop] = useState('All');

  // New Post Form
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCrop, setPostCrop] = useState('General');
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // Selected Post Detail Modal State
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [postComments, setPostComments] = useState({});

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;

    const postId = selectedPost.id;
    const newReply = {
      author: userProfile?.name || 'Farmer',
      text: newComment.trim(),
      time: 'Just now'
    };

    setPostComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newReply]
    }));

    setNewComment('');
  };

  // Check login session & Load posts
  const loadPosts = async () => {
    try {
      const res = await fetch('/api/community');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (err) {
      console.error('Error loading community posts:', err);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('user_profile');
    if (session) {
      const prof = JSON.parse(session);
      setUserProfile(prof);
      setIsLoggedIn(true);
    }
    loadPosts();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      alert('Please enter a title and description.');
      return;
    }

    if (!isLoggedIn) {
      alert('Please log in first to contribute to the forums!');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Handle image upload if a photo was chosen
      if (imagePreview) {
        try {
          const uploadRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imagePreview, cropHint: postCrop })
          });
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.image_url;
        } catch (uploadErr) {
          console.warn('Cloudinary upload failed, using default fallback asset');
          // Fall back to a crop asset or pest asset
          imageUrl = getAssetUrl(postCrop.toLowerCase()) || null;
        }
      }

      // Submit post to api
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: userProfile.name,
          district: userProfile.district,
          crop_category: postCrop,
          title: postTitle,
          content: postContent,
          image_url: imageUrl
        })
      });

      const result = await response.json();
      if (result.success) {
        // Clear form
        setPostTitle('');
        setPostContent('');
        setPostCrop('General');
        setImagePreview(null);
        setShowPostModal(false);
        alert('Discussion posted successfully!');
        // Reload posts
        loadPosts();
      }
    } catch (err) {
      console.error('Failed to submit post:', err);
      alert('Error sharing post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchDist = filterDistrict === 'All' || post.district === filterDistrict;
    const matchCrop = filterCrop === 'All' || post.crop_category.toLowerCase() === filterCrop.toLowerCase();
    return matchDist && matchCrop;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-[288px] pt-16 min-h-screen w-full overflow-x-hidden">
        <header className="fixed left-0 lg:left-[288px] top-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 rounded-xl text-primary hover:bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/50"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <span className="font-headline text-lg font-bold text-primary">AP Community Forums</span>
            <div className="h-6 w-[1px] bg-outline-variant" />
            <span className="text-xs text-on-surface-variant font-semibold">Farmers Network</span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-12">
          
          {/* Header Title */}
          <div>
            <h2 className="font-display text-4xl font-black text-primary tracking-tight">Farmer Community Forums</h2>
            <p className="text-sm text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
              Connect with fellow farmers across Andhra Pradesh. Share diagnostics, report infestations, discuss crop prices, and learn organic remedies.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Filters & Create Post Panel */}
            <div className="bg-white p-5 rounded-3xl border border-outline-variant/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">filter_alt</span>
                  <span className="text-xs font-bold text-primary uppercase font-label">Filters</span>
                </div>

                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  {/* District filter */}
                  <div className="flex-1 sm:flex-none">
                    <select 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2 px-3 text-xs font-bold cursor-pointer"
                      value={filterDistrict}
                      onChange={(e) => setFilterDistrict(e.target.value)}
                    >
                      <option value="All">All Districts</option>
                      {AP_DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  {/* Crop filter */}
                  <div className="flex-1 sm:flex-none">
                    <select 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2 px-3 text-xs font-bold cursor-pointer"
                      value={filterCrop}
                      onChange={(e) => setFilterCrop(e.target.value)}
                    >
                      <option value="All">All Crops</option>
                      {AP_CROPS.map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPostModal(true)}
                className="w-full md:w-auto bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Create Post
              </button>
            </div>

            {/* Discussion Feed */}
            <ErrorBoundary>
              <div className="space-y-6">
                {filteredPosts.length === 0 ? (
                  <div className="p-16 bg-surface-container-low border border-outline-variant rounded-[3rem] text-center italic text-on-surface-variant text-sm">
                    No forum discussions match your active filters. Submit a post to start the thread!
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <article 
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="glass-card rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/60 hover:border-primary/40 hover:shadow-xl transition-all space-y-4 cursor-pointer group relative overflow-hidden"
                    >
                      {/* Post Meta */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                            {post.author ? post.author[0].toUpperCase() : 'F'}
                          </div>
                          <div>
                            <h5 className="font-headline font-bold text-primary text-sm leading-tight group-hover:text-primary-container transition-colors">{post.author}</h5>
                            <p className="text-[10px] text-on-surface-variant font-bold mt-0.5">
                              {post.district} District • {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-surface-container text-secondary border border-outline-variant/40 text-[9px] font-bold uppercase tracking-wider rounded-full">
                            {post.crop_category}
                          </span>
                          <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            View
                          </span>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="space-y-3">
                        <h4 className="font-display font-black text-primary text-lg leading-snug group-hover:text-primary-container transition-colors">{post.title}</h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed font-semibold line-clamp-3">
                          {post.content}
                        </p>
                      </div>

                      {/* Optional Attached Image */}
                      {post.image_url && (
                        <div className="w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-outline-variant/40 relative group-hover:border-primary/30 transition-colors">
                          <FallbackImage 
                            src={post.image_url} 
                            alt="Discussion attachment" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/90 text-primary text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">zoom_in</span>
                              Click to View Full Image & Details
                            </span>
                          </div>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Create Post Modal */}
      {showPostModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPostModal(false)}
        >
          <div 
            className="bg-white rounded-[2.5rem] border border-outline-variant max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
              <div>
                <span className="px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-wider text-white bg-primary w-fit">
                  Community Forum
                </span>
                <h3 className="font-display text-2xl font-black text-primary mt-1">
                  Start a Discussion
                </h3>
              </div>
              <button 
                onClick={() => setShowPostModal(false)}
                className="w-10 h-10 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-full flex items-center justify-center shadow-md transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {isLoggedIn ? (
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Discussion Title</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xs font-semibold"
                      placeholder="e.g., Best dosage of Cartap for stem borer?"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Crop Category</label>
                      <select 
                        className="w-full bg-white border border-outline-variant rounded-xl py-2 px-3 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xs font-semibold"
                        value={postCrop}
                        onChange={(e) => setPostCrop(e.target.value)}
                      >
                        {AP_CROPS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Attach Image</label>
                      <label className="w-full bg-white border border-outline-variant rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 text-on-surface-variant cursor-pointer hover:bg-surface-container transition-colors text-xs font-semibold text-center truncate">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        <span className="material-symbols-outlined text-base">upload</span>
                        <span>Upload Photo</span>
                      </label>
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-outline-variant/60 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setImagePreview(null)}
                        className="absolute top-1 right-1 w-5 h-5 bg-error text-white rounded-full text-[10px] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Message Content</label>
                    <textarea 
                      className="w-full bg-white border border-outline-variant rounded-xl py-3 px-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-xs"
                      placeholder="Provide details about your question, observations, or advice..."
                      rows="4"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      required
                    />
                  </div>

                  <div className="pt-2 text-[10px] font-bold text-on-surface-variant/80">
                    Posting as <span className="text-primary">{userProfile.name}</span> in <span className="text-primary">{userProfile.district}</span>.
                  </div>

                  <div className="pt-4 border-t border-outline-variant/30 flex gap-4 justify-end">
                    <button 
                      type="button"
                      onClick={() => setShowPostModal(false)}
                      className="px-6 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 text-xs"
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish Post'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/15 text-center space-y-4">
                  <span className="material-symbols-outlined text-primary text-3xl">lock</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                    You need to sign in to your farmer account to write and publish community posts.
                  </p>
                  <button 
                    onClick={() => {
                      setShowPostModal(false);
                      router.push('/login');
                    }}
                    className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Sign In Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Post Modal Dialog */}
      {selectedPost && (() => {
        const commentList = postComments[selectedPost.id] || [];
        
        return (
          <div 
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
            onClick={() => setSelectedPost(null)}
          >
            <div 
              className="bg-white rounded-[2.5rem] border border-outline-variant max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base shadow-xs border border-primary/20">
                    {selectedPost.author ? selectedPost.author[0].toUpperCase() : 'F'}
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-primary text-base leading-tight">{selectedPost.author}</h4>
                    <p className="text-xs text-on-surface-variant font-semibold mt-0.5">
                      📍 {selectedPost.district} District • {new Date(selectedPost.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider rounded-full">
                    {selectedPost.crop_category}
                  </span>
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="w-10 h-10 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-full flex items-center justify-center shadow-xs transition-all cursor-pointer"
                    title="Close Modal"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Title */}
                <h3 className="font-display font-black text-primary text-2xl leading-snug">
                  {selectedPost.title}
                </h3>

                {/* Clear High-Res Image View */}
                {selectedPost.image_url && (
                  <div className="w-full max-h-[460px] bg-slate-900/5 rounded-2xl overflow-hidden border border-outline-variant/50 relative flex items-center justify-center p-2 group">
                    <FallbackImage 
                      src={selectedPost.image_url} 
                      alt={selectedPost.title} 
                      className="max-h-[440px] w-full object-contain rounded-xl shadow-xs" 
                    />
                    <a 
                      href={selectedPost.image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 bg-black/75 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                      Open High-Res Image
                    </a>
                  </div>
                )}

                {/* Message Body */}
                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/40">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Discussion Details</h5>
                  <p className="text-sm text-slate-800 leading-relaxed font-semibold whitespace-pre-line">
                    {selectedPost.content}
                  </p>
                </div>

                {/* Replies & Discussion Thread */}
                <div className="space-y-4 border-t border-outline-variant/30 pt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-headline font-bold text-primary text-base flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">chat_bubble</span>
                      Farmer Discussions & Replies
                    </h4>
                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full border border-outline-variant/30">
                      {commentList.length} Replies
                    </span>
                  </div>

                  {/* Add Reply */}
                  {isLoggedIn ? (
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                      <input 
                        type="text"
                        className="flex-1 bg-white border border-outline-variant rounded-xl py-2.5 px-4 text-xs font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        placeholder="Share your agronomic advice or reply..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button 
                        type="submit"
                        className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                        Reply
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 bg-primary/5 rounded-xl text-center text-xs font-semibold text-on-surface-variant border border-primary/10">
                      Sign in to reply to this farmer discussion.
                    </div>
                  )}

                  {/* Replies List */}
                  <div className="space-y-3 pt-2">
                    {commentList.length === 0 ? (
                      <p className="text-xs text-on-surface-variant/70 italic text-center py-4">
                        No replies yet on this thread. Be the first to answer!
                      </p>
                    ) : (
                      commentList.map((c, idx) => (
                        <div key={idx} className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-primary">{c.author}</span>
                            <span className="text-[10px] text-on-surface-variant font-semibold">{c.time}</span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
