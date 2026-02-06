import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenure, promotion, satisfaction, hours, calculated_score } = body;

    // ===== 1. Validasi dasar =====
    if (
      [tenure, promotion, satisfaction, hours, calculated_score].some(
        (v) => v === undefined || v === null || isNaN(Number(v))
      )
    ) {
      return NextResponse.json(
        { error: "Input tidak valid atau tidak lengkap" },
        { status: 400 }
      );
    }

    const prompt = `
        Bertindaklah sebagai Senior HR Analyst "Legend" yang sudah kenyang makan asam garam dunia korporat. 
        Kamu punya insting tajam untuk mencium bau-bau resign dari jarak satu kilometer dan mulutmu tidak punya filter.

        Tugasmu adalah menganalisis profil ini:
        - Masa kerja: ${tenure} tahun
        - Jeda promosi terakhir: ${promotion} tahun
        - Kepuasan kerja: ${satisfaction}/5
        - Jam kerja: ${hours} jam/bulan
        - Risiko resign: ${calculated_score}%

        PANDUAN NADA BICARA (IKUTI SKOR RISIKO):
        1. Risiko < 20% (SANGAT BAIK): Gunakan teori konspirasi lucu, misal "Ini pasti anak pemilik saham" atau "Punya saham rahasia ya?". Sebut mereka aset nasional yang lebih berharga dari printer kantor.
        2. Risiko 21% - 50% (BAIK): Sebut mereka "karyawan idaman mertua" atau "pilar penyangga kantor" yang kalau cuti sehari aja kantor langsung chaos.
        3. Risiko 51% - 80% (BURUK): Gunakan sarkasme tajam soal aplikasi LinkedIn yang sering dibuka diam-diam atau mata yang sudah berbentuk logo 'Open to Work'.
        4. Risiko > 80% (SANGAT BURUK): Sangat dramatis! Kutip lirik lagu (Kumenangis, Pamit, atau Sayonara). Gambarkan mereka sudah seperti hantu di kantor; raga di meja, jiwa di portal lowongan kerja.

        Aturan Output JSON (WAJIB):
        - "analysis": Terdiri dari 2 kalimat PANJANG, deskriptif, dan BERNYAWA. (Kalimat 1: Humor/Observasi. Kalimat 2: Analisis Strategis berdasarkan data).
        - "recommendation": 1 saran taktis yang blak-blakan (Misal: "Kasih kenaikan gaji, atau siap-siap cari pengganti di LinkedIn pagi ini").

        Format JSON:
        {
          "analysis": "...",
          "recommendation": "..."
        }
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.85, // Dinaikkan supaya lebih kreatif & gak kaku
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Anda adalah analis HR senior yang bicara dengan gaya bercerita, sinis namun cerdas, dan hanya menjawab dalam JSON valid.",
        },
        { role: "user", content: prompt },
      ],
    });
    // ===== 3. Parsing aman =====
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");

    const parsed = JSON.parse(raw);

    if (!parsed.analysis || !parsed.recommendation) {
      throw new Error("Invalid AI JSON structure");
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Groq API Error:", error?.message || error);

    // ===== 4. Fallback deterministic (anti blank UI) =====
    return NextResponse.json(
      {
        analysis:
          "Kariernya terlihat jalan di tempat sementara ekspektasi terus naik. Kombinasi stagnasi promosi, beban kerja, dan kepuasan yang melemah membuat risiko resign sulit dihindari.",
        recommendation:
          "Ajukan penyesuaian peran atau promosi berbasis milestone dalam 1 siklus evaluasi ke depan.",
      },
      { status: 200 }
    );
  }
}
