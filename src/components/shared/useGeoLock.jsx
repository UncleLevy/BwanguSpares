import { useState, useEffect } from "react";

/**
 * Checks if the user is accessing from Zambia using IP geolocation.
 * Returns { isZambia: bool | null, loading: bool }
 * isZambia = null while loading
 */
export function useGeoLock() {
  const [isZambia, setIsZambia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://ipapi.co/country/")
      .then(r => r.text())
      .then(country => {
        setIsZambia(country.trim() === "ZM");
      })
      .catch(() => {
        // On error, allow access (fail open)
        setIsZambia(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return { isZambia, loading };
}