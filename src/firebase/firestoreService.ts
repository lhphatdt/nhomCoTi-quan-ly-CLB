import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signInAnonymously,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './config.ts';
import { ClubMember, ClubEvent, TreasuryTransaction, AuthUser } from '../types.ts';
import {
  INITIAL_MEMBERS,
  INITIAL_EVENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_AUTH_USERS,
} from '../data/initialClubData.ts';

// Collections
const MEMBERS_COLLECTION = 'members';
const EVENTS_COLLECTION = 'events';
const TRANSACTIONS_COLLECTION = 'transactions';
const USERS_COLLECTION = 'users';

/**
 * Ensure the client has an active Firebase Auth session so firestore.rules
 * (request.auth != null) passes. Tries anonymous sign-in if not signed in with Google.
 */
export async function ensureFirebaseAuth(): Promise<FirebaseUser | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous auth not enabled or failed, will wait for Google sign-in:', err);
    return null;
  }
}

/**
 * Google Sign-In
 */
export async function signInWithGoogleAccount(): Promise<AuthUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Derive initial user profile from Google Account
  const mssvMatch = fbUser.email?.match(/\d{7,8}/);
  const mssv = mssvMatch ? mssvMatch[0] : `B23DCCN${Math.floor(100 + Math.random() * 900)}`;

  const userProfile: AuthUser = {
    id: fbUser.uid,
    mssv,
    fullName: fbUser.displayName || 'Thành viên Google',
    email: fbUser.email || 'user@school.edu.vn',
    phone: fbUser.phoneNumber || '0988776655',
    department: 'Ban Chuyên môn',
    role: 'member',
    roleTitle: 'Hội viên Google',
    avatar: fbUser.photoURL || undefined,
    status: 'official',
  };

  // Persist user profile to Firestore
  try {
    await setDoc(doc(db, USERS_COLLECTION, fbUser.uid), userProfile, { merge: true });
  } catch (e) {
    console.warn('Could not persist user doc:', e);
  }

  return userProfile;
}

/**
 * Sign out
 */
export async function logoutFirebaseAuth(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.error('Logout error:', e);
  }
}

/**
 * Listen to auth state changes
 */
export function subscribeAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Seed initial mock data if Firestore collections are empty
 */
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const membersSnap = await getDocs(collection(db, MEMBERS_COLLECTION));
    if (membersSnap.empty) {
      console.log('Seeding initial members into Firestore...');
      for (const m of INITIAL_MEMBERS) {
        await setDoc(doc(db, MEMBERS_COLLECTION, m.id), m);
      }
    }

    const eventsSnap = await getDocs(collection(db, EVENTS_COLLECTION));
    if (eventsSnap.empty) {
      console.log('Seeding initial events into Firestore...');
      for (const ev of INITIAL_EVENTS) {
        await setDoc(doc(db, EVENTS_COLLECTION, ev.id), ev);
      }
    }

    const txSnap = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
    if (txSnap.empty) {
      console.log('Seeding initial transactions into Firestore...');
      for (const t of INITIAL_TRANSACTIONS) {
        await setDoc(doc(db, TRANSACTIONS_COLLECTION, t.id), t);
      }
    }

    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    if (usersSnap.empty) {
      console.log('Seeding initial users into Firestore...');
      for (const u of INITIAL_AUTH_USERS) {
        await setDoc(doc(db, USERS_COLLECTION, u.id), u);
      }
    }
  } catch (err) {
    console.warn('Seed initial data error (offline or rules protected):', err);
  }
}

/**
 * Real-time listeners
 */
export function subscribeMembers(
  onUpdate: (members: ClubMember[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, MEMBERS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map((d) => d.data() as ClubMember);
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('Firestore members subscription warning:', err);
      onError?.(err);
    }
  );
}

export function subscribeEvents(
  onUpdate: (events: ClubEvent[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, EVENTS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map((d) => d.data() as ClubEvent);
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('Firestore events subscription warning:', err);
      onError?.(err);
    }
  );
}

export function subscribeTransactions(
  onUpdate: (transactions: TreasuryTransaction[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, TRANSACTIONS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map((d) => d.data() as TreasuryTransaction);
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('Firestore transactions subscription warning:', err);
      onError?.(err);
    }
  );
}

export function subscribeAuthUsers(
  onUpdate: (users: AuthUser[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, USERS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map((d) => d.data() as AuthUser);
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('Firestore users subscription warning:', err);
      onError?.(err);
    }
  );
}

/**
 * Data Mutations with error handling
 */
export async function addMemberDoc(member: ClubMember): Promise<void> {
  try {
    await setDoc(doc(db, MEMBERS_COLLECTION, member.id), member);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${MEMBERS_COLLECTION}/${member.id}`);
  }
}

export async function updateMemberDoc(id: string, updates: Partial<ClubMember>): Promise<void> {
  try {
    await updateDoc(doc(db, MEMBERS_COLLECTION, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${MEMBERS_COLLECTION}/${id}`);
  }
}

export async function deleteMemberDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, MEMBERS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MEMBERS_COLLECTION}/${id}`);
  }
}

export async function addEventDoc(event: ClubEvent): Promise<void> {
  try {
    await setDoc(doc(db, EVENTS_COLLECTION, event.id), event);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${EVENTS_COLLECTION}/${event.id}`);
  }
}

export async function updateEventDoc(id: string, updates: Partial<ClubEvent>): Promise<void> {
  try {
    await updateDoc(doc(db, EVENTS_COLLECTION, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${EVENTS_COLLECTION}/${id}`);
  }
}

export async function deleteEventDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EVENTS_COLLECTION}/${id}`);
  }
}

export async function addTransactionDoc(tx: TreasuryTransaction): Promise<void> {
  try {
    await setDoc(doc(db, TRANSACTIONS_COLLECTION, tx.id), tx);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${TRANSACTIONS_COLLECTION}/${tx.id}`);
  }
}

export async function updateTransactionDoc(
  id: string,
  updates: Partial<TreasuryTransaction>
): Promise<void> {
  try {
    await updateDoc(doc(db, TRANSACTIONS_COLLECTION, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${TRANSACTIONS_COLLECTION}/${id}`);
  }
}

export async function saveUserDoc(user: AuthUser): Promise<void> {
  try {
    await setDoc(doc(db, USERS_COLLECTION, user.id), user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${USERS_COLLECTION}/${user.id}`);
  }
}
