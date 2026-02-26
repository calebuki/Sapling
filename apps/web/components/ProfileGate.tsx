'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  createProfile,
  listProfiles,
  loginProfile,
  type ProfileSummary,
  upgradeGuestProfile
} from '../lib/api';
import { useAppStore } from '../lib/store';
import { PillButton } from './PillButton';

type ProfileGateProps = {
  compact?: boolean;
};

export function ProfileGate({ compact = false }: ProfileGateProps) {
  const queryClient = useQueryClient();
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);

  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [upgradeName, setUpgradeName] = useState('');
  const [upgradePin, setUpgradePin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const profilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles
  });

  const profileOptions = useMemo(() => profilesQuery.data?.profiles ?? [], [profilesQuery.data?.profiles]);

  const selectedProfile = useMemo(() => {
    return profileOptions.find((option) => option.id === selectedProfileId);
  }, [profileOptions, selectedProfileId]);

  const loginMutation = useMutation({
    mutationFn: loginProfile,
    onSuccess: (data) => {
      setProfile(data.profile);
      setError(null);
      setPin('');
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    }
  });

  const createMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setProfile(data.profile as ProfileSummary);
      setNewName('');
      setNewPin('');
      setError(null);
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    }
  });

  const upgradeMutation = useMutation({
    mutationFn: (input: { profileId: string; name: string; pin?: string }) =>
      upgradeGuestProfile(input.profileId, { name: input.name, pin: input.pin }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setProfile(data.profile as ProfileSummary);
      setUpgradeName('');
      setUpgradePin('');
      setError(null);
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    }
  });

  if (profilesQuery.isLoading) {
    return <div className="rounded-2xl bg-white p-5 shadow-bubble">Loading profiles...</div>;
  }

  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-bubble">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-sapling-800">Local Profile</h3>
          <p className="text-sm text-sapling-700">
            Progress is saved in SQLite on this machine. No cloud account required.
          </p>
        </div>
        {profile && (
          <span className="rounded-full bg-sapling-100 px-3 py-1 text-xs font-semibold text-sapling-700">
            Active: {profile.name}
          </span>
        )}
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-3 gap-3'}>
        <select
          value={selectedProfileId}
          onChange={(event) => setSelectedProfileId(event.target.value)}
          className="rounded-2xl border border-sapling-200 px-3 py-2"
        >
          <option value="">Select profile</option>
          {profileOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} {option.isGuest ? '(Guest)' : ''}
            </option>
          ))}
        </select>

        <input
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          type="password"
          placeholder={selectedProfile?.hasPin ? 'PIN required' : 'PIN (optional)'}
          className="rounded-2xl border border-sapling-200 px-3 py-2"
        />

        <PillButton
          onClick={() => {
            if (!selectedProfileId) {
              setError('Select a profile first.');
              return;
            }

            loginMutation.mutate({ profileId: selectedProfileId, pin: pin || undefined });
          }}
          disabled={!selectedProfileId || loginMutation.isPending}
        >
          Log in
        </PillButton>
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-4 gap-3'}>
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="New profile name"
          className="rounded-2xl border border-sapling-200 px-3 py-2"
        />
        <input
          value={newPin}
          onChange={(event) => setNewPin(event.target.value)}
          type="password"
          placeholder="PIN (optional)"
          className="rounded-2xl border border-sapling-200 px-3 py-2"
        />
        <PillButton
          onClick={() => {
            if (!newName.trim()) {
              setError('Profile name is required.');
              return;
            }

            createMutation.mutate({ name: newName.trim(), pin: newPin || undefined });
          }}
          disabled={createMutation.isPending}
        >
          Create Profile
        </PillButton>
      </div>

      {profile?.isGuest && (
        <div className="space-y-3 rounded-2xl border border-earth-yellow/70 bg-earth-cream p-4">
          <p className="text-sm text-earth-brown">
            Upgrade your guest profile to keep a permanent named identity.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <input
              value={upgradeName}
              onChange={(event) => setUpgradeName(event.target.value)}
              placeholder="New profile name"
              className="rounded-2xl border border-sapling-200 px-3 py-2"
            />
            <input
              value={upgradePin}
              onChange={(event) => setUpgradePin(event.target.value)}
              type="password"
              placeholder="PIN (optional)"
              className="rounded-2xl border border-sapling-200 px-3 py-2"
            />
            <PillButton
              variant="secondary"
              onClick={() => {
                if (!profile) {
                  return;
                }

                if (!upgradeName.trim()) {
                  setError('Upgrade name is required.');
                  return;
                }

                upgradeMutation.mutate({
                  profileId: profile.id,
                  name: upgradeName.trim(),
                  pin: upgradePin || undefined
                });
              }}
              disabled={upgradeMutation.isPending}
            >
              Upgrade Guest
            </PillButton>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
    </section>
  );
}
