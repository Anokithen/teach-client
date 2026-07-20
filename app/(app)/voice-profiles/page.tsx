'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { voiceProfilesApi } from '@/lib/endpoints';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth-context';
import { ApiErrorShape, VoiceProfile, VoiceProfileStatus } from '@/lib/types';

const MAX_BYTES = 25 * 1024 * 1024;
const STATUS_TONE: Record<VoiceProfileStatus, 'warning' | 'success' | 'danger'> = {
  processing: 'warning', ready: 'success', failed: 'danger',
};

export default function VoiceProfilesPage() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<VoiceProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | string[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VoiceProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<VoiceProfile | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function load() {
    try { setProfiles((await voiceProfilesApi.list()).data.voice_profiles); }
    catch (err) { setError((err as ApiErrorShape).message); }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    setCreateError(null);
    if (!selected) return setFile(null);
    const extension = selected.name.split('.').pop()?.toLowerCase();
    if (!['mp3', 'wav'].includes(extension || '')) return setCreateError('Choose an MP3 or WAV file.');
    if (selected.size > MAX_BYTES) return setCreateError('The recording must be smaller than 25 MB.');
    setFile(selected);
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!file) return setCreateError('Choose an MP3 or WAV recording.');
    setCreateError(null); setCreating(true);
    try {
      const data = new FormData();
      data.append('audio', file);
      if (label.trim()) data.append('label', label.trim());
      const res = await voiceProfilesApi.create(data);
      setProfiles((previous) => [res.data.voice_profile, ...(previous || [])]);
      setLabel(''); setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      const apiError = err as ApiErrorShape;
      setCreateError(apiError.fields?.length ? apiError.fields : apiError.message);
    } finally { setCreating(false); }
  }

  async function onSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await voiceProfilesApi.update(editing.id, { label: editLabel });
      setProfiles((previous) => previous?.map((profile) => profile.id === editing.id ? res.data.voice_profile : profile) || null);
      setEditing(null);
    } catch (err) { setError((err as ApiErrorShape).message); }
    finally { setSaving(false); }
  }

  async function onPreview(profile: VoiceProfile) {
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const res = await voiceProfilesApi.audio(profile.id);
      setPreviewUrl(URL.createObjectURL(res.data));
    } catch (err) { setError((err as ApiErrorShape).message); }
  }

  async function onDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await voiceProfilesApi.remove(pendingDelete.id);
      setProfiles((previous) => (previous || []).filter((profile) => profile.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) { setError((err as ApiErrorShape).message); }
    finally { setDeleting(false); }
  }

  return <div>
    <h1 className="text-2xl font-semibold text-brand-900">Voice recordings</h1>
    <p className="mt-1 text-sm text-muted">Private recordings are available only to their owner and administrators.</p>
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="mb-4 text-sm font-semibold text-brand-900">Stored voice profiles</h2>
        {!profiles && !error && <Spinner />}
        {error && <Alert>{error}</Alert>}
        {profiles?.length === 0 && <EmptyState title="No recordings yet" description="Upload an MP3 or WAV recording to create a voice profile." />}
        {profiles && profiles.length > 0 && <ul className="divide-y divide-border">
          {profiles.map((profile) => <li key={profile.id} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-medium text-brand-900">{profile.label || `Voice profile #${profile.id}`}</p>
                <p className="text-xs text-muted">{profile.owner_name && `${profile.owner_name} · `}Created {new Date(profile.created_at).toLocaleDateString()}</p></div>
              <div className="flex items-center gap-2"><Badge tone={STATUS_TONE[profile.status] || 'warning'}>{profile.status}</Badge>
                <Button variant="ghost" onClick={() => onPreview(profile)}>Preview</Button>
                <Button variant="ghost" onClick={() => { setEditing(profile); setEditLabel(profile.label || ''); }}>Edit</Button>
                <Button variant="ghost" onClick={() => setPendingDelete(profile)}>Delete</Button></div>
            </div>
          </li>)}
        </ul>}
        {previewUrl && <audio className="mt-4 w-full" controls autoPlay src={previewUrl}>Your browser cannot play this recording.</audio>}
      </Card>
      {!isAdmin && <Card><h2 className="mb-4 text-sm font-semibold text-brand-900">Create a voice profile</h2>
        <form onSubmit={onCreate} className="space-y-4">
          <Input label="Label (optional)" value={label} onChange={(event) => setLabel(event.target.value)} />
          <label className="block text-sm font-medium text-brand-900">Voice recording
            <input ref={fileInput} type="file" accept="audio/mpeg,audio/wav,.mp3,.wav" required onChange={onFileChange} className="mt-1 block w-full text-sm text-muted" />
          </label>
          <p className="-mt-2 text-xs text-muted">MP3 or WAV only, smaller than 25 MB. Upload only a voice you have permission to use.</p>
          <Alert>{createError}</Alert><Button type="submit" loading={creating} className="w-full">Upload recording</Button>
        </form>
      </Card>
      }
    </div>
    <ConfirmDialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={onDelete} loading={deleting} title="Delete this voice profile?" description="This permanently deletes the profile and its Cloudinary recording." confirmLabel="Delete" />
    <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit voice profile" footer={<><Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button><Button onClick={onSave} loading={saving}>Save label</Button></>}>
      <Input label="Label" value={editLabel} onChange={(event) => setEditLabel(event.target.value)} />
    </Modal>
  </div>;
}
