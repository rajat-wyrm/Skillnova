
// ════════════════════════════════════════════════════════════
// Auth Store — Zustand
// ════════════════════════════════════════════════════════════

import { create } from "zustand";
import api, { getErrorMessage } from "./api";
import { APP_CONSTANTS } from "../shared/config/constants";


const STORAGE_KEY = APP_CONSTANTS.AUTH_STORAGE_KEY || "skillnova.auth";

const STORAGE_ENABLED = !import.meta.env.DEV;


const loadFromStorage = () => {
  if (!STORAGE_ENABLED) return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_e) {
    void _e;
    return null;
  }
};


const persist = (state) => {

  try {

    if (!state.user || !state.accessToken) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
      })
    );

  } catch (_e) { void _e; /* ignore storage errors */ }

};


// Minimal client-side derivePermissions fallback. The server returns
// `permissions` for authenticated users; this is only used when the
// server response doesn't include permissions (e.g., during dev).
const derivePermissions = (role) => {
  if (!role) return [];
  // Role names in server are uppercase; normalize to be safe.
  const r = String(role).toUpperCase();
  // Simple defaults: interns have limited access, others have broader access.
  if (r === "INTERN") return ["reports:read", "kb:read", "ai:use"];
  if (r === "MENTOR") return ["reports:read", "reports:review", "kb:read", "ai:use"];
  if (r === "ADMIN" || r === "SUPER_ADMIN") return ["users:read", "reports:read", "kb:read", "ai:use", "settings:read"];
  return [];
};


export const useAuthStore = create((set, get) => ({

  user: null,
  accessToken: null,
  permissions: [],

  step: "login",

  challengeToken: null,
  devCode: null,
  otpMode: "admin",
  contactHint: null,

  internStartDate: null,
  internEndDate: null,

  loading:false,
  error:null,
  hydrated:false,


  hydrate: async()=>{

    if(get().hydrated) return;


    try{

      const {data}=await api.get("/auth/me");


      set({

        user:data.user,

        permissions:
          data.permissions ??
          derivePermissions(data.user?.role),

        step:"authenticated",

        hydrated:true

      });


      persist(get());

      return;


    } catch (_e) { void _e; /* ignore */ }


    const stored=loadFromStorage();


    if(stored?.user && stored?.accessToken){

      set({

        user:stored.user,

        accessToken:stored.accessToken,

        permissions:
          derivePermissions(stored.user.role),

        step:"authenticated",

        hydrated:true

      });


    }else{

      set({

        user:null,
        accessToken:null,
        permissions:[],
        step:"login",
        hydrated:true

      });

    }

  },



  login:async({email,password,rememberMe=true})=>{

    set({
      loading:true,
      error:null
    });


    try{


      const {data}=await api.post(
        "/auth/login",
        {
          email,
          password,
          rememberMe
        }
      );


      if(data.step==="otp_required"){


        set({

          step:"otp",

          challengeToken:data.challengeToken,

          devCode:data.devCode ?? null,

          contactHint:data.contactHint,

          otpMode:
            data.otpMode ??
            (
              data.user?.role==="INTERN"
              ?"user"
              :"admin"
            ),

          loading:false

        });


        return {
          step:"otp"
        };

      }



      set({

        user:data.user,

        accessToken:data.accessToken,

        permissions:
          derivePermissions(data.user.role),

        step:"authenticated",

        loading:false

      });


      persist(get());


      return {
        step:"authenticated"
      };


    }catch(err){

      set({

        loading:false,

        error:getErrorMessage(err)

      });


      throw err;

    }

    },

    // Verify OTP (admin / 2FA) using the challenge token from `login`
    verifyOtp: async ({ code, useTotp = false }) => {
      set({ loading: true, error: null });
      try {
        const challengeToken = get().challengeToken;
        if (!challengeToken) throw new Error("Missing challenge token");

        const { data } = await api.post("/auth/verify-otp", {
          challengeToken,
          code,
          useTotp,
        });

        set({
          user: data.user,
          accessToken: data.accessToken,
          permissions: data.permissions ?? derivePermissions(data.user?.role),
          step: "authenticated",
          challengeToken: null,
          devCode: null,
          loading: false,
        });

        persist(get());

        return { step: "authenticated" };
      } catch (err) {
        set({ loading: false, error: getErrorMessage(err) });
        throw err;
      }
    },

    // Basic logout helper
    logout: () => {
      set({ user: null, accessToken: null, permissions: [], step: 'login' });
      try { localStorage.removeItem(STORAGE_KEY); } catch (_e) { void _e; /* ignore */ }
    }

  }));

  