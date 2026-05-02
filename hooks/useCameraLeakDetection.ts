import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { SecureDocument, UserProfile } from '../types';
import { logSecurityAlert, AlertType } from '../services/securityService';

export const useCameraLeakDetection = (doc: SecureDocument, readerProfile: UserProfile | null) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [leakDetected, setLeakDetected] = useState<AlertType | false>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnimationFrameRef = useRef<number | null>(null);
  const audioProcessorRef = useRef<(() => void) | null>(null);

  const isMounted = useRef(true);

  const signalLeak = useCallback(async (type: AlertType = 'PHONE_DETECTED') => {
    if (leakDetected || !isMounted.current || !readerProfile) return; // Prevent multiple signals
    setLeakDetected(type);
    
    console.warn(`ALERTE DE FUITE DE DONNÉES DÉTECTÉE: ${type}`);
    
    try {
      // Log alert to document owner
      await logSecurityAlert(type, doc, readerProfile);
      
      if (!isMounted.current) return;
      alert(`ALERTE DE SÉCURITÉ: Une capture non autorisée a été détectée. L'accès est révoqué et un signal a été envoyé au propriétaire.`);
    } catch(err) {
      if (!isMounted.current) return;
      console.error(err);
    }
  }, [leakDetected, doc, readerProfile]);

  useEffect(() => {
    isMounted.current = true;
    
    if (readerProfile?.uid === doc.uploaderId) {
      return; // Ne pas exécuter la détection de fuite pour le propriétaire !
    }

    // 1. Load the COCO-SSD model.
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = await cocoSsd.load();
        if (!isMounted.current) return;
        modelRef.current = model;
        setModelLoaded(true);
        console.log("Anti-leak detection model loaded.");
      } catch (error) {
        if (!isMounted.current) return;
        console.error("Failed to load detection model", error);
      }
    };
    loadModel();

    // 2. Request camera and microphone access.
    const setupCameraAndMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: true
        });
        if (!isMounted.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        
        // Setup Video
        if (!videoRef.current) {
          const videoElements = window.document.createElement('video');
          videoElements.style.position = 'fixed';
          videoElements.style.top = '-9999px';
          videoElements.style.opacity = '0.001';
          videoElements.autoplay = true;
          videoElements.playsInline = true;
          videoElements.muted = true;
          videoRef.current = videoElements;
          window.document.body.appendChild(videoElements);
        }

        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          if (!isMounted.current) return;
          videoRef.current?.play().catch(() => {});
          setCameraEnabled(true);
        };

        // Setup Audio Analysis for Screenshot sound detection
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Define an array to keep track of recent volumes for a dynamic threshold
        const history: number[] = [];
        const maxHistory = 30; // About ~0.5 seconds of history assuming 60fps

        audioProcessorRef.current = () => {
          if (!isMounted.current) return;
          
          analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
             sum += dataArray[i];
          }
          const average = sum / bufferLength;
          
          history.push(average);
          if (history.length > maxHistory) {
              history.shift();
          }
          
          // Calculate average of history (background noise level)
          const backgroundLevel = history.reduce((a, b) => a + b, 0) / history.length;
          
          // If current average is significantly higher than background (a sharp spike typical of a click/screenshot sound)
          // 25 is an arbitrary threshold for the spike magnitude.
          if (average > backgroundLevel + 35 && average > 40) {
             signalLeak('AUDIO_SCREENSHOT_DETECTED');
             return; // Stop processing audio after detection
          }
          
          audioAnimationFrameRef.current = requestAnimationFrame(audioProcessorRef.current);
        };

        audioProcessorRef.current();

      } catch (error) {
        if (!isMounted.current) return;
        console.error("Camera/Mic access denied or unavailable", error);
        setCameraError(true);
      }
    };

    setupCameraAndMic();

    return () => {
      isMounted.current = false;
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
      }
      if (audioAnimationFrameRef.current) {
        cancelAnimationFrame(audioAnimationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        if (videoRef.current.parentNode) {
          videoRef.current.parentNode.removeChild(videoRef.current);
        }
        videoRef.current = null;
      }
    };
  }, [signalLeak]); // Need to be careful with dependencies here, better to memoize signalLeak properly

  useEffect(() => {
    // Only visual detection here
    if (!modelLoaded || !cameraEnabled || leakDetected || !videoRef.current) return;

    const detect = async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && isMounted.current && !leakDetected) {
        try {
          const predictions = await modelRef.current!.detect(videoRef.current);
          if (!isMounted.current) return;
          
          // Check if a "cell phone" is detected in the view
          const phoneDetected = predictions.some(pred => 
            (['cell phone', 'laptop', 'tv', 'remote', 'mouse', 'keyboard'].includes(pred.class)) && pred.score > 0.25
          );
          
          if (phoneDetected) {
            signalLeak('PHONE_DETECTED');
          }
        } catch (e) {
          // model might fail if video structure is destroyed midway
        }
      }
    };

    detectionIntervalRef.current = window.setInterval(detect, 200); // Check 5 times per second
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
      }
    };
  }, [modelLoaded, cameraEnabled, leakDetected, signalLeak]);

  return { cameraEnabled, cameraError, leakDetected };
};
