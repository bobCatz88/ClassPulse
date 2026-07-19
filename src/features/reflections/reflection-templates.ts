export type ReflectionTemplate = {
  id: string;
  label: string;
  topic: string;
  transcript: string;
};

export const reflectionTemplates: ReflectionTemplate[] = [
  { id: "confused", label: "Murid masih keliru", topic: "Konsep belum kukuh", transcript: "Sebahagian murid masih keliru tentang konsep utama. Bukti yang saya nampak ialah…" },
  { id: "successful", label: "Aktiviti berjaya", topic: "Aktiviti berkesan", transcript: "Aktiviti hari ini berkesan kerana murid… Bukti yang menyokong pemerhatian ini ialah…" },
  { id: "time", label: "Masa tidak mencukupi", topic: "Pengurusan masa", transcript: "Masa tidak mencukupi untuk… Bahagian yang perlu disusun semula pada kelas seterusnya ialah…" },
  { id: "engagement", label: "Penglibatan rendah", topic: "Penglibatan murid", transcript: "Penglibatan murid rendah apabila… Saya perhatikan bukti berikut…" },
  { id: "follow-up", label: "Perlu susulan individu", topic: "Susulan murid", transcript: "Beberapa murid memerlukan susulan kerana… Bukti yang saya mahu semak semula ialah…" },
  { id: "free", label: "Refleksi bebas", topic: "", transcript: "" },
];
