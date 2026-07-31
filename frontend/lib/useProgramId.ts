"use client";
import { useParams } from "next/navigation";

/**
 * `/program/[id]` rotalarındaki program kimliğini URL'den okur.
 *
 * `useParams()` dinamik segmenti URL'de göründüğü haliyle, yani yüzde-kodlu
 * döndürebiliyor. Bu değer doğrudan `getProgram()`'a verildiğinde `apiFetch`
 * içindeki `encodeURIComponent` onu ikinci kez kodluyor ve `%C3%A2` → `%25C3%25A2`
 * oluyordu; backend böyle bir program bulamayıp 404 dönüyordu.
 *
 * Etkilenen programlar ASCII dışı karakter taşıyanlardı:
 *   1711-yapay-zekâ-ekosistem-2026-yili-cagrisi
 *   yapay-zekâ-kredi-programi
 *
 * Çözüm çift yönlü güvenli: değer zaten çözülmüşse `decodeURIComponent` onu
 * değiştirmez (yüzde dizisi yoktur), kodluysa doğru haline getirir. Bozuk bir
 * yüzde dizisi gelirse hata fırlatmak yerine ham değer kullanılır.
 */
export function useProgramId(): string {
  const { id } = useParams<{ id: string }>();
  if (!id) return "";
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}
