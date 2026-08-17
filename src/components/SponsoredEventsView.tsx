import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Handshake,
  Calendar,
  MapPin,
  Video,
  Image as ImageIcon,
  Plus,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PlayCircle,
  Upload,
  Share2,
  Check
} from 'lucide-react';
import { SponsoredEvent, SponsoredEventMedia, SponsoredEventPhoto, User as UserType } from '../types';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { uploadContentImage } from '../lib/contentImageUpload';
import {
  fetchSponsoredEventsFromDb, createSponsoredEventInDb, deleteSponsoredEventFromDb,
  fetchSponsoredEventMediaFromDb, createSponsoredEventMediaInDb, deleteSponsoredEventMediaFromDb,
  fetchSponsoredEventPhotosFromDb, createSponsoredEventPhotoInDb, updateSponsoredEventPhotoInDb, deleteSponsoredEventPhotoFromDb
} from '../lib/sponsoredEventsApi';

interface SponsoredEventsViewProps {
  currentUser: UserType;
}

/**
 * Public "who have we sponsored" showcase -- a grid of Sponsored Event
 * cards, each opening into its own video gallery + album-based photo
 * gallery (same "albums, more photos" pattern as the Global Campus page's
 * gallery -- see EducationView.tsx's groupPhotosIntoAlbums()).
 *
 * Self-contained: fetches its own data on mount rather than routing through
 * App.tsx's top-level context tree, same as SerpMonitoringView /
 * NewsletterSubscribersView -- this is a lazy-loaded tab most visitors never
 * open, so there's no reason to keep its data in memory for every visitor's
 * whole session.
 */
export const SponsoredEventsView: React.FC<SponsoredEventsViewProps> = ({ currentUser }) => {
  const isStaffAuthenticated = currentUser.accountType === 'admin' || currentUser.accountType === 'staff';

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SponsoredEvent[]>([]);
  const [media, setMedia] = useState<SponsoredEventMedia[]>([]);
  const [photos, setPhotos] = useState<SponsoredEventPhoto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [dbEvents, dbMedia, dbPhotos] = await Promise.all([
        fetchSponsoredEventsFromDb(),
        fetchSponsoredEventMediaFromDb(),
        fetchSponsoredEventPhotosFromDb()
      ]);
      if (cancelled) return;
      setEvents(dbEvents || []);
      setMedia(dbMedia || []);
      setPhotos(dbPhotos || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Deep link: a "Share Event" link carries `?tab=sponsored-events&event=<id>`
  // (see handleCopyLink below) -- auto-open that event once the data has
  // loaded, so landing on a shared link goes straight to the event instead
  // of the all-events grid. Runs once; guarded so it doesn't re-fire and
  // fight a visitor's own later navigation (e.g. clicking "Back").
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || loading) return;
    const eventId = new URLSearchParams(window.location.search).get('event');
    if (!eventId) { deepLinkHandled.current = true; return; }
    if (events.some(e => e.id === eventId)) setSelectedEventId(eventId);
    deepLinkHandled.current = true;
  }, [loading, events]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copyLinkError, setCopyLinkError] = useState(false);
  const handleShareEvent = async (eventId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?tab=sponsored-events&event=${encodeURIComponent(eventId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      setCopyLinkError(true);
      setTimeout(() => setCopyLinkError(false), 3000);
      window.prompt('Copy this link:', url);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId) || null;
  const eventMedia = media.filter(m => m.eventId === selectedEventId).sort((a, b) => (a.date < b.date ? 1 : -1));
  const eventPhotos = photos.filter(p => p.eventId === selectedEventId);

  // --- Add Event modal ---
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evSponsor, setEvSponsor] = useState('');
  const [evDescription, setEvDescription] = useState('');
  const [evLocation, setEvLocation] = useState('');
  const [evDate, setEvDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [evCoverUrl, setEvCoverUrl] = useState('');
  const [evUploading, setEvUploading] = useState(false);
  const [evSaving, setEvSaving] = useState(false);

  const handleCoverFile = async (file: File | null) => {
    if (!file) return;
    setEvUploading(true);
    const url = await uploadContentImage(file, 'sponsored-events');
    if (url) setEvCoverUrl(url);
    setEvUploading(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim() || !evSponsor.trim()) return;
    setEvSaving(true);
    const newEvent: SponsoredEvent = {
      id: `spev-${Date.now()}`,
      title: evTitle.trim(),
      sponsorName: evSponsor.trim(),
      description: evDescription.trim(),
      eventDate: evDate,
      coverImageUrl: evCoverUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80',
      location: evLocation.trim() || undefined
    };
    await createSponsoredEventInDb(newEvent);
    setEvents(prev => [newEvent, ...prev]);
    setEvSaving(false);
    setEventModalOpen(false);
    setEvTitle(''); setEvSponsor(''); setEvDescription(''); setEvLocation(''); setEvCoverUrl('');
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Remove this sponsored event and its entire gallery? This cannot be undone.')) return;
    await deleteSponsoredEventFromDb(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setMedia(prev => prev.filter(m => m.eventId !== id));
    setPhotos(prev => prev.filter(p => p.eventId !== id));
    if (selectedEventId === id) setSelectedEventId(null);
  };

  // --- Add Video modal ---
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [vTitle, setVTitle] = useState('');
  const [vUrl, setVUrl] = useState('');
  const [vThumb, setVThumb] = useState('');
  const [playingMedia, setPlayingMedia] = useState<SponsoredEventMedia | null>(null);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !vTitle.trim() || !vUrl.trim()) return;
    const newMedia: SponsoredEventMedia = {
      id: `spevm-${Date.now()}`,
      eventId: selectedEventId,
      title: vTitle.trim(),
      videoUrl: vUrl.trim(),
      thumbnailUrl: vThumb.trim() || selectedEvent?.coverImageUrl || '',
      date: new Date().toISOString().slice(0, 10)
    };
    await createSponsoredEventMediaInDb(newMedia);
    setMedia(prev => [newMedia, ...prev]);
    setVideoModalOpen(false);
    setVTitle(''); setVUrl(''); setVThumb('');
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('Remove this video?')) return;
    await deleteSponsoredEventMediaFromDb(id);
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  // --- Add Photos modal (batch, forms one album) ---
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoAlbumName, setPhotoAlbumName] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [openAlbumPhotoIndex, setOpenAlbumPhotoIndex] = useState(0);

  interface PhotoAlbum {
    albumId: string;
    albumName: string;
    coverUrl: string;
    date: string;
    photos: SponsoredEventPhoto[];
  }
  const albums: PhotoAlbum[] = useMemo(() => {
    const groups = new Map<string, SponsoredEventPhoto[]>();
    for (const photo of eventPhotos) {
      const key = photo.albumId || photo.id;
      const existing = groups.get(key);
      if (existing) existing.push(photo);
      else groups.set(key, [photo]);
    }
    return Array.from(groups.entries())
      .map(([albumId, ps]) => ({
        albumId,
        albumName: ps[0].albumName || ps[0].caption || 'Untitled Album',
        coverUrl: (ps.find(p => p.isCover) || ps[0]).imageUrl,
        date: ps[0].date,
        photos: ps
      }))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventPhotos]);
  const openAlbum = albums.find(a => a.albumId === openAlbumId) || null;

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadContentImage(file, 'sponsored-events');
      if (url) urls.push(url);
    }
    setPhotoUrls(prev => [...prev, ...urls]);
    setPhotoUploading(false);
  };

  const handleAddPhotoUrl = () => {
    if (!photoUrlInput.trim()) return;
    setPhotoUrls(prev => [...prev, photoUrlInput.trim()]);
    setPhotoUrlInput('');
  };

  const handleSubmitPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || photoUrls.length === 0 || !photoCaption.trim()) return;
    const albumId = `spevalbum-${Date.now()}`;
    const albumName = photoAlbumName.trim() || photoCaption.trim();
    const newPhotos: SponsoredEventPhoto[] = photoUrls.map((url, i) => ({
      id: `spevp-${Date.now()}-${i}`,
      eventId: selectedEventId,
      imageUrl: url,
      caption: photoCaption.trim(),
      date: new Date().toISOString().slice(0, 10),
      albumId,
      albumName,
      isCover: i === 0
    }));
    await Promise.all(newPhotos.map(p => createSponsoredEventPhotoInDb(p)));
    setPhotos(prev => [...newPhotos, ...prev]);
    setPhotoModalOpen(false);
    setPhotoUrls([]); setPhotoUrlInput(''); setPhotoCaption(''); setPhotoAlbumName('');
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('Remove this photo?')) return;
    await deleteSponsoredEventPhotoFromDb(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="hero-band relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/80 border border-amber-500/30 p-8 shadow-2xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Handshake size={14} className="text-amber-400" />
            <span>Community & Partner Sponsorships</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
            Events We're Proud to Sponsor
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            A running gallery of the events, tournaments, and community programs Aviyana Ceylon Resort has backed -- with real video and photo coverage from each one.
          </p>
        </div>
        {isStaffAuthenticated && (
          <button
            onClick={() => setEventModalOpen(true)}
            className="mt-5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg"
          >
            <Plus size={14} />
            <span>Add Sponsored Event</span>
          </button>
        )}
      </div>

      {selectedEvent ? (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedEventId(null)}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-semibold"
          >
            <ChevronLeft size={14} />
            <span>Back to all sponsored events</span>
          </button>

          {/* Event header */}
          <div className="bg-slate-900/80 border border-amber-500/20 rounded-3xl overflow-hidden">
            <div className="aspect-video max-h-72 overflow-hidden bg-black">
              <img src={selectedEvent.coverImageUrl} alt={selectedEvent.title} className="w-full h-full object-cover" onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div className="p-6 space-y-2">
              <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Sponsored by {selectedEvent.sponsorName}
              </span>
              <h2 className="text-2xl font-serif font-bold text-white">{selectedEvent.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1"><Calendar size={12} />{selectedEvent.eventDate}</span>
                {selectedEvent.location && <span className="flex items-center gap-1"><MapPin size={12} />{selectedEvent.location}</span>}
              </div>
              {selectedEvent.description && <p className="text-sm text-slate-300 mt-2">{selectedEvent.description}</p>}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => handleShareEvent(selectedEvent.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} className="text-amber-400" />}
                  <span>{copiedLink ? 'Link Copied!' : copyLinkError ? 'Could not copy' : 'Share Event'}</span>
                </button>
                {isStaffAuthenticated && (
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={12} />
                    <span>Delete this event</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Video gallery */}
          <section className="bg-slate-950 border border-amber-500/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Video size={16} />
                <span>Video Gallery ({eventMedia.length})</span>
              </div>
              {isStaffAuthenticated && (
                <button onClick={() => setVideoModalOpen(true)} className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                  <Plus size={12} /><span>Add Video</span>
                </button>
              )}
            </div>
            {eventMedia.length === 0 ? (
              <p className="text-xs text-slate-400">No videos added yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventMedia.map(m => (
                  <div key={m.id} className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer" onClick={() => setPlayingMedia(m)}>
                    <div className="aspect-video bg-black relative flex items-center justify-center">
                      {m.thumbnailUrl && <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />}
                      <PlayCircle className="absolute text-amber-400 drop-shadow-lg" size={40} />
                    </div>
                    <div className="p-3 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-white line-clamp-1">{m.title}</p>
                      {isStaffAuthenticated && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteVideo(m.id); }} className="p-1 rounded text-red-400 hover:bg-red-950 shrink-0">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Photo gallery (albums) */}
          <section className="bg-slate-950 border border-amber-500/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <ImageIcon size={16} />
                <span>Photo Gallery ({eventPhotos.length} photos, {albums.length} albums)</span>
              </div>
              {isStaffAuthenticated && (
                <button onClick={() => setPhotoModalOpen(true)} className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                  <Plus size={12} /><span>Add Photos</span>
                </button>
              )}
            </div>
            {albums.length === 0 ? (
              <p className="text-xs text-slate-400">No photos added yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {albums.map(album => (
                  <button key={album.albumId} onClick={() => { setOpenAlbumId(album.albumId); setOpenAlbumPhotoIndex(0); }} className="group text-left">
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative">
                      <img src={album.coverUrl} alt={album.albumName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                      {album.photos.length > 1 && (
                        <span className="absolute bottom-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/85 text-amber-300 border border-amber-500/30">
                          {album.photos.length} photos
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1.5 line-clamp-1">{album.albumName}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        // All-events grid
        events.length === 0 ? (
          <p className="text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            No sponsored events published yet. {isStaffAuthenticated && 'Use "Add Sponsored Event" above to publish the first one.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(ev => {
              const evVideoCount = media.filter(m => m.eventId === ev.id).length;
              const evPhotoCount = photos.filter(p => p.eventId === ev.id).length;
              return (
                <div key={ev.id} onClick={() => setSelectedEventId(ev.id)} className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden transition-all hover:-translate-y-1">
                  <div className="aspect-video overflow-hidden bg-black">
                    <img src={ev.coverImageUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(evt) => { (evt.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <div className="p-4 space-y-1.5">
                    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {ev.sponsorName}
                    </span>
                    <h3 className="text-sm font-serif font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">{ev.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span className="flex items-center gap-1"><Calendar size={11} />{ev.eventDate}</span>
                      <span className="flex items-center gap-1"><Video size={11} />{evVideoCount}</span>
                      <span className="flex items-center gap-1"><ImageIcon size={11} />{evPhotoCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Video player modal */}
      {playingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" onClick={() => setPlayingMedia(null)}>
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPlayingMedia(null)} aria-label="Close" className="absolute -top-10 right-0 p-1.5 text-slate-300 hover:text-white">
              <X size={22} />
            </button>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-amber-500/30 flex items-center justify-center">
              <SmartVideoPlayer url={playingMedia.videoUrl} className="max-w-full max-h-full w-full h-full object-contain mx-auto" title={playingMedia.title} />
            </div>
            <p className="text-sm text-white font-semibold mt-2">{playingMedia.title}</p>
          </div>
        </div>
      )}

      {/* Album lightbox */}
      {openAlbum && (() => {
        // Clamp against the album's current photo count -- deleting the
        // last-viewed photo (or any photo before it) would otherwise leave
        // openAlbumPhotoIndex pointing past the end of the (now shorter)
        // photos array, rendering a broken/undefined image with no way to
        // navigate back to a valid one.
        const safeIndex = Math.min(openAlbumPhotoIndex, openAlbum.photos.length - 1);
        const currentPhoto = openAlbum.photos[safeIndex];
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md" onClick={() => setOpenAlbumId(null)}>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpenAlbumId(null)} aria-label="Close" className="absolute -top-10 right-0 p-1.5 text-slate-300 hover:text-white">
              <X size={22} />
            </button>
            <div className="relative bg-black rounded-2xl overflow-hidden border border-amber-500/30 flex items-center justify-center min-h-[50vh]">
              <img
                src={currentPhoto?.imageUrl}
                alt={currentPhoto?.caption}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              {openAlbum.photos.length > 1 && (
                <>
                  <button
                    onClick={() => setOpenAlbumPhotoIndex((safeIndex - 1 + openAlbum.photos.length) % openAlbum.photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-800"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setOpenAlbumPhotoIndex((safeIndex + 1) % openAlbum.photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-800"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-sm text-white font-semibold">{openAlbum.albumName}</p>
                <p className="text-xs text-slate-400">Photo {safeIndex + 1} of {openAlbum.photos.length} -- more photos in this album</p>
              </div>
              {isStaffAuthenticated && (
                <button
                  onClick={() => {
                    if (currentPhoto) handleDeletePhoto(currentPhoto.id);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-red-950 text-red-400 border border-red-500/40 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 size={12} /><span>Delete Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Add Event modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-white">Add Sponsored Event</h3>
              <button onClick={() => setEventModalOpen(false)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title *</label>
                <input required value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="e.g. Kandy Junior Golf Championship" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sponsor Name *</label>
                <input required value={evSponsor} onChange={e => setEvSponsor(e.target.value)} placeholder="e.g. Aviyana Ceylon Resort" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                  <input value={evLocation} onChange={e => setEvLocation(e.target.value)} placeholder="e.g. Kandy" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea rows={3} value={evDescription} onChange={e => setEvDescription(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Image</label>
                <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl text-xs text-slate-400 cursor-pointer">
                  {evUploading ? <Loader2 size={14} className="animate-spin text-amber-400" /> : <Upload size={14} className="text-amber-400" />}
                  <span className="truncate">{evCoverUrl ? 'Cover selected' : 'Upload a cover image...'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleCoverFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEventModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={evSaving} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50">
                  {evSaving ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Video modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-white">Add Video</h3>
              <button onClick={() => setVideoModalOpen(false)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddVideo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input required value={vTitle} onChange={e => setVTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Video URL (YouTube recommended) *</label>
                <input required value={vUrl} onChange={e => setVUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail URL (optional)</label>
                <input value={vThumb} onChange={e => setVThumb(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setVideoModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs">Add Video</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Photos modal */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-white">Add Photos (one album)</h3>
              <button onClick={() => setPhotoModalOpen(false)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitPhotos} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Album Name</label>
                <input value={photoAlbumName} onChange={e => setPhotoAlbumName(e.target.value)} placeholder="e.g. Award Ceremony" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Caption *</label>
                <input required value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Photos</label>
                <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl text-xs text-slate-400 cursor-pointer">
                  {photoUploading ? <Loader2 size={14} className="animate-spin text-amber-400" /> : <Upload size={14} className="text-amber-400" />}
                  <span>Choose files...</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoFiles(e.target.files)} />
                </label>
              </div>
              <div className="flex gap-2">
                <input value={photoUrlInput} onChange={e => setPhotoUrlInput(e.target.value)} placeholder="Or paste an image URL" className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                <button type="button" onClick={handleAddPhotoUrl} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs">Add</button>
              </div>
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 p-0.5 rounded bg-slate-950/80 text-red-400">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPhotoModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={photoUrls.length === 0 || !photoCaption.trim()} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-40">
                  Add {photoUrls.length > 1 ? `${photoUrls.length} Photos` : 'Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
