import React, { useState, useRef } from 'react';
import { Play, Square, Radio, FileText, CheckCircle, AlertCircle, X, Activity } from 'lucide-react';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY;

export default function AudioDebugger({ onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle' | 'recording' | 'finished' | 'error'
  const [blobInfo, setBlobInfo] = useState({ size: 0, type: '' });
  const [whisperStatus, setWhisperStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [whisperResult, setWhisperResult] = useState('');
  
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startTestRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingStatus('recording');
      setAudioBlob(null);
      setAudioUrl(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                       /iPad|iPhone|iPod/.test(navigator.platform) ||
                       (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);

      let options = {};
      if (!isSafari && MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setBlobInfo({ size: blob.size, type: blob.type });
        setRecordingStatus('finished');
        
        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();

      // Record exactly for 3 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording(false);
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      setRecordingStatus('error');
      setWhisperResult(`Error mic: ${err.message}`);
      setIsRecording(false);
    }
  };

  const playLocalAudio = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.play().catch(e => {
      setWhisperResult(`Error reproducción: ${e.message}`);
    });
  };

  const testWhisperAPI = async () => {
    if (!audioBlob) return;
    if (!OPENAI_KEY) {
      setWhisperStatus('error');
      setWhisperResult("Error: VITE_OPENAI_KEY está vacío en el cliente.");
      return;
    }

    setWhisperStatus('sending');
    setWhisperResult('');

    const formData = new FormData();
    const mime = audioBlob.type || 'audio/webm';
    const extension = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
    formData.append('file', audioBlob, `test.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

    try {
      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`
        },
        body: formData
      });

      const status = res.status;
      const responseText = await res.text();

      if (res.ok) {
        setWhisperStatus('success');
        const json = JSON.parse(responseText);
        setWhisperResult(`HTTP ${status} OK\nTranscripción: "${json.text}"`);
      } else {
        setWhisperStatus('error');
        setWhisperResult(`HTTP ${status} Error\nRespuesta: ${responseText}`);
      }
    } catch (err) {
      setWhisperStatus('error');
      setWhisperResult(`Error petición: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Activity className="text-indigo-400" size={18} />
            <h2 className="text-sm font-semibold text-slate-200">Consola de Depuración de Audio</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Paso 1: Grabar */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paso 1: Grabar Prueba de 3s</h3>
            <button
              onClick={startTestRecording}
              disabled={isRecording}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                ${isRecording 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                }
              `}
            >
              {isRecording ? <Square size={14} className="animate-pulse" /> : <Radio size={14} />}
              {isRecording ? 'Grabando 3 segundos...' : 'Grabar 3 Segundos'}
            </button>
            <p className="text-[10px] text-slate-500">
              Estado: <span className="font-mono text-slate-300">{recordingStatus}</span>
            </p>
          </div>

          {/* Paso 2: Escuchar y tamaño */}
          {audioBlob && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paso 2: Validar Blob de Audio</h3>
              <div className="bg-slate-950/60 rounded-xl p-3 text-[11px] font-mono space-y-1 text-slate-400 border border-slate-800/40">
                <p>Tamaño: <span className="text-slate-200">{blobInfo.size} bytes</span></p>
                <p>Mime: <span className="text-slate-200">{blobInfo.type}</span></p>
              </div>
              <button
                onClick={playLocalAudio}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Play size={12} /> Escuchar Audio Local
              </button>
            </div>
          )}

          {/* Paso 3: Probar Whisper */}
          {audioBlob && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paso 3: Probar Whisper API</h3>
              <button
                onClick={testWhisperAPI}
                disabled={whisperStatus === 'sending'}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {whisperStatus === 'sending' ? 'Enviando...' : 'Probar Transcripción (Whisper)'}
              </button>
              
              {whisperStatus !== 'idle' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {whisperStatus === 'sending' && <div className="w-2 h-2 border border-slate-400 border-t-transparent rounded-full animate-spin" />}
                    {whisperStatus === 'success' && <CheckCircle className="text-emerald-400" size={10} />}
                    {whisperStatus === 'error' && <AlertCircle className="text-red-400" size={10} />}
                    <span className="text-slate-400 font-semibold uppercase tracking-wider">Resultado API:</span>
                  </div>
                  <pre className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">
                    {whisperResult}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
