export async function fetchWithAuth(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);

    // ถ้าหลังบ้านส่งสถานะ 401 (Unauthorized / Session หมดอายุ) กลับมา
    if (response.status === 401) {
      console.warn("Session expired, redirecting to login...");
      
      // บังคับเคลียร์หน้าจอและดีดกลับไปหน้า Login ทันที
      window.location.href = "/login";
      return;
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}