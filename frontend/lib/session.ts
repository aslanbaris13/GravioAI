/**
 * Tarayıcı oturum kimliği — backend'deki `user_sessions` kaydının anahtarı.
 *
 * Kimlik doğrulama yok; bu id fiilen tahmin edilemeyen bir bearer-token gibi
 * davranır. localStorage'da saklanır, ilk ziyarette üretilir.
 */
const SESSION_KEY = "gravioai_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
