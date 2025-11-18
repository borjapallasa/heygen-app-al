"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useHeygenVideos from "@/src/hooks/useHeygenVideos";
import useHeygenGroups from "@/src/hooks/useHeygenGroups";
import useJobPolling from "@/src/hooks/useJobPolling";
import AvatarGrid from "@/src/features/avatars/AvatarGrid";
import { timeAgo } from "@/src/lib/utils";

export default function VideosPane({ onGroupSelect } = {}) {
  const { videos, loading, error, fetchThumbnailForVideo } = useHeygenVideos();
  const { groups } = useHeygenGroups();
  const { jobs, loading: jobsLoading, updateJobStatus } = useJobPolling();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const videoRefs = useRef(new Map());

  const startNewVideo = () => {
    setShowGroupModal(true);
  };

  const handleGroupSelect = async (group) => {
    // Close modal immediately
    setShowGroupModal(false);
    
    // Call onGroupSelect (goToGroupAvatars) directly - same as clicking avatars on top
    // This will handle: setting selectedGroup, clearing selection, setting view to GROUP, and fetching avatars
    if (onGroupSelect && group) {
      await onGroupSelect(group);
      window?.scrollTo?.({ top: 0, behavior: "smooth" });
    }
  };

  const handleMenuToggle = (videoId) => {
    setOpenMenuId(openMenuId === videoId ? null : videoId);
  };

  const handleImport = (video) => {
    console.log("Import video:", video);
    // TODO: Implement import to project
    setOpenMenuId(null);
  };

  const handleDownload = (video) => {
    if (video.video_url) {
      window.open(video.video_url, '_blank');
    }
    setOpenMenuId(null);
  };

  const handleDelete = (video) => {
    if (confirm(`Are you sure you want to delete "${video.title || video.video_title}"?`)) {
      console.log("Delete video:", video);
      // TODO: Implement delete
    }
    setOpenMenuId(null);
  };

  // Intersection Observer for lazy loading thumbnails
  useEffect(() => {
    if (!fetchThumbnailForVideo || videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const videoId = entry.target.getAttribute("data-video-id");
            if (videoId) {
              // Only fetch if video doesn't already have a thumbnail
              const video = videos.find(v => (v.video_id || v.id) === videoId);
              if (video && !video.thumb && !video.thumbnail_url && !video.thumbnail) {
                fetchThumbnailForVideo(videoId);
              }
              // Unobserve after checking/fetching to avoid duplicate requests
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin: "100px", // Prefetch thumbnails 100px ahead of viewport
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    // Use requestAnimationFrame to ensure DOM is updated before observing
    const timeoutId = setTimeout(() => {
      // Observe all video card elements that don't have thumbnails yet
      videoRefs.current.forEach((element, videoId) => {
        if (element) {
          const video = videos.find(v => (v.video_id || v.id) === videoId);
          // Only observe videos that don't have thumbnails
          if (video && !video.thumb && !video.thumbnail_url && !video.thumbnail) {
            observer.observe(element);
          }
        }
      });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [videos, fetchThumbnailForVideo]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center text-slate-500">
          Loading videos...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Video Card - Always First */}
        <button
          onClick={startNewVideo}
          className="group relative bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 overflow-hidden transition-all hover:shadow-md"
        >
          <div className="aspect-video flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center mb-4 transition-colors">
              <svg className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
              New Video
            </span>
          </div>
        </button>

        {/* Job Cards - Processing/Pending jobs */}
        {jobs && jobs.length > 0 && jobs
          .filter(job => job.status === 'pending' || job.status === 'processing')
          .map((job) => {
            const jobId = job.job_request_uuid;
            const metadata = job.metadata || {};
            const avatarCount = metadata.avatarIds?.length || 0;

            return (
              <div
                key={jobId}
                className="group relative bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-sm"
              >
                {/* Thumbnail placeholder with loading animation */}
                <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {/* Spinner */}
                    <svg className="animate-spin h-12 w-12 text-blue-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-medium text-blue-600">
                      {job.status === 'pending' ? 'Queued' : 'Generating'}...
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                      {job.status === 'pending' ? 'Pending' : 'Processing'}
                    </span>
                  </div>
                </div>

                {/* Job Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">
                        {metadata.script?.substring(0, 50) || 'Video Generation'}
                        {metadata.script?.length > 50 ? '...' : ''}
                      </h3>
                      <p className="text-xs text-slate-500 mb-2">
                        {timeAgo(new Date(job.created_at).getTime() / 1000)} · {avatarCount} avatar{avatarCount !== 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (confirm('Mark this job as completed? (for testing)')) {
                              await updateJobStatus(jobId, 'completed');
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 underline"
                        >
                          Mark Complete
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={async () => {
                            if (confirm('Mark this job as failed?')) {
                              await updateJobStatus(jobId, 'failed', {
                                ...metadata,
                                error: 'Cancelled by user'
                              });
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-700 underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Video Cards */}
        {videos && videos.length > 0 && videos.map((video) => {
          const videoId = video.video_id || video.id;
          const isMenuOpen = openMenuId === videoId;

          return (
            <div
              key={videoId}
              ref={(el) => {
                if (el) {
                  videoRefs.current.set(videoId, el);
                } else {
                  videoRefs.current.delete(videoId);
                }
              }}
              data-video-id={videoId}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {video.thumb || video.thumbnail_url || video.thumbnail ? (
                  <img
                    src={video.thumb || video.thumbnail_url || video.thumbnail}
                    alt={video.title || video.video_title || "Video"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <svg
                      className="w-16 h-16 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* Status Badge */}
                {video.status && (
                  <div className="absolute top-3 right-3">
                    <span
                      className={`
                        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${
                          video.status === "completed" || video.status === "success"
                            ? "bg-green-100 text-green-800"
                            : video.status === "processing" || video.status === "pending"
                            ? "bg-blue-100 text-blue-800"
                            : video.status === "failed" || video.status === "error"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      `}
                    >
                      {video.status === "completed" || video.status === "success" ? "Completed" :
                       video.status === "processing" ? "Processing" :
                       video.status === "pending" ? "Pending" :
                       video.status === "failed" || video.status === "error" ? "Error" :
                       video.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">
                      {video.title || video.video_title || video.name || "Untitled Video"}
                    </h3>
                    {video.createdAt && (
                      <p className="text-xs text-slate-500">
                        {timeAgo(video.createdAt)} · Generated
                      </p>
                    )}
                  </div>

                  {/* Three Dots Menu */}
                  <div className="relative">
                    <button
                      onClick={() => handleMenuToggle(videoId)}
                      className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />

                        <div className="absolute right-0 bottom-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                          <button
                            onClick={() => handleImport(video)}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import
                          </button>
                          <button
                            onClick={() => handleDownload(video)}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(video)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Group Selection Modal - Simplified to match AvatarBubbleRow behavior */}
    {showGroupModal && typeof window !== 'undefined' && createPortal(
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto" style={{ pointerEvents: 'auto' }}>
        <div className="w-full max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setShowGroupModal(false)}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-slate-900">Choose an Avatar</h2>
          </div>

          <div className="px-2 sm:px-4 lg:px-6">
            <AvatarGrid
              groups={groups}
              onPick={handleGroupSelect}
              sizeClass="w-28 h-28 md:w-32 md:h-32"
              nameWidth="w-36"
            />
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
}
