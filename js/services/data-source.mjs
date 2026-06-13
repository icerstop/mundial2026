
import { FIREBASE_CONFIG } from '../config/firebase.mjs';

let localPollingId = null;

async function fetchLocalData(cacheBust = false) {
  const suffix = cacheBust ? `?t=${Date.now()}` : '';
  const response = await fetch(`data/matches.json${suffix}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function startLocalPolling(onData, getCurrentData) {
  if (localPollingId) return;
  localPollingId = setInterval(async () => {
    try {
      const nextData = await fetchLocalData(true);
      if (nextData.meta?.lastUpdated !== getCurrentData()?.meta?.lastUpdated) {
        onData(nextData);
      }
    } catch (error) {
      console.warn('Real-time sync failed:', error);
    }
  }, 5000);
}

async function useLocalSource(onData, onError, getCurrentData) {
  try {
    onData(await fetchLocalData());
    startLocalPolling(onData, getCurrentData);
  } catch (error) {
    onError(error);
  }
}

export function startDataSource({ onData, onError, getCurrentData }) {
  const firebaseApi = window.firebase;
  if (!FIREBASE_CONFIG.databaseURL || !firebaseApi) {
    useLocalSource(onData, onError, getCurrentData);
    return;
  }

  try {
    if (!firebaseApi.apps?.length) firebaseApi.initializeApp(FIREBASE_CONFIG);
    firebaseApi.database().ref('worldcup').on('value', snapshot => {
      const value = snapshot.val();
      if (value) {
        onData(value);
      } else {
        console.warn('Firebase is empty, using the local snapshot.');
        useLocalSource(onData, onError, getCurrentData);
      }
    }, error => {
      console.error('Firebase read error:', error);
      useLocalSource(onData, onError, getCurrentData);
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    useLocalSource(onData, onError, getCurrentData);
  }
}
