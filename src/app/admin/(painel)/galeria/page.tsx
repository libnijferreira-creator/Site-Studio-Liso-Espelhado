import type { Metadata } from "next";
import { listGallery } from "@/lib/queries";
import { ShowroomManager } from "./ShowroomManager";

export const metadata: Metadata = {
  title: "Mostruário — fotos e vídeos",
  robots: { index: false, follow: false },
};

export default function AdminGaleriaPage() {
  const items = listGallery();
  return <ShowroomManager items={items} />;
}
