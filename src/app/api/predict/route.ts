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

    // ===== 2. Prompt dikunci ketat =====
    const prompt = `
        Kamu adalah Senior HR Analyst berpengalaman:
        profesional, cerdas, punya selera humor sedang, dan membaca data tanpa drama.

        Gaya komunikasi:
        - Jika kondisi karyawan MASIH masuk akal → nada suportif, memotivasi, dengan humor tipis
        - Jika kondisi karyawan BURUK di hampir semua aspek → boleh ada sarkas halus, tetap profesional dan empatik 
        - Jika kondisi karyawan SANGAT BURUK → nada serius, tegas, dengan sedikit humor gelap
        - Jika kondisi karyawan AMAT BAIK → nada ceria, optimis, dengan humor ringan
        - Jika kondisi karyawan baik semua misalkan promosi rutin, kepuasan tinggi, jam kerja wajar → nada sangat positif, penuh semangat, dengan humor ceria
        - Tidak lebay, tidak menghina, tidak kejam

        Data karyawan:
        - Masa kerja: ${tenure} tahun
        - Jeda promosi terakhir: ${promotion} tahun
        - Kepuasan kerja (1–5): ${satisfaction}
        - Jam kerja per bulan: ${hours}
        - Risiko resign: ${calculated_score}%

        Aturan WAJIB:
        1. Output HARUS JSON valid
        2. Field "analysis" hanya 2 kalimat:
        - Kalimat 1:
            • observasi kondisi karyawan dengan humor profesional
            • jika datanya buruk, boleh ada sarkas ringan
            • jika datanya masih sehat, gunakan nada empatik & menyemangati
        - Kalimat 2:
            • analisis HR strategis
            • mengaitkan SEMUA variabel (masa kerja, promosi, kepuasan, jam kerja, risiko)
        3. Jangan menyebut angka mentah tanpa interpretasi
        4. Jangan menyebut nama individu, fisik, atau kata kasar

        Rekomendasi:
        - 1 tindakan konkret & realistis yang bisa dieksekusi HR
        - Jika kondisi masih baik → fokus mempertahankan & mengembangkan
        - Jika kondisi buruk → fokus intervensi cepat & nyata
        - Tidak normatif, tidak abstrak

        Format output (WAJIB):
        {
        "analysis": "Kalimat observasi dengan humor profesional. Kalimat analisis HR yang jelas dan membumi.",
        "recommendation": "Satu langkah konkret dan masuk akal untuk HR."
        }
        `;


    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Anda adalah analis HR senior yang hanya menjawab dalam JSON valid.",
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
