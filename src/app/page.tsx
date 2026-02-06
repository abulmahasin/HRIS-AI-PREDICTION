"use client";
import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, Loader2, AlertTriangle, CheckCircle, Send, 
  UserCheck, Clock, Star, TrendingUp, HelpCircle, Info,
  Shield, Target, Calendar
} from 'lucide-react';

export default function HRISPredictor() {
  const [formData, setFormData] = useState({
    tenure: 2,
    promotion: 1,
    satisfaction: 3,
    hours: 160
  });
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{score: number, analysis: string, recommendation: string} | null>(null);

  useEffect(() => {
    if (formData.promotion > formData.tenure) {
      setValidationError(`Jeda promosi (${formData.promotion} tahun) tidak boleh melebihi lama kerja (${formData.tenure} tahun)`);
      setFormData(prev => ({ 
        ...prev, 
        promotion: prev.tenure 
      }));
    } else {
      setValidationError(null);
    }
  }, [formData.promotion, formData.tenure]);

  const handleSliderChange = (name: string, value: number) => {
    if (name === 'promotion') {
      const maxValue = formData.tenure;
      const adjustedValue = Math.min(value, maxValue);
      setFormData(prev => ({ 
        ...prev, 
        [name]: adjustedValue 
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateInternalScore = () => {
    let score = 0;
    if (formData.hours > 200) score += 35;
    if (formData.promotion > 3) score += 25;
    if (formData.satisfaction <= 2) score += 30;
    if (formData.tenure > 4 && formData.promotion > 2) score += 10;
    if (formData.satisfaction >= 4) score -= 20;
    if (formData.promotion <= 1) score -= 15;
    if (formData.hours >= 140 && formData.hours <= 180) score -= 10;
    return Math.min(Math.max(score, 0), 100);
  };

  const runAnalysis = async () => {
    if (formData.promotion > formData.tenure) {
      alert(`Error: Jeda promosi (${formData.promotion} tahun) tidak boleh melebihi lama kerja (${formData.tenure} tahun). Silakan perbaiki input.`);
      return;
    }
    
    setLoading(true);
    const score = calculateInternalScore();
    
    setResult({ 
      score, 
      analysis: "Menganalisis data karyawan...", 
      recommendation: "Menyiapkan rekomendasi..." 
    });

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, calculated_score: score }),
      });
      
      if (!res.ok) throw new Error('AI Service Error');
      const aiData = await res.json();
      setResult({ score, ...aiData });
    } catch (error) {
      const fallbackAnalysis = getFallbackAnalysis(score, formData);
      setResult({ 
        score, 
        ...fallbackAnalysis
      });
    } finally {
      setLoading(false);
    }
  };

  const getFallbackAnalysis = (score: number, data: typeof formData) => {
    let analysis = "";
    let recommendation = "";
    
    if (score >= 70) {
      analysis = `Risiko Tinggi: Karyawan dengan ${data.tenure} tahun pengalaman menunjukkan tanda-tanda burnout (${data.hours} jam/bulan) dan stagnasi karir (${data.promotion} tahun tanpa promosi).`;
      recommendation = "Segera jadwalkan one-on-one meeting dengan HRBP dan atasan langsung untuk evaluasi karir dan beban kerja.";
    } else if (score >= 40) {
      analysis = `Risiko Sedang: Kombinasi kepuasan ${data.satisfaction}/5 dan jam kerja ${data.hours} jam/bulan memerlukan monitoring.`;
      recommendation = "Lakukan pulse survey dan tawarkan program mentoring untuk meningkatkan engagement.";
    } else {
      analysis = `Risiko Rendah: Karyawan stabil dengan kepuasan ${data.satisfaction}/5 dan beban kerja wajar ${data.hours} jam/bulan.`;
      recommendation = "Pertahankan dengan recognition program dan pastikan jalur promosi tetap jelas.";
    }
    
    return { analysis, recommendation };
  };

  const TooltipInfo = ({ text, detail }: { text: string, detail: string }) => (
    <div className="relative inline-block ml-2">
      <HelpCircle 
        size={16} 
        className="text-slate-400 cursor-help hover:text-blue-600 transition-colors"
        onMouseEnter={() => setShowTooltip(text)}
        onMouseLeave={() => setShowTooltip(null)}
      />
      {showTooltip === text && (
        <div className="absolute left-0 top-6 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {detail}
          <div className="absolute -top-1 left-2 w-2 h-2 bg-slate-800 transform rotate-45"></div>
        </div>
      )}
    </div>
  );

  const SatisfactionMeter = () => {
    const labels = ['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'];
    
    return (
      <div className="mt-4">
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleSliderChange('satisfaction', num)}
              className={`flex-1 h-12 rounded-lg flex items-center justify-center transition-all duration-200 border-2 ${
                formData.satisfaction >= num 
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                  : 'bg-white text-slate-400 border-amber-200 hover:border-amber-400'
              }`}
            >
              <span className="text-sm font-semibold">{num}</span>
            </button>
          ))}
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Status Kepuasan</span>
            <span className="text-sm font-semibold text-amber-700">
              {labels[formData.satisfaction - 1]}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {formData.satisfaction <= 2 && 'Kepuasan rendah - perlu intervensi segera untuk mencegah turnover'}
            {formData.satisfaction === 3 && 'Kepuasan cukup - ada ruang untuk peningkasan engagement'}
            {formData.satisfaction === 4 && 'Kepuasan baik - karyawan cenderung loyal'}
            {formData.satisfaction === 5 && 'Kepuasan sangat baik - karyawan highly engaged'}
          </p>
        </div>
      </div>
    );
  };

  const HoursIndicator = () => {
    const getHoursLevel = () => {
      if (formData.hours < 140) return { 
        label: 'Di Bawah Normal',
        color: 'text-amber-700'
      };
      if (formData.hours <= 180) return { 
        label: 'Normal',
        color: 'text-emerald-700'
      };
      if (formData.hours <= 200) return { 
        label: 'Sedang Lembur',
        color: 'text-orange-700'
      };
      return { 
        label: 'Lembur Berlebihan',
        color: 'text-red-700'
      };
    };
    
    const level = getHoursLevel();
    const percentage = Math.min((formData.hours / 300) * 100, 100);
    
    return (
      <div className="mt-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-600">Visualisasi Jam Kerja</span>
            <span className="text-sm font-semibold text-slate-800">
              {formData.hours} jam/bulan
            </span>
          </div>
          
          <div className="relative h-2 bg-violet-200 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500 ease-out bg-violet-600"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>140</span>
            <span>180</span>
            <span>200</span>
          </div>
        </div>
        
        <div className="bg-white border border-violet-200 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className={`font-semibold text-sm ${level.color}`}>{level.label}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {formData.hours < 140 && 'Jam kerja di bawah standar normal (140-180 jam/bulan). Perlu evaluasi produktivitas.'}
            {formData.hours >= 140 && formData.hours <= 180 && 'Jam kerja ideal sesuai standar industri. Work-life balance terjaga.'}
            {formData.hours > 180 && formData.hours <= 200 && 'Beban kerja sedikit tinggi. Monitor untuk mencegah burnout.'}
            {formData.hours > 200 && 'Beban kerja sangat tinggi! Risiko burnout dan resign meningkat signifikan.'}
          </p>
        </div>
      </div>
    );
  };

  const InfoSection = () => (
    <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-xl border border-blue-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-600 rounded-lg shadow-sm">
          <Shield className="text-white" size={22} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Petunjuk Penggunaan</h3>
          <p className="text-sm text-slate-600">Pahami setiap parameter untuk hasil prediksi yang akurat</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            icon: <UserCheck size={18} className="text-blue-600" />,
            title: 'Lama Kerja',
            bgColor: 'bg-blue-50',
            description: 'Total tahun bekerja di perusahaan. Karyawan senior tanpa perkembangan cenderung mencari peluang baru.'
          },
          {
            icon: <TrendingUp size={18} className="text-emerald-600" />,
            title: 'Jeda Promosi',
            bgColor: 'bg-emerald-50',
            description: 'Waktu sejak promosi terakhir. Tidak boleh melebihi lama kerja. Jeda panjang = risiko tinggi.'
          },
          {
            icon: <Star size={18} className="text-amber-600" />,
            title: 'Kepuasan Kerja',
            bgColor: 'bg-amber-50',
            description: 'Skala 1-5 kebahagiaan kerja. Kepuasan rendah adalah early warning sign turnover.'
          },
          {
            icon: <Clock size={18} className="text-violet-600" />,
            title: 'Jam Kerja',
            bgColor: 'bg-violet-50',
            description: 'Total jam per bulan. Jam berlebihan (>200 jam) menyebabkan burnout dan resign.'
          }
        ].map((item, idx) => (
          <div key={idx} className={`${item.bgColor} p-4 rounded-lg border border-slate-200/50`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                {item.icon}
              </div>
              <h4 className="font-semibold text-slate-800 text-sm">{item.title}</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-blue-100">
        <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
          <div className="p-1.5 bg-blue-50 rounded-md">
            <Target className="text-blue-600 flex-shrink-0" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Tujuan Sistem</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Identifikasi dini karyawan berisiko resign agar HRD dapat mengambil tindakan preventif yang tepat waktu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-8 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
               <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    Flight Risk Predictor
                  </h1>
                  <p className="text-slate-200 text-sm">
                    Deteksi dini risiko resign karyawan secara objektif dengan bantuan AI.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <InfoSection />

            {/* Form Section */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <Info size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Input Data Karyawan</h2>
                  <p className="text-sm text-slate-600">Masukkan informasi untuk analisis risiko</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lama Kerja */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-600 rounded-lg shadow-sm">
                        <UserCheck size={18} className="text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Lama Kerja</span>
                      <TooltipInfo 
                        text="tenure" 
                        detail="Total tahun bekerja di perusahaan saat ini. Semakin lama tenure tanpa promosi, semakin tinggi risiko resign."
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-700">{formData.tenure}</div>
                      <div className="text-xs text-slate-600">tahun</div>
                    </div>
                  </div>
                  
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    value={formData.tenure}
                    onChange={(e) => {
                      const newTenure = parseInt(e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        tenure: newTenure,
                        promotion: Math.min(prev.promotion, newTenure)
                      }));
                    }}
                    className="w-full h-2 bg-blue-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-blue-700 [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:shadow-md"
                  />
                  
                  <div className="flex justify-between text-xs text-slate-600 mt-3">
                    <span>0 tahun</span>
                    <span>15 tahun</span>
                    <span>30 tahun</span>
                  </div>
                </div>

                {/* Jeda Promosi */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-600 rounded-lg shadow-sm">
                        <TrendingUp size={18} className="text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Jeda Promosi</span>
                      <TooltipInfo 
                        text="promotion" 
                        detail="Tahun sejak promosi terakhir. Nilai ini tidak boleh melebihi lama kerja. Jeda promosi panjang meningkatkan risiko resign."
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-700">{formData.promotion}</div>
                      <div className="text-xs text-slate-600">tahun</div>
                    </div>
                  </div>
                  
                  <input 
                    type="range" 
                    min="0" 
                    max={formData.tenure} 
                    value={formData.promotion}
                    onChange={(e) => handleSliderChange('promotion', parseInt(e.target.value))}
                    className="w-full h-2 bg-emerald-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-emerald-700 [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:shadow-md"
                  />
                  
                  {validationError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700 font-medium">{validationError}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xs text-slate-600 mt-3">
                    <span>0 tahun</span>
                    <span className="text-slate-500">Maksimal: {formData.tenure} tahun</span>
                  </div>
                </div>

                {/* Kepuasan */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-xl border border-amber-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-600 rounded-lg shadow-sm">
                        <Star size={18} className="text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Kepuasan Kerja</span>
                      <TooltipInfo 
                        text="satisfaction" 
                        detail="Tingkat kepuasan karyawan terhadap pekerjaan dalam skala 1-5. Semakin rendah kepuasan, semakin tinggi risiko resign."
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-700">{formData.satisfaction}/5</div>
                    </div>
                  </div>
                  
                  <SatisfactionMeter />
                </div>

                {/* Jam Kerja */}
                <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 p-6 rounded-xl border border-violet-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-violet-600 rounded-lg shadow-sm">
                        <Clock size={18} className="text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">Jam Kerja/Bulan</span>
                      <TooltipInfo 
                        text="hours" 
                        detail="Total jam kerja per bulan. Standar normal 140-180 jam. Di atas 200 jam meningkatkan risiko burnout dan resign."
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-violet-700">{formData.hours}</div>
                      <div className="text-xs text-slate-600">jam</div>
                    </div>
                  </div>
                  
                  <input 
                    type="range" 
                    min="80" 
                    max="300" 
                    step="10"
                    value={formData.hours}
                    onChange={(e) => handleSliderChange('hours', parseInt(e.target.value))}
                    className="w-full h-2 bg-violet-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-600 [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-violet-700 [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:shadow-md"
                  />
                  
                  <HoursIndicator />
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <button 
              onClick={runAnalysis} 
              disabled={loading || validationError !== null}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Menganalisis Data...</span>
                </>
              ) : validationError ? (
                <>
                  <AlertTriangle size={20} />
                  <span>Perbaiki Input Terlebih Dahulu</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Analisis Risiko Resign</span>
                </>
              )}
            </button>

            {/* Results */}
            {result && (
              <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200 p-8 shadow-lg">
                  
                  {/* Score Display */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8 pb-8 border-b border-slate-200">
                    <div className="text-center md:text-left">
                      <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Skor Risiko Resign</span>
                      <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                        <div className={`p-3 rounded-xl shadow-md ${
                          result.score >= 70 ? 'bg-red-100' :
                          result.score >= 40 ? 'bg-amber-100' :
                          'bg-emerald-100'
                        }`}>
                          {result.score >= 70 ? (
                            <AlertTriangle className="text-red-600" size={28} />
                          ) : result.score >= 40 ? (
                            <AlertTriangle className="text-amber-600" size={28} />
                          ) : (
                            <CheckCircle className="text-emerald-600" size={28} />
                          )}
                        </div>
                        <div>
                          <div className={`text-5xl font-bold ${
                            result.score >= 70 ? 'text-red-600' :
                            result.score >= 40 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {result.score}%
                          </div>
                          <div className={`text-sm font-semibold mt-1 ${
                            result.score >= 70 ? 'text-red-600' :
                            result.score >= 40 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {result.score >= 70 ? 'Risiko Tinggi' : 
                             result.score >= 40 ? 'Risiko Sedang' : 'Risiko Rendah'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Risk Gauge */}
                    <div className="w-full md:w-80">
                      <div className="relative h-3 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 rounded-full shadow-inner">
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-slate-800 rounded-full transition-all duration-500 shadow-md"
                          style={{ left: `${result.score}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                            {result.score}%
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Analysis */}
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BrainCircuit size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Analisis AI</p>
                          <p className="text-xs text-slate-500">Berdasarkan algoritma machine learning</p>
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{result.analysis}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Target size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Rekomendasi Aksi</p>
                          <p className="text-xs text-slate-500">Action plan untuk HRD</p>
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed mb-6">{result.recommendation}</p>
                      
                      {/* Timeline */}
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Calendar size={18} className="text-indigo-600" />
                          Timeline Tindakan
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {result.score >= 70 ? (
                            <>
                              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <div className="text-red-700 font-semibold text-sm mb-2">Segera (3 hari)</div>
                                <ul className="text-xs text-slate-600 space-y-1">
                                  <li>• One-on-one meeting</li>
                                  <li>• Review beban kerja</li>
                                </ul>
                              </div>
                              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <div className="text-orange-700 font-semibold text-sm mb-2">Minggu Ini</div>
                                <ul className="text-xs text-slate-600 space-y-1">
                                  <li>• Diskusi dengan atasan</li>
                                  <li>• Identifikasi masalah</li>
                                </ul>
                              </div>
                              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <div className="text-amber-700 font-semibold text-sm mb-2">Bulan Ini</div>
                                <ul className="text-xs text-slate-600 space-y-1">
                                  <li>• Evaluasi jalur karir</li>
                                  <li>• Rencana development</li>
                                </ul>
                              </div>
                            </>
                          ) : result.score >= 40 ? (
                            <>
                              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <div className="text-amber-700 font-semibold text-sm mb-2">Minggu Depan</div>
                                <ul className="text-xs text-slate-600 space-y-1">
                                  <li>• Pulse survey</li>
                                  <li>• Konsultasi informal</li>
                                </ul>
                              </div>
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="text-blue-700 font-semibold text-sm mb-2">2 Minggu</div>
                                <ul className="text-xs text-slate-600 space-y-1">
                                  <li>• Program mentoring</li>
                                  <li>• Review tanggung jawab</li>
                                </ul>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="text-slate-700 font-semibold text-sm mb-2">1 Bulan</div>
                                <ul className="text-xs text-slate-600 space-y-1">
                                  <li>• Evaluasi progress</li>
                                  <li>• Follow-up meeting</li>
                                </ul>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                <div className="text-emerald-700 font-semibold text-sm mb-2">Rutin</div>
                                <ul className="text-xs text-slate-600 space-y-1">
                                  <li>• Recognition program</li>
                                  <li>• Check-in berkala</li>
                                </ul>
                              </div>
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="text-blue-700 font-semibold text-sm mb-2">3 Bulan</div>
                                <ul className="text-xs text-slate-600 space-y-1">
                                  <li>• Career path discussion</li>
                                  <li>• Feedback session</li>
                                </ul>
                              </div>
                              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                <div className="text-indigo-700 font-semibold text-sm mb-2">Tahunan</div>
                                <ul className="text-xs text-slate-600 space-y-1">
                                  <li>• Comprehensive review</li>
                                  <li>• Development planning</li>
                                </ul>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Disclaimer */}
                <div className="mt-6 bg-white p-5 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-50 rounded-md">
                      <Info size={18} className="text-blue-600 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Disclaimer:</strong> Hasil prediksi berdasarkan algoritma AI dan data yang diinput. 
                      Untuk akurasi optimal, lakukan verifikasi dengan wawancara mendalam dan pertimbangan kontekstual lainnya. 
                      Sistem ini adalah decision support tool, bukan pengganti judgment profesional HRD.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}