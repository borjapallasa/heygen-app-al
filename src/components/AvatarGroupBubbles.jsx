"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  X,
  Loader2,
  ArrowLeft,
  Check,
  ArrowRight,
  ChevronUp,
  Mic,
  Square,
  Pause,
  Play,
  MoreVertical,
  Download,
  Trash2,
  Upload,
  FileText,
  Music2,
} from 'lucide-react';

/*********************************
 * Constants & Utilities
 *********************************/
const API_KEY = 'NzI5OTk1YTg0MDNjNGRhNGIwZWI0ZTY2Y2RjOTVhNmYtMTY5NjE2NzMyMA==';
const HEYGEN = {
  logo: 'https://app.heygen.com/icons/heygen/wordmark/svg/HeyGen_Logo_Prism_Black.svg',
  avatarsList: 'https://api.heygen.com/v2/avatar_group.list?include_public=false',
  groupAvatars: (groupId) => `https://api.heygen.com/v2/avatar_group/${groupId}/avatars`,
  videosList: 'https://api.heygen.com/v1/video.list',
  videoStatus: (id) => `https://api.heygen.com/v1/video_status.get?video_id=${id}`,
};

const VIEW = {
  HOME: 'HOME',
  SELECT: 'SELECT',
  GROUP: 'GROUP',
  REVIEW: 'REVIEW',
};

function toStartCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id_' + Math.random().toString(36).slice(2);
}

function timeAgo(tsSec) {
  try {
    const now = Date.now();
    const then = (Number(tsSec) || 0) * 1000;
    const diff = Math.max(0, now - then);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
  } catch {
    return '';
  }
}

function getStatusPlaceholder(status) {
  const ok = String(status || '').toLowerCase() === 'completed';
  return ok
    ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="%23e2e8f0"/></svg>'
    : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="%23fee2e2"/></svg>';
}

// Avoid single final row of 1: if n % 3 === 1 and n >= 4, first row is 2
function chunkAvatarsForRows(list) {
  const out = [];
  const n = list.length;
  if (n === 0) return out;
  let i = 0;
  if (n % 3 === 1 && n >= 4) {
    out.push(list.slice(0, 2));
    i = 2;
  }
  for (; i < n; i += 3) out.push(list.slice(i, Math.min(i + 3, n)));
  return out;
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, { headers: { accept: 'application/json', 'x-api-key': API_KEY }, ...opts });
  if (!res.ok) throw new Error(`${opts?.method || 'GET'} ${url} failed`);
  return res.json();
}

/*********************************
 * Data Hooks
 *********************************/
function useHeygenGroups() {
  const palette = useMemo(
    () => [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-teal-500',
    ],
    []
  );
  const randomColor = () => palette[Math.floor(Math.random() * palette.length)];

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJSON(HEYGEN.avatarsList, { signal });
        const payload = data?.data?.avatar_group_list || data?.data?.avatars || [];
        const mapped = (Array.isArray(payload) ? payload : []).map((it) => {
          const id = it.id || it.avatar_id || cryptoRandomId();
          const raw = it.name || it.avatar_name || 'Unnamed';
          const name = toStartCase(raw);
          const image = it.preview_image || it.preview_image_url || it.preview_video_url || '';
          return { id, name, image, initials: getInitials(name), color: randomColor() };
        });
        setGroups(mapped);
      } catch (e) {
        if (e?.name !== 'AbortError') setError(e.message || 'Failed to fetch avatars');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return { groups, loading, error };
}

function useHeygenVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  async function fetchThumbsBatched(items, signal, size = 8) {
    const out = [];
    for (let i = 0; i < items.length; i += size) {
      const batch = items.slice(i, i + size);
      const done = await Promise.all(
        batch.map(async (v) => {
          try {
            const json = await fetchJSON(HEYGEN.videoStatus(v.id), { signal });
            const t = json?.data?.thumbnail_url || null;
            return { ...v, thumb: t || v.thumb || getStatusPlaceholder(v.status) };
          } catch {
            return { ...v, thumb: v.thumb || getStatusPlaceholder(v.status) };
          }
        })
      );
      out.push(...done);
    }
    return out;
  }

  // initial load
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: '50' });
        const json = await fetchJSON(`${HEYGEN.videosList}?${params.toString()}`, { signal });
        const list = json?.data?.videos || [];
        const normalized = list.map((v) => ({
          id: v.video_id,
          title: v.video_title || 'Untitled',
          status: (v.status || '').toLowerCase(),
          createdAt: v.created_at,
          type: v.type || 'GENERATED',
          thumb: null,
        }));
        const withThumbs = await fetchThumbsBatched(normalized, signal);
        setVideos(withThumbs);
        setToken(json?.data?.token || null);
      } catch (e) {
        if (e?.name !== 'AbortError') setError(e.message || 'Failed to fetch videos');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // load more
  async function loadMore() {
    if (!token || loadingMore) return;
    const controller = new AbortController();
    const { signal } = controller;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: '50', token });
      const json = await fetchJSON(`${HEYGEN.videosList}?${params.toString()}`, { signal });
      const list = json?.data?.videos || [];
      const normalized = list.map((v) => ({
        id: v.video_id,
        title: v.video_title || 'Untitled',
        status: (v.status || '').toLowerCase(),
        createdAt: v.created_at,
        type: v.type || 'GENERATED',
        thumb: null,
      }));
      const withThumbs = await fetchThumbsBatched(normalized, signal);
      setVideos((prev) => [...prev, ...withThumbs]);
      setToken(json?.data?.token || null);
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e.message || 'Failed to fetch videos');
    } finally {
      setLoadingMore(false);
    }
  }

  return { videos, loading, error, token, loadingMore, loadMore };
}

function useGroupAvatars() {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchForGroup(group) {
    if (!group?.id) return;
    setLoading(true);
    setError(null);
    setAvatars([]);
    try {
      const json = await fetchJSON(HEYGEN.groupAvatars(group.id));
      const list = json?.data?.avatar_list || [];
      const mapped = list.map((a) => ({
        id: a.avatar_id,
        name: a.avatar_name,
        image: a.preview_image_url,
        video: a.preview_video_url,
      }));
      setAvatars(mapped);
    } catch (e) {
      setError(e.message || 'Failed to fetch avatar list');
    } finally {
      setLoading(false);
    }
  }

  return { avatars, loading, error, fetchForGroup };
}

/*********************************
 * Main Component
 *********************************/
export default function AvatarGroupBubbles() {
  const { groups, loading: groupsLoading, error: groupsError } = useHeygenGroups();
  const { videos, loading: videosLoading, error: videosError, token, loadingMore, loadMore } = useHeygenVideos();
  const groupAvatars = useGroupAvatars();

  const [view, setView] = useState(VIEW.HOME);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedAvatarIds, setSelectedAvatarIds] = useState(new Set());
  const [promptText, setPromptText] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [audioAttachment, setAudioAttachment] = useState(null);

  const isInitialLoading = groupsLoading || videosLoading;

  useEffect(() => {
    runAssertions();
  }, []);

  function startNewVideo() {
    setView(VIEW.SELECT);
    try {
      window?.scrollTo?.({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  }

  function goToReview() {
    setView(VIEW.REVIEW);
    try {
      window?.scrollTo?.({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  }

  async function goToGroupAvatars(group) {
    setSelectedGroup(group);
    setSelectedAvatarIds(new Set());
    setView(VIEW.GROUP);
    await groupAvatars.fetchForGroup(group);
  }

  function toggleAvatarSelect(id) {
    setSelectedAvatarIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img src={HEYGEN.logo} alt="HeyGen" className="w-40 h-auto mb-4 motion-safe:animate-pulse" />
          <div className="text-slate-500 text-sm">Loading your content…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative w-full max-w-6xl mx-auto p-6">
        {/* HOME */}
        <section
          aria-hidden={view !== VIEW.HOME}
          className={`transition-all duration-300 ease-out ${
            view === VIEW.HOME ? 'opacity-100 translate-y-0 pointer-events-auto relative' : 'opacity-0 -translate-y-1 pointer-events-none absolute inset-0'
          }`}
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Avatars</h1>
          {groupsError ? (
            <BannerError msg={groupsError} />
          ) : (
            <>
              <AvatarBubbleRow groups={groups} onPick={goToGroupAvatars} />
              <Divider />
              <VideosSection
                videos={videos}
                loading={videosLoading}
                error={videosError}
                onLoadMore={loadMore}
                hasMore={!!token}
                moreLoading={loadingMore}
                onNewVideo={startNewVideo}
              />
            </>
          )}
        </section>

        {/* SELECT */}
        <section
          aria-hidden={view !== VIEW.SELECT}
          className={`transition-all duration-300 ease-out ${
            view === VIEW.SELECT ? 'opacity-100 translate-y-0 pointer-events-auto relative' : 'opacity-0 translate-y-1 pointer-events-none absolute inset-0'
          }`}
        >
          <HeaderBack title="Choose an Avatar" onBack={() => setView(VIEW.HOME)} />
          {groupsError ? (
            <BannerError msg={groupsError} />
          ) : (
            <div className="px-2 sm:px-4 lg:px-6 pt-10 pb-12">
              <AvatarGrid groups={groups} onPick={goToGroupAvatars} sizeClass="w-28 h-28 md:w-32 md:h-32" nameWidth="w-36" />
            </div>
          )}
        </section>

        {/* GROUP AVATARS */}
        <section
          aria-hidden={view !== VIEW.GROUP}
          className={`transition-all duration-300 ease-out ${
            view === VIEW.GROUP ? 'opacity-100 translate-y-0 pointer-events-auto relative' : 'opacity-0 translate-y-1 pointer-events-none absolute inset-0'
          }`}
        >
          <HeaderBack title={selectedGroup ? selectedGroup.name : 'Avatar Group'} onBack={() => setView(VIEW.SELECT)} leftThumb={selectedGroup?.image} />

          {groupAvatars.error && <BannerError msg={groupAvatars.error} />}

          {groupAvatars.loading ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="flex flex-col items-center">
                <img src={HEYGEN.logo} alt="HeyGen" className="w-40 h-auto mb-4 motion-safe:animate-pulse" />
                <div className="text-slate-500 text-sm">Loading avatars…</div>
              </div>
            </div>
          ) : (
            <div className="pt-6 pb-24">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupAvatars.avatars.map((a) => (
                  <AvatarHoverCard key={a.id} avatar={a} selected={selectedAvatarIds.has(a.id)} onToggle={() => toggleAvatarSelect(a.id)} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* REVIEW */}
        <section
          aria-hidden={view !== VIEW.REVIEW}
          className={`transition-all duration-300 ease-out ${
            view === VIEW.REVIEW ? 'opacity-100 translate-y-0 pointer-events-auto relative' : 'opacity-0 translate-y-1 pointer-events-none absolute inset-0'
          }`}
        >
          <HeaderBack title="Review & Confirm" onBack={() => setView(VIEW.GROUP)} leftThumb={selectedGroup?.image} />

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 text-center">Selected Avatars</h2>
            {(() => {
              const selected = groupAvatars.avatars.filter((a) => selectedAvatarIds.has(a.id));
              if (selected.length === 0) return <div className="text-slate-500 text-sm text-center">No avatars selected.</div>;
              const rows = chunkAvatarsForRows(selected);
              return (
                <div className="space-y-4">
                  {rows.map((row, idx) => (
                    <div key={idx} className="flex justify-center gap-4">
                      {row.map((a) => (
                        <article key={a.id} className="w-36 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                          <div className="relative aspect-[4/5] overflow-hidden">
                            <img src={a.image} alt={a.name} className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                          <div className="p-2">
                            <div className="text-xs font-medium text-slate-900 whitespace-normal break-words text-center">{a.name}</div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex justify-center pb-8">
            <div className="w-full max-w-xl space-y-4">
              {audioAttachment ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Audio</h3>
                  <audio src={audioAttachment.url} controls className="w-full" />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-h-[120px]">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Script</h3>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap">{promptText || '—'}</div>
                </div>
              )}

              <button
                onClick={() => {
                  const selected = groupAvatars.avatars.filter((a) => selectedAvatarIds.has(a.id));
                  console.log('CONFIRM', { group: selectedGroup, selected, script: promptText, audio: audioAttachment });
                }}
                className="w-full px-4 py-3 rounded-2xl bg-black text-white hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </section>

        {/* AUDIO RECORDER */}
        {recorderOpen && (
          <RecorderOverlay
            onClose={() => setRecorderOpen(false)}
            onSave={(item) => {
              setAudioAttachment(item);
              setPromptText('');
              setRecorderOpen(false);
            }}
          />
        )}

        {/* FLOATER BAR */}
        {view === VIEW.GROUP && selectedAvatarIds.size > 0 && (
          <FloaterBar
            value={promptText}
            onChange={(v) => {
              setPromptText(v);
              if (v && audioAttachment) setAudioAttachment(null);
            }}
            onSubmit={goToReview}
            actionsOpen={actionsOpen}
            setActionsOpen={setActionsOpen}
            audioAttachment={audioAttachment}
            onRemoveAudio={() => setAudioAttachment(null)}
            onRecordAudio={() => setRecorderOpen(true)}
          />
        )}
      </div>
    </div>
  );
}

/*********************************
 * UI Components
 *********************************/
function BannerError({ msg }) {
  return <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4">{msg}</div>;
}

function Divider() {
  return <div role="separator" className="border-t border-slate-200 my-2" />;
}

function HeaderBack({ title, onBack, leftThumb }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-50"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </button>
      {leftThumb ? (
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-slate-200">
          <img src={leftThumb} alt="thumb" className="w-full h-full object-cover" />
        </div>
      ) : null}
      <h1 className="text-2xl font-bold text-slate-900 whitespace-normal break-words">{title}</h1>
    </div>
  );
}

function AvatarBubbleRow({ groups, onPick }) {
  return (
    <div className="relative py-2">
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-min">
          {groups.map((g) => (
            <div key={g.id} className="flex-shrink-0 w-16 flex flex-col items-center">
              <button
                onClick={() => onPick(g)}
                className="w-16 h-16 rounded-full hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl overflow-hidden"
              >
                {g.image ? (
                  <img src={g.image} alt={g.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className={`${g.color} w-full h-full flex items-center justify-center`}>
                    <span className="text-white font-semibold">{g.initials}</span>
                  </div>
                )}
              </button>
              <span className="mt-1 text-xs text-slate-700 truncate w-16 text-center" title={g.name}>
                {g.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}

function AvatarGrid({ groups, onPick, sizeClass = 'w-24 h-24', nameWidth = 'w-28' }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-7 sm:gap-8 place-items-center">
      {groups.map((g) => (
        <button key={g.id} className="group flex flex-col items-center" onClick={() => onPick(g)}>
          <span
            className={`${sizeClass} rounded-full overflow-hidden shadow-sm ring-1 ring-slate-200 group-hover:shadow-md group-hover:scale-105 transition-transform ${
              g.image ? '' : g.color
            } flex items-center justify-center`}
          >
            {g.image ? (
              <img src={g.image} alt={g.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <span className="text-white font-semibold text-xl">{g.initials}</span>
            )}
          </span>
          <span className={`mt-3 text-sm text-slate-800 font-medium truncate ${nameWidth} text-center`} title={g.name}>
            {g.name}
          </span>
        </button>
      ))}
    </div>
  );
}

function AvatarHoverCard({ avatar, selected, onToggle }) {
  const videoRef = useRef(null);
  const hoverTimer = useRef(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      try {
        videoRef.current.muted = true;
        videoRef.current.setAttribute('muted', '');
      } catch {}
    }
  }, []);

  function safePlay(v) {
    if (!v) return;
    try {
      const p = v.play?.();
      if (p && typeof p.then === 'function') {
        p.then(() => setShowVideo(true)).catch(() => setShowVideo(false));
      } else {
        setShowVideo(true);
      }
    } catch {
      setShowVideo(false);
    }
  }

  function handleEnter() {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      const v = videoRef.current;
      if (v) {
        try {
          v.currentTime = 0;
        } catch {}
        safePlay(v);
      }
    }, 75);
  }
  function handleLeave() {
    clearTimeout(hoverTimer.current);
    const v = videoRef.current;
    if (v) {
      try {
        v.pause?.();
        v.currentTime = 0;
      } catch {}
    }
    setShowVideo(false);
  }

  return (
    <article className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/5] overflow-hidden" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <img src={avatar.image} alt={avatar.name} className="absolute inset-0 w-full h-full object-cover" />
        {avatar.video && (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
            muted
            playsInline
            loop
            preload="metadata"
            disablePictureInPicture
            controls={false}
            onCanPlay={() => setShowVideo(true)}
          >
            <source src={avatar.video} type="video/mp4" />
          </video>
        )}
        <button
          onClick={onToggle}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full border ${
            selected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white/80 text-slate-700 border-slate-300'
          } backdrop-blur flex items-center justify-center shadow`}
          aria-pressed={selected}
          aria-label={selected ? 'Deselect avatar' : 'Select avatar'}
        >
          {selected ? <Check className="w-4 h-4" /> : <span className="block w-3.5 h-3.5 rounded-full border border-slate-400" />}
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-900 whitespace-normal break-words">{avatar.name}</h3>
      </div>
    </article>
  );
}

function VideosSection({ videos, loading, error, onLoadMore, hasMore, moreLoading, onNewVideo }) {
  if (error) return <BannerError msg={error} />;
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-slate-900">Videos</h2>
        {loading && (
          <div className="flex items-center text-sm text-slate-600">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading…
          </div>
        )}
      </div>

      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <NewVideoCard onClick={onNewVideo} />
            {videos.map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
          <div className="flex justify-center mt-5">
            <button
              onClick={onLoadMore}
              disabled={!hasMore || moreLoading}
              className="px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm disabled:opacity-50"
            >
              {moreLoading ? 'Loading…' : hasMore ? 'Load more' : 'No more videos'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function NewVideoCard({ onClick }) {
  return (
    <article
      className="group rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-slate-400 transition-all cursor-pointer bg-slate-50 relative"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label="Create new video"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-2">
            <Plus className="w-6 h-6 text-slate-700" />
          </div>
          <span className="text-sm font-medium text-slate-800">New Video</span>
        </div>
      </div>
      <div className="aspect-video" />
      <div className="h-12" />
    </article>
  );
}

function VideoCard({ v }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuWrapRef.current) return;
      if (menuOpen && !menuWrapRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  return (
    <article className="group rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-video overflow-hidden">
        <img src={v.thumb || getStatusPlaceholder(v.status)} alt={v.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute top-2 right-2">
          {v.status !== 'completed' ? (
            <span className="inline-block text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">Error</span>
          ) : (
            <span className="inline-block text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border-emerald-200 border">Completed</span>
          )}
        </div>
      </div>
      <div className="p-3 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate" title={v.title}>
              {v.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {timeAgo(v.createdAt)} · {(v.type || 'GENERATED').toLowerCase().replace(/^./, (c) => c.toUpperCase())}
            </p>
          </div>
          <div className="relative" ref={menuWrapRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
              aria-label="Open actions"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-40 rounded-xl border border-slate-200 bg-white shadow-xl py-1 z-10">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                  <Upload className="w-4 h-4" /> Import
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function FloaterBar({ value, onChange, onSubmit, actionsOpen, setActionsOpen, audioAttachment, onRemoveAudio, onRecordAudio }) {
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 rounded-3xl border border-slate-300 bg-white shadow-lg px-3 py-2 w-[min(760px,90vw)]">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your script"
          className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400 px-2 py-2"
        />
        {audioAttachment && <AudioChip item={audioAttachment} onRemove={onRemoveAudio} />}
        <div className="relative">
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-sm text-slate-700"
          >
            <span>More</span>
            <ChevronUp className="w-4 h-4" />
          </button>
          {actionsOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-52 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-[60vh] overflow-auto">
              <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-sm">
                <FileText className="w-4 h-4 text-slate-500" /> Import Content
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-sm">
                <Music2 className="w-4 h-4 text-slate-500" /> Import Audios
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-sm"
                onClick={() => {
                  setActionsOpen(false);
                  onRecordAudio?.();
                }}
              >
                <Mic className="w-4 h-4" /> Record Audio
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onSubmit}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:opacity-90"
          aria-label="Submit"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function AudioChip({ item, onRemove }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
      <audio src={item.url} controls className="h-8" />
      <span className="text-xs text-slate-700 truncate max-w-[120px]" title={item.name}>
        {item.name}
      </span>
      <button onClick={onRemove} className="text-slate-500 hover:text-slate-700" aria-label="Remove audio">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function RecorderOverlay({ onClose, onSave }) {
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        streamRef.current = stream;
        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRef.current = mr;
      } catch (e) {
        setError(e.message || 'Microphone permission denied');
      }
    })();
    return () => {
      cancelled = true;
      try {
        mediaRef.current?.stop();
      } catch {}
      chunksRef.current = [];
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
    };
  }, []);

  function handlePrimary() {
    if (!recording) return start();
    return stop();
  }

  function start() {
    if (!mediaRef.current || recording) return;
    setError(null);
    chunksRef.current = [];
    try {
      mediaRef.current.start();
      setRecording(true);
      setPaused(false);
      setDuration(0);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      setError(e.message);
    }
  }

  function pause() {
    try {
      mediaRef.current?.pause();
      setPaused(true);
    } catch {}
  }

  function resume() {
    try {
      mediaRef.current?.resume();
      setPaused(false);
    } catch {}
  }

  function stop() {
    if (!mediaRef.current) return;
    try {
      mediaRef.current.stop();
    } catch {}
    clearInterval(timerRef.current);
    setRecording(false);
    setPaused(false);
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const name = `Recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
    onSave?.({ url, blob, name, duration });
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }

  function fmt(sec) {
    const m = Math.floor(sec / 60),
      s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center" role="dialog" aria-modal>
      <div className="bg-white w-[min(680px,92vw)] rounded-3xl shadow-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Record Audio</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center" aria-label="Close recorder">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {error && <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-xl px-3 py-2 text-sm">{error}</div>}

        <div className="flex flex-col items-center py-8">
          <button
            onClick={handlePrimary}
            className={`group relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 ${
              recording ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:brightness-110' : 'bg-gradient-to-br from-rose-500 to-red-600 hover:brightness-110'
            } ring-8 ring-white/60 outline outline-1 outline-black/5`}
            aria-label={recording ? 'Stop and use' : 'Start recording'}
          >
            <span className="absolute inset-0 rounded-full bg-white/10 pointer-events-none" aria-hidden></span>
            {recording ? <Square className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
          </button>

          <div className="mt-4 text-3xl font-mono tracking-widest text-slate-900" aria-live="polite">
            {fmt(duration)}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              disabled={!recording}
              onClick={paused ? resume : pause}
              className="px-3 py-2 rounded-full border border-slate-300 text-slate-700 disabled:opacity-40 bg-white hover:bg-slate-50 flex items-center gap-2"
              aria-label={paused ? 'Resume' : 'Pause'}
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="text-sm">{paused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>

          <p className="mt-6 text-sm text-slate-500 text-center max-w-md">Your microphone input will stay on this page and is not uploaded until you submit.</p>
        </div>
      </div>
    </div>
  );
}

/*********************************
 * Assertions
 *********************************/
function runAssertions() {
  try {
    console.assert(getInitials('John Smith') === 'JS', 'Initials');
    console.assert(toStartCase('oMAR aBOUlila') === 'Omar Aboulila', 'StartCase');
    console.assert(typeof timeAgo(Math.floor(Date.now() / 1000)) === 'string', 'timeAgo returns');
    console.assert(typeof timeAgo === 'function', 'timeAgo is a function');
    const rid = cryptoRandomId();
    console.assert(typeof rid === 'string' && rid.length > 3, 'cryptoRandomId returns string');

    const mk = (n) => Array.from({ length: n }, (_, i) => i + 1);
    const sizes = (rows) => rows.map((r) => r.length).join(',');
    console.assert(sizes(chunkAvatarsForRows(mk(1))) === '1', 'chunk 1');
    console.assert(sizes(chunkAvatarsForRows(mk(2))) === '2', 'chunk 2');
    console.assert(sizes(chunkAvatarsForRows(mk(3))) === '3', 'chunk 3');
    console.assert(sizes(chunkAvatarsForRows(mk(4))) === '2,2', 'chunk 4 -> 2,2');
    console.assert(sizes(chunkAvatarsForRows(mk(5))) === '2,3', 'chunk 5 -> 2,3');
    console.assert(sizes(chunkAvatarsForRows(mk(6))) === '3,3', 'chunk 6 -> 3,3');
    console.assert(sizes(chunkAvatarsForRows(mk(7))) === '2,3,2', 'chunk 7 -> 2,3,2');
  } catch (e) {
    console.warn('Assertions skipped:', e);
  }
}
// --- end: AvatarGroupBubbles.jsx ---
