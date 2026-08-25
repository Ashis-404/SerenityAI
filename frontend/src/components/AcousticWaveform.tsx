import React, { useEffect, useRef } from 'react';

interface AcousticWaveformProps {
  isRecording: boolean;
  stream: MediaStream | null;
}

export const AcousticWaveform: React.FC<AcousticWaveformProps> = ({ isRecording, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording || !stream || !canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#14b8a6');
        gradient.addColorStop(0.5, '#6366f1');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [isRecording, stream]);

  if (!isRecording) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '8px 16px',
      background: 'rgba(20, 184, 166, 0.1)',
      border: '1px solid rgba(20, 184, 166, 0.3)',
      borderRadius: '24px',
      marginBottom: '12px'
    }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} className="recording-pulse" />
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-teal)' }}>
        Listening to acoustic affect & speech...
      </span>
      <canvas ref={canvasRef} width={120} height={24} style={{ display: 'block' }} />
    </div>
  );
};
