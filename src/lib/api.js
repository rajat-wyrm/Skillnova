// ════════════════════════════════════════════════════════════
// Axios client with auth interceptor + CSRF + refresh
// ════════════════════════════════════════════════════════════

import axios from "axios";
import { APP_CONSTANTS } from "../shared/config/constants";


const BASE_URL =
  import.meta.env.VITE_API_URL || "/api/v1";


export const api = axios.create({

  baseURL: BASE_URL,

  withCredentials: true,

  timeout:
    APP_CONSTANTS.API_TIMEOUT || 30000,

  headers: {
    "Content-Type": "application/json",
  },

});



// ── Helpers ──────────────────────────────────────────────

const getCookie = (name) => {

  if (typeof document === "undefined") {
    return null;
  }


  const match = document.cookie.match(
    new RegExp(
      "(^|;\\s*)" + name + "=([^;]+)"
    )
  );


  return match
    ? decodeURIComponent(match[2])
    : null;

};



const getStoredAccessToken = () => {

  try {

    const raw =
      localStorage.getItem(
        APP_CONSTANTS.AUTH_STORAGE_KEY ||
        "skillnova.auth"
      );


    if (!raw) return null;


    const parsed = JSON.parse(raw);


    return parsed?.accessToken || null;


  } catch {

    return null;

  }

};




// ── Request interceptor ─────────────────────────────────

api.interceptors.request.use(

  (config) => {


    const token =
      getStoredAccessToken();


    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }



    const csrf =
      getCookie(
        APP_CONSTANTS.CSRF_COOKIE ||
        "sn_csrf"
      );



    const method =
      config.method?.toLowerCase();



    if (
      csrf &&
      ["post","put","patch","delete"]
        .includes(method)
    ) {

      config.headers[
        APP_CONSTANTS.CSRF_HEADER ||
        "X-CSRF-Token"
      ] = csrf;

    }



    return config;

  },

  (error) =>
    Promise.reject(error)

);





// ── Response interceptor — refresh token ────────────────

let refreshing = null;


const REFRESH_EXCLUDED_URLS =
  new Set([
    "/auth/refresh",
    "/auth/login",
    "/auth/verify-otp",
  ]);



api.interceptors.response.use(

  (response) =>
    response,


  async(error)=>{


    const original =
      error.config;


    const status =
      error.response?.status;



    if (
      status === 401 &&
      original &&
      !original._retry &&
      !REFRESH_EXCLUDED_URLS.has(original.url)
    ) {


      original._retry = true;



      try {


        refreshing =
          refreshing ||
          axios.post(
            `${BASE_URL}/auth/refresh`,
            {},
            {
              withCredentials:true
            }
          );



        const refreshResponse =
          await refreshing;


        refreshing = null;



        const newToken =
          refreshResponse.data?.accessToken;



        if(newToken){


          const key =
            APP_CONSTANTS.AUTH_STORAGE_KEY ||
            "skillnova.auth";



          const old =
            JSON.parse(
              localStorage.getItem(key) || "{}"
            );



          localStorage.setItem(

            key,

            JSON.stringify({

              ...old,

              accessToken:newToken

            })

          );

        }



        return api(original);



      } catch(refreshError){


        refreshing = null;


        if(typeof window !== "undefined"){

          window.dispatchEvent(
            new CustomEvent(
              "skillnova:logout"
            )
          );

        }


        return Promise.reject(refreshError);

      }

    }



    return Promise.reject(error);

  }

);




// ── Error normalisation ─────────────────────────────────

export function getErrorMessage(err){


  if(!err){

    return "Something went wrong";

  }



  const errors =
    err.response?.data?.errors;



  if(
    Array.isArray(errors) &&
    errors.length
  ){

    return (
      errors[0]?.message ||
      err.response?.data?.error ||
      "Validation failed"
    );

  }



  if(err.response?.data?.error){

    return err.response.data.error;

  }



  if(err.response?.data?.message){

    return err.response.data.message;

  }



  if(err.message){

    return err.message;

  }



  return "Network error — please try again";

}



export default api;