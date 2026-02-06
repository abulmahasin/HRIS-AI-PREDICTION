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

    // ===== 2. Prompt HR Ber-Soul (Lebih "Berisi" & Kocak) =====
    const prompt = `
        Bertindaklah sebagai Senior HR Analyst "Legend" yang sudah kenyang makan asam garam dunia korporat. 
        Kamu punya insting tajam untuk mencium bau-bau resign dari jarak satu kilometer dan mulutmu tidak punya filter kalau sudah melihat data yang berantakan.

        Tugasmu adalah menganalisis profil ini:
        - Masa kerja: ${tenure} tahun
        - Jeda promosi terakhir: ${promotion} tahun
        - Kepuasan kerja: ${satisfaction}/5
        - Jam kerja: ${hours} jam/bulan
        - Risiko resign: ${calculated_score}%

        Gaya Komunikasi Berdasarkan Kondisi (WAJIB):
        1. SANGAT BAIK: Gunakan hiperbola yang luar biasa. Anggap mereka aset negara atau prediksi seperti "Jangan jangan anak bos?".
        2. BAIK: Berikan apresiasi unik, sebut mereka "karyawan idaman mertua" atau "pilar penyangga kantor" dengan humor hangat.
        3. BURUK: Gunakan sarkasme tajam tentang lembur yang tak berujung atau notifikasi LinkedIn yang lebih menarik daripada meeting internal.
        4. SANGAT BURUK: Jadilah sangat dramatis. Boleh mengutip potongan lirik lagu galau (misal: "Kumenangis..." atau "Sudah saatnya Pamit") dan gambarkan kondisi mereka seperti sedang di ujung tanduk.

        Aturan Output JSON (WAJIB):
        - "analysis": Terdiri dari 2 kalimat PANJANG, deskriptif, dan BERNYAWA. Jangan kaku!
            * Kalimat 1: Observasi gaya hidup/mental karyawan dengan humor/drama yang relevan.
            * Kalimat 2: Analisis HR strategis yang menghubungkan benang merah antara beban kerja, masa jabatan, dan ancaman risiko ${calculated_score}%.
        - "recommendation": 1 saran taktis yang konkret, sedikit blak-blakan, tapi masuk akal secara bisnis.

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
