// src/services/firebase.ts
//
// Talks directly to the Firebase Realtime Database REST API using the
// legacy database secret -- no OAuth token exchange needed, unlike the
// Arduino Cloud version. Every request is a plain HTTPS GET/PATCH with
// the secret as a query parameter.

import { FIREBASE_CONFIG } from '../config';

const BASE_URL = `${FIREBASE_CONFIG.DATABASE_URL}/.json?auth=${FIREBASE_CONFIG.DATABASE_SECRET}`;

type GarageState = {
  openGarage?: boolean;
  closeGarage?: boolean;
  garageOnline?: boolean;
};

export async function fetchGarageState(): Promise<GarageState> {
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    throw new Error(`Firebase GET failed (${res.status})`);
  }
  return (await res.json()) ?? {};
}

export async function getGarageOnline(): Promise<boolean> {
  const state = await fetchGarageState();
  return Boolean(state.garageOnline);
}

async function patchGarageState(patch: GarageState): Promise<void> {
  const res = await fetch(BASE_URL, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Firebase PATCH failed (${res.status})`);
  }
}

export async function triggerOpenGarage(): Promise<void> {
  await patchGarageState({ openGarage: true });
}

export async function triggerCloseGarage(): Promise<void> {
  await patchGarageState({ closeGarage: true });
}
