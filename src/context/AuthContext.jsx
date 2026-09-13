import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const AuthContext = createContext(null);

const DEMO_USER_KEY = 'brs_current_user';
const DEMO_USERS_DB_KEY = 'brs_demo_users_db';

// Default pre-seeded demo user
const DEFAULT_DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  password: 'password123',
  role: 'admin',
  user_metadata: {
    full_name: 'Alex Johnson (Admin)',
    phone: '+91 98765 43210',
    role: 'admin'
  }
};

const DEFAULT_DEMO_PROFILE = {
  id: 'demo-user-123',
  full_name: 'Alex Johnson (Admin)',
  email: 'demo@example.com',
  phone: '+91 98765 43210',
  role: 'admin',
  created_at: new Date().toISOString()
};

function getStoredDemoUsers() {
  try {
    const list = JSON.parse(localStorage.getItem(DEMO_USERS_DB_KEY) || '[]');
    const existingIndex = list.findIndex(u => u.email === DEFAULT_DEMO_USER.email);
    if (existingIndex === -1) {
      list.push(DEFAULT_DEMO_USER);
      localStorage.setItem(DEMO_USERS_DB_KEY, JSON.stringify(list));
    } else if (list[existingIndex].role !== 'admin') {
      list[existingIndex].role = 'admin';
      list[existingIndex].user_metadata = {
        ...list[existingIndex].user_metadata,
        role: 'admin'
      };
      localStorage.setItem(DEMO_USERS_DB_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [DEFAULT_DEMO_USER];
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLive = isSupabaseConfigured();

  // Fetch or create profile row in Supabase
  const loadSupabaseProfile = async (supabaseUser) => {
    if (!supabaseUser) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        // If profile row doesn't exist yet, create one
        const fallbackProfile = {
          id: supabaseUser.id,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
          email: supabaseUser.email,
          phone: supabaseUser.user_metadata?.phone || '',
          role: 'user'
        };
        await supabase.from('profiles').upsert(fallbackProfile);
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.warn("Could not load user profile:", err);
      setProfile({
        id: supabaseUser.id,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        email: supabaseUser.email,
        phone: supabaseUser.user_metadata?.phone || '',
        role: 'user'
      });
    }
  };

  useEffect(() => {
    if (isLive) {
      // 1. Check active Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          loadSupabaseProfile(currentUser);
        }
        setLoading(false);
      }).catch((err) => {
        console.warn("Error getting Supabase session:", err);
        setLoading(false);
      });

      // 2. Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await loadSupabaseProfile(currentUser);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local Demo Auth Mode
      try {
        const stored = localStorage.getItem(DEMO_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          const users = getStoredDemoUsers();
          const match = users.find(u => u.id === parsed.id || u.email === parsed.email);
          const userRole = match?.role || parsed.role || parsed.user_metadata?.role || (parsed.email === 'demo@example.com' ? 'admin' : 'user');
          setProfile({
            id: parsed.id,
            full_name: parsed.user_metadata?.full_name || parsed.email.split('@')[0],
            email: parsed.email,
            phone: parsed.user_metadata?.phone || '',
            role: userRole,
            created_at: parsed.created_at || new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn("Error loading demo user:", e);
      }
      setLoading(false);
    }
  }, [isLive]);

  // Login
  const login = async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (isLive) {
      try {
        const res = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password
        });
        if (res.data?.user) {
          await loadSupabaseProfile(res.data.user);
        }
        return res;
      } catch (networkErr) {
        return { data: null, error: { message: networkErr.message || 'Connection failed' } };
      }
    }

    // Local Demo Login
    const users = getStoredDemoUsers();
    const found = users.find(u => u.email.toLowerCase() === trimmedEmail && u.password === password);

    if (!found) {
      return {
        data: null,
        error: { message: 'Invalid email or password. (Hint: Use demo@example.com / password123)' }
      };
    }

    const assignedRole = found.role || (found.email === 'demo@example.com' ? 'admin' : 'user');

    const demoUser = {
      id: found.id,
      email: found.email,
      role: assignedRole,
      user_metadata: {
        ...found.user_metadata,
        role: assignedRole
      }
    };

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setProfile({
      id: found.id,
      full_name: found.user_metadata?.full_name || found.email.split('@')[0],
      email: found.email,
      phone: found.user_metadata?.phone || '',
      role: assignedRole,
      created_at: new Date().toISOString()
    });

    return { data: { user: demoUser, session: { access_token: 'demo-token' } }, error: null };
  };

  // Signup
  const signup = async (email, password, fullName, phone = '') => {
    const trimmedEmail = email.trim().toLowerCase();

    if (isLive) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone
            }
          }
        });

        if (error) return { data, error };

        // If session exists or user created, save profile
        if (data?.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: fullName,
              email: trimmedEmail,
              phone: phone,
              role: 'user'
            });
            await loadSupabaseProfile(data.user);
          } catch (profileErr) {
            console.warn("Could not insert profile:", profileErr);
          }
        }

        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message || 'Signup failed' } };
      }
    }

    // Local Demo Signup
    const users = getStoredDemoUsers();
    if (users.some(u => u.email.toLowerCase() === trimmedEmail)) {
      return { data: null, error: { message: 'An account with this email already exists.' } };
    }

    const newUser = {
      id: 'demo-' + Date.now(),
      email: trimmedEmail,
      password: password,
      user_metadata: {
        full_name: fullName,
        phone: phone
      }
    };

    users.push(newUser);
    localStorage.setItem(DEMO_USERS_DB_KEY, JSON.stringify(users));

    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      user_metadata: newUser.user_metadata
    };

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setProfile({
      id: newUser.id,
      full_name: fullName,
      email: trimmedEmail,
      phone: phone,
      role: 'user',
      created_at: new Date().toISOString()
    });

    return { data: { user: sessionUser, session: { access_token: 'demo-token' } }, error: null };
  };

  // Logout
  const logout = async () => {
    if (isLive) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase signout warning:", err);
      }
    }
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    return { error: null };
  };

  // Update Profile (Name & Phone)
  const updateProfile = async ({ fullName, phone }) => {
    if (!user) return { error: { message: 'Not logged in' } };

    if (isLive) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;
        setProfile(data);

        // Also update Supabase auth metadata
        await supabase.auth.updateUser({
          data: { full_name: fullName, phone: phone }
        });

        return { data, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    // Local Demo Profile Update
    const updatedProfile = {
      ...profile,
      full_name: fullName,
      phone: phone
    };
    setProfile(updatedProfile);

    const updatedUser = {
      ...user,
      user_metadata: {
        ...user.user_metadata,
        full_name: fullName,
        phone: phone
      }
    };
    setUser(updatedUser);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updatedUser));

    return { data: updatedProfile, error: null };
  };

  // Switch role between 'user' and 'admin' (supported in demo, or live if user is admin)
  const toggleRole = async () => {
    const nextRole = profile?.role === 'admin' ? 'user' : 'admin';
    if (isLive) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ role: nextRole })
          .eq('id', user.id)
          .select()
          .single();
        if (!error && data) {
          setProfile(data);
          return { data, error: null };
        }
      } catch (err) {
        console.warn("Could not toggle role in Supabase:", err);
      }
    }

    const updatedProfile = { ...profile, role: nextRole };
    setProfile(updatedProfile);
    if (user) {
      const updatedUser = {
        ...user,
        role: nextRole,
        user_metadata: { ...user.user_metadata, role: nextRole }
      };
      setUser(updatedUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updatedUser));
      const users = getStoredDemoUsers();
      const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
      if (idx !== -1) {
        users[idx].role = nextRole;
        users[idx].user_metadata = { ...users[idx].user_metadata, role: nextRole };
        localStorage.setItem(DEMO_USERS_DB_KEY, JSON.stringify(users));
      }
    }
    return { data: updatedProfile, error: null };
  };

  // Reset Password
  const resetPassword = async (email) => {
    if (isLive) {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login'
      });
    }
    // Demo response
    return { data: {}, error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isLiveAuth: isLive,
        isAdmin: profile?.role === 'admin',
        login,
        signup,
        logout,
        updateProfile,
        toggleRole,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
